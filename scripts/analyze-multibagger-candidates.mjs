import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(rootDir, "data", "universe-price-backtest.csv");
const reportPath = path.join(rootDir, "reports", "latest-multibagger-candidates.md");
const csvPath = path.join(rootDir, "data", "multibagger-candidates.csv");

const rows = parseCsvRecords(fs.readFileSync(sourcePath, "utf8"))
  .filter((row) => !row.error)
  .map((row) => ({
    ...row,
    periodReturn: Number(row.periodReturn || 0),
    trades: Number(row.trades || 0),
    winRate: Number(row.winRate || 0),
    averageReturn: Number(row.averageReturn || 0),
    maxDrawdown: Number(row.maxDrawdown || 0),
    priceScore: Number(row.priceScore || 0),
  }));

const doubled = rows
  .filter((row) => row.periodReturn >= 100)
  .sort((a, b) => b.periodReturn - a.periodReturn);
const watchCandidates = rows
  .filter((row) =>
    row.judgement === "良さそう"
    && row.trades >= 2
    && row.winRate >= 70
    && row.averageReturn >= 15
    && row.maxDrawdown > -15
    && row.latestSignal !== "高値圏"
  )
  .sort((a, b) => b.priceScore - a.priceScore);
const avoid = rows
  .filter((row) => row.periodReturn >= 100 && row.judgement !== "良さそう")
  .sort((a, b) => b.periodReturn - a.periodReturn);

const outputRows = [
  ...doubled.slice(0, 100).map((row) => withComment({ group: "過去1年2倍以上", ...row })),
  ...watchCandidates.slice(0, 100).map((row) => withComment({ group: "2倍監視候補", ...row })),
  ...avoid.slice(0, 50).map((row) => withComment({ group: "上がったが慎重", ...row })),
];

fs.writeFileSync(reportPath, renderReport(), "utf8");
fs.writeFileSync(csvPath, toCsv(outputRows), "utf8");

console.log(`2倍候補レポートを生成しました: ${reportPath}`);
console.log(`2倍候補CSVを生成しました: ${csvPath}`);
console.log(`過去1年2倍以上: ${doubled.length}件`);
console.log(`2倍監視候補: ${watchCandidates.length}件`);

function renderReport() {
  return [
    "# 2倍候補調査",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    "注意: これは売買推奨ではありません。過去の値動きから、次に財務確認する候補を絞るための調査です。",
    "",
    "## サマリー",
    "",
    `- 価格取得済み: ${rows.length}件`,
    `- 過去1年で2倍以上: ${doubled.length}件`,
    `- 2倍監視候補: ${watchCandidates.length}件`,
    `- 上がったが慎重: ${avoid.length}件`,
    "",
    "## 過去1年で2倍以上",
    "",
    ...formatRows(doubled.slice(0, 50)),
    "",
    "## 2倍監視候補",
    "",
    "条件: 良さそう、売買検証2回以上、勝率70%以上、平均+15%以上、最大下落-15%以内、高値圏ではない。",
    "",
    ...formatRows(watchCandidates.slice(0, 50)),
    "",
    "## 上がったが慎重",
    "",
    ...formatRows(avoid.slice(0, 30)),
    "",
  ].join("\n");
}

function formatRows(items) {
  if (!items.length) return ["- なし"];
  return items.map((row, index) =>
    `- ${index + 1}. ${row.code} ${row.name}: 期間騰落${round(row.periodReturn)}% / ${row.bestStrategy} / ${row.judgement} / 平均${round(row.averageReturn)}% / 勝率${round(row.winRate)}% / 最大下落${round(row.maxDrawdown)}% / ${row.latestSignal}。${candidateComment(row)}`
  );
}

function withComment(row) {
  return {
    ...row,
    comment: candidateComment(row),
    nextCheck: nextCheck(row),
    caution: caution(row),
  };
}

function candidateComment(row) {
  if (row.group === "上がったが慎重" || row.judgement === "見送り寄り") {
    return `値動きは大きいですが、${caution(row)}。買い候補ではなく監視・除外判断を優先します`;
  }
  if (row.periodReturn >= 100 && row.latestSignal === "高値圏") {
    return `すでに大きく上がっています。勢いはありますが高値圏なので、押し目か出来高継続を待つ候補です`;
  }
  if (row.latestSignal === "上昇中押し目") {
    return `上昇トレンド中の押し目候補です。次は決算成長、出来高、直近高値までの距離を確認します`;
  }
  if (row.latestSignal === "安値反転候補") {
    return `安値圏から反転し始めた候補です。赤字・下方修正・信用需給が重くないか確認します`;
  }
  if (row.bestStrategy === "高値更新") {
    return `高値更新型で強い値動きです。飛びつきではなく、出来高を伴う継続上昇かを確認します`;
  }
  return `価格バックテストは良好です。財務、材料、流動性を確認してから候補化します`;
}

function nextCheck(row) {
  if (row.latestSignal === "高値圏") return "押し目、出来高継続、決算材料";
  if (row.latestSignal === "上昇中押し目") return "決算成長、出来高、直近高値";
  if (row.latestSignal === "安値反転候補") return "赤字有無、下方修正、信用需給";
  if (row.bestStrategy === "高値更新") return "出来高、材料、過熱感";
  return "財務、材料、流動性";
}

function caution(row) {
  if (row.maxDrawdown <= -18) return "最大下落が深い";
  if (row.winRate < 50) return "勝率が低い";
  if (row.averageReturn < 0) return "平均リターンがマイナス";
  if (row.trades < 2) return "検証回数が少ない";
  if (row.periodReturn >= 100 && row.latestSignal === "高値圏") return "高値掴みリスクが高い";
  return "価格だけでは判断材料が足りない";
}

function toCsv(records) {
  const headers = [
    "group",
    "code",
    "name",
    "market",
    "sector",
    "periodReturn",
    "bestStrategy",
    "trades",
    "winRate",
    "averageReturn",
    "maxDrawdown",
    "latestSignal",
    "priceScore",
    "judgement",
    "comment",
    "nextCheck",
    "caution",
  ];
  return [
    headers.join(","),
    ...records.map((record) => headers.map((header) => escapeCsv(record[header])).join(",")),
    "",
  ].join("\n");
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll("\"", "\"\"")}"`;
  return text;
}

function round(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}
