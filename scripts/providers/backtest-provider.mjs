import fs from "node:fs";
import { parseCsvRecords } from "../csv-utils.mjs";

const numberFields = new Set(["sampleCount", "trades", "winRate", "averageReturn", "maxDrawdown", "bestScore"]);

export function parseBacktestCsv(text) {
  return parseCsvRecords(text).map((row) => {
    const record = {};
    Object.entries(row).forEach(([header, value]) => {
      record[header] = numberFields.has(header) ? Number(value || 0) : value;
    });
    return record;
  });
}

export async function fetchBacktestResults({ inputBacktestCsv } = {}) {
  if (!fs.existsSync(inputBacktestCsv)) {
    return {
      source: "none",
      fetchedAt: new Date().toISOString(),
      results: [],
    };
  }

  return {
    source: inputBacktestCsv,
    fetchedAt: new Date().toISOString(),
    results: parseBacktestCsv(fs.readFileSync(inputBacktestCsv, "utf8")),
  };
}

export function applyBacktestResults(stocks, results) {
  const byCode = new Map(results.map((result) => [result.code, result]));
  return stocks.map((stock) => ({
    ...stock,
    backtest: byCode.get(stock.code) ?? null,
  }));
}
