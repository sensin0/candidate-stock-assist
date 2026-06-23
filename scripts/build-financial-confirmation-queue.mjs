import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const appDir = path.join(rootDir, "app");

const stockMasterPath = path.join(dataDir, "stock-master.csv");
const promotionReadinessPath = path.join(dataDir, "promotion-readiness.csv");
const hiddenDraftPath = path.join(dataDir, "stock-master-hidden-gems-draft.csv");
const outputCsvPath = path.join(dataDir, "financial-confirmation-queue.csv");
const outputReportPath = path.join(reportsDir, "latest-financial-confirmation.md");
const outputJsPath = path.join(appDir, "generated-financial-confirmation.js");

const stockRows = readCsv(stockMasterPath);
const promotionRows = readCsv(promotionReadinessPath);
const hiddenDraftRows = readCsv(hiddenDraftPath);

const rows = [
  ...promotionRows.slice(0, 40).map((row) => queueRowFromPromotion(row)),
  ...hiddenDraftRows.map((row) => queueRowFromHiddenDraft(row)),
  ...stockRows.filter(needsNormalCandidateCheck).map((row) => queueRowFromNormal(row)),
]
  .sort((a, b) => b.confirmationScore - a.confirmationScore)
  .map((row, index) => ({ ...row, rank: index + 1 }));

writeCsv(rows);
writeReport(rows);
writeAppData(rows);

console.log(`財務確認キューCSVを生成しました: ${path.relative(rootDir, outputCsvPath)}`);
console.log(`財務確認キューレポートを生成しました: ${path.relative(rootDir, outputReportPath)}`);
console.log(`財務確認キュー: ${rows.length}件`);

function queueRowFromPromotion(row) {
  const blockers = splitBlockers(row.blockers);
  const score = number(row.readinessScore) + (row.status === "最優先で財務確認" ? 30 : 8) - blockers.length * 22;
  return {
    source: "昇格候補",
    code: row.code,
    name: row.name,
    sector: row.sector,
    price: number(row.price),
    confirmationScore: round(score),
    status: blockers.length ? "確認してから判断" : "最優先で財務確認",
    action: blockers.length ? "通常候補へ入れる前に注意点を確認" : "通常候補へ入れる前の財務確認",
    checklist: row.checklist || defaultChecklist(),
    blockers: blockers.join(" / ") || "なし",
    note: row.note || row.nextCheck || "財務と出来高を確認",
    nextStep: blockers.length ? "材料、過熱感、下落理由を確認" : "BPS、EPS、現金、負債、発行株数を確認",
    buyGuard: "確認完了まで買わない",
  };
}

function queueRowFromHiddenDraft(row) {
  const score = 150 + number(row.hiddenScore) * 0.7 + number(row.winRate) * 0.2 + Math.max(-20, number(row.maxDrawdown));
  return {
    source: "未発掘下書き",
    code: row.code,
    name: row.name,
    sector: row.sector,
    price: number(row.price),
    confirmationScore: round(score),
    status: "最優先で財務確認",
    action: "通常候補へ入れる前の財務確認",
    checklist: defaultChecklist(),
    blockers: "財務確認前",
    note: row.note || "未発掘候補からの確認下書き",
    nextStep: "有報と決算短信で仮置きを実数へ置き換える",
    buyGuard: "確認完了まで買わない",
  };
}

function queueRowFromNormal(row) {
  const missing = [];
  if (!truthy(row.qualitativeDone)) missing.push("有報確認待ち");
  if (row.dataConfidence === "一部手入力" || row.dataConfidence === "未確認") missing.push(row.dataConfidence);
  if (!number(row.bps) || !number(row.eps)) missing.push("BPS/EPS確認");
  const score = 90 + missing.length * 18;
  return {
    source: "通常候補",
    code: row.code,
    name: row.name,
    sector: row.sector,
    price: number(row.price),
    confirmationScore: round(score),
    status: "通常候補の再確認",
    action: "既存候補の財務データを確認",
    checklist: defaultChecklist(),
    blockers: missing.join(" / ") || "なし",
    note: row.catalyst || row.risk || "既存候補の確認",
    nextStep: "仮置きや手入力を有報・決算短信で更新",
    buyGuard: "不明点が残るなら買わない",
  };
}

function needsNormalCandidateCheck(row) {
  return !truthy(row.qualitativeDone)
    || row.dataConfidence === "一部手入力"
    || row.dataConfidence === "未確認"
    || !number(row.bps)
    || !number(row.eps);
}

function writeCsv(rows) {
  const headers = [
    "rank",
    "confirmationScore",
    "source",
    "code",
    "name",
    "sector",
    "price",
    "status",
    "action",
    "buyGuard",
    "blockers",
    "nextStep",
    "checklist",
    "note",
  ];
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")),
  ].join("\n");
  fs.writeFileSync(outputCsvPath, `${csv}\n`, "utf8");
}

function writeReport(rows) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const urgent = rows.filter((row) => row.status === "最優先で財務確認");
  const lines = [
    "# 財務確認キュー",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    "通常候補へ入れる前、または買う前に、財務データを確認する順番です。",
    "ここに出ている銘柄は売買推奨ではありません。BPS、EPS、現金、有利子負債、発行株数、直近決算を確認するまで買わない前提です。",
    "",
    `確認対象: ${rows.length}件`,
    `最優先で財務確認: ${urgent.length}件`,
    "",
    "## 最優先で財務確認",
    "",
    ...reportItems(urgent.slice(0, 20)),
    "",
    "## 全確認キュー",
    "",
    ...reportItems(rows.slice(0, 50)),
    "",
    "## 確認してから通常候補へ入れる条件",
    "",
    "- BPS、EPS、現金、有利子負債、発行株数が決算資料と合っている",
    "- 直近決算で売上または利益が大きく悪化していない",
    "- 材料が一過性ではなく、出来高が続いている",
    "- 高値圏や急騰後なら、押し目が出るまで待つ",
  ];
  fs.writeFileSync(outputReportPath, `${lines.join("\n")}\n`, "utf8");
}

function writeAppData(rows) {
  const payload = {
    generatedAt: new Date().toISOString(),
    source: "data/financial-confirmation-queue.csv",
    total: rows.length,
    priorityCount: rows.filter((row) => row.status === "最優先で財務確認").length,
    top: rows.slice(0, 80),
  };
  fs.writeFileSync(outputJsPath, `window.AUTO_FINANCIAL_CONFIRMATION = ${JSON.stringify(payload, null, 2)};\n`, "utf8");
}

function reportItems(rows) {
  if (!rows.length) return ["- 該当なし"];
  return rows.map((row, index) =>
    `- ${index + 1}. ${row.code} ${row.name}: ${row.source} / ${row.status} / 点${row.confirmationScore} / 株価${row.price}円 / 注意: ${row.blockers} / 次: ${row.nextStep}`
  );
}

function splitBlockers(value) {
  const text = String(value ?? "");
  if (!text || text === "なし") return [];
  return text.split("/").map((item) => item.trim()).filter(Boolean);
}

function defaultChecklist() {
  return "BPS、EPS、現金、有利子負債、発行株数、直近決算、出来高";
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function truthy(value) {
  return value === true || value === "true" || value === "1";
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}
