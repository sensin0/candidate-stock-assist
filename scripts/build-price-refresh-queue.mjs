import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(rootDir, "app");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const generatedDataPath = path.join(appDir, "generated-data.js");
const outputCsvPath = path.join(dataDir, "price-refresh-queue.csv");
const outputReportPath = path.join(reportsDir, "latest-price-refresh-queue.md");

const payload = readGeneratedData();
const rows = payload.stocks
  .map(enrich)
  .filter((stock) => !stock.priceAsOf || stock.priceAge > 5)
  .map(toQueueRow)
  .sort((a, b) => Number(b.priority) - Number(a.priority))
  .map((row, index) => ({ rank: index + 1, ...row }));

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
writeCsv(outputCsvPath, rows, [
  "rank",
  "priority",
  "code",
  "name",
  "price",
  "priceAsOf",
  "priceAge",
  "buyLine",
  "targetPrice",
  "sellGuidePrice",
  "buyRatio",
  "upside",
  "reason",
  "nextAction",
]);
writeReport(rows);

console.log(`株価更新キューを生成しました: ${path.relative(rootDir, outputCsvPath)}`);
console.log(`更新優先: ${rows.length}件`);

function readGeneratedData() {
  if (!fs.existsSync(generatedDataPath)) {
    throw new Error("先に npm run update を実行してください");
  }
  const match = fs.readFileSync(generatedDataPath, "utf8").match(/window\.AUTO_STOCK_DATA = ([\s\S]*);\s*$/);
  if (!match) throw new Error("generated-data.js を読めませんでした");
  return JSON.parse(match[1]);
}

function enrich(stock) {
  const effectiveShares = Math.max(0, Number(stock.shares || 0) - Number(stock.treasuryShares || 0));
  const marketCap = Number(stock.price || 0) * effectiveShares / 1_000_000;
  const pbrBuy = Number(stock.bps || 0) * Number(stock.pbrLow || 0);
  const pbrTarget = Number(stock.bps || 0) * Number(stock.pbrHigh || 0);
  const perBuy = Number(stock.eps || 0) > 0 && Number(stock.perLow || 0) > 0
    ? Number(stock.eps) * Number(stock.perLow)
    : pbrBuy;
  const perTarget = Number(stock.eps || 0) > 0 && Number(stock.perHigh || 0) > 0
    ? Number(stock.eps) * Number(stock.perHigh)
    : pbrTarget;
  const buyLine = Math.max(1, Math.min(pbrBuy, perBuy));
  const targetPrice = Math.max(pbrTarget, perTarget, buyLine * 1.5);
  const sellGuidePrice = practicalSellGuidePrice({ ...stock, buyLine, targetPrice });
  const buyRatio = Number(stock.price || 0) / buyLine;
  const upside = (targetPrice / Number(stock.price || 1) - 1) * 100;
  const netCash = Number(stock.cash || 0)
    + Number(stock.securities || 0)
    + Number(stock.investmentSecurities || 0)
    - Number(stock.interestDebt || 0);
  const netCashRatio = marketCap > 0 ? netCash / marketCap : 0;
  const priceAge = daysSince(stock.priceAsOf);

  return {
    ...stock,
    buyLine,
    targetPrice,
    sellGuidePrice,
    buyRatio,
    upside,
    netCashRatio,
    priceAge,
  };
}

function toQueueRow(stock) {
  const nearBuy = stock.buyRatio <= 1.05 && stock.upside >= 50;
  const possibleBuy = stock.buyRatio <= 1.15 && stock.upside >= 30;
  const goodBacktest = Number(stock.backtest?.trades || 0) >= 1
    && Number(stock.backtest?.averageReturn || 0) > 0
    && Number(stock.backtest?.winRate || 0) >= 60
    && Number(stock.backtest?.maxDrawdown || 0) > -15;
  const sellCheck = stock.held && Number(stock.price || 0) >= stock.sellGuidePrice * 0.9;
  const reasons = [];
  if (!stock.priceAsOf) reasons.push("株価日付なし");
  else reasons.push(`株価が${stock.priceAge}日前`);
  if (nearBuy) reasons.push("買い場に近い");
  else if (possibleBuy) reasons.push("買いライン接近");
  if (sellCheck) reasons.push("売り判断に影響");
  if (goodBacktest) reasons.push("バックテスト良好");
  if (stock.netCashRatio >= 0.3) reasons.push("ネット現金厚め");

  const priority = Math.round(
    30
    + (nearBuy ? 45 : possibleBuy ? 24 : 0)
    + (sellCheck ? 20 : 0)
    + (goodBacktest ? 12 : 0)
    + Math.min(15, Math.max(0, stock.netCashRatio) * 12)
    + Math.min(12, Math.max(0, stock.priceAge || 0))
  );

  return {
    priority,
    code: stock.code,
    name: stock.name,
    price: round(stock.price),
    priceAsOf: stock.priceAsOf || "",
    priceAge: stock.priceAge ?? "",
    buyLine: round(stock.buyLine),
    targetPrice: round(stock.targetPrice),
    sellGuidePrice: round(stock.sellGuidePrice),
    buyRatio: round(stock.buyRatio),
    upside: round(stock.upside),
    reason: reasons.join(" / "),
    nextAction: "最新株価を確認して price-updates.csv に追加",
  };
}

function practicalSellGuidePrice(stock) {
  const price = Number(stock.price || 0);
  const buyLine = Number(stock.buyLine || 0);
  const targetPrice = Number(stock.targetPrice || 0);
  const history = Array.isArray(stock.history) ? stock.history.filter((value) => Number.isFinite(value) && value > 0) : [];
  const recentHigh = Math.max(price, ...history);
  const firstProfit = Math.max(price * 1.2, buyLine * 1.25, recentHigh * 1.05);
  if (!Number.isFinite(targetPrice) || targetPrice <= 0) return firstProfit;
  return Math.max(1, Math.min(targetPrice * 0.9, firstProfit));
}

function writeReport(queueRows) {
  const topRows = queueRows.slice(0, 20);
  const urgent = queueRows.filter((row) => row.reason.includes("買い場に近い") || row.reason.includes("売り判断に影響"));
  const lines = [
    "# 株価更新キュー",
    "",
    `生成日時: ${new Date().toISOString()}`,
    `更新優先: ${queueRows.length}件`,
    `買い・売り判定に影響: ${urgent.length}件`,
    "",
    "## 先に更新する銘柄",
    "",
    ...(topRows.length
      ? topRows.map((row) => `- ${row.rank}. ${row.code} ${row.name}: ${row.reason} / 現在登録 ${yen(row.price)} / 買い目安 ${yen(row.buyLine)} / 次: ${row.nextAction}`)
      : ["- 該当なし"]),
    "",
    "## 使い方",
    "- 上位から最新株価を確認し、data/price-updates.csv に code,price,asOf を追加します。",
    "- 買い場に近い銘柄は、最新株価が買い目安以下か確認してから今買い判定に戻します。",
    "- 最新株価が買い目安を上回った場合は、通知せず監視に戻します。",
  ];
  fs.writeFileSync(outputReportPath, `${lines.join("\n")}\n`, "utf8");
}

function writeCsv(filePath, csvRows, headers) {
  const lines = [
    headers.join(","),
    ...csvRows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")),
  ];
  fs.writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function escapeCsv(value) {
  const text = String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll("\"", "\"\"")}"`;
  return text;
}

function daysSince(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((todayOnly - date) / 86_400_000);
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function yen(value) {
  return `${Number(value || 0).toLocaleString("ja-JP")}円`;
}
