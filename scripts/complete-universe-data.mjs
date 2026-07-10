import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const outputPath = path.join(dataDir, "universe-completion-overrides.csv");
const reportPath = path.join(reportsDir, "latest-universe-data-completion.md");

const listed = readCsv("listed-universe.csv");
const metricsByCode = new Map(readCsv("universe-metrics.csv").map((row) => [row.code, row]));
const factsByCode = new Map(readCsv("universe-financial-facts.csv").map((row) => [row.code, row]));
const priceByCode = new Map(readCsv("universe-price-backtest.csv").map((row) => [row.code, row]));
const monthlyPriceByCode = groupByCode(readCsv("monthly-price-history.csv"));
const previousCompletionByCode = new Map(readCsv("universe-completion-overrides.csv").map((row) => [row.code, row]));

const completions = [];
const unresolved = [];

for (const issue of listed) {
  const metric = metricsByCode.get(issue.code);
  const fact = factsByCode.get(issue.code);
  const priceRow = priceByCode.get(issue.code);
  const monthlyRows = monthlyPriceByCode.get(issue.code) ?? [];
  const previous = previousCompletionByCode.get(issue.code);
  const source = completionNeed(metric, fact, previous);
  if (!source) continue;

  const price = firstPositive(priceRow?.lastClose, latestMonthlyClose(monthlyRows), fact?.price, metric?.price, previous?.price);
  if (!price) {
    unresolved.push(unresolvedRow(issue, "価格がないため補完不可", metric, fact, priceRow));
    continue;
  }

  completions.push(completionRow(issue, price, source, priceRow, monthlyRows, previous));
}

fs.writeFileSync(outputPath, toCsv(completions), "utf8");
writeReport(completions, unresolved);

console.log(`日本株データ完全化: 補完${completions.length}件 / 未解決${unresolved.length}件`);
console.log(path.relative(rootDir, outputPath));

function completionNeed(metric, fact, previous) {
  const metricSource = metric?.asOf || "";
  const factOk = fact?.status === "取得成功";
  if (metricSource === "completionEstimate") return "completionEstimate";
  if (previous?.asOf === "completionEstimate" && !factOk) return previous.source || "completionEstimate";
  const metricOk = validMetric(metric) && metricSource !== "unavailable" && metricSource !== "priceEstimate";
  if (factOk || metricOk) return "";
  if (metricSource === "priceEstimate") return "priceEstimate";
  if (metricSource === "unavailable") return "unavailable";
  if (!metric || !validMetric(metric)) return "missingFinancial";
  return "";
}

function completionRow(issue, price, source, priceRow, monthlyRows, previous = {}) {
  // Conservative fallback: PBR ~= 0.75, PER ~= 12. This allows charting and
  // broad screening, but does not manufacture an immediate buy signal.
  const bps = round(price / 0.75);
  const eps = round(price / 12);
  const shares = 10_000_000;
  const netAssets = Math.round((bps * shares) / 1_000_000);
  const cash = Math.round(netAssets * 0.2);
  const interestDebt = Math.round(netAssets * 0.15);
  return {
    code: issue.code,
    name: issue.name,
    market: issue.market,
    sector: issue.sector,
    price: round(price),
    bps,
    eps,
    cash,
    securities: 0,
    investmentSecurities: 0,
    interestDebt,
    netAssets,
    rentalBook: 0,
    rentalMarket: 0,
    shares,
    treasuryShares: 0,
    asOf: "completionEstimate",
    confidence: "補完",
    source,
    monthlyHistoryCount: monthlyRows.length,
    priceScore: round(priceRow?.priceScore || 0),
    reason: previous.reason || `${source}を保守補完。買いラインが現在値より下になる前提でチャートと判定を継続`,
  };
}

function unresolvedRow(issue, reason, metric, fact, priceRow) {
  return {
    code: issue.code,
    name: issue.name,
    market: issue.market,
    sector: issue.sector,
    metricSource: metric?.asOf || "なし",
    financialStatus: fact?.status || "なし",
    priceStatus: priceRow && !priceRow.error ? "価格取得済み" : "価格なし",
    reason,
  };
}

function validMetric(row) {
  return firstPositive(row?.price) > 0
    && firstPositive(row?.bps) > 0
    && firstPositive(row?.eps) > 0
    && firstPositive(row?.shares) > 0;
}

function writeReport(completed, unresolvedRows) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const bySource = groupCount(completed, "source");
  const lines = [
    "# 日本株データ完全化",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    `母集団: ${listed.length}件`,
    `補完生成: ${completed.length}件`,
    `未解決: ${unresolvedRows.length}件`,
    "",
    "## 補完方針",
    "",
    "- 実取得データがある銘柄は実取得を優先します。",
    "- 取得できない銘柄は `completionEstimate` として保守補完します。",
    "- 補完値はチャート表示と広域判定を止めないためのものです。",
    "- 補完値だけで強い今買い判定を作らないよう、買いラインは現在値より下に寄せます。",
    "",
    "## 補完内訳",
    "",
    ...Object.entries(bySource).map(([label, count]) => `- ${label}: ${count}件`),
    ...(completed.length ? [] : ["- 該当なし"]),
    "",
    "## 未解決",
    "",
    ...(unresolvedRows.length
      ? unresolvedRows.slice(0, 80).map((row, index) => `- ${index + 1}. ${row.code} ${row.name}: ${row.reason} / ${row.metricSource} / ${row.financialStatus} / ${row.priceStatus}`)
      : ["- 該当なし"]),
  ];
  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

function groupByCode(rows) {
  return rows.reduce((acc, row) => {
    acc.set(row.code, [...(acc.get(row.code) ?? []), row]);
    return acc;
  }, new Map());
}

function latestMonthlyClose(rows) {
  const latest = [...rows]
    .filter((row) => row.month && Number(row.close || 0) > 0)
    .sort((a, b) => String(a.month).localeCompare(String(b.month)))
    .at(-1);
  return latest?.close || 0;
}

function groupCount(items, key) {
  return items.reduce((acc, item) => {
    const label = item[key] || "未設定";
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
}

function readCsv(name) {
  const filePath = path.join(dataDir, name);
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function firstPositive(...values) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function toCsv(items) {
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
    "asOf",
    "confidence",
    "source",
    "monthlyHistoryCount",
    "priceScore",
    "reason",
  ];
  return `${headers.join(",")}\n${items.map((item) => headers.map((header) => escapeCsv(item[header])).join(",")).join("\n")}\n`;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll("\"", "\"\"")}"`;
  return text;
}
