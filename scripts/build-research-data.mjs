import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const appDir = path.join(rootDir, "app");
const universeCsv = path.join(dataDir, "universe-price-backtest.csv");
const multibaggerCsv = path.join(dataDir, "multibagger-candidates.csv");
const outputJs = path.join(appDir, "generated-research.js");

const universeRows = readCsv(universeCsv);
const multibaggerRows = readCsv(multibaggerCsv);

const universeSuccess = universeRows.filter((row) => !row.error).length;
const universeTop = universeRows
  .filter((row) => row.judgement === "良さそう")
  .sort((a, b) => number(b.priceScore) - number(a.priceScore))
  .slice(0, 20)
  .map((row) => ({
    code: row.code,
    name: row.name,
    market: row.market,
    sector: row.sector,
    judgement: row.judgement,
    signal: row.latestSignal,
    strategy: row.bestStrategy,
    score: number(row.priceScore),
    winRate: number(row.winRate),
    averageReturn: number(row.averageReturn),
    maxDrawdown: number(row.maxDrawdown),
    periodReturn: number(row.periodReturn),
    trades: number(row.trades),
  }));

const multibaggerWatch = multibaggerRows
  .filter((row) => row.group === "2倍監視候補")
  .slice(0, 20)
  .map((row) => ({
    code: row.code,
    name: row.name,
    market: row.market,
    sector: row.sector,
    judgement: row.judgement,
    signal: row.latestSignal,
    strategy: row.bestStrategy,
    score: number(row.priceScore),
    winRate: number(row.winRate),
    averageReturn: number(row.averageReturn),
    maxDrawdown: number(row.maxDrawdown),
    periodReturn: number(row.periodReturn),
    trades: number(row.trades),
    comment: row.comment,
    nextCheck: row.nextCheck,
    caution: row.caution,
  }));

const payload = {
  generatedAt: new Date().toISOString(),
  source: "data/universe-price-backtest.csv + data/multibagger-candidates.csv",
  universe: {
    total: universeRows.length,
    success: universeSuccess,
    good: universeRows.filter((row) => row.judgement === "良さそう").length,
    avoid: universeRows.filter((row) => row.judgement === "見送り寄り").length,
  },
  universeTop,
  multibaggerWatch,
};

fs.writeFileSync(outputJs, `window.AUTO_RESEARCH_DATA = ${JSON.stringify(payload, null, 2)};\n`, "utf8");
console.log(`画面用調査データを生成しました: ${outputJs}`);

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
