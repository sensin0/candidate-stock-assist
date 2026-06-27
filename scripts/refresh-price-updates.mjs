import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";
import { readRuntimeStocks } from "./runtime-stock-data.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const stockMasterPath = path.join(dataDir, "stock-master.csv");
const autoPromotionDraftPath = path.join(dataDir, "stock-master-universe-promotion-draft.csv");
const universeMetricsPath = path.join(dataDir, "universe-metrics.csv");
const priceUpdatesPath = path.join(dataDir, "price-updates.csv");
const outputReportPath = path.join(reportsDir, "latest-price-refresh.md");
const concurrency = Number(process.env.PRICE_REFRESH_CONCURRENCY || 6);
const limit = Number(process.env.PRICE_REFRESH_LIMIT || 0);

const stocks = readRuntimeStocks({ stockMasterPath, autoPromotionDraftPath, universeMetricsPath })
  .filter((stock) => /^\d{4}$/.test(stock.code));
const targets = limit > 0 ? stocks.slice(0, limit) : stocks;
const existingRows = readCsv(priceUpdatesPath);
const existingByCode = new Map(existingRows.map((row) => [row.code, row]));

const results = await mapLimit(targets, concurrency, async (stock) => {
  const result = await fetchLatestClose(stock.code).catch((error) => ({
    ok: false,
    code: stock.code,
    name: stock.name,
    error: error.message,
  }));
  return { stock, result };
});

const updatedByCode = new Map(existingByCode);
for (const { stock, result } of results) {
  if (!result.ok) continue;
  updatedByCode.set(stock.code, {
    code: stock.code,
    price: result.close,
    asOf: result.date,
  });
}

const stockOrder = new Map(stocks.map((stock, index) => [stock.code, index]));
const rows = [...updatedByCode.values()]
  .filter((row) => row.code && stockOrder.has(row.code))
  .sort((a, b) => (stockOrder.get(a.code) ?? 99999) - (stockOrder.get(b.code) ?? 99999) || a.code.localeCompare(b.code));

fs.writeFileSync(priceUpdatesPath, toCsv(rows, ["code", "price", "asOf"]), "utf8");
writeReport(results, rows.length);

const okCount = results.filter((item) => item.result.ok).length;
console.log(`株価を自動更新しました: ${okCount}/${targets.length}件`);
console.log(path.relative(rootDir, outputReportPath));

async function fetchLatestClose(code) {
  const errors = [];
  for (const suffix of [".T", ".N"]) {
    const result = await fetchLatestCloseWithSymbol(`${code}${suffix}`).catch((error) => {
      errors.push(`${suffix}: ${error.message}`);
      return null;
    });
    if (result) return { ...result, code };
  }
  throw new Error(errors.join(" / ") || "最新株価なし");
}

async function fetchLatestCloseWithSymbol(symbol) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - 14 * 24 * 60 * 60;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${start}&period2=${end}&interval=1d&events=history&includeAdjustedClose=true`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

  const json = await response.json();
  const error = json.chart?.error;
  if (error) throw new Error(error.description || error.code || "chart error");

  const result = json.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const prices = timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      close: closes[index],
    }))
    .filter((item) => Number.isFinite(item.close) && item.close > 0);

  const latest = prices.at(-1);
  if (!latest) throw new Error("最新株価なし");
  return { ok: true, close: round(latest.close), date: latest.date };
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function writeReport(items, totalRows) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const ok = items.filter((item) => item.result.ok);
  const failed = items.filter((item) => !item.result.ok);
  const lines = [
    "# 株価自動更新",
    "",
    `生成日時: ${new Date().toISOString()}`,
    `対象: ${items.length}件`,
    `成功: ${ok.length}件`,
    `失敗: ${failed.length}件`,
    `price-updates.csv 登録: ${totalRows}件`,
    "",
    "## 更新できた銘柄",
    "",
    ...(ok.length
      ? ok.slice(0, 40).map(({ stock, result }, index) => `- ${index + 1}. ${stock.code} ${stock.name}: ${result.date} / ${yen(result.close)}`)
      : ["- 該当なし"]),
    "",
    "## 取得できなかった銘柄",
    "",
    ...(failed.length
      ? failed.slice(0, 40).map(({ stock, result }, index) => `- ${index + 1}. ${stock.code} ${stock.name}: ${result.error}`)
      : ["- 該当なし"]),
    "",
    "## 運用",
    "- 毎朝の判定前に最新終値を取得します。",
    "- 取得できない日は既存の株価CSVを残して処理を継続します。",
    "- 買い候補に近い銘柄は、この更新後に今買い・データ待ちを再判定します。",
  ];
  fs.writeFileSync(outputReportPath, `${lines.join("\n")}\n`, "utf8");
}

async function mapLimit(items, size, mapper) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
      await sleep(80);
    }
  });
  await Promise.all(workers);
  return results;
}

function toCsv(rows, headers) {
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")).join("\n")}\n`;
}

function escapeCsv(value) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll("\"", "\"\"")}"`;
  return text;
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function yen(value) {
  return `${Number(value || 0).toLocaleString("ja-JP")}円`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
