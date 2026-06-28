import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";
import { sqliteFreshFor, tableRows } from "./sqlite-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const stockMasterPath = path.join(dataDir, "stock-master.csv");
const universePath = path.join(dataDir, "universe-price-backtest.csv");
const multibaggerPath = path.join(dataDir, "multibagger-candidates.csv");
const universeBuyCandidatesPath = path.join(dataDir, "universe-buy-candidates.csv");
const universeBuyCandidateReviewPath = path.join(dataDir, "universe-buy-candidate-review.csv");
const outputCsvPath = path.join(dataDir, "promotion-candidates.csv");
const outputReportPath = path.join(reportsDir, "latest-promotion-candidates.md");
const useSqlite = sqliteFreshFor([stockMasterPath, universePath, multibaggerPath, universeBuyCandidatesPath, universeBuyCandidateReviewPath]);

const stockMaster = readTable("stock_master", stockMasterPath);
const existingCodes = new Set(stockMaster.map((row) => row.code));
const universeRows = readTable("universe_price_backtest", universePath).filter((row) => row.judgement === "良さそう" && !row.error);
const multibaggerRows = readTable("multibagger_candidates", multibaggerPath).filter((row) => row.group === "2倍監視候補");
const universeBuyRows = readTable("universe_buy_candidates", universeBuyCandidatesPath);
const universeBuyReviewByCode = new Map(readTable("universe_buy_candidate_review", universeBuyCandidateReviewPath).map((row) => [row.code, row]));

const candidates = new Map();

for (const row of universeBuyRows) {
  if (existingCodes.has(row.code)) continue;
  const review = universeBuyReviewByCode.get(row.code) ?? {};
  if (review.reviewStatus === "今回は見送り") continue;
  upsert(row.code, {
    code: row.code,
    name: row.name,
    market: row.market,
    sector: row.sector,
    source: "自動買い候補予備軍",
    signal: row.signal,
    strategy: "財務+価格自動判定",
    score: number(row.autoBuyScore) + 24 + (review.reviewStatus === "通常候補へ昇格OK" ? 30 : 0),
    winRate: number(row.winRate),
    averageReturn: number(row.averageReturn),
    maxDrawdown: number(row.maxDrawdown),
    periodReturn: 0,
    reason: review.reasons || row.comment || "財務と価格の両方が条件内",
    nextCheck: "有報、決算短信、利益継続性、負債、出来高",
    caution: review.cautions || row.caution || "自動ランキング反映済み。原資料確認で精度向上",
    reviewStatus: review.reviewStatus || "",
  });
}

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
  if (row.source === "自動買い候補予備軍") value += 26;
  if (row.signal === "上昇中押し目") value += 10;
  if (row.signal === "高値圏") value -= 14;
  if (number(row.maxDrawdown) <= -15) value -= 18;
  return Math.round(value * 10) / 10;
}

function actionLabel(row) {
  if (row.reviewStatus === "通常候補へ昇格OK") return "昇格OKを通常候補前確認";
  if (row.source === "自動買い候補予備軍") return "最優先で通常候補前確認";
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

function readTable(tableName, csvPath) {
  if (useSqlite) return tableRows(tableName);
  return readCsv(csvPath);
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
    "reviewStatus",
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
    `データストア: ${useSqlite ? "SQLite" : "CSVフォールバック"}`,
    "",
    "広域バックテストと2倍監視候補から、まだ通常候補に入っていない銘柄を抽出しています。",
    "このリストは買い推奨ではありません。通常候補へ入れる前に、BPS、EPS、現金、有利子負債、発行株数、有報、直近決算を確認します。",
    "",
    `候補数: ${rows.length}件`,
    `通常候補登録済み: ${existingCodes.size}件`,
    `自動買い候補予備軍から: ${rows.filter((row) => row.source === "自動買い候補予備軍").length}件`,
    `昇格OK: ${rows.filter((row) => row.reviewStatus === "通常候補へ昇格OK").length}件`,
    "",
    "## 昇格OKを通常候補前確認",
    "",
    ...rows.filter((row) => row.action === "昇格OKを通常候補前確認").slice(0, 20).map((row, index) =>
      `- ${index + 1}. ${row.code} ${row.name}: ${row.action} / 優先度${row.priority} / ${row.reason} / 次に確認: ${row.nextCheck}`
    ),
    "",
    "## 最優先で通常候補前確認",
    "",
    ...rows.filter((row) => row.action === "最優先で通常候補前確認").slice(0, 20).map((row, index) =>
      `- ${index + 1}. ${row.code} ${row.name}: ${row.action} / 優先度${row.priority} / ${row.reason} / 次に確認: ${row.nextCheck}`
    ),
    "",
    "## 優先して財務確認",
    "",
    ...rows.filter((row) => row.action === "優先して財務確認").slice(0, 20).map((row, index) =>
      `- ${index + 1}. ${row.code} ${row.name}: ${row.action} / 優先度${row.priority} / ${row.reason} / 次に確認: ${row.nextCheck}`
    ),
    "",
    "## 注意して見る",
    "",
    ...rows
      .filter((row) => !["昇格OKを通常候補前確認", "最優先で通常候補前確認", "優先して財務確認"].includes(row.action))
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
