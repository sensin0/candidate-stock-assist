import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const worklistPath = path.join(dataDir, "financial-confirmation-worklist.csv");
const confirmedInputPath = path.join(dataDir, "financial-confirmed-input.csv");
const outputReportPath = path.join(reportsDir, "latest-financial-confirmed-input.md");

const headers = [
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

const existing = readCsv(confirmedInputPath);
const worklist = readCsv(worklistPath);
const confirmedRows = worklist
  .filter((row) => row.confirmed === "true" && row.qualitativeDone === "true")
  .map(fromWorklistRow)
  .filter(isComplete);

const byCode = new Map(existing.map((row) => [row.code, normalizeExisting(row)]));
for (const row of confirmedRows) byCode.set(row.code, row);

const outputRows = [...byCode.values()].filter((row) => row.code);
fs.writeFileSync(confirmedInputPath, toCsv(outputRows), "utf8");
writeReport(confirmedRows, outputRows);

console.log(`確認済み入力へ反映しました: ${confirmedRows.length}件`);
console.log(`${path.relative(rootDir, confirmedInputPath)}: ${outputRows.length}件`);

function fromWorklistRow(row) {
  return {
    code: row.code,
    name: row.name,
    sector: row.sector || "未分類",
    price: number(row.price),
    shares: number(row.checkedShares),
    treasuryShares: number(row.checkedTreasuryShares),
    cash: number(row.checkedCash),
    securities: number(row.checkedSecurities),
    investmentSecurities: number(row.checkedInvestmentSecurities),
    interestDebt: number(row.checkedInterestDebt),
    netAssets: number(row.checkedNetAssets),
    rentalBook: number(row.checkedRentalBook),
    rentalMarket: number(row.checkedRentalMarket),
    bps: number(row.checkedBps),
    eps: number(row.checkedEps),
    pbrLow: row.checkedPbrLow || "0.64",
    pbrAvg: row.checkedPbrAvg || midpoint(row.checkedPbrLow, row.checkedPbrHigh),
    pbrHigh: row.checkedPbrHigh || "1.53",
    perLow: row.checkedPerLow || "10",
    perAvg: row.checkedPerAvg || "16",
    perHigh: row.checkedPerHigh || "24",
    dataConfidence: "確認済み",
    qualitativeDone: "true",
    held: "false",
    risk: row.risk || "",
    catalyst: row.catalyst || row.memo || "財務確認済み",
    history: row.history || makeHistory(number(row.price)),
  };
}

function normalizeExisting(row) {
  const normalized = {};
  for (const header of headers) normalized[header] = row[header] ?? "";
  return normalized;
}

function isComplete(row) {
  return row.code
    && row.name
    && number(row.price) > 0
    && number(row.shares) > 0
    && number(row.bps) > 0
    && row.dataConfidence === "確認済み"
    && row.qualitativeDone === "true";
}

function writeReport(appliedRows, allRows) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const incomplete = worklist.filter((row) => row.confirmed === "true" && row.qualitativeDone === "true").length - appliedRows.length;
  const lines = [
    "# 財務確認済み入力",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    `今回反映: ${appliedRows.length}件`,
    `確認済み入力合計: ${allRows.length}件`,
    `入力不足で未反映: ${Math.max(0, incomplete)}件`,
    "",
    "## 今回反映",
    "",
    ...(appliedRows.length
      ? appliedRows.map((row, index) => `- ${index + 1}. ${row.code} ${row.name}: BPS ${row.bps} / EPS ${row.eps} / 株価 ${row.price}円`)
      : ["- 該当なし"]),
    "",
    "## 次",
    "",
    "- `npm run financial:promote` で通常候補への昇格プレビューを見る",
    "- 問題なければ `node scripts/promote-confirmed-candidates.mjs --write` で通常候補へ反映",
  ];
  fs.writeFileSync(outputReportPath, `${lines.join("\n")}\n`, "utf8");
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function toCsv(rows) {
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")).join("\n")}\n`;
}

function midpoint(left, right) {
  const a = number(left);
  const b = number(right);
  if (!a || !b) return "";
  return Math.round(((a + b) / 2) * 100) / 100;
}

function makeHistory(price) {
  if (!price) return "";
  return [0.88, 0.92, 0.95, 0.97, 1].map((rate) => Math.round(price * rate)).join("|");
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}
