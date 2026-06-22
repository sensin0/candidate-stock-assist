import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const appDir = path.join(rootDir, "app");
const stockMasterPath = path.join(dataDir, "stock-master.csv");
const promotionPath = path.join(dataDir, "promotion-candidates.csv");
const universePath = path.join(dataDir, "universe-price-backtest.csv");
const outputCsvPath = path.join(dataDir, "hidden-gems.csv");
const outputReportPath = path.join(reportsDir, "latest-hidden-gems.md");
const outputJsPath = path.join(appDir, "generated-hidden-gems.js");

const existingCodes = new Set(readCsv(stockMasterPath).map((row) => row.code));
const promotedCodes = new Set(readCsv(promotionPath).map((row) => row.code));
const universeRows = readCsv(universePath).filter((row) => !row.error && row.code && !existingCodes.has(row.code) && !promotedCodes.has(row.code));

const rows = universeRows
  .map(toHiddenGem)
  .filter((row) => row.hiddenScore >= 70)
  .sort((a, b) => b.hiddenScore - a.hiddenScore)
  .slice(0, 120);

writeCsv(rows);
writeReport(rows);
writeAppData(rows);

console.log(`未発掘候補CSVを生成しました: ${path.relative(rootDir, outputCsvPath)}`);
console.log(`未発掘候補レポートを生成しました: ${path.relative(rootDir, outputReportPath)}`);
console.log(`未発掘候補: ${rows.length}件`);

function toHiddenGem(row) {
  const trades = number(row.trades);
  const winRate = number(row.winRate);
  const averageReturn = number(row.averageReturn);
  const maxDrawdown = number(row.maxDrawdown);
  const periodReturn = number(row.periodReturn);
  const score = number(row.priceScore);
  let hiddenScore = score + averageReturn * 1.15 + winRate * 0.2 + Math.max(-35, maxDrawdown) * 1.35 + Math.min(18, trades * 4);

  if (row.judgement === "良さそう") hiddenScore += 22;
  if (row.latestSignal === "上昇中押し目") hiddenScore += 24;
  if (row.latestSignal === "待ち" && winRate >= 80 && averageReturn >= 15) hiddenScore += 14;
  if (row.latestSignal === "高値圏") hiddenScore -= 28;
  if (trades < 2) hiddenScore -= 26;
  if (winRate < 60) hiddenScore -= 38;
  if (averageReturn < 8) hiddenScore -= 26;
  if (maxDrawdown <= -15) hiddenScore -= 36;
  if (periodReturn > 160) hiddenScore -= 32;
  if (periodReturn < -70) hiddenScore -= 20;
  if (row.judgement === "見送り寄り") hiddenScore -= 60;

  const cautions = [];
  if (trades < 2) cautions.push("検証回数少なめ");
  if (maxDrawdown <= -15) cautions.push("下落深め");
  if (periodReturn > 160) cautions.push("急騰後");
  if (row.latestSignal === "高値圏") cautions.push("高値圏");

  return {
    hiddenScore: round(hiddenScore),
    code: row.code,
    name: row.name,
    market: row.market,
    sector: row.sector,
    judgement: row.judgement,
    signal: row.latestSignal,
    strategy: row.bestStrategy,
    priceScore: score,
    winRate,
    averageReturn,
    maxDrawdown,
    periodReturn,
    trades,
    status: hiddenStatus(row, cautions),
    nextCheck: hiddenNextCheck(row, cautions),
    caution: cautions.join(" / ") || "なし",
    reason: hiddenReason(row),
  };
}

function hiddenStatus(row, cautions) {
  if (cautions.includes("急騰後") || cautions.includes("高値圏")) return "押し目待ちで監視";
  if (cautions.includes("下落深め")) return "下落リスク確認";
  if (row.latestSignal === "上昇中押し目") return "未発掘の財務確認候補";
  if (row.judgement === "良さそう") return "未発掘の監視候補";
  return "様子見候補";
}

function hiddenNextCheck(row, cautions) {
  if (cautions.includes("急騰後") || cautions.includes("高値圏")) return "押し目、出来高継続、材料";
  if (cautions.includes("下落深め")) return "下落理由、決算悪化、流動性";
  if (row.latestSignal === "上昇中押し目") return "BPS、EPS、現金、有利子負債、直近決算";
  return "財務、材料、出来高";
}

function hiddenReason(row) {
  if (row.latestSignal === "上昇中押し目") return "既存候補外で上昇中の押し目に見える";
  if (row.bestStrategy === "安値反転") return "安値反転の検証が良い";
  if (row.bestStrategy === "高値更新") return "高値更新型で勢いがある";
  return "価格検証で候補圏に残った";
}

function writeCsv(rows) {
  const headers = [
    "hiddenScore",
    "code",
    "name",
    "market",
    "sector",
    "status",
    "judgement",
    "signal",
    "strategy",
    "priceScore",
    "winRate",
    "averageReturn",
    "maxDrawdown",
    "periodReturn",
    "trades",
    "nextCheck",
    "caution",
    "reason",
  ];
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")),
  ].join("\n");
  fs.writeFileSync(outputCsvPath, `${csv}\n`, "utf8");
}

function writeReport(rows) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const lines = [
    "# 未発掘候補",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    "通常候補と既存の昇格候補を除いた日本株全体から、まだ見えていない候補を探しています。",
    "価格検証だけの候補なので、買い候補ではありません。財務と材料を確認してから昇格候補へ入れます。",
    "",
    `未発掘候補: ${rows.length}件`,
    `除外した通常候補: ${existingCodes.size}件`,
    `除外した既存昇格候補: ${promotedCodes.size}件`,
    "",
    "## 上位候補",
    "",
    ...rows.slice(0, 40).map((row, index) =>
      `- ${index + 1}. ${row.code} ${row.name}: ${row.status} / 点${row.hiddenScore} / ${row.signal} / 勝率${row.winRate}% / 平均${row.averageReturn}% / 最大下落${row.maxDrawdown}% / 注意: ${row.caution} / 次: ${row.nextCheck}`
    ),
    "",
    "## 使い方",
    "",
    "- 上位から財務、決算、出来高を確認します",
    "- 急騰後や高値圏は、押し目が出るまで通常候補へ入れません",
    "- 良いものだけ次回の昇格候補へ回します",
  ];
  fs.writeFileSync(outputReportPath, `${lines.join("\n")}\n`, "utf8");
}

function writeAppData(rows) {
  const payload = {
    generatedAt: new Date().toISOString(),
    source: "data/hidden-gems.csv",
    total: rows.length,
    priorityCount: rows.filter((row) => row.status === "未発掘の財務確認候補").length,
    top: rows.slice(0, 80),
  };
  fs.writeFileSync(outputJsPath, `window.AUTO_HIDDEN_GEMS = ${JSON.stringify(payload, null, 2)};\n`, "utf8");
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}
