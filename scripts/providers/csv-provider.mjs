import fs from "node:fs";

const numberFields = new Set([
  "price",
  "shares",
  "treasuryShares",
  "cash",
  "securities",
  "investmentSecurities",
  "interestDebt",
  "netAssets",
  "rentalBook",
  "rentalMarket",
  "bps",
  "eps",
  "pbrLow",
  "pbrAvg",
  "pbrHigh",
  "perLow",
  "perAvg",
  "perHigh",
]);

export function parseStockCsv(text) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean);
  const headers = rows.shift().split(",").map((value) => value.trim());
  return rows.map((row) => {
    const values = row.split(",").map((value) => value.trim());
    const record = {};
    headers.forEach((header, index) => {
      const value = values[index] ?? "";
      if (header === "history") {
        record[header] = value ? value.split("|").map(Number) : [];
      } else if (header === "qualitativeDone" || header === "held") {
        record[header] = value === "true" || value === "1";
      } else if (numberFields.has(header)) {
        record[header] = Number(value || 0);
      } else {
        record[header] = value;
      }
    });
    return record;
  });
}

export async function fetchStocksFromCsv({ inputCsv }) {
  return {
    source: "csv",
    fetchedAt: new Date().toISOString(),
    stocks: parseStockCsv(fs.readFileSync(inputCsv, "utf8")),
  };
}
