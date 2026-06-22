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
const universeAll = universeRows
  .filter((row) => !row.error)
  .map(mapUniverseRow)
  .sort((a, b) => b.timingRank - a.timingRank || b.score - a.score);
const universeTop = universeAll.filter((row) => row.judgement === "良さそう").slice(0, 100);
const timingBuys = universeAll.filter((row) => row.timingAction === "初回買い候補" || row.timingAction === "押し目買い候補").slice(0, 80);

const multibaggerWatch = multibaggerRows
  .filter((row) => row.group === "2倍監視候補")
  .slice(0, 80)
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
    timingAction: timingAction(row),
    timingRank: timingRank(row),
  }));

const payload = {
  generatedAt: new Date().toISOString(),
  source: "data/universe-price-backtest.csv + data/multibagger-candidates.csv",
  universe: {
    total: universeRows.length,
    success: universeSuccess,
    good: universeRows.filter((row) => row.judgement === "良さそう").length,
    avoid: universeRows.filter((row) => row.judgement === "見送り寄り").length,
    ranked: universeAll.length,
    buyTiming: timingBuys.length,
  },
  universeAll,
  universeTop,
  timingBuys,
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

function mapUniverseRow(row) {
  return {
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
    timingAction: timingAction(row),
    timingRank: timingRank(row),
  };
}

function timingAction(row) {
  const signal = row.latestSignal;
  const judgement = row.judgement;
  const winRate = number(row.winRate);
  const averageReturn = number(row.averageReturn);
  const maxDrawdown = number(row.maxDrawdown);
  if (judgement === "見送り寄り" || maxDrawdown <= -20) return "買わない";
  if (signal === "上昇中押し目" && judgement === "良さそう" && winRate >= 70 && averageReturn >= 10) return "押し目買い候補";
  if (signal === "待ち" && judgement === "良さそう" && winRate >= 80 && averageReturn >= 20 && maxDrawdown > -10) return "初回買い候補";
  if (signal === "高値圏") return "追いかけ注意";
  if (judgement === "良さそう") return "反転待ち";
  return "監視";
}

function timingRank(row) {
  let rank = number(row.priceScore);
  rank += number(row.averageReturn) * 0.8;
  rank += number(row.winRate) * 0.15;
  rank += Math.max(-30, number(row.maxDrawdown)) * 0.8;
  const action = timingAction(row);
  if (action === "押し目買い候補") rank += 35;
  if (action === "初回買い候補") rank += 28;
  if (action === "反転待ち") rank += 10;
  if (action === "追いかけ注意") rank -= 18;
  if (action === "買わない") rank -= 45;
  return Math.round(rank * 10) / 10;
}
