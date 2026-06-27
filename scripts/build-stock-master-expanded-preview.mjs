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
const hiddenDraftPath = path.join(dataDir, "stock-master-hidden-gems-draft.csv");
const universePromotionDraftPath = path.join(dataDir, "stock-master-universe-promotion-draft.csv");
const financialScreenedPath = path.join(dataDir, "financial-worklist-screened.csv");
const outputPath = path.join(dataDir, "stock-master-expanded-preview.csv");
const reportPath = path.join(reportsDir, "latest-stock-master-expanded-preview.md");
const appOutputPath = path.join(rootDir, "app", "generated-expansion-preview.js");
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
const financialScreenedByCode = new Map(readCsv(financialScreenedPath).map((row) => [row.code, row]));
const draftRows = uniqueByCode([
  ...readCsv(universePromotionDraftPath),
  ...readCsv(draftPath),
  ...readCsv(hiddenDraftPath),
])
  .filter((row) => row.code && !existingCodes.has(row.code))
  .filter((row) => isPreviewEligible(row))
  .slice(0, limit)
  .map(toPreviewStockRow);

const rows = [...masterRows.map(normalizeMasterRow), ...draftRows];
const csv = [
  stockHeaders.join(","),
  ...rows.map((row) => stockHeaders.map((header) => escapeCsv(row[header] ?? "")).join(",")),
].join("\n");

parseStockCsv(csv);
fs.writeFileSync(outputPath, `${csv}\n`, "utf8");
writeAppData(masterRows, draftRows);
writeReport(masterRows, draftRows);

console.log(`通常候補追加プレビューを生成しました: ${path.relative(rootDir, outputPath)}`);
console.log(`画面用追加候補データを生成しました: ${path.relative(rootDir, appOutputPath)}`);
console.log(`確認レポートを生成しました: ${path.relative(rootDir, reportPath)}`);
console.log(`現在候補 ${masterRows.length}件 + 追加プレビュー ${draftRows.length}件 = ${rows.length}件`);

function normalizeMasterRow(row) {
  const normalized = {};
  for (const header of stockHeaders) {
    normalized[header] = row[header] ?? "";
  }
  return normalized;
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function uniqueByCode(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    if (!row.code || seen.has(row.code)) return false;
    seen.add(row.code);
    return true;
  });
}

function toPreviewStockRow(row) {
  const screened = financialScreenedByCode.get(row.code);
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
    risk: previewRisk(row, screened),
    catalyst: previewCatalyst(row, screened),
    history: row.history || makeHistory(row.price),
  };
}

function isPreviewEligible(row) {
  const screened = financialScreenedByCode.get(row.code);
  if (!screened) return true;
  if (screened.status === "見送り寄り") return false;
  return true;
}

function previewRisk(row, screened) {
  const base = "財務確認前。通常候補へ入れる前に有報と決算で確認";
  if (!screened) return base;
  if (screened.status === "昇格確認優先") return `${base}。財務スクリーニング: 昇格確認優先`;
  if (screened.status === "慎重確認") return `${base}。財務スクリーニング: 慎重確認`;
  return base;
}

function previewCatalyst(row, screened) {
  const note = row.note || "日本株全体スクリーニングからの追加候補";
  if (!screened) return note;
  return `${note}。${screened.reasons || screened.action || screened.status}`;
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
    `除外: 財務スクリーニングで見送り寄りになった銘柄は追加候補から外しています。`,
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

function writeAppData(masterRows, draftRows) {
  const payload = {
    generatedAt: new Date().toISOString(),
    source: "data/stock-master-expanded-preview.csv",
    currentCount: masterRows.length,
    previewAddCount: draftRows.length,
    expandedCount: masterRows.length + draftRows.length,
    items: draftRows.map((row, index) => ({
      rank: index + 1,
      code: row.code,
      name: row.name,
      sector: row.sector,
      price: number(row.price),
      bps: number(row.bps),
      eps: number(row.eps),
      pbrLow: number(row.pbrLow),
      pbrAvg: number(row.pbrAvg),
      pbrHigh: number(row.pbrHigh),
      perAvg: number(row.perAvg),
      dataConfidence: row.dataConfidence,
      qualitativeDone: row.qualitativeDone === "true",
      risk: row.risk,
      catalyst: row.catalyst,
      history: String(row.history || "")
        .split("|")
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0),
    })),
  };
  fs.writeFileSync(appOutputPath, `window.AUTO_EXPANSION_PREVIEW = ${JSON.stringify(payload, null, 2)};\n`, "utf8");
}

function makeHistory(priceText) {
  const price = Number(priceText || 0);
  if (!Number.isFinite(price) || price <= 0) return "";
  return [0.9, 0.93, 0.95, 0.98, 1].map((rate) => Math.round(price * rate)).join("|");
}

function round2(value) {
  return Math.round(value * 100) / 100;
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
