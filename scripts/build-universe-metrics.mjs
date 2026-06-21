import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseStockCsv } from "./providers/csv-provider.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stockMasterPath = path.join(rootDir, "data", "stock-master.csv");
const outputPath = path.join(rootDir, "data", "universe-metrics.csv");

const stocks = parseStockCsv(fs.readFileSync(stockMasterPath, "utf8"));
const rows = stocks.map((stock) => ({
  code: stock.code,
  price: stock.price,
  bps: stock.bps,
  eps: stock.eps,
  cash: stock.cash,
  securities: stock.securities,
  investmentSecurities: stock.investmentSecurities,
  interestDebt: stock.interestDebt,
  netAssets: stock.netAssets,
  rentalBook: stock.rentalBook,
  rentalMarket: stock.rentalMarket,
  shares: stock.shares,
  treasuryShares: stock.treasuryShares,
  asOf: "seed",
}));

fs.writeFileSync(outputPath, toCsv(rows), "utf8");
console.log(`universe-metrics を生成しました: ${rows.length}件`);

function toCsv(items) {
  const headers = [
    "code",
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
  ];
  return `${headers.join(",")}\n${items.map((item) => headers.map((header) => item[header] ?? "").join(",")).join("\n")}\n`;
}
