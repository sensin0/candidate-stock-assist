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
  ...doubled.slice(0, 100).map((row) => ({ group: "過去1年2倍以上", ...row })),
  ...watchCandidates.slice(0, 100).map((row) => ({ group: "2倍監視候補", ...row })),
  ...avoid.slice(0, 50).map((row) => ({ group: "上がったが慎重", ...row })),
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
    `- ${index + 1}. ${row.code} ${row.name}: 期間騰落${round(row.periodReturn)}% / ${row.bestStrategy} / ${row.judgement} / 平均${round(row.averageReturn)}% / 勝率${round(row.winRate)}% / 最大下落${round(row.maxDrawdown)}% / ${row.latestSignal}`
  );
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
