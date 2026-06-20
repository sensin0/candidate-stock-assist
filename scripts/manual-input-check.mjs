import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseStockCsv } from "./providers/csv-provider.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stockMasterPath = path.join(rootDir, "data", "stock-master.csv");

const stocks = parseStockCsv(fs.readFileSync(stockMasterPath, "utf8"));
const manualInputs = stocks.filter((stock) => stock.dataConfidence === "一部手入力");

console.log("一部手入力チェック");
console.log(`対象: ${manualInputs.length}件`);

if (!manualInputs.length) {
  console.log("一部手入力はありません。");
  process.exit(0);
}

console.log("");
console.log("確認する順番");
manualInputs.forEach((stock, index) => {
  const notes = [
    stock.qualitativeDone ? "定性確認済み" : "定性未確認",
    stock.held ? "保有中" : "未保有",
    stock.catalyst ? `材料: ${stock.catalyst}` : "",
    stock.risk ? `リスク: ${stock.risk}` : "",
  ].filter(Boolean);
  console.log(`${index + 1}. ${stock.code} ${stock.name} / ${stock.sector} / ${notes.join(" / ")}`);
});

console.log("");
console.log("確認後にやること");
console.log("- data/stock-master.csv の dataConfidence を 確認済み に変える");
console.log("- npm run production:check で 一部手入力 の件数が減ったか見る");
