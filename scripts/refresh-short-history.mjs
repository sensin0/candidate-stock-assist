import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const stockMasterPath = path.join(dataDir, "stock-master.csv");
const reportPath = path.join(reportsDir, "latest-short-history-refresh.md");
const minHistory = Number(process.env.SHORT_HISTORY_MIN || 8);
const days = Number(process.env.SHORT_HISTORY_DAYS || 380);

const raw = fs.readFileSync(stockMasterPath, "utf8");
const headers = raw.split(/\r?\n/, 1)[0].split(",");
const rows = parseCsvRecords(raw);
const targets = rows.filter((row) => historyValues(row).length > 0 && historyValues(row).length < minHistory);
const results = [];

for (const row of targets) {
  try {
    const prices = await fetchDailyPrices(row.code, days);
    const history = prices.slice(-minHistory).map((item) => Math.round(item.close * 10) / 10);
    if (history.length < minHistory) throw new Error(`価格履歴が少なすぎます: ${history.length}件`);
    row.history = history.join("|");
    row.price = String(history.at(-1));
    results.push({
      code: row.code,
      name: row.name,
      status: "更新",
      points: prices.length,
      history: row.history,
      message: `${history.length}点へ更新`,
    });
  } catch (error) {
    results.push({
      code: row.code,
      name: row.name,
      status: "取得失敗",
      points: historyValues(row).length,
      history: row.history,
      message: error.message,
    });
  }
}

fs.writeFileSync(stockMasterPath, toCsv(rows, headers), "utf8");
writeReport(results);

const updated = results.filter((row) => row.status === "更新").length;
const failed = results.filter((row) => row.status === "取得失敗").length;
console.log(`短い価格履歴を更新しました: 更新${updated}件 / 取得失敗${failed}件`);
console.log(path.relative(rootDir, reportPath));

async function fetchDailyPrices(code, daysBack) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - daysBack * 24 * 60 * 60;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.T?period1=${start}&period2=${end}&interval=1d&events=history&includeAdjustedClose=true`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const json = await response.json();
  const chartError = json.chart?.error;
  if (chartError) throw new Error(chartError.description || chartError.code || "chart error");
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

function historyValues(row) {
  return String(row.history || "")
    .split("|")
    .map(Number)
    .filter((value) => Number.isFinite(value) && value > 0);
}

function writeReport(items) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const updated = items.filter((row) => row.status === "更新");
  const failed = items.filter((row) => row.status === "取得失敗");
  const lines = [
    "# 短い価格履歴の自動補完",
    "",
    `生成日時: ${new Date().toISOString()}`,
    `対象: ${items.length}件`,
    `更新: ${updated.length}件`,
    `取得失敗: ${failed.length}件`,
    "",
    "## 更新",
    ...(updated.length ? updated.map((row) => `- ${row.code} ${row.name}: ${row.message} / ${row.history}`) : ["- 該当なし"]),
    "",
    "## 取得失敗",
    ...(failed.length ? failed.map((row) => `- ${row.code} ${row.name}: ${row.message}`) : ["- 該当なし"]),
    "",
    "## 使い方",
    "- 履歴が短い通常候補だけ、Yahoo Financeから日足を取り直して直近8点へ補完します。",
    "- 取得失敗の銘柄は、買い判断に使わず価格履歴不足として扱います。",
  ];
  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

function toCsv(items, csvHeaders) {
  return `${csvHeaders.join(",")}\n${items.map((row) => csvHeaders.map((header) => escapeCsv(row[header] ?? "")).join(",")).join("\n")}\n`;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}
