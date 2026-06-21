import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";
import { parseStockCsv } from "./providers/csv-provider.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stockMasterPath = path.join(rootDir, "data", "stock-master.csv");
const universePath = path.join(rootDir, "data", "listed-universe.csv");

const universe = parseCsvRecords(fs.readFileSync(universePath, "utf8"))
  .filter((row) => /^[0-9A-Z]{4}$/i.test(row.code));
const stocks = parseStockCsv(fs.readFileSync(stockMasterPath, "utf8"));
const stockCodes = new Set(stocks.map((stock) => stock.code));
const universeCodes = new Set();
const duplicates = [];

for (const item of universe) {
  if (universeCodes.has(item.code)) duplicates.push(item.code);
  universeCodes.add(item.code);
}

const missingInStockMaster = universe.filter((item) => !stockCodes.has(item.code));
const absentFromUniverse = stocks.filter((stock) => !universeCodes.has(stock.code));
const coverage = universe.length ? Math.round((stocks.length / universe.length) * 1000) / 10 : 0;

console.log("JPX/TSE国内株母集団チェック");
console.log(`母集団: ${universe.length}件`);
console.log(`候補銘柄: ${stocks.length}件`);
console.log(`母集団に対する候補化率: ${coverage}%`);
console.log(`候補未登録: ${missingInStockMaster.length}件`);
console.log(`母集団にない候補: ${absentFromUniverse.length}件`);
console.log(`重複コード: ${duplicates.length}件`);

if (missingInStockMaster.length) {
  console.log("");
  console.log("次に候補化する銘柄");
  missingInStockMaster.slice(0, 10).forEach((item, index) => {
    const details = [item.market, item.sector].filter(Boolean).join(" / ");
    console.log(`${index + 1}. ${item.code} ${item.name}${details ? ` / ${details}` : ""}`);
  });
}

if (absentFromUniverse.length) {
  console.log("");
  console.log("母集団にない候補（REIT・ETF・地方市場などの可能性）");
  absentFromUniverse.slice(0, 10).forEach((stock) => console.log(`- ${stock.code} ${stock.name}`));
}

if (duplicates.length) {
  console.log("");
  console.log(`重複コード: ${[...new Set(duplicates)].join(", ")}`);
  process.exit(1);
}
