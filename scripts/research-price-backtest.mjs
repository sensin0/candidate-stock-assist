import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { backtestStock } from "./backtest-core.mjs";
import { parseStockCsv } from "./providers/csv-provider.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stockMasterPath = path.join(rootDir, "data", "stock-master.csv");
const reportPath = path.join(rootDir, "reports", "latest-price-backtest.md");
const csvPath = path.join(rootDir, "data", "price-backtest-results.csv");
const windows = [
  { label: "半年", days: 190 },
  { label: "1年", days: 380 },
  { label: "2年", days: 760 },
];

const stocks = parseStockCsv(fs.readFileSync(stockMasterPath, "utf8"));
const allRows = [];
const sections = [];

for (const window of windows) {
  const rows = [];
  for (const stock of stocks) {
    try {
      const prices = await fetchDailyPrices(stock.code, window.days);
      const history = prices.map((item) => item.close);
      const backtest = backtestStock({ ...stock, history });
      const row = {
        window: window.label,
        days: window.days,
        code: stock.code,
        name: stock.name,
        points: history.length,
        firstDate: prices[0]?.date ?? "",
        lastDate: prices.at(-1)?.date ?? "",
        periodReturn: round(((history.at(-1) / history[0]) - 1) * 100),
        strategy: backtest.bestStrategyLabel,
        timing: backtest.timingLabel,
        confidence: backtest.confidence,
        trades: backtest.trades,
        winRate: backtest.winRate,
        averageReturn: backtest.averageReturn,
        maxDrawdown: backtest.maxDrawdown,
        score: backtest.bestScore,
        judgement: judgement(backtest),
        error: "",
      };
      rows.push(row);
      allRows.push(row);
    } catch (error) {
      const row = {
        window: window.label,
        days: window.days,
        code: stock.code,
        name: stock.name,
        points: 0,
        firstDate: "",
        lastDate: "",
        periodReturn: "",
        strategy: "",
        timing: "",
        confidence: "",
        trades: 0,
        winRate: "",
        averageReturn: "",
        maxDrawdown: "",
        score: "",
        judgement: "取得失敗",
        error: error.message,
      };
      rows.push(row);
      allRows.push(row);
    }
    await sleep(120);
  }
  sections.push(renderWindowSection(window, rows));
}

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, renderReport(sections), "utf8");
fs.writeFileSync(csvPath, toCsv(allRows), "utf8");

console.log(`価格バックテストレポートを生成しました: ${reportPath}`);
console.log(`価格バックテストCSVを生成しました: ${csvPath}`);

async function fetchDailyPrices(code, days) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - days * 24 * 60 * 60;
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

  if (prices.length < 30) throw new Error(`価格データが少なすぎます: ${prices.length}件`);
  return prices;
}

function renderReport(sections) {
  return [
    "# 価格バックテスト調査",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    "注意: この調査は売買推奨ではありません。候補を絞るための過去検証です。",
    "",
    ...sections,
    "",
  ].join("\n");
}

function renderWindowSection(window, rows) {
  const ok = rows.filter((row) => !row.error);
  const traded = ok.filter((row) => row.trades > 0);
  const strong = traded.filter((row) => row.judgement === "良さそう");
  const weak = traded.filter((row) => row.judgement === "見送り寄り");
  const failed = rows.filter((row) => row.error);

  return [
    `## ${window.label}`,
    "",
    `- 取得成功: ${ok.length}/${rows.length}`,
    `- 売買検証あり: ${traded.length}/${ok.length}`,
    `- 良さそう: ${strong.length}件`,
    `- 見送り寄り: ${weak.length}件`,
    "",
    "### 戦略別",
    "",
    ...strategySummary(traded).map((line) => `- ${line}`),
    "",
    "### 上位",
    "",
    ...traded
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 8)
      .map((row) =>
        `- ${row.code} ${row.name}: ${row.strategy} / ${row.judgement} / 勝率${row.winRate}% / 平均${row.averageReturn}% / 最大下落${row.maxDrawdown}% / 期間騰落${row.periodReturn}%`
      ),
    "",
    "### 見送り寄り",
    "",
    ...(weak.length
      ? weak.map((row) => `- ${row.code} ${row.name}: 勝率${row.winRate}% / 平均${row.averageReturn}% / 最大下落${row.maxDrawdown}%`)
      : ["- なし"]),
    "",
    "### 取得失敗",
    "",
    ...(failed.length ? failed.map((row) => `- ${row.code} ${row.name}: ${row.error}`) : ["- なし"]),
    "",
  ].join("\n");
}

function strategySummary(rows) {
  const byStrategy = new Map();
  for (const row of rows) {
    if (!byStrategy.has(row.strategy)) byStrategy.set(row.strategy, []);
    byStrategy.get(row.strategy).push(row);
  }
  return [...byStrategy.entries()].map(([strategy, items]) => {
    const avg = average(items.map((item) => item.averageReturn));
    const win = average(items.map((item) => item.winRate));
    const drawdown = average(items.map((item) => item.maxDrawdown));
    return `${strategy}: ${items.length}件 / 平均${round(avg)}% / 勝率${round(win)}% / 最大下落${round(drawdown)}%`;
  });
}

function judgement(result) {
  if (!result.trades) return "未約定";
  if (result.averageReturn > 0 && result.winRate >= 60 && result.maxDrawdown > -15) return "良さそう";
  if (result.averageReturn < 0 || result.winRate < 50 || result.maxDrawdown <= -15) return "見送り寄り";
  return "中立";
}

function toCsv(records) {
  const headers = [
    "window",
    "days",
    "code",
    "name",
    "points",
    "firstDate",
    "lastDate",
    "periodReturn",
    "strategy",
    "timing",
    "confidence",
    "trades",
    "winRate",
    "averageReturn",
    "maxDrawdown",
    "score",
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

function average(values) {
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / Math.max(1, values.length);
}

function round(value) {
  return Math.round(Number(value || 0) * 10) / 10;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
