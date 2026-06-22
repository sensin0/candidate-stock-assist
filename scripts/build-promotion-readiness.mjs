import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const appDir = path.join(rootDir, "app");
const promotionPath = path.join(dataDir, "promotion-candidates.csv");
const draftPath = path.join(dataDir, "stock-master-input-draft.csv");
const outputCsvPath = path.join(dataDir, "promotion-readiness.csv");
const outputReportPath = path.join(reportsDir, "latest-promotion-readiness.md");
const outputJsPath = path.join(appDir, "generated-promotion-readiness.js");

const promotions = parseCsvRecords(fs.readFileSync(promotionPath, "utf8"));
const draftRows = parseCsvRecords(fs.readFileSync(draftPath, "utf8"));
const draftByCode = new Map(draftRows.map((row) => [row.code, row]));

const rows = promotions
  .filter((row) => draftByCode.has(row.code))
  .slice(0, 80)
  .map((row, index) => readinessRow(row, draftByCode.get(row.code), index + 1))
  .sort((a, b) => b.readinessScore - a.readinessScore);

writeCsv(rows);
writeReport(rows);
writeAppData(rows);

console.log(`昇格準備チェックCSVを生成しました: ${path.relative(rootDir, outputCsvPath)}`);
console.log(`昇格準備チェックレポートを生成しました: ${path.relative(rootDir, outputReportPath)}`);
console.log(`昇格準備チェック: ${rows.length}件`);

function readinessRow(row, draft, rank) {
  const priority = number(row.priority);
  const winRate = number(row.winRate);
  const averageReturn = number(row.averageReturn);
  const maxDrawdown = number(row.maxDrawdown);
  const periodReturn = number(row.periodReturn);
  const price = number(draft.price);
  let score = priority;

  if (row.action === "優先して財務確認") score += 24;
  if (row.signal === "上昇中押し目") score += 18;
  if (winRate >= 80) score += 14;
  if (averageReturn >= 20) score += 12;
  if (maxDrawdown > -8) score += 10;
  if (periodReturn > 180) score -= 28;
  if (maxDrawdown <= -15) score -= 30;
  if (price <= 0) score -= 50;

  const blockers = [];
  if (periodReturn > 180) blockers.push("急騰後");
  if (maxDrawdown <= -15) blockers.push("下落深め");
  if (winRate < 60) blockers.push("勝率弱め");
  if (!price) blockers.push("株価未取得");

  const status = blockers.length
    ? "材料と過熱感を先に確認"
    : row.action === "優先して財務確認"
      ? "最優先で財務確認"
      : "監視しながら財務確認";

  return {
    readinessScore: round(score),
    rank,
    code: row.code,
    name: row.name,
    market: row.market,
    sector: row.sector,
    status,
    action: row.action,
    signal: row.signal,
    priority,
    winRate,
    averageReturn,
    maxDrawdown,
    periodReturn,
    price,
    nextCheck: row.nextCheck,
    blockers: blockers.join(" / ") || "なし",
    checklist: "BPS、EPS、現金、有利子負債、発行株数、直近決算、出来高",
    note: row.reason,
  };
}

function writeCsv(rows) {
  const headers = [
    "readinessScore",
    "rank",
    "code",
    "name",
    "market",
    "sector",
    "status",
    "action",
    "signal",
    "priority",
    "winRate",
    "averageReturn",
    "maxDrawdown",
    "periodReturn",
    "price",
    "nextCheck",
    "blockers",
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
  const top = rows.slice(0, 30);
  const lines = [
    "# 通常候補への昇格準備チェック",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    "追加候補を通常候補へ入れる前に、どれから財務確認するかを並べています。",
    "ここに出た銘柄はまだ買い候補ではありません。BPS、EPS、現金、有利子負債、発行株数、直近決算、出来高を確認してから昇格します。",
    "",
    `確認対象: ${rows.length}件`,
    `最優先で財務確認: ${rows.filter((row) => row.status === "最優先で財務確認").length}件`,
    `過熱感など先に確認: ${rows.filter((row) => row.blockers !== "なし").length}件`,
    "",
    "## 最優先で財務確認",
    "",
    ...top.map((row, index) =>
      `- ${index + 1}. ${row.code} ${row.name}: ${row.status} / 準備点${row.readinessScore} / 株価${row.price}円 / 勝率${row.winRate}% / 平均${row.averageReturn}% / 最大下落${row.maxDrawdown}% / 注意: ${row.blockers}`
    ),
    "",
    "## 確認項目",
    "",
    "- BPSとEPSが決算資料と合っているか",
    "- 現金、有利子負債、発行株数が決算資料と合っているか",
    "- 直近決算で利益が悪化していないか",
    "- 急騰直後ではなく、出来高が続いているか",
    "- 確認できたものだけ通常候補へ昇格",
  ];
  fs.writeFileSync(outputReportPath, `${lines.join("\n")}\n`, "utf8");
}

function writeAppData(rows) {
  const payload = {
    generatedAt: new Date().toISOString(),
    source: "data/promotion-readiness.csv",
    total: rows.length,
    priorityCount: rows.filter((row) => row.status === "最優先で財務確認").length,
    blockerCount: rows.filter((row) => row.blockers !== "なし").length,
    top: rows.slice(0, 40),
  };
  fs.writeFileSync(outputJsPath, `window.AUTO_PROMOTION_READINESS = ${JSON.stringify(payload, null, 2)};\n`, "utf8");
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
