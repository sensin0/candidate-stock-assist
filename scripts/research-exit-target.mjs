import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const code = process.argv[2] || process.env.EXIT_TARGET_CODE || "6276";
const days = Number(process.env.EXIT_TARGET_DAYS || 1900);
const stopLoss = Number(process.env.EXIT_TARGET_STOP_LOSS || -12);
const trailingStop = Number(process.env.EXIT_TARGET_TRAILING_STOP || -15);
const maxHold = Number(process.env.EXIT_TARGET_MAX_HOLD || 180);
const cooldown = Number(process.env.EXIT_TARGET_COOLDOWN || 10);

const stock = loadStock(code);
const prices = await fetchDailyPrices(code, days);
const timing = buildTiming(stock);

const takeProfitRows = [10, 15, 20, 25, 30, 35, 40, 50, 60, 75, 100, 125, 150]
  .map((takeProfit) => simulateTakeProfit(prices, timing, takeProfit))
  .sort((a, b) => b.score - a.score);

const lineRows = buildTargetLines(timing)
  .map((line) => simulateTargetLine(prices, timing, line))
  .sort((a, b) => b.score - a.score);

const reportPath = path.join(rootDir, "reports", `latest-exit-target-${code}.md`);
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, renderReport({ stock, prices, timing, takeProfitRows, lineRows }), "utf8");

console.log(`出口バックテスト: ${code} ${stock.name || ""}`);
console.log(`価格データ: ${prices[0]?.date} - ${prices.at(-1)?.date} / ${prices.length}本`);
console.log(`利確率最上位: ${takeProfitRows[0]?.label} / 勝率${takeProfitRows[0]?.winRate}% / 平均${takeProfitRows[0]?.avgReturn}%`);
console.log(`ライン最上位: ${lineRows[0]?.label} / 勝率${lineRows[0]?.winRate}% / 平均${lineRows[0]?.avgReturn}%`);
console.log(path.relative(rootDir, reportPath));

function loadStock(targetCode) {
  for (const file of ["stock-master.csv", "universe-metrics.csv"]) {
    const fullPath = path.join(rootDir, "data", file);
    if (!fs.existsSync(fullPath)) continue;
    const rows = parseCsvRecords(fs.readFileSync(fullPath, "utf8"));
    const found = rows.find((row) => row.code === targetCode);
    if (found) return found;
  }
  throw new Error(`銘柄データがありません: ${targetCode}`);
}

async function fetchDailyPrices(targetCode, daysBack) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - daysBack * 24 * 60 * 60;
  const symbol = `${targetCode}.T`;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${start}&period2=${end}&interval=1d&events=history`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const json = await response.json();
  const error = json.chart?.error;
  if (error) throw new Error(error.description || error.code || "chart error");
  const result = json.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const quote = result?.indicators?.quote?.[0] ?? {};
  const prices = timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      close: Number(quote.close?.[index]),
      high: Number(quote.high?.[index]),
      low: Number(quote.low?.[index]),
    }))
    .filter((item) => item.close > 0 && item.high > 0 && item.low > 0);
  if (prices.length < 120) throw new Error(`価格データが少なすぎます: ${prices.length}件`);
  return prices;
}

function buildTiming(row) {
  const bps = Number(row.bps || 0);
  const eps = Number(row.eps || 0);
  const pbrLow = Number(row.pbrLow || 0.64);
  const pbrAvg = Number(row.pbrAvg || 1.09);
  const pbrHigh = Number(row.pbrHigh || 1.53);
  const perLow = Number(row.perLow || 10);
  const perAvg = Number(row.perAvg || 16);
  const perHigh = Number(row.perHigh || 24);
  const buyLine = Math.max(1, Math.min(bps * pbrLow, eps * perLow));
  return {
    bps,
    eps,
    pbrLow,
    pbrAvg,
    pbrHigh,
    perLow,
    perAvg,
    perHigh,
    buyLine,
    nearLine: buyLine * 1.1,
  };
}

function buildTargetLines(timing) {
  return [
    { label: "第一利確 20%", price: (entry) => entry * 1.2 },
    { label: `PBR平均 ${timing.pbrAvg}x`, price: () => timing.bps * timing.pbrAvg },
    { label: `PBR上限 ${timing.pbrHigh}x`, price: () => timing.bps * timing.pbrHigh },
    { label: `PER下限 ${timing.perLow}x`, price: () => timing.eps * timing.perLow },
    { label: `PER平均 ${timing.perAvg}x`, price: () => timing.eps * timing.perAvg },
    { label: `PER上限 ${timing.perHigh}x`, price: () => timing.eps * timing.perHigh },
  ];
}

function simulateTakeProfit(prices, timing, takeProfit) {
  return summarize(`${takeProfit}%`, runSimulation(prices, timing, {
    targetPrice: (entry) => entry * (1 + takeProfit / 100),
    targetLabel: `利確${takeProfit}%`,
    maxHold,
  }));
}

function simulateTargetLine(prices, timing, line) {
  const result = summarize(line.label, runSimulation(prices, timing, {
    targetPrice: line.price,
    targetLabel: line.label,
    maxHold: Math.max(maxHold, 252),
  }));
  result.targetPrice = round(line.price(prices.at(-1).close));
  return result;
}

function runSimulation(prices, timing, options) {
  const trades = [];
  let position = null;
  let nextEntry = 120;
  for (let index = 120; index < prices.length; index += 1) {
    const price = prices[index];
    if (!position) {
      if (index >= nextEntry && shouldEnter(prices, timing, index)) {
        position = {
          entryIndex: index,
          entryDate: price.date,
          entry: price.close,
          peak: price.close,
          trough: price.close,
          target: options.targetPrice(price.close),
        };
      }
      continue;
    }

    position.peak = Math.max(position.peak, price.high);
    position.trough = Math.min(position.trough, price.low);
    const lowReturn = percentage(price.low, position.entry);
    const closeReturn = percentage(price.close, position.entry);
    const trailReturn = percentage(price.close, position.peak);
    const hold = index - position.entryIndex;
    let reason = "";
    let exit = price.close;
    let returnPct = closeReturn;

    if (price.high >= position.target) {
      reason = options.targetLabel;
      exit = position.target;
      returnPct = percentage(exit, position.entry);
    } else if (lowReturn <= stopLoss) {
      reason = `損切${stopLoss}%`;
      exit = position.entry * (1 + stopLoss / 100);
      returnPct = stopLoss;
    } else if (trailReturn <= trailingStop && closeReturn > 0) {
      reason = `トレーリング${trailingStop}%`;
    } else if (hold >= options.maxHold || index === prices.length - 1) {
      reason = "期限/現値";
    }

    if (reason) {
      trades.push({
        entryDate: position.entryDate,
        entry: round(position.entry),
        exitDate: price.date,
        exit: round(exit),
        returnPct: round(returnPct),
        maxRunup: round(percentage(position.peak, position.entry)),
        maxDrawdown: round(percentage(position.trough, position.entry)),
        hold,
        reason,
      });
      position = null;
      nextEntry = index + cooldown;
    }
  }
  return trades;
}

function shouldEnter(prices, timing, index) {
  const price = prices[index];
  const previous = prices[index - 1];
  const ma20 = average(prices.slice(Math.max(0, index - 19), index + 1).map((item) => item.close));
  const deepValue = price.close <= timing.buyLine;
  const nearValue = price.close <= timing.nearLine;
  const rebound = price.close > ma20 && previous.close <= ma20;
  return nearValue && (deepValue || rebound);
}

function summarize(label, trades) {
  const avgReturn = average(trades.map((trade) => trade.returnPct));
  const winRate = trades.length
    ? (trades.filter((trade) => trade.returnPct > 0).length / trades.length) * 100
    : 0;
  const maxDrawdown = trades.length ? Math.min(...trades.map((trade) => trade.maxDrawdown)) : 0;
  const avgHold = average(trades.map((trade) => trade.hold));
  const score = winRate * 0.35 + avgReturn * 1.8 + Math.min(20, trades.length * 4) + maxDrawdown * 0.8 - avgHold * 0.03;
  return {
    label,
    trades: trades.length,
    winRate: round(winRate),
    avgReturn: round(avgReturn),
    medianReturn: round(median(trades.map((trade) => trade.returnPct))),
    avgHold: round(avgHold),
    maxDrawdown: round(maxDrawdown),
    avgRunup: round(average(trades.map((trade) => trade.maxRunup))),
    score: round(score),
    samples: trades,
  };
}

function renderReport({ stock, prices, timing, takeProfitRows, lineRows }) {
  const current = prices.at(-1).close;
  return [
    `# 出口バックテスト ${stock.code} ${stock.name || ""}`,
    "",
    `生成日時: ${new Date().toISOString()}`,
    `価格期間: ${prices[0].date} - ${prices.at(-1).date} (${prices.length}本)`,
    `現在値: ${round(current)}円`,
    `買いライン: ${round(timing.buyLine)}円 / 買い場近い: ${round(timing.nearLine)}円`,
    `損切り: ${stopLoss}% / トレーリング: ${trailingStop}% / 最大保有: ${maxHold}営業日 / 再エントリー間隔: ${cooldown}営業日`,
    "",
    "注意: 日足の高値・安値・終値だけを使った簡易検証です。決算発表日、流動性、当時の財務状態は完全再現していません。",
    "",
    "## 利確率別",
    "",
    "| 利確 | 取引数 | 勝率 | 平均損益 | 中央損益 | 平均保有 | 最大含み損 | スコア |",
    "|---:|---:|---:|---:|---:|---:|---:|---:|",
    ...takeProfitRows.map((row) =>
      `| ${row.label} | ${row.trades} | ${row.winRate}% | ${row.avgReturn}% | ${row.medianReturn}% | ${row.avgHold}日 | ${row.maxDrawdown}% | ${row.score} |`
    ),
    "",
    "## 評価ライン別",
    "",
    "| ライン | 目安株価 | 取引数 | 勝率 | 平均損益 | 中央損益 | 平均保有 | 最大含み損 | スコア |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
    ...lineRows.map((row) =>
      `| ${row.label} | ${row.targetPrice ? `${row.targetPrice}円` : "-"} | ${row.trades} | ${row.winRate}% | ${row.avgReturn}% | ${row.medianReturn}% | ${row.avgHold}日 | ${row.maxDrawdown}% | ${row.score} |`
    ),
    "",
    "## 最上位ラインの取引例",
    "",
    "| 買い日 | 買値 | 売り日 | 売値 | 損益 | 最大上昇 | 最大下落 | 理由 |",
    "|---|---:|---|---:|---:|---:|---:|---|",
    ...lineRows[0].samples.map((trade) =>
      `| ${trade.entryDate} | ${trade.entry} | ${trade.exitDate} | ${trade.exit} | ${trade.returnPct}% | ${trade.maxRunup}% | ${trade.maxDrawdown}% | ${trade.reason} |`
    ),
    "",
  ].join("\n");
}

function percentage(value, base) {
  return ((value / base) - 1) * 100;
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length : 0;
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function round(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}
