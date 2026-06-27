import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const listedPath = path.join(dataDir, "listed-universe.csv");
const priceBacktestPath = path.join(dataDir, "universe-price-backtest.csv");
const outputPath = path.join(dataDir, "universe-financial-facts.csv");
const outputReportPath = path.join(reportsDir, "latest-universe-financial-facts.md");
const limit = Number(process.env.UNIVERSE_FINANCIAL_FETCH_LIMIT || 3728);
const concurrency = Number(process.env.UNIVERSE_FINANCIAL_FETCH_CONCURRENCY || 8);
const refreshExisting = process.env.UNIVERSE_FINANCIAL_REFRESH_EXISTING === "true";

const listed = readCsv(listedPath);
const priceByCode = new Map(readCsv(priceBacktestPath).map((row) => [row.code, row.lastClose || row.price || ""]));
const existing = readCsv(outputPath);
const existingByCode = new Map(existing.map((row) => [row.code, row]));
const targets = listed
  .filter((row) => row.code)
  .filter((row) => refreshExisting || existingByCode.get(row.code)?.status !== "取得成功")
  .slice(0, limit);

const results = await mapLimit(targets, concurrency, async (row) => {
  const result = await fetchIrbankMetrics(row.code).catch((error) => ({
    status: "取得失敗",
    error: error.message,
  }));
  return toFactRow(row, result);
});

const nextByCode = new Map(existingByCode);
for (const row of results) nextByCode.set(row.code, row);

const listedOrder = new Map(listed.map((row, index) => [row.code, index]));
const outputRows = [...nextByCode.values()]
  .sort((a, b) => (listedOrder.get(a.code) ?? 99999) - (listedOrder.get(b.code) ?? 99999) || a.code.localeCompare(b.code));

fs.writeFileSync(outputPath, toCsv(outputRows), "utf8");
writeReport(outputRows, results);

const okCount = results.filter((row) => row.status === "取得成功").length;
console.log(`日本株全体の財務データを取得しました: ${okCount}/${targets.length}件`);
console.log(`${path.relative(rootDir, outputPath)}: ${outputRows.filter((row) => row.status === "取得成功").length}件取得済み`);

async function fetchIrbankMetrics(code) {
  const sourceUrl = `https://irbank.net/${encodeURIComponent(code)}/results`;
  const response = await fetch(sourceUrl, {
    headers: { "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const html = await response.text();
  const bps = latestMetric(html, "BPS", "number");
  const eps = latestMetric(html, "EPS", "number");
  const netAssets = latestMetric(html, "純資産", "money");
  const interestDebt = latestMetric(html, "有利子負債", "money");
  const cash = latestMetric(html, "現金等", "money");
  const period = bps.period || eps.period || netAssets.period || cash.period || "";
  const shares = bps.value > 0 && netAssets.value > 0
    ? Math.round((netAssets.value * 1_000_000) / bps.value)
    : 0;
  if (!bps.value || !netAssets.value || !shares) throw new Error("BPS、純資産、株数推定が不足");
  return {
    status: "取得成功",
    period,
    sourceUrl,
    shares,
    bps: round(bps.value),
    eps: round(eps.value),
    netAssets: round(netAssets.value),
    interestDebt: round(interestDebt.value),
    cash: round(cash.value),
  };
}

function toFactRow(listedRow, result) {
  const price = Number(priceByCode.get(listedRow.code) || 0);
  return {
    code: listedRow.code,
    name: listedRow.name,
    market: listedRow.market,
    sector: listedRow.sector,
    price: Number.isFinite(price) ? price : 0,
    bps: result.bps ?? "",
    eps: result.eps ?? "",
    cash: result.cash ?? "",
    securities: 0,
    investmentSecurities: 0,
    interestDebt: result.interestDebt ?? "",
    netAssets: result.netAssets ?? "",
    rentalBook: 0,
    rentalMarket: 0,
    shares: result.shares ?? "",
    treasuryShares: 0,
    period: result.period || "",
    sourceUrl: result.sourceUrl || `https://irbank.net/${encodeURIComponent(listedRow.code)}/results`,
    status: result.status,
    error: result.error || "",
    fetchedAt: new Date().toISOString(),
  };
}

function latestMetric(html, title, type) {
  const block = metricBlock(html, title);
  const matches = [...block.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>[\s\S]*?<span class="text">([\s\S]*?)<\/span>/g)];
  const parsed = matches
    .map((match) => ({
      period: stripTags(match[1]).match(/\d{4}\/\d{2}/)?.[0] ?? "",
      value: type === "money" ? parseJapaneseMoney(stripTags(match[2])) : parseNumber(stripTags(match[2])),
    }))
    .filter((item) => item.period && Number.isFinite(item.value));
  return parsed.at(-1) ?? { period: "", value: 0 };
}

function metricBlock(html, title) {
  const sections = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2><dl class="gdl">([\s\S]*?)<\/dl>/g)];
  const section = sections.find((match) => stripTags(match[1]).replace(/#\d+|\*/g, "").trim() === title);
  return section?.[2] ?? "";
}

function parseJapaneseMoney(text) {
  const value = text.replace(/,/g, "").trim();
  if (!value || value === "-") return 0;
  if (value.includes("億")) {
    const [okuText, restText = ""] = value.split("億");
    return round(parseNumber(okuText) * 100 + (restText.includes("万") ? parseNumber(restText.replace("万", "")) / 100 : 0));
  }
  if (value.includes("百万")) return round(parseNumber(value.replace("百万", "")));
  if (value.includes("万")) return round(parseNumber(value.replace("万", "")) / 100);
  return parseNumber(value);
}

function parseNumber(text) {
  const normalized = text.replace(/,/g, "").replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stripTags(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&thinsp;|&nbsp;/g, "")
    .replace(/&amp;/g, "&")
    .trim();
}

function writeReport(rows, latestRows) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const ok = rows.filter((row) => row.status === "取得成功");
  const failed = rows.filter((row) => row.status !== "取得成功");
  const latestOk = latestRows.filter((row) => row.status === "取得成功");
  const latestFailed = latestRows.filter((row) => row.status !== "取得成功");
  const lines = [
    "# 日本株全体 財務データ取得",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    `母集団: ${listed.length}件`,
    `今回対象: ${latestRows.length}件`,
    `今回取得成功: ${latestOk.length}件`,
    `今回取得失敗: ${latestFailed.length}件`,
    `累計取得成功: ${ok.length}件`,
    `累計取得失敗: ${failed.length}件`,
    "",
    "## 今回取得できた上位",
    "",
    ...(latestOk.length
      ? latestOk.slice(0, 50).map((row, index) => `- ${index + 1}. ${row.code} ${row.name}: ${row.period} / BPS ${row.bps} / EPS ${row.eps} / 純資産 ${row.netAssets}百万円 / 現金等 ${row.cash}百万円 / 有利子負債 ${row.interestDebt}百万円`)
      : ["- 該当なし"]),
    "",
    "## 今回取得できなかった上位",
    "",
    ...(latestFailed.length
      ? latestFailed.slice(0, 50).map((row, index) => `- ${index + 1}. ${row.code} ${row.name}: ${row.error}`)
      : ["- 該当なし"]),
    "",
    "## 使い方",
    "",
    "- このCSVは日本株全体の財務実データ取得キャッシュです。",
    "- 取得成功した銘柄は universe-metrics.csv で priceEstimate より優先して使います。",
    "- ただし、IRBANK自動取得は確認補助なので、買い候補にする前には決算短信と有報の後追い確認を残します。",
  ];
  fs.writeFileSync(outputReportPath, `${lines.join("\n")}\n`, "utf8");
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

async function mapLimit(items, size, mapper) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
      await sleep(40);
    }
  });
  await Promise.all(workers);
  return results;
}

function toCsv(rows) {
  const headers = [
    "code",
    "name",
    "market",
    "sector",
    "price",
    "bps",
    "eps",
    "cash",
    "securities",
    "investmentSecurities",
    "interestDebt",
    "netAssets",
    "rentalBook",
    "rentalMarket",
    "shares",
    "treasuryShares",
    "period",
    "sourceUrl",
    "status",
    "error",
    "fetchedAt",
  ];
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")).join("\n")}\n`;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll("\"", "\"\"")}"`;
  return text;
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
