import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseStockCsv } from "./providers/csv-provider.mjs";
import { applyPriceUpdates, fetchPriceUpdates } from "./providers/price-provider.mjs";
import { backtestStock, timingInputs } from "./backtest-core.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const inputCsv = path.join(dataDir, "stock-master.csv");
const inputPriceCsv = path.join(dataDir, "price-updates.csv");
const outputCsv = path.join(dataDir, "auto-financial-followup.csv");
const outputReport = path.join(reportsDir, "latest-auto-financial-followup.md");

const rawStocks = parseStockCsv(fs.readFileSync(inputCsv, "utf8"));
const priceUpdates = await fetchPriceUpdates({ inputPriceCsv });
const stocks = applyPriceUpdates(rawStocks, priceUpdates.prices);
const targets = stocks
  .filter((stock) => stock.dataConfidence === "自動財務確認")
  .map(buildFollowup)
  .sort(compareFollowup);

fs.writeFileSync(outputCsv, toCsv(targets), "utf8");
fs.writeFileSync(outputReport, buildReport(targets), "utf8");

console.log(`自動財務確認の後追い確認レポートを作成しました: ${targets.length}件`);

function buildFollowup(stock) {
  const { buyLine, targetPrice } = timingInputs(stock);
  const backtest = backtestStock(stock);
  const marketCap = ((stock.price * Math.max(0, stock.shares - stock.treasuryShares)) / 1_000_000) || 0;
  const netCash = stock.cash + stock.securities + stock.investmentSecurities - stock.interestDebt;
  const netCashRatio = marketCap > 0 ? netCash / marketCap : 0;
  const pbr = stock.bps > 0 ? stock.price / stock.bps : 0;
  const per = stock.eps > 0 ? stock.price / stock.eps : 0;
  const buyDistance = buyLine > 0 ? stock.price / buyLine : 99;
  const upside = stock.price > 0 ? ((targetPrice / stock.price) - 1) * 100 : 0;
  const weakBacktest = backtest.trades > 0
    && (backtest.averageReturn <= 0 || backtest.winRate < 45 || backtest.maxDrawdown < -18);
  const noBacktest = backtest.trades === 0;
  const score = scoreFollowup({
    pbr,
    per,
    netCashRatio,
    buyDistance,
    upside,
    backtest,
    weakBacktest,
    noBacktest,
    debtRatio: stock.netAssets > 0 ? stock.interestDebt / stock.netAssets : 0,
  });
  return {
    code: stock.code,
    name: stock.name,
    sector: stock.sector,
    price: stock.price,
    buyLine,
    targetPrice,
    upside,
    pbr,
    per,
    netCashRatio,
    followupScore: score,
    action: actionLabel({ score, buyDistance, weakBacktest, noBacktest, backtest }),
    buyDistance,
    timingLabel: backtest.timingLabel,
    buyTiming: backtest.buyTiming,
    sellTiming: backtest.sellTiming,
    backtestTrades: backtest.trades,
    backtestWinRate: backtest.winRate,
    backtestAverageReturn: backtest.averageReturn,
    backtestMaxDrawdown: backtest.maxDrawdown,
    checkItems: checkItems({ stock, netCashRatio, pbr, per, buyDistance, weakBacktest, noBacktest, backtest }),
  };
}

function scoreFollowup({ pbr, per, netCashRatio, buyDistance, upside, backtest, weakBacktest, noBacktest, debtRatio }) {
  let score = 40;
  if (pbr > 0 && pbr <= 0.7) score += 18;
  else if (pbr > 0 && pbr <= 1) score += 10;
  if (per > 0 && per <= 10) score += 14;
  else if (per > 0 && per <= 16) score += 8;
  if (netCashRatio >= 0.5) score += 16;
  else if (netCashRatio >= 0.2) score += 9;
  if (buyDistance <= 1.05) score += 12;
  else if (buyDistance <= 1.15) score += 6;
  if (upside >= 50) score += 12;
  else if (upside >= 30) score += 6;
  if (backtest.trades >= 2 && backtest.averageReturn > 0 && backtest.winRate >= 50) score += 8;
  if (noBacktest) score -= 8;
  if (weakBacktest) score -= 35;
  if (debtRatio > 0.6) score -= 12;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function actionLabel({ score, buyDistance, weakBacktest, noBacktest, backtest }) {
  if (weakBacktest) return "買いは後回し";
  if (noBacktest && backtest.sampleCount < 6) return "価格履歴を先に増やす";
  if (noBacktest) return buyDistance > 1.08 ? "買いラインまで待つ" : "財務確認を進める";
  if (score >= 75 && buyDistance <= 1.08) return "決算短信と有報を先に確認";
  if (score >= 65) return "財務確認を進める";
  return "監視継続";
}

function compareFollowup(a, b) {
  return actionPriority(a) - actionPriority(b)
    || b.followupScore - a.followupScore
    || a.buyDistance - b.buyDistance;
}

function actionPriority(row) {
  if (row.action === "決算短信と有報を先に確認") return 0;
  if (row.action === "財務確認を進める") return 1;
  if (row.action === "買いラインまで待つ") return 2;
  if (row.action === "価格履歴を先に増やす") return 3;
  if (row.action === "監視継続") return 4;
  return 5;
}

function checkItems({ stock, netCashRatio, pbr, per, buyDistance, weakBacktest, noBacktest, backtest }) {
  const items = [
    "直近決算の現預金・有価証券・有利子負債を確認",
    "自己株式と発行株数を確認",
  ];
  if (stock.rentalBook || stock.rentalMarket) items.push("賃貸等不動産の時価と簿価を確認");
  if (netCashRatio >= 0.2) items.push("ネットキャッシュの持続性を確認");
  if (pbr <= 1) items.push("低PBRの理由が一時的か確認");
  if (per > 0 && per <= 16) items.push("今期利益が維持できるか確認");
  if (buyDistance <= 1.08) items.push("買いライン付近なので買う前に優先確認");
  if (buyDistance > 1.08) items.push("買いラインまで距離があるので追いかけない");
  if (weakBacktest) items.push("過去の売買検証が弱いので原則見送り");
  if (noBacktest && backtest.sampleCount < 6) items.push("価格履歴不足のためタイミング精度は参考扱い");
  else if (noBacktest) items.push("買いライン未到達のため検証売買は0回");
  return [...new Set(items)].join(" / ");
}

function buildReport(rows) {
  const priority = rows.filter((row) => row.action === "決算短信と有報を先に確認" || row.action === "財務確認を進める");
  const waitForBuyLine = rows.filter((row) => row.action === "買いラインまで待つ");
  const priceHistory = rows.filter((row) => row.action === "価格履歴を先に増やす");
  const avoid = rows.filter((row) => ["買いは後回し", "監視継続"].includes(row.action));
  return [
    "# 自動財務確認 後追い確認",
    "",
    `生成日時: ${new Date().toISOString()}`,
    `対象: ${rows.length}件`,
    `優先確認: ${priority.length}件`,
    `買いライン待ち: ${waitForBuyLine.length}件`,
    `価格履歴不足: ${priceHistory.length}件`,
    `後回し・見送り寄り: ${avoid.length}件`,
    "",
    "## 優先確認",
    ...markdownRows(priority.slice(0, 10)),
    "",
    "## 買いライン待ち",
    ...markdownRows(waitForBuyLine.slice(0, 10)),
    "",
    "## 価格履歴不足",
    ...markdownRows(priceHistory),
    "",
    "## 後回し・見送り寄り",
    ...markdownRows(avoid.slice(0, 10)),
    "",
    "## 全件",
    ...markdownRows(rows),
    "",
    "## 使い方",
    "- 優先確認に出た銘柄だけ、決算短信と有報で現金・有価証券・借入・発行株数を後追い確認します。",
    "- 後回しに出た銘柄は、今買いに見えてもランキング上位へ上げません。",
    "- 買いラインまで待つ銘柄は、財務より先に価格が買い目安へ近づくまで待ちます。",
    "- 価格履歴不足の銘柄は、価格データが増えるまで買い判断に使いません。",
    "- 確認できた銘柄だけ通常候補へ昇格させます。",
    "",
  ].join("\n");
}

function markdownRows(rows) {
  if (!rows.length) return ["- 該当なし"];
  return rows.map((row, index) => [
    `- ${index + 1}. ${row.code} ${row.name}`,
    `スコア${row.followupScore}`,
    row.action,
    `現在${formatYen(row.price)}`,
    `買い目安${formatYen(row.buyLine)}`,
    `上値余地${formatPercent(row.upside)}`,
    `PBR${formatNumber(row.pbr)}倍`,
    `PER${formatNumber(row.per)}倍`,
    `ネット現金${formatPercent(row.netCashRatio * 100)}`,
    `検証 ${row.backtestTrades}回 勝率${formatPercent(row.backtestWinRate)} 平均${formatPercent(row.backtestAverageReturn)}`,
  ].join(" / "));
}

function toCsv(rows) {
  const headers = [
    "rank",
    "code",
    "name",
    "sector",
    "followupScore",
    "action",
    "timingLabel",
    "price",
    "buyLine",
    "targetPrice",
    "upside",
    "pbr",
    "per",
    "netCashRatio",
    "backtestTrades",
    "backtestWinRate",
    "backtestAverageReturn",
    "backtestMaxDrawdown",
    "buyTiming",
    "sellTiming",
    "checkItems",
  ];
  const lines = rows.map((row, index) => headers.map((header) => {
    if (header === "rank") return index + 1;
    return csvCell(row[header]);
  }).join(","));
  return `${headers.join(",")}\n${lines.join("\n")}\n`;
}

function csvCell(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

function formatYen(value) {
  return `${Math.round(value).toLocaleString("ja-JP")}円`;
}

function formatPercent(value) {
  return `${Math.round(value * 10) / 10}%`;
}

function formatNumber(value) {
  return Math.round(value * 100) / 100;
}
