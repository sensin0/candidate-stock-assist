import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const universePath = path.join(rootDir, "data", "listed-universe.csv");
const reportPath = path.join(rootDir, "reports", "latest-universe-price-backtest.md");
const csvPath = path.join(rootDir, "data", "universe-price-backtest.csv");
const limit = Number(process.env.UNIVERSE_BACKTEST_LIMIT || 1000);
const concurrency = Number(process.env.UNIVERSE_BACKTEST_CONCURRENCY || 6);
const days = Number(process.env.UNIVERSE_BACKTEST_DAYS || 380);

const universe = parseCsvRecords(fs.readFileSync(universePath, "utf8"))
  .filter((row) => /^[0-9A-Z]{4}$/.test(row.code))
  .slice(0, limit);

const rows = await mapLimit(universe, concurrency, async (stock, index) => {
  try {
    const prices = await fetchDailyPrices(stock.code, days);
    const result = evaluatePriceOnlyStrategies(prices);
    return {
      rankSeed: index + 1,
      code: stock.code,
      name: stock.name,
      market: stock.market,
      sector: stock.sector,
      points: prices.length,
      firstDate: prices[0]?.date ?? "",
      lastDate: prices.at(-1)?.date ?? "",
      lastClose: round(prices.at(-1)?.close ?? 0),
      periodReturn: round(((prices.at(-1).close / prices[0].close) - 1) * 100),
      ...result,
      error: "",
    };
  } catch (error) {
    return {
      rankSeed: index + 1,
      code: stock.code,
      name: stock.name,
      market: stock.market,
      sector: stock.sector,
      points: 0,
      firstDate: "",
      lastDate: "",
      lastClose: "",
      periodReturn: "",
      bestStrategy: "",
      trades: 0,
      winRate: "",
      averageReturn: "",
      maxDrawdown: "",
      latestSignal: "",
      priceScore: "",
      judgement: "取得失敗",
      error: error.message,
    };
  }
});

const sorted = [...rows].sort((a, b) => Number(b.priceScore || -999) - Number(a.priceScore || -999));

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, renderReport(sorted), "utf8");
fs.writeFileSync(csvPath, toCsv(sorted), "utf8");

const ok = rows.filter((row) => !row.error);
console.log(`日本株価格バックテスト: ${ok.length}/${rows.length}件取得`);
console.log(`良さそう: ${ok.filter((row) => row.judgement === "良さそう").length}件`);
console.log(`見送り寄り: ${ok.filter((row) => row.judgement === "見送り寄り").length}件`);
for (const row of sorted.filter((item) => !item.error).slice(0, 10)) {
  console.log(`${row.code} ${row.name}: ${row.priceScore}点 / ${row.bestStrategy} / 平均${row.averageReturn}% / 勝率${row.winRate}%`);
}

async function fetchDailyPrices(code, daysBack) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - daysBack * 24 * 60 * 60;
  const symbol = `${code}.T`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${start}&period2=${end}&interval=1d&events=history&includeAdjustedClose=true`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);

  const json = await response.json();
  const error = json.chart?.error;
  if (error) throw new Error(error.description || error.code || "chart error");

  const result = json.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const prices = timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      close: closes[index],
    }))
    .filter((item) => Number.isFinite(item.close) && item.close > 0);

  if (prices.length < 120) throw new Error(`価格データが少なすぎます: ${prices.length}件`);
  return prices;
}

function evaluatePriceOnlyStrategies(prices) {
  const strategies = [
    ["安値反転", simulateLowRebound(prices)],
    ["高値更新", simulateBreakout(prices)],
    ["上昇中押し目", simulatePullback(prices)],
  ].map(([label, result]) => ({ label, ...result }));
  const best = strategies.sort((a, b) => scoreStrategy(b) - scoreStrategy(a))[0];
  const latestSignal = latestSignalFor(prices);
  const priceScore = round(scoreStrategy(best) + latestSignal.score);
  return {
    bestStrategy: best.label,
    trades: best.trades,
    winRate: round(best.winRate),
    averageReturn: round(best.averageReturn),
    maxDrawdown: round(best.maxDrawdown),
    latestSignal: latestSignal.label,
    priceScore,
    judgement: judgement({ ...best, priceScore }),
  };
}

function simulateLowRebound(prices) {
  return simulate(prices, {
    shouldEnter(index) {
      if (index < 120) return false;
      const close = prices[index].close;
      const prev = prices[index - 1].close;
      const low120 = minClose(prices, index - 120, index);
      const ma20 = movingAverage(prices, index, 20);
      const prevMa20 = movingAverage(prices, index - 1, 20);
      return close <= low120 * 1.12 && prev <= prevMa20 && close > ma20;
    },
    takeProfit: 15,
    stopLoss: -8,
    trailingStop: -10,
    maxHold: 60,
  });
}

function simulateBreakout(prices) {
  return simulate(prices, {
    shouldEnter(index) {
      if (index < 90) return false;
      return prices[index].close >= maxClose(prices, index - 90, index - 1) * 1.01;
    },
    takeProfit: 12,
    stopLoss: -7,
    trailingStop: -8,
    maxHold: 40,
  });
}

function simulatePullback(prices) {
  return simulate(prices, {
    shouldEnter(index) {
      if (index < 120) return false;
      const close = prices[index].close;
      const prev = prices[index - 1].close;
      const ma50 = movingAverage(prices, index, 50);
      const ma120 = movingAverage(prices, index, 120);
      return ma50 > ma120 && close > ma50 && prev <= ma50 * 1.02;
    },
    takeProfit: 10,
    stopLoss: -6,
    trailingStop: -8,
    maxHold: 35,
  });
}

function simulate(prices, options) {
  const trades = [];
  let position = null;
  let peak = 0;

  for (let index = 1; index < prices.length; index += 1) {
    const close = prices[index].close;
    if (!position) {
      if (options.shouldEnter(index)) {
        position = { entryPrice: close, entryIndex: index, worstPrice: close };
        peak = close;
      }
      continue;
    }

    peak = Math.max(peak, close);
    position.worstPrice = Math.min(position.worstPrice, close);
    const returnPct = ((close / position.entryPrice) - 1) * 100;
    const trailPct = ((close / peak) - 1) * 100;
    const holdDays = index - position.entryIndex;
    if (
      returnPct >= options.takeProfit
      || returnPct <= options.stopLoss
      || trailPct <= options.trailingStop
      || holdDays >= options.maxHold
      || index === prices.length - 1
    ) {
      trades.push({
        returnPct,
        drawdownPct: ((position.worstPrice / position.entryPrice) - 1) * 100,
      });
      position = null;
      peak = 0;
    }
  }

  if (!trades.length) return { trades: 0, winRate: 0, averageReturn: 0, maxDrawdown: 0 };
  return {
    trades: trades.length,
    winRate: (trades.filter((trade) => trade.returnPct > 0).length / trades.length) * 100,
    averageReturn: average(trades.map((trade) => trade.returnPct)),
    maxDrawdown: Math.min(...trades.map((trade) => trade.drawdownPct)),
  };
}

function latestSignalFor(prices) {
  const index = prices.length - 1;
  const close = prices[index].close;
  const ma20 = movingAverage(prices, index, 20);
  const ma50 = movingAverage(prices, index, 50);
  const ma120 = movingAverage(prices, index, 120);
  const low120 = minClose(prices, index - 120, index);
  const high120 = maxClose(prices, index - 120, index);
  if (close <= low120 * 1.08 && close > ma20) return { label: "安値反転候補", score: 10 };
  if (ma50 > ma120 && close > ma50 && close < high120 * 0.92) return { label: "上昇中押し目", score: 8 };
  if (close >= high120 * 0.98) return { label: "高値圏", score: -4 };
  return { label: "待ち", score: 0 };
}

function scoreStrategy(result) {
  if (!result.trades) return -30;
  const samplePenalty = result.trades === 1 ? 18 : 0;
  return result.winRate * 0.35 + result.averageReturn * 2 + result.maxDrawdown * 1.2 + Math.min(16, result.trades * 3) - samplePenalty;
}

function judgement(result) {
  if (!result.trades) return "未約定";
  if (result.trades >= 2 && result.averageReturn > 3 && result.winRate >= 55 && result.maxDrawdown > -12 && result.priceScore >= 35) return "良さそう";
  if (result.averageReturn < 0 || result.winRate < 45 || result.maxDrawdown <= -18) return "見送り寄り";
  return "中立";
}

function renderReport(records) {
  const ok = records.filter((row) => !row.error);
  const strong = ok.filter((row) => row.judgement === "良さそう");
  const weak = ok.filter((row) => row.judgement === "見送り寄り");
  return [
    "# 日本株価格バックテスト",
    "",
    `生成日時: ${new Date().toISOString()}`,
    `対象: ${records.length}件`,
    `取得成功: ${ok.length}件`,
    `良さそう: ${strong.length}件`,
    `見送り寄り: ${weak.length}件`,
    "",
    "注意: 価格だけの広域調査です。財務・資産バリュー確認前の一次候補として使います。",
    "",
    "## 上位候補",
    "",
    ...strong.slice(0, 50).map((row, index) =>
      `- ${index + 1}. ${row.code} ${row.name}: ${row.priceScore}点 / ${row.bestStrategy} / ${row.judgement} / 平均${row.averageReturn}% / 勝率${row.winRate}% / 最大下落${row.maxDrawdown}% / ${row.latestSignal}`
    ),
    "",
    "## 見送り寄り",
    "",
    ...weak.slice(0, 50).map((row) =>
      `- ${row.code} ${row.name}: ${row.bestStrategy} / 平均${row.averageReturn}% / 勝率${row.winRate}% / 最大下落${row.maxDrawdown}%`
    ),
    "",
  ].join("\n");
}

function minClose(prices, start, end) {
  return Math.min(...prices.slice(Math.max(0, start), end + 1).map((item) => item.close));
}

function maxClose(prices, start, end) {
  return Math.max(...prices.slice(Math.max(0, start), end + 1).map((item) => item.close));
}

function movingAverage(prices, index, period) {
  const slice = prices.slice(Math.max(0, index - period + 1), index + 1);
  return average(slice.map((item) => item.close));
}

function average(values) {
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / Math.max(1, values.length);
}

function round(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

async function mapLimit(items, max, mapper) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: max }, async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function toCsv(records) {
  const headers = [
    "rankSeed",
    "code",
    "name",
    "market",
    "sector",
    "points",
    "firstDate",
    "lastDate",
    "lastClose",
    "periodReturn",
    "bestStrategy",
    "trades",
    "winRate",
    "averageReturn",
    "maxDrawdown",
    "latestSignal",
    "priceScore",
    "judgement",
    "error",
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
