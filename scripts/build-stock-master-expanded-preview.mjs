import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";
import { parseStockCsv } from "./providers/csv-provider.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const stockMasterPath = path.join(dataDir, "stock-master.csv");
const draftPath = path.join(dataDir, "stock-master-input-draft.csv");
const outputPath = path.join(dataDir, "stock-master-expanded-preview.csv");
const reportPath = path.join(reportsDir, "latest-stock-master-expanded-preview.md");
const limit = Number(process.env.STOCK_MASTER_EXPAND_LIMIT || 50);

const stockHeaders = [
  "code",
  "name",
  "sector",
  "price",
  "shares",
  "treasuryShares",
  "cash",
  "securities",
  "investmentSecurities",
  "interestDebt",
  "netAssets",
  "rentalBook",
  "rentalMarket",
  "bps",
  "eps",
  "pbrLow",
  "pbrAvg",
  "pbrHigh",
  "perLow",
  "perAvg",
  "perHigh",
  "dataConfidence",
  "qualitativeDone",
  "held",
  "risk",
  "catalyst",
  "history",
];

const masterRows = parseCsvRecords(fs.readFileSync(stockMasterPath, "utf8"));
const existingCodes = new Set(masterRows.map((row) => row.code));
const draftRows = parseCsvRecords(fs.readFileSync(draftPath, "utf8"))
  .filter((row) => row.code && !existingCodes.has(row.code))
  .slice(0, limit)
  .map(toPreviewStockRow);

const rows = [...masterRows.map(normalizeMasterRow), ...draftRows];
const csv = [
  stockHeaders.join(","),
  ...rows.map((row) => stockHeaders.map((header) => escapeCsv(row[header] ?? "")).join(",")),
].join("\n");

parseStockCsv(csv);
fs.writeFileSync(outputPath, `${csv}\n`, "utf8");
writeReport(masterRows, draftRows);

console.log(`通常候補追加プレビューを生成しました: ${path.relative(rootDir, outputPath)}`);
console.log(`確認レポートを生成しました: ${path.relative(rootDir, reportPath)}`);
console.log(`現在候補 ${masterRows.length}件 + 追加プレビュー ${draftRows.length}件 = ${rows.length}件`);

function normalizeMasterRow(row) {
  const normalized = {};
  for (const header of stockHeaders) {
    normalized[header] = row[header] ?? "";
  }
  return normalized;
}

function toPreviewStockRow(row) {
  const pbrLow = Number(row.pbrLow || 0);
  const pbrHigh = Number(row.pbrHigh || 0);
  const pbrAvg = pbrLow > 0 && pbrHigh > 0 ? round2((pbrLow + pbrHigh) / 2) : "";
  const price = Number(row.price || 0);
  const eps = Number(row.eps || 0);
  const perAvg = price > 0 && eps > 0 ? round2(price / eps) : "";
  return {
    code: row.code,
    name: row.name,
    sector: row.sector || "未分類",
    price: row.price,
    shares: row.shares,
    treasuryShares: "0",
    cash: row.cash,
    securities: "0",
    investmentSecurities: "0",
    interestDebt: row.interestDebt,
    netAssets: row.netAssets,
    rentalBook: "0",
    rentalMarket: "0",
    bps: row.bps,
    eps: row.eps,
    pbrLow: row.pbrLow,
    pbrAvg,
    pbrHigh: row.pbrHigh,
    perLow: "0",
    perAvg,
    perHigh: "0",
    dataConfidence: "推定",
    qualitativeDone: "false",
    held: "false",
    risk: "財務確認前。通常候補へ入れる前に有報と決算で確認",
    catalyst: row.note || "日本株全体スクリーニングからの追加候補",
    history: row.history || makeHistory(row.price),
  };
}

function writeReport(masterRows, draftRows) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const lines = [
    "# 通常候補追加プレビュー",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    "既存の通常候補に、全体スクリーニングから拾った追加候補を仮で足した確認用ファイルです。",
    "ここに出た銘柄は、まだ買い候補として確定ではありません。財務数値を確認してから通常候補へ昇格します。",
    "",
    `既存の通常候補: ${masterRows.length}件`,
    `追加プレビュー: ${draftRows.length}件`,
    `確認後の候補数イメージ: ${masterRows.length + draftRows.length}件`,
    "",
    "## 追加候補",
    "",
    ...draftRows.slice(0, 40).map((row, index) =>
      `- ${index + 1}. ${row.code} ${row.name}: 株価${row.price}円 / ${row.dataConfidence} / ${row.risk}`
    ),
    "",
    "## 次に見るところ",
    "",
    "- BPS、EPS、現金、有利子負債、発行株数が決算資料と合っているか",
    "- 急騰後だけでランキングに入っていないか",
    "- 初心者向けには、財務確認前の銘柄を今買い表示にしない",
  ];
  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

function makeHistory(priceText) {
  const price = Number(priceText || 0);
  if (!Number.isFinite(price) || price <= 0) return "";
  return [0.9, 0.93, 0.95, 0.98, 1].map((rate) => Math.round(price * rate)).join("|");
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}
