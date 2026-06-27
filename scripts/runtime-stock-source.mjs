import fs from "node:fs";
import path from "node:path";
import { parseCsvRecords } from "./csv-utils.mjs";
import { parseStockCsv } from "./providers/csv-provider.mjs";

export function readRuntimeStocks({
  stockMasterPath,
  autoPromotionDraftPath,
  universeMetricsPath,
} = {}) {
  const baseStocks = parseStockCsv(fs.readFileSync(stockMasterPath, "utf8"));
  const promoted = readAutoPromotionStocks(baseStocks, autoPromotionDraftPath, universeMetricsPath);
  return [...baseStocks, ...promoted];
}

export function readAutoPromotionStocks(existingStocks, autoPromotionDraftPath, universeMetricsPath) {
  if (!autoPromotionDraftPath || !fs.existsSync(autoPromotionDraftPath)) return [];
  const existingCodes = new Set(existingStocks.map((stock) => String(stock.code)));
  const metricsByCode = readUniverseMetrics(universeMetricsPath);
  return parseCsvRecords(fs.readFileSync(autoPromotionDraftPath, "utf8"))
    .filter((row) => row.code && !existingCodes.has(String(row.code)))
    .map((row) => toAutoPromotedStock(row, metricsByCode.get(String(row.code))))
    .filter((stock) => stock.code && stock.price > 0 && stock.shares > 0 && stock.bps > 0);
}

function readUniverseMetrics(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return new Map();
  return new Map(parseCsvRecords(fs.readFileSync(filePath, "utf8")).map((row) => [String(row.code), row]));
}

function toAutoPromotedStock(row, metric = {}) {
  const pbrLow = number(row.pbrLow) || 0.64;
  const pbrHigh = number(row.pbrHigh) || 1.53;
  const metricSource = metric.asOf || "";
  return {
    code: String(row.code),
    name: row.name,
    sector: row.sector || "未分類",
    price: number(row.price),
    priceAsOf: todayInJapan(),
    shares: number(row.shares),
    treasuryShares: 0,
    cash: number(row.cash),
    securities: number(metric.securities),
    investmentSecurities: number(metric.investmentSecurities),
    interestDebt: number(row.interestDebt),
    netAssets: number(row.netAssets),
    rentalBook: number(metric.rentalBook),
    rentalMarket: number(metric.rentalMarket),
    bps: number(row.bps),
    eps: number(row.eps),
    pbrLow,
    pbrAvg: round((pbrLow + pbrHigh) / 2),
    pbrHigh,
    perLow: 0,
    perAvg: row.eps && number(row.eps) > 0 ? round(number(row.price) / number(row.eps)) : 0,
    perHigh: 0,
    dataConfidence: "自動財務確認",
    qualitativeDone: true,
    held: false,
    risk: "",
    catalyst: row.note || "全体自動判定から通常候補へ自動昇格",
    history: String(row.history || "")
      .split("|")
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0),
    edinet: periodEndFromMetricSource(metricSource)
      ? {
        documentType: metricSource.startsWith("irbank:") ? "irbank-auto" : "auto-financial",
        periodEnd: periodEndFromMetricSource(metricSource),
        submittedAt: todayInJapan(),
        sourceUrl: "",
      }
      : undefined,
  };
}

function periodEndFromMetricSource(source) {
  const match = String(source || "").match(/(\d{4})\/(\d{2})/);
  if (!match) return "";
  return `${match[1]}-${match[2]}-01`;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function todayInJapan() {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
