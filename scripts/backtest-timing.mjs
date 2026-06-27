import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { backtestStock } from "./backtest-core.mjs";
import { readRuntimeStocks } from "./runtime-stock-data.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stockMasterPath = path.join(rootDir, "data", "stock-master.csv");
const autoPromotionDraftPath = path.join(rootDir, "data", "stock-master-universe-promotion-draft.csv");
const universeMetricsPath = path.join(rootDir, "data", "universe-metrics.csv");
const financialScreenedPath = path.join(rootDir, "data", "financial-worklist-screened.csv");
const outputPath = path.join(rootDir, "data", "backtest-results.csv");

const stocks = readRuntimeStocks({ stockMasterPath, autoPromotionDraftPath, universeMetricsPath });
const financialScreening = loadFinancialScreening();
const rows = stocks.map((stock) => {
  const result = backtestStock(stock);
  const screening = financialScreening.get(String(stock.code));
  const timingLabel = guardedTimingLabel(result.timingLabel, screening);
  return {
    code: stock.code,
    bestStrategyId: result.bestStrategyId,
    bestStrategyLabel: result.bestStrategyLabel,
    timingLabel,
    buyTiming: result.buyTiming,
    sellTiming: result.sellTiming,
    confidence: result.confidence,
    sampleCount: result.sampleCount,
    trades: result.trades,
    winRate: result.winRate,
    averageReturn: result.averageReturn,
    maxDrawdown: result.maxDrawdown,
    bestScore: result.bestScore,
    financialScreeningStatus: screening?.status ?? "",
    financialScreeningCautions: screening?.cautions ?? "",
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

function guardedTimingLabel(timingLabel, screening) {
  if (screening?.status === "見送り寄り") return "財務で見送り";
  if (screening?.status === "慎重確認" && timingLabel === "買い候補") return "財務慎重確認";
  return timingLabel;
}

function loadFinancialScreening() {
  if (!fs.existsSync(financialScreenedPath)) return new Map();
  const lines = fs.readFileSync(financialScreenedPath, "utf8").trim().split(/\r?\n/);
  const headers = parseCsvLine(lines.shift() ?? "");
  const codeIndex = headers.indexOf("code");
  const statusIndex = headers.indexOf("status");
  const cautionsIndex = headers.indexOf("cautions");
  if (codeIndex < 0 || statusIndex < 0) return new Map();
  return new Map(lines.map((line) => {
    const values = parseCsvLine(line);
    return [values[codeIndex], {
      status: values[statusIndex] ?? "",
      cautions: values[cautionsIndex] ?? "",
    }];
  }).filter(([code]) => code));
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      if (inQuotes && line[index + 1] === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
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
    "financialScreeningStatus",
    "financialScreeningCautions",
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
