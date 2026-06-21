export const timingStrategies = [
  {
    id: "value-line",
    label: "買いライン到達で買い",
    entryBuffer: 1,
    exitRatio: 0.9,
    stopLoss: 0.85,
    trailingStop: 0.82,
    waitForTurn: false,
  },
  {
    id: "early-value",
    label: "5%以内で早めに買い",
    entryBuffer: 1.05,
    exitRatio: 0.85,
    stopLoss: 0.88,
    trailingStop: 0.84,
    waitForTurn: false,
  },
  {
    id: "turnaround",
    label: "下げ止まり反転で買い",
    entryBuffer: 1.1,
    exitRatio: 0.9,
    stopLoss: 0.9,
    trailingStop: 0.88,
    waitForTurn: true,
  },
];

export function timingInputs(stock) {
  const pbrBuy = stock.bps * stock.pbrLow;
  const pbrTarget = stock.bps * stock.pbrHigh;
  const perBuy = stock.eps > 0 && stock.perLow > 0 ? stock.eps * stock.perLow : pbrBuy;
  const perTarget = stock.eps > 0 && stock.perHigh > 0 ? stock.eps * stock.perHigh : pbrTarget;
  const buyLine = Math.max(1, Math.min(pbrBuy, perBuy));
  const targetPrice = Math.max(pbrTarget, perTarget, buyLine * 1.5);
  return { buyLine, targetPrice };
}

export function backtestStock(stock) {
  const history = Array.isArray(stock.history) ? stock.history.filter((value) => Number.isFinite(value) && value > 0) : [];
  const { buyLine, targetPrice } = timingInputs(stock);
  const results = timingStrategies.map((strategy) => runStrategy({ history, buyLine, targetPrice, strategy }));
  const ranked = [...results].sort((a, b) => strategyScore(b) - strategyScore(a));
  const best = ranked[0] ?? emptyResult(timingStrategies[0]);
  return {
    bestStrategyId: best.strategyId,
    bestStrategyLabel: best.strategyLabel,
    timingLabel: timingLabel({ stock, buyLine, targetPrice, best }),
    buyTiming: buyTimingText(best, buyLine),
    sellTiming: sellTimingText(best, targetPrice),
    confidence: confidenceLabel(best),
    sampleCount: history.length,
    trades: best.trades,
    winRate: round(best.winRate),
    averageReturn: round(best.averageReturn),
    maxDrawdown: round(best.maxDrawdown),
    bestScore: round(strategyScore(best)),
    results,
  };
}

function runStrategy({ history, buyLine, targetPrice, strategy }) {
  if (history.length < 4) return emptyResult(strategy);

  const trades = [];
  let position = null;
  let peak = 0;

  for (let index = 1; index < history.length; index += 1) {
    const price = history[index];
    const previous = history[index - 1];

    if (!position) {
      const nearBuy = price <= buyLine * strategy.entryBuffer;
      const turnedUp = !strategy.waitForTurn || (previous <= buyLine * strategy.entryBuffer && price > previous);
      if (nearBuy && turnedUp) {
        position = { entryPrice: price, entryIndex: index, worstPrice: price };
        peak = price;
      }
      continue;
    }

    peak = Math.max(peak, price);
    position.worstPrice = Math.min(position.worstPrice, price);
    const stopPrice = Math.max(position.entryPrice * strategy.stopLoss, peak * strategy.trailingStop);
    const targetReached = price >= targetPrice * strategy.exitRatio;
    const stopped = price <= stopPrice;
    const finalDay = index === history.length - 1;

    if (targetReached || stopped || finalDay) {
      trades.push({
        entryIndex: position.entryIndex,
        exitIndex: index,
        entryPrice: position.entryPrice,
        exitPrice: price,
        returnPct: ((price / position.entryPrice) - 1) * 100,
        drawdownPct: ((position.worstPrice / position.entryPrice) - 1) * 100,
        exitReason: targetReached ? "target" : stopped ? "stop" : "latest",
      });
      position = null;
      peak = 0;
    }
  }

  if (!trades.length) {
    return {
      ...emptyResult(strategy),
      sampleCount: history.length,
    };
  }

  const wins = trades.filter((trade) => trade.returnPct > 0).length;
  return {
    strategyId: strategy.id,
    strategyLabel: strategy.label,
    sampleCount: history.length,
    trades: trades.length,
    winRate: (wins / trades.length) * 100,
    averageReturn: average(trades.map((trade) => trade.returnPct)),
    maxDrawdown: Math.min(...trades.map((trade) => trade.drawdownPct)),
    lastReturn: trades.at(-1)?.returnPct ?? 0,
    lastExitReason: trades.at(-1)?.exitReason ?? "none",
  };
}

function emptyResult(strategy) {
  return {
    strategyId: strategy.id,
    strategyLabel: strategy.label,
    sampleCount: 0,
    trades: 0,
    winRate: 0,
    averageReturn: 0,
    maxDrawdown: 0,
    lastReturn: 0,
    lastExitReason: "none",
  };
}

function strategyScore(result) {
  if (!result.trades) return -100;
  return result.winRate * 0.4 + result.averageReturn * 1.2 + result.maxDrawdown * 0.8 + Math.min(10, result.trades * 3);
}

function confidenceLabel(result) {
  if (result.sampleCount < 12 || result.trades < 2) return "参考";
  if (result.winRate >= 60 && result.averageReturn > 0 && result.maxDrawdown > -12) return "高め";
  if (result.averageReturn > 0) return "中";
  return "低";
}

function timingLabel({ stock, buyLine, targetPrice, best }) {
  if (stock.held && stock.price >= targetPrice * 0.9) return "売り検討";
  if (stock.price <= buyLine * 1.02) return best.trades === 0 ? "調査優先" : "買い候補";
  if (stock.price <= buyLine * 1.08) return "買い場待ち";
  return "待つ";
}

function buyTimingText(result, buyLine) {
  if (result.strategyId === "early-value") return `買いライン+5%以内 (${formatYen(buyLine * 1.05)}以下)`;
  if (result.strategyId === "turnaround") return `買いライン+10%以内で反転確認 (${formatYen(buyLine * 1.1)}以下)`;
  return `買いライン到達 (${formatYen(buyLine)}以下)`;
}

function sellTimingText(result, targetPrice) {
  if (result.strategyId === "early-value") return `目標の85%付近 (${formatYen(targetPrice * 0.85)}目安)`;
  return `目標の90%付近 (${formatYen(targetPrice * 0.9)}目安)`;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function formatYen(value) {
  return `${Math.round(value).toLocaleString("ja-JP")}円`;
}
