import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";
import { parseStockCsv } from "./providers/csv-provider.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = path.join(rootDir, "data", "stock-master-input.csv");
const writeToMaster = process.argv.includes("--write");
const outputPath = path.join(rootDir, "data", writeToMaster ? "stock-master.csv" : "stock-master.generated.csv");

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

const defaults = {
  sector: "未分類",
  treasuryShares: "0",
  securities: "0",
  investmentSecurities: "0",
  rentalBook: "0",
  rentalMarket: "0",
  pbrAvg: "",
  perLow: "0",
  perAvg: "0",
  perHigh: "0",
  dataConfidence: "未確認",
  qualitativeDone: "false",
  held: "false",
  risk: "",
  catalyst: "",
  history: "",
};

if (!fs.existsSync(inputPath)) {
  console.error(`入力ファイルが見つかりません: ${path.relative(rootDir, inputPath)}`);
  process.exit(1);
}

const rows = parseCsvRecords(fs.readFileSync(inputPath, "utf8"));
if (!rows.length) {
  console.error("stock-master-input.csv に入力行がありません");
  process.exit(1);
}

const outputRows = rows.map(normalizeInputRow);
const csv = [
  stockHeaders.join(","),
  ...outputRows.map((row) => stockHeaders.map((header) => escapeCsv(row[header] ?? "")).join(",")),
].join("\n");

parseStockCsv(csv);
fs.writeFileSync(outputPath, `${csv}\n`, "utf8");
const summary = buildSummary(outputRows);
console.log(`${path.relative(rootDir, outputPath)} を生成しました: ${summary.count}件`);
console.log(`本番準備目安: ${summary.readinessLabel}`);
console.log(`20件まで: あと${summary.toMinimum}件 / 50件まで: あと${summary.toPractical}件`);
if (summary.warnings.length) {
  console.log("確認ポイント:");
  summary.warnings.forEach((warning) => console.log(`- ${warning}`));
}
if (!writeToMaster) {
  console.log("確認後に data/stock-master.csv へ反映してください。直接反映する場合は --write を付けます。");
}

function normalizeInputRow(row) {
  const normalized = {};
  for (const header of stockHeaders) {
    normalized[header] = row[header] ?? defaults[header] ?? "";
  }
  normalized.pbrAvg = normalized.pbrAvg || midpoint(normalized.pbrLow, normalized.pbrHigh);
  normalized.catalyst = normalized.catalyst || row.note || "";
  normalized.history = normalized.history || makeHistory(normalized.price);
  return normalized;
}

function midpoint(left, right) {
  const a = Number(left || 0);
  const b = Number(right || 0);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return "";
  return String(Math.round(((a + b) / 2) * 100) / 100);
}

function makeHistory(priceText) {
  const price = Number(priceText || 0);
  if (!Number.isFinite(price) || price <= 0) return "";
  return [0.88, 0.92, 0.95, 0.97, 1].map((rate) => Math.round(price * rate)).join("|");
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function buildSummary(rows) {
  const count = rows.length;
  const warnings = [];
  const codes = new Set();
  rows.forEach((row) => {
    if (codes.has(row.code)) warnings.push(`コード重複: ${row.code}`);
    codes.add(row.code);
    if (Number(row.price || 0) <= 0) warnings.push(`${row.code} ${row.name}: 株価が未入力`);
    if (Number(row.shares || 0) <= 0) warnings.push(`${row.code} ${row.name}: 発行株数が未入力`);
    if (Number(row.bps || 0) <= 0) warnings.push(`${row.code} ${row.name}: BPSが未入力`);
  });
  return {
    count,
    readinessLabel: count >= 50 ? "実用目安OK" : count >= 20 ? "最低件数OK" : "まだ少なめ",
    toMinimum: Math.max(0, 20 - count),
    toPractical: Math.max(0, 50 - count),
    warnings: [...new Set(warnings)].slice(0, 8),
  };
}
