import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const universePath = path.join(rootDir, "data", "listed-universe.csv");
const metricsPath = path.join(rootDir, "data", "universe-metrics.csv");

const universe = parseCsvRecords(fs.readFileSync(universePath, "utf8"));
const metrics = parseCsvRecords(fs.readFileSync(metricsPath, "utf8"));
const universeByCode = new Map(universe.map((item) => [item.code, item]));
const ranked = metrics
  .map((row) => scoreCandidate(row, universeByCode.get(row.code)))
  .filter(Boolean)
  .sort((a, b) => b.score - a.score);

console.log("日本株一次スクリーニング");
console.log(`母集団: ${universe.length}件`);
console.log(`判定可能: ${ranked.length}件`);
console.log(`未判定: ${Math.max(0, universe.length - ranked.length)}件`);
console.log("");
console.log("上位候補");
ranked.slice(0, 10).forEach((item, index) => {
  console.log(
    `${index + 1}. ${item.code} ${item.name}: ${item.score}点 / PBR ${fmt(item.pbr)} / PER ${fmt(item.per)} / 正味資産倍率 ${fmt(item.netAssetRatio)} / ${item.market}`,
  );
});

function scoreCandidate(row, issue = {}) {
  const price = number(row.price);
  const bps = number(row.bps);
  const eps = number(row.eps);
  const shares = number(row.shares);
  const treasuryShares = number(row.treasuryShares);
  const cash = number(row.cash);
  const securities = number(row.securities);
  const investmentSecurities = number(row.investmentSecurities);
  const interestDebt = number(row.interestDebt);
  const rentalBook = number(row.rentalBook);
  const rentalMarket = number(row.rentalMarket);
  const effectiveShares = Math.max(0, shares - treasuryShares);
  if (!row.code || !price || !bps || !effectiveShares) return null;

  const marketCap = (price * effectiveShares) / 1_000_000;
  const pbr = price / bps;
  const per = eps > 0 ? price / eps : null;
  const rentalGain = Math.max(0, rentalMarket - rentalBook);
  const nonBusinessAssets = cash + securities + investmentSecurities + rentalGain - interestDebt;
  const netAssetRatio = marketCap > 0 ? nonBusinessAssets / marketCap : 0;
  const score =
    points(pbr <= 0.5, 25)
    + points(pbr <= 0.8, 15)
    + points(per !== null && per <= 12, 15)
    + points(netAssetRatio >= 1, 25)
    + points(netAssetRatio >= 0.5, 10)
    + points(eps > 0, 10);

  return {
    code: row.code,
    name: issue.name || row.code,
    market: issue.market || "Unknown",
    sector: issue.sector || "Unknown",
    score,
    pbr,
    per,
    netAssetRatio,
  };
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function points(condition, value) {
  return condition ? value : 0;
}

function fmt(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "-";
  return Math.round(value * 100) / 100;
}
