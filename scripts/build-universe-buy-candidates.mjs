import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";
import { timingInputs } from "./backtest-core.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");

const listed = readCsv("listed-universe.csv");
const metrics = readCsv("universe-metrics.csv");
const priceRows = readCsv("universe-price-backtest.csv");
const statusRows = readCsv("universe-check-status.csv");
const stockMaster = readCsv("stock-master.csv");
const monthlySignalRows = readCsv("monthly-signal-backtest.csv");

const listedByCode = new Map(listed.map((row) => [row.code, row]));
const priceByCode = new Map(priceRows.map((row) => [row.code, row]));
const statusByCode = new Map(statusRows.map((row) => [row.code, row]));
const stockMasterCodes = new Set(stockMaster.map((row) => row.code));
const latestMonth = latestUsableMonth(monthlySignalRows);
const monthlySignalByCode = new Map(monthlySignalRows.filter((row) => row.month === latestMonth).map((row) => [row.code, row]));
const defaultTiming = {
  pbrLow: 0.64,
  pbrHigh: 1.53,
  perLow: 10,
  perHigh: 24,
};
const specialSectors = new Set(["銀行業", "証券、商品先物取引業", "保険業", "その他金融業", "電気・ガス業", "不動産業"]);
const displayLimit = 120;
const nowBuyDisplayLimit = 90;

const candidates = metrics
  .filter((row) => listedByCode.has(row.code))
  .map(toCandidate)
  .filter(Boolean)
  .sort((a, b) =>
    signalPriority(b) - signalPriority(a)
    || financialPriority(b) - financialPriority(a)
    || b.rankingScore - a.rankingScore
    || b.autoBuyScore - a.autoBuyScore
    || a.buyRatio - b.buyRatio
    || b.upside - a.upside
  );

const top = selectDisplayCandidates(candidates, displayLimit);
top.forEach((row, index) => {
  row.rank = index + 1;
});
fs.writeFileSync(path.join(dataDir, "universe-buy-candidates.csv"), toCsv(top), "utf8");
writeReport(top, candidates.length);

console.log(`全体自動買い候補予備軍を生成しました: ${top.length}/${candidates.length}件`);
console.log(path.relative(rootDir, path.join(dataDir, "universe-buy-candidates.csv")));

function toCandidate(row) {
  const listedRow = listedByCode.get(row.code);
  const priceRow = priceByCode.get(row.code);
  const statusRow = statusByCode.get(row.code);
  const monthlyRow = monthlySignalByCode.get(row.code);
  const metricSource = row.asOf || "";
  const price = number(monthlyRow?.close || priceRow?.lastClose || row.price);
  const bps = number(row.bps);
  const eps = number(row.eps);
  const shares = Math.max(0, number(row.shares) - number(row.treasuryShares));
  if (!price || !bps || !eps || !shares) return null;
  if (metricSource === "unavailable" || metricSource === "priceEstimate") return null;
  if (statusRow?.status && !["自動チェック完了", "財務のみ完了"].includes(statusRow.status)) return null;
  if (monthlyRow?.dataStatus && monthlyRow.dataStatus !== "判定可能") return null;

  const marketCap = (price * shares) / 1_000_000;
  const pbr = price / bps;
  const per = eps > 0 ? price / eps : 0;
  const netCash = number(row.cash) + number(row.securities) + number(row.investmentSecurities) - number(row.interestDebt);
  const netCashRatio = marketCap > 0 ? netCash / marketCap : 0;
  const { buyLine, targetPrice, sellGuidePrice } = timingInputs({ price, bps, eps, ...defaultTiming });
  const buyRatio = number(monthlyRow?.buyRatio) || (buyLine > 0 ? price / buyLine : 999);
  const upside = number(monthlyRow?.upside) || (targetPrice > 0 ? (targetPrice / price - 1) * 100 : 0);
  const winRate = number(priceRow?.winRate);
  const averageReturn = number(priceRow?.averageReturn);
  const maxDrawdown = number(priceRow?.maxDrawdown);
  const trades = number(priceRow?.trades);
  const priceScore = number(priceRow?.priceScore);
  const latestSignal = priceRow?.latestSignal || "";
  const periodReturn = number(priceRow?.periodReturn);
  const judgement = priceRow?.judgement || "";
  const signal = monthlyRow?.signal || priceRow?.latestSignal || "";

  if (!["今買い候補", "買い場近い"].includes(signal)) return null;
  if (upside < 50 || pbr <= 0 || pbr > 1 || per <= 0 || per > 20) return null;

  const safety = signal === "今買い候補"
    ? netCashRatio >= 0 || pbr <= 0.6 ? "自動今買い候補" : "財務注意つき自動今買い"
    : netCashRatio >= 0 || pbr <= 0.6 ? "自動買い場近い" : "財務注意つき買い場近い";
  const alreadyNormal = stockMasterCodes.has(row.code);
  const specialSector = specialSectors.has(listedRow?.sector || statusRow?.sector || "");
  const multibagger = multibaggerProfile({
    latestSignal,
    judgement,
    priceScore,
    winRate,
    averageReturn,
    maxDrawdown,
    trades,
    periodReturn,
    pbr,
    per,
    netCashRatio,
    specialSector,
  });
  const doublePlan = doubleTargetPlan({ price, multibagger, latestSignal, priceScore, winRate, averageReturn, trades });
  const autoBuyScore = score({
    pbr,
    per,
    netCashRatio,
    buyRatio,
    upside,
    winRate,
    averageReturn,
    maxDrawdown,
    trades,
    priceScore,
    latestSignal,
    periodReturn,
    judgement,
    specialSector,
    signal,
    alreadyNormal,
  });
  const rankingScore = autoBuyScore + multibagger.score;

  return {
    rank: 0,
    code: row.code,
    name: listedRow?.name || statusRow?.name || row.code,
    market: listedRow?.market || statusRow?.market || "",
    sector: listedRow?.sector || statusRow?.sector || "",
    status: safety,
    normalCandidate: alreadyNormal ? "通常候補登録済み" : "通常候補前",
    autoBuyScore: round(autoBuyScore),
    rankingScore: round(rankingScore),
    multibaggerScore: round(multibagger.score),
    multibaggerLabel: multibagger.label,
    multibaggerReasons: multibagger.reasons.join(" / "),
    doubleTag: doublePlan.tag,
    doubleTargetPrice: doublePlan.targetPrice,
    doubleTimeframe: doublePlan.timeframe,
    doubleComment: doublePlan.comment,
    price: round(price),
    buyLine: round(buyLine),
    targetPrice: round(targetPrice),
    sellGuidePrice: round(sellGuidePrice),
    buyRatio: round(buyRatio),
    upside: round(upside),
    pbr: round(pbr),
    per: round(per),
    netCashRatio: round(netCashRatio * 100),
    winRate: round(winRate),
    averageReturn: round(averageReturn),
    maxDrawdown: round(maxDrawdown),
    trades: round(trades),
    priceScore: round(priceScore),
    latestSignal,
    periodReturn: round(periodReturn),
    signal,
    judgement: judgement || monthlyRow?.reason || "月次シグナル",
    metricSource,
    action: alreadyNormal ? "通常候補として自動ランキング反映" : "自動取得財務でランキング反映。原資料チェックで精度を上げる",
    comment: `${signal}。自動取得財務と月次シグナルで条件内です。${doublePlan.tag}: ${doublePlan.timeframe}。${multibagger.label}: ${multibagger.reasons.join(" / ") || "2倍化条件は標準"}`,
    caution: cautionText({ safety, multibagger, latestSignal, periodReturn }),
  };
}

function doubleTargetPlan({ price, multibagger, latestSignal, priceScore, winRate, averageReturn, trades }) {
  const targetPrice = round(price * 2);
  if (multibagger.label === "2倍期待強" && latestSignal === "上昇中押し目" && priceScore >= 90 && winRate >= 80 && averageReturn >= 15) {
    return {
      tag: "2倍候補",
      targetPrice,
      timeframe: "早ければ2〜4か月、通常は6〜12か月目安",
      comment: "過去の強い上昇中押し目では短期2倍化が出ています。出来高と材料継続が前提です",
    };
  }
  if (multibagger.label === "2倍期待強") {
    return {
      tag: "2倍候補",
      targetPrice,
      timeframe: "6〜12か月目安",
      comment: "2倍条件は強いですが、短期化には出来高増加と材料が必要です",
    };
  }
  if (multibagger.label === "2倍期待あり") {
    return {
      tag: "2倍監視",
      targetPrice,
      timeframe: "9〜18か月目安",
      comment: "2倍要素はあります。まず第一利確とPBR平均到達を確認します",
    };
  }
  if (multibagger.label === "2倍監視") {
    return {
      tag: "2倍監視",
      targetPrice,
      timeframe: "12か月以上。条件改善待ち",
      comment: "現時点では監視寄りです。上昇中押し目か価格スコア改善を待ちます",
    };
  }
  return {
    tag: "通常候補",
    targetPrice,
    timeframe: "2倍狙いではなく第一利確優先",
    comment: "2倍化条件は弱めです。短期利確と損切りを優先します",
  };
}

function score(item) {
  let value = 0;
  value += Math.max(0, 1 - item.buyRatio) * 42;
  value += Math.min(42, item.upside / 5);
  value += item.pbr <= 0.5 ? 18 : item.pbr <= 0.7 ? 12 : 6;
  value += item.per <= 10 ? 14 : item.per <= 15 ? 8 : 3;
  if (item.specialSector) value += item.netCashRatio >= 0 ? 3 : -8;
  else value += item.netCashRatio >= 0.5 ? 18 : item.netCashRatio >= 0 ? 10 : -8;
  value += item.winRate * 0.16;
  value += item.averageReturn * 0.7;
  value += Math.max(-20, item.maxDrawdown) * 0.8;
  value += Math.min(16, item.trades * 2);
  value += Math.min(14, item.priceScore * 0.1);
  if (item.signal === "上昇中押し目") value += 10;
  if (item.latestSignal === "上昇中押し目") value += 14;
  if (item.judgement === "良さそう") value += 10;
  if (item.latestSignal === "高値圏") value -= 16;
  if (item.periodReturn > 180) value -= 12;
  if (item.specialSector) value -= 14;
  if (item.alreadyNormal) value += 4;
  return value;
}

function signalPriority(row) {
  if (row.signal === "今買い候補") return 3;
  if (row.signal === "買い場近い") return 2;
  return 1;
}

function financialPriority(row) {
  if (String(row.status || "").includes("財務注意")) return 0;
  return 1;
}

function selectDisplayCandidates(rows, limit) {
  const nowBuy = rows.filter((row) => row.signal === "今買い候補");
  const nearBuy = rows.filter((row) => row.signal === "買い場近い");
  const other = rows.filter((row) => !["今買い候補", "買い場近い"].includes(row.signal));
  const selected = [
    ...nowBuy.slice(0, Math.min(nowBuy.length, nowBuyDisplayLimit)),
    ...nearBuy.slice(0, Math.max(0, limit - Math.min(nowBuy.length, nowBuyDisplayLimit))),
  ];
  if (selected.length < limit) {
    const selectedCodes = new Set(selected.map((row) => row.code));
    selected.push(...[...nowBuy, ...nearBuy, ...other].filter((row) => !selectedCodes.has(row.code)).slice(0, limit - selected.length));
  }
  return selected.slice(0, limit);
}

function multibaggerProfile(item) {
  let score = 0;
  const reasons = [];
  if (item.latestSignal === "上昇中押し目") {
    score += 18;
    reasons.push("上昇中押し目");
  }
  if (item.judgement === "良さそう") {
    score += 12;
    reasons.push("広域検証良好");
  }
  if (item.priceScore >= 50) {
    score += 10;
    reasons.push(`価格スコア${round(item.priceScore)}`);
  }
  if (item.trades >= 5) {
    score += 12;
    reasons.push(`検証${round(item.trades)}回`);
  } else if (item.trades >= 3) {
    score += 7;
    reasons.push(`検証${round(item.trades)}回`);
  }
  if (item.winRate >= 70 && item.averageReturn >= 10) {
    score += 12;
    reasons.push(`勝率${round(item.winRate)}%/平均${round(item.averageReturn)}%`);
  }
  if (item.maxDrawdown > -15) {
    score += 6;
    reasons.push(`下落浅め${round(item.maxDrawdown)}%`);
  }
  if (!item.specialSector && item.netCashRatio >= 1) {
    score += 8;
    reasons.push("ネット現金100%以上");
  } else if (!item.specialSector && item.netCashRatio >= 0.5) {
    score += 5;
    reasons.push("ネット現金50%以上");
  }
  if (item.pbr > 0 && item.pbr <= 1 && item.per > 0 && item.per <= 15) {
    score += 4;
    reasons.push("低PBR+低PER");
  }
  if (item.latestSignal === "高値圏") {
    score -= 18;
    reasons.push("高値圏は追いかけ注意");
  }
  if (item.periodReturn > 180) {
    score -= 12;
    reasons.push("直近上昇済み");
  }
  if (item.specialSector) {
    score -= 8;
    reasons.push("特殊業種は財務指標を割引");
  }
  const label = score >= 45
    ? "2倍期待強"
    : score >= 28
      ? "2倍期待あり"
      : score >= 12
        ? "2倍監視"
        : "2倍要素薄め";
  return { score, label, reasons };
}

function cautionText({ safety, multibagger, latestSignal, periodReturn }) {
  const cautions = [];
  if (safety.includes("財務注意")) cautions.push("ネット有利子負債が重め。負債と利益継続性を確認");
  else cautions.push("自動取得財務で判定。原資料チェック推奨");
  if (latestSignal === "高値圏") cautions.push("高値圏のため追いかけ買い注意");
  if (periodReturn > 180) cautions.push("直近で上がりすぎ。押し目待ち優先");
  if (multibagger.label === "2倍要素薄め") cautions.push("2倍化条件は弱い。第一利確優先");
  return cautions.join(" / ");
}

function writeReport(rows, total) {
  fs.mkdirSync(reportsDir, { recursive: true });
  rows.forEach((row, index) => {
    row.rank = index + 1;
  });
  const lines = [
    "# 全体自動判定 買い候補予備軍",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    "日本株全体から、財務データと価格タイミングの両方が条件内のものを抽出しています。",
    "自動取得財務をランキングへ反映します。原資料チェック済みかどうかはラベルと注意で分けます。",
    `対象月: ${latestMonth}`,
    "",
    `抽出候補: ${total}件`,
    `表示候補: ${rows.length}件`,
    `表示内 今買い候補: ${rows.filter((row) => row.signal === "今買い候補").length}件`,
    `表示内 買い場近い: ${rows.filter((row) => row.signal === "買い場近い").length}件`,
    `通常候補前: ${rows.filter((row) => row.normalCandidate === "通常候補前").length}件`,
    `通常候補登録済み: ${rows.filter((row) => row.normalCandidate === "通常候補登録済み").length}件`,
    "",
    "## 予備軍上位",
    "",
    ...rows.slice(0, 30).map((row) =>
      `- ${row.rank}. ${row.code} ${row.name}: ${row.status} / ${row.doubleTag} / 2倍目安 ${row.doubleTimeframe} / 2倍価格 ${row.doubleTargetPrice}円 / 総合${row.rankingScore} / 2倍${row.multibaggerScore}(${row.multibaggerLabel}) / 買い比率${row.buyRatio} / 上昇余地${row.upside}% / PBR ${row.pbr} / PER ${row.per} / ネット現金${row.netCashRatio}% / ${row.signal} / 次: ${row.action}`
    ),
    "",
    "## 運用ルール",
    "",
    "- 自動取得財務の銘柄もランキングに出します。",
    "- 表示順位は 今買い候補 > 買い場近い を優先し、2倍期待は同じ売買タイミング内の加点として扱います。",
    "- 原資料チェック済みと自動取得はラベルで分けます。",
    "- 財務注意つきは除外せず、負債と利益継続性の注意を付けて表示します。",
  ];
  fs.writeFileSync(path.join(reportsDir, "latest-universe-buy-candidates.md"), `${lines.join("\n")}\n`, "utf8");
}

function readCsv(name) {
  const filePath = path.join(dataDir, name);
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function latestUsableMonth(rows) {
  const counts = new Map();
  for (const row of rows) {
    if (!row.month) continue;
    counts.set(row.month, (counts.get(row.month) ?? 0) + 1);
  }
  const usable = [...counts.entries()]
    .filter(([, count]) => count >= 1000)
    .map(([month]) => month)
    .sort();
  if (usable.length) return usable.at(-1);
  return [...counts.keys()].sort().at(-1) || "";
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function toCsv(rows) {
  const headers = [
    "rank",
    "code",
    "name",
    "market",
    "sector",
    "status",
    "normalCandidate",
    "autoBuyScore",
    "rankingScore",
    "multibaggerScore",
    "multibaggerLabel",
    "multibaggerReasons",
    "doubleTag",
    "doubleTargetPrice",
    "doubleTimeframe",
    "doubleComment",
    "price",
    "buyLine",
    "targetPrice",
    "sellGuidePrice",
    "buyRatio",
    "upside",
    "pbr",
    "per",
    "netCashRatio",
    "winRate",
    "averageReturn",
    "maxDrawdown",
    "trades",
    "priceScore",
    "latestSignal",
    "periodReturn",
    "signal",
    "judgement",
    "metricSource",
    "action",
    "comment",
    "caution",
  ];
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")).join("\n")}\n`;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll("\"", "\"\"")}"`;
  return text;
}
