import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const stockMasterPath = path.join(dataDir, "stock-master.csv");
const universePath = path.join(dataDir, "universe-price-backtest.csv");
const multibaggerPath = path.join(dataDir, "multibagger-candidates.csv");
const outputCsvPath = path.join(dataDir, "promotion-candidates.csv");
const outputReportPath = path.join(reportsDir, "latest-promotion-candidates.md");

const stockMaster = readCsv(stockMasterPath);
const existingCodes = new Set(stockMaster.map((row) => row.code));
const universeRows = readCsv(universePath).filter((row) => row.judgement === "良さそう" && !row.error);
const multibaggerRows = readCsv(multibaggerPath).filter((row) => row.group === "2倍監視候補");

const candidates = new Map();

for (const row of universeRows) {
  if (existingCodes.has(row.code)) continue;
  upsert(row.code, {
    code: row.code,
    name: row.name,
    market: row.market,
    sector: row.sector,
    source: "広域候補",
    signal: row.latestSignal,
    strategy: row.bestStrategy,
    score: number(row.priceScore),
    winRate: number(row.winRate),
    averageReturn: number(row.averageReturn),
    maxDrawdown: number(row.maxDrawdown),
    periodReturn: number(row.periodReturn),
    reason: signalReason(row),
    nextCheck: "BPS、EPS、現金、有利子負債、発行株数",
    caution: "価格だけの一次候補",
  });
}

for (const row of multibaggerRows) {
  if (existingCodes.has(row.code)) continue;
  upsert(row.code, {
    code: row.code,
    name: row.name,
    market: row.market,
    sector: row.sector,
    source: "2倍監視",
    signal: row.latestSignal,
    strategy: row.bestStrategy,
    score: number(row.priceScore) + 16,
    winRate: number(row.winRate),
    averageReturn: number(row.averageReturn),
    maxDrawdown: number(row.maxDrawdown),
    periodReturn: number(row.periodReturn),
    reason: row.comment || signalReason(row),
    nextCheck: row.nextCheck || "決算成長、出来高、材料",
    caution: row.caution || "価格だけでは判断材料が足りない",
  });
}

const rows = [...candidates.values()]
  .map((row) => ({ ...row, priority: priority(row), action: actionLabel(row) }))
  .sort((a, b) => b.priority - a.priority)
  .slice(0, 150);

fs.mkdirSync(reportsDir, { recursive: true });
writeCsv(outputCsvPath, rows);
writeReport(outputReportPath, rows);

console.log(`昇格候補CSVを生成しました: ${path.relative(rootDir, outputCsvPath)}`);
console.log(`昇格候補レポートを生成しました: ${path.relative(rootDir, outputReportPath)}`);
console.log(`昇格候補: ${rows.length}件`);

function upsert(code, next) {
  const current = candidates.get(code);
  if (!current || priority(next) > priority(current)) candidates.set(code, next);
}

function priority(row) {
  let value = number(row.score);
  value += number(row.averageReturn) * 0.9;
  value += number(row.winRate) * 0.18;
  value += Math.max(-30, number(row.maxDrawdown)) * 0.8;
  if (row.source === "2倍監視") value += 12;
  if (row.signal === "上昇中押し目") value += 10;
  if (row.signal === "高値圏") value -= 14;
  if (number(row.maxDrawdown) <= -15) value -= 18;
  return Math.round(value * 10) / 10;
}

function actionLabel(row) {
  if (number(row.maxDrawdown) <= -15) return "下落リスク確認が先";
  if (row.signal === "高値圏") return "押し目待ちで財務確認";
  if (row.signal === "上昇中押し目") return "優先して財務確認";
  return "監視しながら財務確認";
}

function signalReason(row) {
  if (row.latestSignal === "上昇中押し目") return "上昇トレンド中の押し目候補";
  if (row.latestSignal === "高値圏") return "すでに大きく上がっているため押し目待ち";
  if (row.bestStrategy === "高値更新") return "高値更新型の候補";
  return "価格バックテスト上位候補";
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function writeCsv(filePath, rows) {
  const headers = [
    "priority",
    "code",
    "name",
    "source",
    "market",
    "sector",
    "action",
    "signal",
    "strategy",
    "score",
    "winRate",
    "averageReturn",
    "maxDrawdown",
    "periodReturn",
    "reason",
    "nextCheck",
    "caution",
  ];
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")),
  ].join("\n");
  fs.writeFileSync(filePath, `${csv}\n`, "utf8");
}

function writeReport(filePath, rows) {
  const lines = [
    "# 通常候補への昇格候補",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    "広域バックテストと2倍監視候補から、まだ通常候補に入っていない銘柄を抽出しています。",
    "このリストは買い推奨ではありません。通常候補へ入れる前に、BPS、EPS、現金、有利子負債、発行株数、有報、直近決算を確認します。",
    "",
    `候補数: ${rows.length}件`,
    `通常候補登録済み: ${existingCodes.size}件`,
    "",
    "## 優先して財務確認",
    "",
    ...rows.slice(0, 20).map((row, index) =>
      `- ${index + 1}. ${row.code} ${row.name}: ${row.action} / 優先度${row.priority} / ${row.reason} / 次に確認: ${row.nextCheck}`
    ),
    "",
    "## 注意して見る",
    "",
    ...rows
      .filter((row) => row.action !== "優先して財務確認")
      .slice(0, 20)
      .map((row, index) =>
        `- ${index + 1}. ${row.code} ${row.name}: ${row.action} / ${row.caution} / 最大下落${row.maxDrawdown}%`
      ),
  ];
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}
