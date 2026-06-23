import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const queuePath = path.join(dataDir, "financial-confirmation-queue.csv");
const promotionDraftPath = path.join(dataDir, "stock-master-input-draft.csv");
const hiddenDraftPath = path.join(dataDir, "stock-master-hidden-gems-draft.csv");
const outputCsvPath = path.join(dataDir, "financial-confirmation-worklist.csv");
const outputReportPath = path.join(reportsDir, "latest-financial-confirmation-worklist.md");
const limit = Number(process.env.FINANCIAL_WORKLIST_LIMIT || 30);

const queue = readCsv(queuePath).slice(0, limit);
const draftByCode = new Map([
  ...readCsv(promotionDraftPath).map((row) => [row.code, row]),
  ...readCsv(hiddenDraftPath).map((row) => [row.code, row]),
]);

const rows = queue.map((item) => workRow(item, draftByCode.get(item.code)));

fs.writeFileSync(outputCsvPath, toCsv(rows), "utf8");
writeReport(rows);

console.log(`財務確認ワークシートを生成しました: ${path.relative(rootDir, outputCsvPath)}`);
console.log(`確認対象: ${rows.length}件`);

function workRow(item, draft = {}) {
  return {
    priorityRank: item.rank,
    code: item.code,
    name: item.name,
    sector: item.sector,
    source: item.source,
    status: "入力待ち",
    price: item.price || draft.price || "",
    checkedShares: "",
    checkedTreasuryShares: "",
    checkedCash: "",
    checkedSecurities: "",
    checkedInvestmentSecurities: "",
    checkedInterestDebt: "",
    checkedNetAssets: "",
    checkedRentalBook: "",
    checkedRentalMarket: "",
    checkedBps: "",
    checkedEps: "",
    checkedPbrLow: draft.pbrLow || "0.64",
    checkedPbrAvg: draft.pbrAvg || midpoint(draft.pbrLow, draft.pbrHigh) || "",
    checkedPbrHigh: draft.pbrHigh || "1.53",
    checkedPerLow: "10",
    checkedPerAvg: "16",
    checkedPerHigh: "24",
    confirmed: "false",
    qualitativeDone: "false",
    risk: "",
    catalyst: item.note || draft.note || "",
    history: draft.history || "",
    sourceUrl: "",
    memo: item.nextStep || "BPS、EPS、現金、有利子負債、発行株数を確認",
    draftShares: draft.shares || "",
    draftCash: draft.cash || "",
    draftInterestDebt: draft.interestDebt || "",
    draftNetAssets: draft.netAssets || "",
    draftBps: draft.bps || "",
    draftEps: draft.eps || "",
  };
}

function writeReport(items) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const lines = [
    "# 財務確認ワークシート",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    "財務確認キュー上位を、確認済み入力へ進めるための作業表です。",
    "BPS、EPS、現金、有利子負債、発行株数などを決算資料で確認し、`confirmed` と `qualitativeDone` を `true` にしたものだけ通常候補へ昇格できます。",
    "",
    `対象: ${items.length}件`,
    "",
    "## 入力待ち",
    "",
    ...items.slice(0, 30).map((row, index) =>
      `- ${index + 1}. ${row.code} ${row.name}: ${row.source} / 株価${row.price}円 / 下書きBPS ${row.draftBps || "未入力"} / 下書きEPS ${row.draftEps || "未入力"}`
    ),
    "",
    "## 使い方",
    "",
    "- `data/financial-confirmation-worklist.csv` を開く",
    "- `checked...` の列に確認済みの値を入れる",
    "- `confirmed` と `qualitativeDone` を `true` にする",
    "- 内容を `data/financial-confirmed-input.csv` に移す",
    "- `npm run financial:promote` で昇格プレビューを見る",
  ];
  fs.writeFileSync(outputReportPath, `${lines.join("\n")}\n`, "utf8");
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function midpoint(left, right) {
  const a = number(left);
  const b = number(right);
  if (!a || !b) return "";
  return Math.round(((a + b) / 2) * 100) / 100;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toCsv(items) {
  const headers = [
    "priorityRank",
    "code",
    "name",
    "sector",
    "source",
    "status",
    "price",
    "checkedShares",
    "checkedTreasuryShares",
    "checkedCash",
    "checkedSecurities",
    "checkedInvestmentSecurities",
    "checkedInterestDebt",
    "checkedNetAssets",
    "checkedRentalBook",
    "checkedRentalMarket",
    "checkedBps",
    "checkedEps",
    "checkedPbrLow",
    "checkedPbrAvg",
    "checkedPbrHigh",
    "checkedPerLow",
    "checkedPerAvg",
    "checkedPerHigh",
    "confirmed",
    "qualitativeDone",
    "risk",
    "catalyst",
    "history",
    "sourceUrl",
    "memo",
    "draftShares",
    "draftCash",
    "draftInterestDebt",
    "draftNetAssets",
    "draftBps",
    "draftEps",
  ];
  return `${headers.join(",")}\n${items.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")).join("\n")}\n`;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}
