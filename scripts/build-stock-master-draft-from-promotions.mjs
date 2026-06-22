import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const promotionPath = path.join(dataDir, "promotion-candidates.csv");
const stockMasterPath = path.join(dataDir, "stock-master.csv");
const outputInputPath = path.join(dataDir, "stock-master-input-draft.csv");
const outputReportPath = path.join(reportsDir, "latest-stock-master-draft.md");
const limit = Number(process.env.STOCK_MASTER_DRAFT_LIMIT || 50);
const concurrency = Number(process.env.STOCK_MASTER_DRAFT_CONCURRENCY || 8);

const promotions = parseCsvRecords(fs.readFileSync(promotionPath, "utf8"));
const existing = new Set(parseCsvRecords(fs.readFileSync(stockMasterPath, "utf8")).map((row) => row.code));
const targets = promotions.filter((row) => !existing.has(row.code)).slice(0, limit);

const quotes = await mapLimit(targets, concurrency, async (row) => {
  const prices = await fetchDailyPrices(row.code, 90).catch(() => []);
  const latest = prices.at(-1);
  const price = latest?.close ?? 0;
  return {
    ...row,
    price,
    asOf: latest?.date ?? "",
    history: prices.slice(-8).map((item) => Math.round(item.close)).join("|"),
  };
});

const rows = quotes
  .filter((row) => row.price > 0)
  .map(toDraftInputRow);

writeDraftInput(rows);
writeReport(rows, quotes);

console.log(`通常候補入力下書きCSVを生成しました: ${path.relative(rootDir, outputInputPath)}`);
console.log(`通常候補入力下書きレポートを生成しました: ${path.relative(rootDir, outputReportPath)}`);
console.log(`下書き候補: ${rows.length}/${targets.length}件`);

function toDraftInputRow(row) {
  const price = Number(row.price);
  const assumedPbr = row.action === "優先して財務確認" ? 0.85 : 1.0;
  const assumedPer = row.signal === "上昇中押し目" ? 16 : 18;
  const shares = 10_000_000;
  const bps = Math.max(1, Math.round(price / assumedPbr));
  const eps = Math.max(1, Math.round((price / assumedPer) * 10) / 10);
  const netAssets = Math.round((bps * shares) / 1_000_000);
  const cash = Math.round(netAssets * 0.25);
  const interestDebt = Math.round(netAssets * 0.1);
  const pbrLow = Math.max(0.3, Math.round(assumedPbr * 0.75 * 100) / 100);
  const pbrHigh = Math.round(Math.max(1.2, assumedPbr * 1.8) * 100) / 100;
  return {
    code: row.code,
    name: row.name,
    sector: row.sector || "未分類",
    price,
    shares,
    cash,
    interestDebt,
    netAssets,
    bps,
    eps,
    pbrLow,
    pbrHigh,
    note: `推定下書き。${row.action}。${row.reason}。財務確認: BPS/EPS/現金/有利子負債/発行株数`,
    asOf: row.asOf,
    source: row.source,
    priority: row.priority,
    history: row.history,
  };
}

function writeDraftInput(rows) {
  const headers = ["code", "name", "sector", "price", "shares", "cash", "interestDebt", "netAssets", "bps", "eps", "pbrLow", "pbrHigh", "note", "history"];
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")),
  ].join("\n");
  fs.writeFileSync(outputInputPath, `${csv}\n`, "utf8");
}

function writeReport(rows, allQuotes) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const failed = allQuotes.filter((row) => !row.price);
  const lines = [
    "# 通常候補入力下書き",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    "昇格候補から、通常候補マスタへ入れるための入力下書きを作っています。",
    "株価は取得値ですが、BPS、EPS、現金、有利子負債、発行株数は確認前の仮置きです。通常候補へ反映する前に有報と決算で確認します。",
    "",
    `下書き生成: ${rows.length}件`,
    `株価取得失敗: ${failed.length}件`,
    "",
    "## 上位下書き",
    "",
    ...rows.slice(0, 30).map((row, index) =>
      `- ${index + 1}. ${row.code} ${row.name}: 株価${row.price}円 / 優先度${row.priority} / ${row.note}`
    ),
  ];
  fs.writeFileSync(outputReportPath, `${lines.join("\n")}\n`, "utf8");
}

async function fetchDailyPrices(code, daysBack) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - daysBack * 24 * 60 * 60;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.T?period1=${start}&period2=${end}&interval=1d&events=history&includeAdjustedClose=true`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const json = await response.json();
  const result = json.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  return timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      close: closes[index],
    }))
    .filter((item) => Number.isFinite(item.close) && item.close > 0);
}

async function mapLimit(items, size, mapper) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}
