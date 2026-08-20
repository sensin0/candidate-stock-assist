import fs from "node:fs";
import { parseCsvRecords } from "../csv-utils.mjs";

const numberFields = new Set([
  "sales",
  "salesPrevious",
  "salesGrowthRate",
  "operatingProfit",
  "operatingProfitPrevious",
  "operatingProfitGrowthRate",
  "ordinaryProfit",
  "ordinaryProfitPrevious",
  "netIncome",
  "netIncomePrevious",
]);

export function parseEarningsFactsCsv(text) {
  return parseCsvRecords(text).map((row) => {
    const record = {};
    Object.entries(row).forEach(([header, value]) => {
      if (numberFields.has(header)) {
        const parsed = Number(value);
        record[header] = Number.isFinite(parsed) ? parsed : 0;
      } else if (header === "operatingProfitTurnaround") {
        record[header] = /^(1|true|TRUE|yes|YES|黒字転換)$/.test(String(value ?? "").trim());
      } else {
        record[header] = value;
      }
    });
    return record;
  }).filter((record) => record.code);
}

export async function fetchEarningsFacts({ inputEarningsCsv, earningsCsvUrl } = {}) {
  if (earningsCsvUrl) {
    const response = await fetch(earningsCsvUrl);
    if (!response.ok) {
      throw new Error(`決算短信CSV URLの取得に失敗しました: ${response.status}`);
    }
    return {
      source: earningsCsvUrl,
      fetchedAt: new Date().toISOString(),
      facts: parseEarningsFactsCsv(await response.text()),
    };
  }

  if (inputEarningsCsv && fs.existsSync(inputEarningsCsv)) {
    return {
      source: inputEarningsCsv,
      fetchedAt: new Date().toISOString(),
      facts: parseEarningsFactsCsv(fs.readFileSync(inputEarningsCsv, "utf8")),
    };
  }

  return {
    source: "none",
    fetchedAt: new Date().toISOString(),
    facts: [],
  };
}

export function applyEarningsFacts(stocks, facts) {
  const byCode = new Map(facts.map((fact) => [fact.code, fact]));
  return stocks.map((stock) => {
    const fact = byCode.get(stock.code);
    if (!fact) return stock;
    return {
      ...stock,
      earnings: fact,
    };
  });
}
