import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const reviewPath = path.join(dataDir, "universe-buy-candidate-review.csv");
const historyPath = path.join(dataDir, "monthly-price-history.csv");
const outputPath = path.join(dataDir, "price-validation-queue.csv");
const reportPath = path.join(reportsDir, "latest-price-validation-queue.md");

const reviewRows = readCsv(reviewPath);
const historyByCode = groupByCode(readCsv(historyPath));

const rows = reviewRows
  .filter((row) => ["thin", "auxiliaryWeak"].includes(row.priceValidationLevel))
  .map((row) => toQueueRow(row, historyByCode.get(row.code) ?? []))
  .sort((a, b) => priority(b) - priority(a))
  .slice(0, 120);

fs.mkdirSync(reportsDir, { recursive: true });
writeCsv(outputPath, rows);
writeReport(rows);

console.log(`価格検証キューを生成しました: ${path.relative(rootDir, outputPath)}`);
console.log(`価格検証キューレポートを生成しました: ${path.relative(rootDir, reportPath)}`);
console.log(`価格検証キュー: ${rows.length}件`);

function toQueueRow(row, historyRows) {
  const historyMonths = historyRows.length;
  const trades = number(row.trades);
  const issue = validationIssue({ historyMonths, trades, priceValidationLevel: row.priceValidationLevel });
  return {
    code: row.code,
    name: row.name,
    signal: row.signal,
    reviewStatus: row.reviewStatus,
    trustLevel: row.trustLevel,
    priceValidationLevel: row.priceValidationLevel,
    financialRiskLevel: row.financialRiskLevel,
    trades,
    auxiliaryTrades: number(row.auxiliaryTrades),
    auxiliaryWinRate: row.auxiliaryWinRate,
    auxiliaryAverageReturn: row.auxiliaryAverageReturn,
    auxiliaryMaxDrawdown: row.auxiliaryMaxDrawdown,
    historyMonths,
    buyRatio: row.buyRatio,
    pbr: row.pbr,
    per: row.per,
    upside: row.upside,
    issue,
    nextAction: nextAction(issue),
  };
}

function validationIssue({ historyMonths, trades, priceValidationLevel }) {
  if (priceValidationLevel === "auxiliaryWeak") return "補助検証弱い";
  if (historyMonths < 18) return "価格履歴不足";
  if (trades === 0) return "売買ルール未約定";
  return "取引回数少";
}

function nextAction(issue) {
  if (issue === "価格履歴不足") return "日足または追加履歴を取得して再検証";
  if (issue === "補助検証弱い") return "ランキングを下げ、買い表示を抑制";
  if (issue === "売買ルール未約定") return "買いライン近辺の補助ルールで再検証";
  return "日足検証で取引回数を増やして信頼度を再判定";
}

function priority(row) {
  let value = 0;
  if (row.signal === "今買い候補") value += 100;
  if (row.signal === "買い場近い") value += 70;
  if (row.reviewStatus === "通常候補へ昇格OK") value += 30;
  if (row.financialRiskLevel === "low") value += 20;
  if (row.issue === "売買ルール未約定") value += 12;
  value += Math.max(0, 1.08 - number(row.buyRatio)) * 40;
  value += Math.min(20, number(row.upside) / 10);
  return value;
}

function writeReport(rows) {
  const issueCounts = countBy(rows, "issue");
  const lines = [
    "# 価格検証キュー",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    "価格検証が少ない候補を、履歴不足と売買ルール未約定に分けます。",
    "履歴が十分でも取引0回のものは、データ不足ではなく過去の買い条件に到達しにくい候補です。",
    "",
    `対象: ${rows.length}件`,
    `価格履歴不足: ${issueCounts["価格履歴不足"] || 0}件`,
    `売買ルール未約定: ${issueCounts["売買ルール未約定"] || 0}件`,
    `取引回数少: ${issueCounts["取引回数少"] || 0}件`,
    `補助検証弱い: ${issueCounts["補助検証弱い"] || 0}件`,
    "",
    "## 優先確認",
    "",
    ...rows.slice(0, 30).map((row, index) =>
      `- ${index + 1}. ${row.code} ${row.name}: ${row.signal} / ${row.issue} / 履歴${row.historyMonths}か月 / 検証${row.trades}回 / 買い比率${row.buyRatio} / 次: ${row.nextAction}`
    ),
    "",
    "## 次の改善",
    "",
    "- 売買ルール未約定は、日足または週足で買いライン付近の補助検証を追加します。",
    "- 価格履歴不足は、履歴取得キューへ回します。",
    "- 取引回数少は、候補から外さず信頼度を一段下げて表示します。",
  ];
  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

function writeCsv(filePath, rows) {
  const headers = [
    "code",
    "name",
    "signal",
    "reviewStatus",
    "trustLevel",
    "priceValidationLevel",
    "financialRiskLevel",
    "trades",
    "auxiliaryTrades",
    "auxiliaryWinRate",
    "auxiliaryAverageReturn",
    "auxiliaryMaxDrawdown",
    "historyMonths",
    "buyRatio",
    "pbr",
    "per",
    "upside",
    "issue",
    "nextAction",
  ];
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")),
  ].join("\n");
  fs.writeFileSync(filePath, `${csv}\n`, "utf8");
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function groupByCode(rows) {
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.code)) grouped.set(row.code, []);
    grouped.get(row.code).push(row);
  }
  return grouped;
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = row[key] || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replaceAll("\"", "\"\"")}"`;
}
