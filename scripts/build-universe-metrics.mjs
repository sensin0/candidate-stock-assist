import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";
import { parseStockCsv } from "./providers/csv-provider.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stockMasterPath = path.join(rootDir, "data", "stock-master.csv");
const draftPath = path.join(rootDir, "data", "stock-master-input-draft.csv");
const hiddenDraftPath = path.join(rootDir, "data", "stock-master-hidden-gems-draft.csv");
const universeBacktestPath = path.join(rootDir, "data", "universe-price-backtest.csv");
const outputPath = path.join(rootDir, "data", "universe-metrics.csv");
const outputReportPath = path.join(rootDir, "reports", "latest-universe-financial-coverage.md");
const estimateLimit = Number(process.env.UNIVERSE_METRICS_ESTIMATE_LIMIT || 3728);

const stocks = parseStockCsv(fs.readFileSync(stockMasterPath, "utf8"));
const rows = [];
const seen = new Set();

for (const stock of stocks) addRow({
  code: stock.code,
  price: stock.price,
  bps: stock.bps,
  eps: stock.eps,
  cash: stock.cash,
  securities: stock.securities,
  investmentSecurities: stock.investmentSecurities,
  interestDebt: stock.interestDebt,
  netAssets: stock.netAssets,
  rentalBook: stock.rentalBook,
  rentalMarket: stock.rentalMarket,
  shares: stock.shares,
  treasuryShares: stock.treasuryShares,
  asOf: stock.dataConfidence === "確認済み" || stock.qualitativeDone ? "confirmed" : "stockMaster",
});

for (const row of readCsv(draftPath)) addRow(metricFromDraft(row, "promotionDraft"));
for (const row of readCsv(hiddenDraftPath)) addRow(metricFromDraft(row, "hiddenDraft"));

const backtestRows = readCsv(universeBacktestPath)
  .filter((row) => !row.error && Number(row.lastClose) > 0)
  .sort((a, b) => Number(b.priceScore || 0) - Number(a.priceScore || 0))
  .slice(0, estimateLimit);

for (const row of backtestRows) addRow(metricFromPriceBacktest(row));

fs.writeFileSync(outputPath, toCsv(rows), "utf8");
writeReport(rows);
console.log(`universe-metrics を生成しました: ${rows.length}件`);
console.log(`確認済み: ${rows.filter((row) => row.asOf === "confirmed").length}件 / 確認前推定: ${rows.filter((row) => row.asOf !== "confirmed").length}件`);

function addRow(row) {
  if (!row?.code || seen.has(row.code)) return;
  seen.add(row.code);
  rows.push(row);
}

function metricFromDraft(row, asOf) {
  return {
    code: row.code,
    price: number(row.price),
    bps: number(row.bps),
    eps: number(row.eps),
    cash: number(row.cash),
    securities: 0,
    investmentSecurities: 0,
    interestDebt: number(row.interestDebt),
    netAssets: number(row.netAssets),
    rentalBook: 0,
    rentalMarket: 0,
    shares: number(row.shares) || 10_000_000,
    treasuryShares: 0,
    asOf,
  };
}

function metricFromPriceBacktest(row) {
  const price = number(row.lastClose);
  const bps = round(price / 0.9);
  const eps = round(price / 15);
  const shares = 10_000_000;
  const netAssets = Math.round((bps * shares) / 1_000_000);
  return {
    code: row.code,
    price,
    bps,
    eps,
    cash: Math.round(netAssets * 0.25),
    securities: 0,
    investmentSecurities: 0,
    interestDebt: Math.round(netAssets * 0.12),
    netAssets,
    rentalBook: 0,
    rentalMarket: 0,
    shares,
    treasuryShares: 0,
    asOf: "priceEstimate",
  };
}

function writeReport(items) {
  fs.mkdirSync(path.dirname(outputReportPath), { recursive: true });
  const confirmed = items.filter((row) => row.asOf === "confirmed");
  const estimated = items.filter((row) => row.asOf !== "confirmed");
  const lines = [
    "# 日本株 財務データ範囲",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    `財務メトリクス対象: ${items.length}件`,
    `確認済み: ${confirmed.length}件`,
    `確認前推定: ${estimated.length}件`,
    "",
    "確認前推定は探索用です。通常候補へ昇格するには、確認済み入力またはEDINET相当データが必要です。",
    "",
    "## 確認前推定の内訳",
    "",
    ...Object.entries(groupCount(estimated, "asOf")).map(([label, count]) => `- ${label}: ${count}件`),
    "",
    "## 次にやること",
    "",
    "- 財務確認キュー上位からBPS、EPS、現金、有利子負債、発行株数を確認",
    "- 確認済みになったものだけ通常候補へ昇格",
    "- 推定だけの銘柄は買い候補にしない",
  ];
  fs.writeFileSync(outputReportPath, `${lines.join("\n")}\n`, "utf8");
}

function groupCount(items, key) {
  return items.reduce((acc, item) => {
    acc[item[key] || "unknown"] = (acc[item[key] || "unknown"] ?? 0) + 1;
    return acc;
  }, {});
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
  return Math.round(Number(value || 0) * 10) / 10;
}

function toCsv(items) {
  const headers = [
    "code",
    "price",
    "bps",
    "eps",
    "cash",
    "securities",
    "investmentSecurities",
    "interestDebt",
    "netAssets",
    "rentalBook",
    "rentalMarket",
    "shares",
    "treasuryShares",
    "asOf",
  ];
  return `${headers.join(",")}\n${items.map((item) => headers.map((header) => item[header] ?? "").join(",")).join("\n")}\n`;
}
