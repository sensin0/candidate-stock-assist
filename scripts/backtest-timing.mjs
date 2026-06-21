import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { backtestStock } from "./backtest-core.mjs";
import { parseStockCsv } from "./providers/csv-provider.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stockMasterPath = path.join(rootDir, "data", "stock-master.csv");
const outputPath = path.join(rootDir, "data", "backtest-results.csv");

const stocks = parseStockCsv(fs.readFileSync(stockMasterPath, "utf8"));
const rows = stocks.map((stock) => {
  const result = backtestStock(stock);
  return {
    code: stock.code,
    bestStrategyId: result.bestStrategyId,
    bestStrategyLabel: result.bestStrategyLabel,
    timingLabel: result.timingLabel,
    buyTiming: result.buyTiming,
    sellTiming: result.sellTiming,
    confidence: result.confidence,
    sampleCount: result.sampleCount,
    trades: result.trades,
    winRate: result.winRate,
    averageReturn: result.averageReturn,
    maxDrawdown: result.maxDrawdown,
    bestScore: result.bestScore,
  };
});

fs.writeFileSync(outputPath, toCsv(rows), "utf8");

const usable = rows.filter((row) => Number(row.trades) > 0);
console.log("バックテスト完了");
console.log(`対象: ${rows.length}件`);
console.log(`売買検証あり: ${usable.length}件`);
for (const row of usable.sort((a, b) => Number(b.bestScore) - Number(a.bestScore)).slice(0, 10)) {
  console.log(`${row.code} ${row.timingLabel}: ${row.bestStrategyLabel} / 勝率${row.winRate}% / 平均${row.averageReturn}%`);
}

function toCsv(records) {
  const headers = [
    "code",
    "bestStrategyId",
    "bestStrategyLabel",
    "timingLabel",
    "buyTiming",
    "sellTiming",
    "confidence",
    "sampleCount",
    "trades",
    "winRate",
    "averageReturn",
    "maxDrawdown",
    "bestScore",
  ];
  return [
    headers.join(","),
    ...records.map((record) => headers.map((header) => escapeCsv(record[header])).join(",")),
    "",
  ].join("\n");
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll("\"", "\"\"")}"`;
  return text;
}
