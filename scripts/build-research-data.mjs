import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";
import { sqliteFreshFor, tableRows } from "./sqlite-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const appDir = path.join(rootDir, "app");
const universeCsv = path.join(dataDir, "universe-price-backtest.csv");
const listedUniverseCsv = path.join(dataDir, "listed-universe.csv");
const multibaggerCsv = path.join(dataDir, "multibagger-candidates.csv");
const universeBuyCandidatesCsv = path.join(dataDir, "universe-buy-candidates.csv");
const universeBuyCandidateReviewCsv = path.join(dataDir, "universe-buy-candidate-review.csv");
const universeMetricsCsv = path.join(dataDir, "universe-metrics.csv");
const monthlyPriceHistoryCsv = path.join(dataDir, "monthly-price-history.csv");
const earningsFactsCsv = path.join(dataDir, "earnings-facts.csv");
const outputJs = path.join(appDir, "generated-research.js");

const sqliteInputs = [
  universeCsv,
  listedUniverseCsv,
  universeMetricsCsv,
  monthlyPriceHistoryCsv,
  multibaggerCsv,
  universeBuyCandidatesCsv,
  universeBuyCandidateReviewCsv,
  earningsFactsCsv,
];
let useSqlite = sqliteFreshFor(sqliteInputs);
const universeRows = readTable("universe_price_backtest", universeCsv);
const listedUniverseByCode = new Map(readTable("listed_universe", listedUniverseCsv).map((row) => [row.code, row]));
const metricsByCode = new Map(readTable("universe_metrics", universeMetricsCsv).map((row) => [row.code, row]));
const monthlyHistoryByCode = groupMonthlyHistory(readTable("monthly_price_history", monthlyPriceHistoryCsv));
const multibaggerRows = readTable("multibagger_candidates", multibaggerCsv);
const universeBuyCandidateRows = readTable("universe_buy_candidates", universeBuyCandidatesCsv);
const universeBuyCandidateReviewByCode = new Map(readTable("universe_buy_candidate_review", universeBuyCandidateReviewCsv).map((row) => [row.code, row]));
const earningsFactsByCode = new Map(readTable("earnings_facts", earningsFactsCsv).map((row) => [row.code, row]));

const universeSuccess = universeRows.filter((row) => !row.error).length;
const universeAll = universeRows
  .filter((row) => !row.error)
  .map(mapUniverseRow)
  .sort((a, b) => b.qualityRank - a.qualityRank || b.timingRank - a.timingRank || b.score - a.score);
const universeTop = universeAll.filter((row) => row.judgement === "良さそう").slice(0, 300);
const timingBuys = universeAll.filter((row) => row.timingAction === "初回買い候補" || row.timingAction === "押し目買い候補").slice(0, 200);

const multibaggerWatch = multibaggerRows
  .filter((row) => row.group === "2倍監視候補")
  .slice(0, 150)
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

const autoBuyCandidates = universeBuyCandidateRows.map((row) => {
  const review = universeBuyCandidateReviewByCode.get(row.code) ?? {};
  const metrics = metricsByCode.get(row.code) ?? {};
  const earnings = earningsFactsByCode.get(row.code) ?? {};
  const price = number(row.price || metrics.price);
  const pbr = number(row.pbr);
  const per = number(row.per);
  const momentumRisk = momentumRiskFor(row);
  return {
    code: row.code,
    name: row.name,
    market: row.market,
    sector: row.sector,
    status: row.status,
    normalCandidate: row.normalCandidate,
    reviewStatus: review.reviewStatus || "",
    reviewReasons: review.reasons || "",
    reviewCautions: review.cautions || "",
    reviewNextAction: review.nextAction || "",
    financialRiskLevel: review.financialRiskLevel || "",
    financialRiskReasons: review.financialRiskReasons || "",
    priceValidationLevel: review.priceValidationLevel || "",
    priceValidationReasons: review.priceValidationReasons || "",
    auxiliaryTrades: number(review.auxiliaryTrades),
    auxiliaryWinRate: number(review.auxiliaryWinRate),
    auxiliaryAverageReturn: number(review.auxiliaryAverageReturn),
    auxiliaryMaxDrawdown: number(review.auxiliaryMaxDrawdown),
    momentumRiskLevel: momentumRisk.level,
    momentumRiskReasons: momentumRisk.reasons.join(" / ") || "過熱リスク低め",
    trustLevel: review.trustLevel || "",
    autoBuyScore: number(row.autoBuyScore),
    price,
    bps: number(metrics.bps) || (pbr > 0 ? round(price / pbr) : 0),
    eps: number(metrics.eps) || (per > 0 ? round(price / per) : 0),
    cash: number(metrics.cash),
    securities: number(metrics.securities),
    investmentSecurities: number(metrics.investmentSecurities),
    interestDebt: number(metrics.interestDebt),
    netAssets: number(metrics.netAssets),
    rentalBook: number(metrics.rentalBook),
    rentalMarket: number(metrics.rentalMarket),
    shares: number(metrics.shares),
    treasuryShares: number(metrics.treasuryShares),
    history: monthlyHistoryByCode.get(row.code) ?? estimatedHistory(price),
    buyLine: number(row.buyLine),
    targetPrice: number(row.targetPrice),
    sellGuidePrice: number(row.sellGuidePrice),
    buyRatio: number(row.buyRatio),
    upside: number(row.upside),
    pbr,
    per,
    netCashRatio: number(row.netCashRatio),
    winRate: number(row.winRate),
    averageReturn: number(row.averageReturn),
    maxDrawdown: number(row.maxDrawdown),
    signal: row.signal,
    judgement: row.judgement,
    metricSource: row.metricSource,
    action: review.nextAction || row.action,
    comment: row.comment,
    caution: review.cautions || row.caution,
    rankingScore: number(row.rankingScore || row.autoBuyScore),
    multibaggerScore: number(row.multibaggerScore),
    multibaggerLabel: row.multibaggerLabel || "",
    multibaggerReasons: row.multibaggerReasons || "",
    doubleTag: row.doubleTag || "",
    doubleTargetPrice: number(row.doubleTargetPrice),
    doubleTimeframe: row.doubleTimeframe || "",
    doubleComment: row.doubleComment || "",
    earningsScore: number(row.earningsScore),
    earningsLabel: row.earningsLabel || earningsLabel(earnings),
    salesGrowthRate: firstNumber(row.salesGrowthRate, earnings.salesGrowthRate),
    operatingProfitGrowthRate: firstNumber(row.operatingProfitGrowthRate, earnings.operatingProfitGrowthRate),
    operatingProfitTurnaround: row.operatingProfitTurnaround === "true" || earnings.operatingProfitTurnaround === true || String(earnings.operatingProfitTurnaround) === "true",
    earningsPeriod: row.earningsPeriod || earnings.period || "",
    earningsSource: row.earningsSource || earnings.sourceUrl || "",
    earningsReasons: row.earningsReasons || "",
    earningsCautions: row.earningsCautions || "",
    disclosureTitle: row.disclosureTitle || earnings.documentTitle || "",
    trades: number(row.trades),
    priceScore: number(row.priceScore),
    latestSignal: row.latestSignal || "",
    periodReturn: number(row.periodReturn),
    timingAction: "確認前買い候補",
    timingRank: number(row.rankingScore || row.autoBuyScore),
    qualityRank: number(row.rankingScore || row.autoBuyScore),
    qualityNote: review.reviewStatus ? `${review.reviewStatus}: ${review.reasons || review.cautions}` : row.caution || "自動ランキング反映済み。原資料確認で精度向上",
  };
})
  .sort(autoBuyCandidateSort)
  .slice(0, 120);

const payload = {
  generatedAt: new Date().toISOString(),
  source: "data/universe-price-backtest.csv + data/multibagger-candidates.csv",
  store: useSqlite ? "sqlite:data/candidate-stock-assist.sqlite" : "csv:fallback",
  universe: {
    total: universeRows.length,
    success: universeSuccess,
    good: universeRows.filter((row) => row.judgement === "良さそう").length,
    avoid: universeRows.filter((row) => row.judgement === "見送り寄り").length,
    ranked: universeAll.length,
    buyTiming: timingBuys.length,
    autoBuyCandidates: autoBuyCandidates.length,
  },
  universeAll,
  universeTop,
  timingBuys,
  autoBuyCandidates,
  multibaggerWatch,
};

fs.writeFileSync(outputJs, `window.AUTO_RESEARCH_DATA = ${JSON.stringify(payload, null, 2)};\n`, "utf8");
console.log(`画面用調査データを生成しました: ${outputJs}`);

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function readTable(tableName, csvPath) {
  if (useSqlite) {
    try {
      return tableRows(tableName);
    } catch (error) {
      useSqlite = false;
      console.warn(`SQLite読み込み失敗。CSVへ切り替えます: ${error.message}`);
    }
  }
  return readCsv(csvPath);
}

function momentumRiskFor(row) {
  const reasons = [];
  const latestSignal = row.latestSignal || "";
  const periodReturn = number(row.periodReturn);
  let points = 0;
  if (latestSignal === "高値圏") {
    points += 3;
    reasons.push("高値圏");
  }
  if (periodReturn >= 180) {
    points += 3;
    reasons.push(`急騰後 ${round(periodReturn)}%`);
  } else if (periodReturn >= 100) {
    points += 2;
    reasons.push(`上昇大 ${round(periodReturn)}%`);
  }
  if (periodReturn <= -60) {
    points += 2;
    reasons.push(`大幅下落後 ${round(periodReturn)}%`);
  }
  const level = points >= 4 ? "high" : points >= 2 ? "medium" : "low";
  return { level, reasons };
}

function autoBuyCandidateSort(a, b) {
  return reviewPriority(b.reviewStatus) - reviewPriority(a.reviewStatus)
    || trustPriority(b.trustLevel) - trustPriority(a.trustLevel)
    || buyTimingPriority(b) - buyTimingPriority(a)
    || earningsPriority(b) - earningsPriority(a)
    || priceValidationPriority(b.priceValidationLevel) - priceValidationPriority(a.priceValidationLevel)
    || momentumPriority(b.momentumRiskLevel) - momentumPriority(a.momentumRiskLevel)
    || b.rankingScore - a.rankingScore;
}

function earningsPriority(item) {
  let value = 0;
  if (number(item.salesGrowthRate) >= 20) value += 4;
  else if (number(item.salesGrowthRate) >= 15) value += 2;
  if (item.operatingProfitTurnaround) value += 4;
  else if (number(item.operatingProfitGrowthRate) >= 50) value += 3;
  else if (number(item.operatingProfitGrowthRate) >= 20) value += 2;
  if (number(item.operatingProfitGrowthRate) < 0) value -= 3;
  return value;
}

function earningsLabel(row = {}) {
  const salesGrowthRate = number(row.salesGrowthRate);
  const operatingProfitGrowthRate = number(row.operatingProfitGrowthRate);
  const turnaround = row.operatingProfitTurnaround === true || String(row.operatingProfitTurnaround) === "true";
  const labels = [];
  if (salesGrowthRate >= 20) labels.push(`売上+${round(salesGrowthRate)}%`);
  if (turnaround) labels.push("営業黒字転換");
  else if (operatingProfitGrowthRate >= 20) labels.push(`営業益+${round(operatingProfitGrowthRate)}%`);
  if (labels.length) return `決算強い: ${labels.join(" / ")}`;
  return row.code ? "決算中立" : "";
}

function firstNumber(...values) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && String(value ?? "") !== "") return parsed;
  }
  return 0;
}

function trustPriority(level) {
  if (level === "high") return 5;
  if (level === "watch") return 4;
  if (level === "financialCaution") return 3;
  if (level === "thinValidation") return 2;
  if (level === "avoid") return 1;
  return 0;
}

function priceValidationPriority(level) {
  if (level === "good" || level === "auxiliaryGood") return 4;
  if (level === "neutral") return 3;
  if (level === "thin") return 2;
  if (level === "weak" || level === "auxiliaryWeak") return 1;
  return 0;
}

function momentumPriority(level) {
  if (level === "low") return 3;
  if (level === "medium") return 2;
  if (level === "high") return 1;
  return 0;
}

function buyTimingPriority(item) {
  const buyRatio = number(item.buyRatio);
  if (buyRatio > 0 && buyRatio <= 1) return 4;
  if (buyRatio > 0 && buyRatio <= 1.08) return 3;
  if (buyRatio > 0 && buyRatio <= 1.18) return 2;
  return 1;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value, digits = 2) {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function estimatedHistory(price) {
  if (!Number.isFinite(price) || price <= 0) return [];
  return [0.92, 0.96, 0.99, 1].map((rate) => Math.round(price * rate));
}

function reviewPriority(status) {
  if (status === "通常候補へ昇格OK") return 3;
  if (status === "追加確認") return 2;
  if (status === "今回は見送り") return 1;
  return 0;
}

function mapUniverseRow(row) {
  const listed = listedUniverseByCode.get(row.code);
  const metrics = metricsByCode.get(row.code) ?? {};
  const price = number(row.lastClose || metrics.price);
  return {
    code: row.code,
    name: listed?.name || row.name,
    market: listed?.market || row.market,
    sector: listed?.sector || row.sector,
    sourceName: row.name,
    judgement: row.judgement,
    signal: row.latestSignal,
    strategy: row.bestStrategy,
    score: number(row.priceScore),
    price,
    bps: number(metrics.bps),
    eps: number(metrics.eps),
    chartBps: number(metrics.bps) || (price > 0 ? round(price / 0.75) : 0),
    chartEps: number(metrics.eps) > 0 ? number(metrics.eps) : price > 0 ? round(price / 12) : 0,
    metricSource: metrics.asOf || "",
    history: monthlyHistoryByCode.get(row.code) ?? [],
    winRate: number(row.winRate),
    averageReturn: number(row.averageReturn),
    maxDrawdown: number(row.maxDrawdown),
    periodReturn: number(row.periodReturn),
    trades: number(row.trades),
    timingAction: timingAction(row),
    timingRank: timingRank(row),
    qualityRank: qualityRank(row),
    qualityNote: qualityNote(row),
  };
}

function groupMonthlyHistory(rows) {
  const byCode = new Map();
  for (const row of rows) {
    const close = number(row.close);
    if (!row.code || !close) continue;
    const current = byCode.get(row.code) ?? [];
    current.push({ month: row.month, close });
    byCode.set(row.code, current);
  }
  return new Map([...byCode.entries()].map(([code, items]) => [
    code,
    items
      .sort((a, b) => String(a.month).localeCompare(String(b.month)))
      .slice(-18)
      .map((item) => item.close),
  ]));
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

function qualityRank(row) {
  const trades = number(row.trades);
  const winRate = number(row.winRate);
  const averageReturn = number(row.averageReturn);
  const maxDrawdown = number(row.maxDrawdown);
  const periodReturn = number(row.periodReturn);
  let rank = number(row.priceScore);

  rank += averageReturn * 1.1;
  rank += winRate * 0.22;
  rank += Math.max(-35, maxDrawdown) * 1.4;
  rank += Math.min(18, trades * 3);

  if (trades < 2) rank -= 18;
  if (trades >= 4) rank += 10;
  if (winRate < 60) rank -= 35;
  if (averageReturn < 8) rank -= 24;
  if (maxDrawdown <= -15) rank -= 34;
  if (row.judgement === "見送り寄り") rank -= 60;
  if (row.latestSignal === "高値圏") rank -= 22;
  if (periodReturn > 180) rank -= 20;
  if (periodReturn < -60) rank -= 12;
  if (["押し目買い候補", "初回買い候補"].includes(timingAction(row))) rank += 22;

  return Math.round(rank * 10) / 10;
}

function qualityNote(row) {
  const notes = [];
  const trades = number(row.trades);
  const maxDrawdown = number(row.maxDrawdown);
  const periodReturn = number(row.periodReturn);
  if (trades < 2) notes.push("検証回数少なめ");
  if (maxDrawdown <= -15) notes.push("下落深め");
  if (row.latestSignal === "高値圏") notes.push("高値圏");
  if (periodReturn > 180) notes.push("急騰後");
  if (!notes.length) return "利益と下落耐性を確認";
  return notes.join(" / ");
}
