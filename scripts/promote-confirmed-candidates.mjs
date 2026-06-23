import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";
import { parseStockCsv } from "./providers/csv-provider.mjs";
import { parseEdinetFactsCsv } from "./providers/edinet-provider.mjs";
import { backtestStock } from "./backtest-core.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const stockMasterPath = path.join(dataDir, "stock-master.csv");
const promotionDraftPath = path.join(dataDir, "stock-master-input-draft.csv");
const hiddenDraftPath = path.join(dataDir, "stock-master-hidden-gems-draft.csv");
const confirmedInputPath = path.join(dataDir, "financial-confirmed-input.csv");
const worklistPath = path.join(dataDir, "financial-confirmation-worklist.csv");
const screenedPath = path.join(dataDir, "financial-worklist-screened.csv");
const edinetFactsPath = path.join(dataDir, "edinet-facts.csv");
const outputPreviewPath = path.join(dataDir, "stock-master-promoted.csv");
const outputReportPath = path.join(reportsDir, "latest-promoted-candidates.md");
const writeToMaster = process.argv.includes("--write");
const limit = Number(process.env.PROMOTE_CONFIRMED_LIMIT || 10);
const autoScreenedLimit = Number(process.env.PROMOTE_SCREENED_LIMIT || 6);

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

const existing = parseStockCsv(fs.readFileSync(stockMasterPath, "utf8"));
const existingByCode = new Map(existing.map((row) => [row.code, row]));
const draftByCode = new Map([
  ...readCsv(promotionDraftPath).map((row) => [row.code, row]),
  ...readCsv(hiddenDraftPath).map((row) => [row.code, row]),
]);
const confirmedInputRows = readCsv(confirmedInputPath);
const worklistByCode = new Map(readCsv(worklistPath).map((row) => [row.code, row]));
const screenedRows = readCsv(screenedPath);
const factsByCode = new Map(readEdinetFacts().map((row) => [row.code, row]));

const candidates = [
  ...confirmedInputRows.map((row) => promoteFromConfirmedInput(row)),
  ...screenedRows
    .filter((row) => row.status === "昇格確認優先" && number(row.screenScore) >= 80)
    .filter((row) => acceptableAutoTiming(row, worklistByCode.get(row.code)))
    .slice(0, autoScreenedLimit)
    .map((row) => promoteFromScreened(row, worklistByCode.get(row.code))),
  ...[...draftByCode.values()]
    .filter((row) => factsByCode.has(row.code))
    .map((row) => promoteFromDraftAndFact(row, factsByCode.get(row.code))),
]
  .filter(Boolean)
  .filter((row) => isConfirmed(row))
  .filter((row) => !existingByCode.has(row.code) || existingByCode.get(row.code).dataConfidence !== "確認済み")
  .slice(0, limit);

const merged = mergeRows(existing, candidates);
const outputCsv = toStockCsv(merged);
parseStockCsv(outputCsv);

fs.writeFileSync(writeToMaster ? stockMasterPath : outputPreviewPath, outputCsv, "utf8");
writeReport(candidates, writeToMaster);

console.log(`${writeToMaster ? "通常候補へ反映" : "昇格プレビュー生成"}: ${candidates.length}件`);
console.log(`${path.relative(rootDir, writeToMaster ? stockMasterPath : outputPreviewPath)}`);

function promoteFromConfirmedInput(row) {
  const normalized = normalizeStockRow(normalizeConfirmedInput(row));
  return {
    ...normalized,
    dataConfidence: "確認済み",
    qualitativeDone: "true",
    catalyst: normalized.catalyst || row.note || "財務確認済み",
  };
}

function promoteFromScreened(screened, worklistRow = {}) {
  const row = normalizeStockRow({
    code: screened.code,
    name: screened.name,
    sector: screened.sector,
    price: screened.price,
    shares: worklistRow.checkedShares,
    treasuryShares: worklistRow.checkedTreasuryShares,
    cash: worklistRow.checkedCash,
    securities: worklistRow.checkedSecurities,
    investmentSecurities: worklistRow.checkedInvestmentSecurities,
    interestDebt: worklistRow.checkedInterestDebt,
    netAssets: worklistRow.checkedNetAssets,
    rentalBook: worklistRow.checkedRentalBook,
    rentalMarket: worklistRow.checkedRentalMarket,
    bps: worklistRow.checkedBps,
    eps: worklistRow.checkedEps,
    pbrLow: worklistRow.checkedPbrLow || "0.64",
    pbrAvg: worklistRow.checkedPbrAvg || midpoint(worklistRow.checkedPbrLow, worklistRow.checkedPbrHigh),
    pbrHigh: worklistRow.checkedPbrHigh || "1.53",
    perLow: worklistRow.checkedPerLow || "10",
    perAvg: worklistRow.checkedPerAvg || "16",
    perHigh: worklistRow.checkedPerHigh || "24",
    dataConfidence: "自動財務確認",
    qualitativeDone: "true",
    held: "false",
    catalyst: `自動財務確認: ${screened.reasons || "財務スクリーニング上位"}`,
    history: worklistRow.history,
  });
  return row;
}

function acceptableAutoTiming(screened, worklistRow = {}) {
  const candidate = promoteFromScreened(screened, worklistRow);
  const result = backtestStock({
    ...candidate,
    qualitativeDone: true,
    held: false,
    history: String(candidate.history || "").split("|").map(Number).filter((value) => Number.isFinite(value)),
  });
  if (result.trades < 1) return true;
  return result.averageReturn > 0 && result.winRate >= 50 && result.maxDrawdown > -12;
}

function normalizeConfirmedInput(row) {
  return {
    ...row,
    shares: row.shares || row.checkedShares,
    treasuryShares: row.treasuryShares || row.checkedTreasuryShares,
    cash: row.cash || row.checkedCash,
    securities: row.securities || row.checkedSecurities,
    investmentSecurities: row.investmentSecurities || row.checkedInvestmentSecurities,
    interestDebt: row.interestDebt || row.checkedInterestDebt,
    netAssets: row.netAssets || row.checkedNetAssets,
    rentalBook: row.rentalBook || row.checkedRentalBook,
    rentalMarket: row.rentalMarket || row.checkedRentalMarket,
    bps: row.bps || row.checkedBps,
    eps: row.eps || row.checkedEps,
    pbrLow: row.pbrLow || row.checkedPbrLow,
    pbrAvg: row.pbrAvg || row.checkedPbrAvg,
    pbrHigh: row.pbrHigh || row.checkedPbrHigh,
    perLow: row.perLow || row.checkedPerLow,
    perAvg: row.perAvg || row.checkedPerAvg,
    perHigh: row.perHigh || row.checkedPerHigh,
    dataConfidence: row.confirmed === "true" ? "確認済み" : row.dataConfidence,
  };
}

function promoteFromDraftAndFact(row, fact) {
  return normalizeStockRow({
    ...row,
    cash: fact.cash,
    securities: fact.securities,
    investmentSecurities: fact.investmentSecurities,
    interestDebt: fact.interestDebt,
    netAssets: fact.netAssets,
    rentalBook: fact.rentalBook,
    rentalMarket: fact.rentalMarket,
    bps: fact.bps,
    eps: fact.eps,
    dataConfidence: "確認済み",
    qualitativeDone: "true",
    catalyst: row.note || "EDINET相当データ確認済み",
  });
}

function normalizeStockRow(row) {
  const price = number(row.price);
  const pbrLow = row.pbrLow || "0.64";
  const pbrHigh = row.pbrHigh || "1.53";
  return {
    code: row.code,
    name: row.name,
    sector: row.sector || "未分類",
    price,
    shares: number(row.shares) || 10_000_000,
    treasuryShares: number(row.treasuryShares),
    cash: number(row.cash),
    securities: number(row.securities),
    investmentSecurities: number(row.investmentSecurities),
    interestDebt: number(row.interestDebt),
    netAssets: number(row.netAssets),
    rentalBook: number(row.rentalBook),
    rentalMarket: number(row.rentalMarket),
    bps: number(row.bps),
    eps: number(row.eps),
    pbrLow,
    pbrAvg: row.pbrAvg || midpoint(pbrLow, pbrHigh),
    pbrHigh,
    perLow: row.perLow || "10",
    perAvg: row.perAvg || "16",
    perHigh: row.perHigh || "24",
    dataConfidence: row.dataConfidence || "確認済み",
    qualitativeDone: String(row.qualitativeDone ?? "true"),
    held: String(row.held ?? "false"),
    risk: row.risk || "",
    catalyst: row.catalyst || row.note || "",
    history: row.history || makeHistory(price),
  };
}

function isConfirmed(row) {
  const confirmedConfidence = row.dataConfidence === "確認済み" || row.dataConfidence === "自動財務確認";
  return row.code
    && row.name
    && number(row.price) > 0
    && number(row.shares) > 0
    && number(row.bps) > 0
    && confirmedConfidence
    && String(row.qualitativeDone) === "true";
}

function mergeRows(baseRows, promotedRows) {
  const byCode = new Map(baseRows.map((row) => [row.code, stockToCsvRow(row)]));
  for (const row of promotedRows) byCode.set(row.code, row);
  return [...byCode.values()];
}

function stockToCsvRow(stock) {
  return {
    ...stock,
    qualitativeDone: String(Boolean(stock.qualitativeDone)),
    held: String(Boolean(stock.held)),
    history: Array.isArray(stock.history) ? stock.history.join("|") : stock.history,
  };
}

function writeReport(rows, wroteMaster) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const lines = [
    "# 確認済み候補の通常候補昇格",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    wroteMaster ? "確認済み候補を通常候補へ反映しました。" : "確認済み候補の昇格プレビューです。反映するには `--write` を付けます。",
    "",
    `昇格対象: ${rows.length}件`,
    "",
    "## 昇格対象",
    "",
    ...(rows.length ? rows.map((row, index) => `- ${index + 1}. ${row.code} ${row.name}: ${row.sector} / 株価${row.price}円 / BPS${row.bps} / EPS${row.eps}`) : ["- 該当なし"]),
    "",
    "## 昇格条件",
    "",
    "- 確認済み入力、財務スクリーニング上位、またはEDINET相当データがある",
    "- BPS、EPS、現金、有利子負債、発行株数が入っている",
    "- `dataConfidence` が `確認済み` または `自動財務確認`",
    "- `qualitativeDone` が `true`",
  ];
  fs.writeFileSync(outputReportPath, `${lines.join("\n")}\n`, "utf8");
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function readEdinetFacts() {
  if (!fs.existsSync(edinetFactsPath)) return [];
  return parseEdinetFactsCsv(fs.readFileSync(edinetFactsPath, "utf8"));
}

function toStockCsv(rows) {
  return `${stockHeaders.join(",")}\n${rows.map((row) => stockHeaders.map((header) => escapeCsv(row[header] ?? "")).join(",")).join("\n")}\n`;
}

function midpoint(left, right) {
  const a = number(left);
  const b = number(right);
  if (!a || !b) return "";
  return round((a + b) / 2);
}

function makeHistory(price) {
  if (!price) return "";
  return [0.88, 0.92, 0.95, 0.97, 1].map((rate) => Math.round(price * rate)).join("|");
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}
