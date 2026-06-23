import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const hiddenGemsPath = path.join(dataDir, "hidden-gems.csv");
const stockMasterPath = path.join(dataDir, "stock-master.csv");
const outputInputPath = path.join(dataDir, "stock-master-hidden-gems-draft.csv");
const outputReportPath = path.join(reportsDir, "latest-hidden-gems-stock-master-draft.md");
const limit = Number(process.env.HIDDEN_GEMS_DRAFT_LIMIT || 20);
const concurrency = Number(process.env.HIDDEN_GEMS_DRAFT_CONCURRENCY || 6);

const hiddenGems = parseCsvRecords(fs.readFileSync(hiddenGemsPath, "utf8"));
const existing = new Set(parseCsvRecords(fs.readFileSync(stockMasterPath, "utf8")).map((row) => row.code));
const targets = hiddenGems
  .filter((row) => row.assistAction === "今すぐ財務確認")
  .filter((row) => !existing.has(row.code))
  .slice(0, limit);

const quotes = await mapLimit(targets, concurrency, async (row) => {
  const prices = await fetchDailyPrices(row.code, 90).catch(() => []);
  const latest = prices.at(-1);
  return {
    ...row,
    price: latest?.close ?? 0,
    asOf: latest?.date ?? "",
    history: prices.slice(-8).map((item) => Math.round(item.close)).join("|"),
  };
});

const rows = quotes
  .filter((row) => row.price > 0)
  .map(toDraftInputRow);

writeDraftInput(rows);
writeReport(rows, quotes);

console.log(`未発掘から通常候補入力下書きCSVを生成しました: ${path.relative(rootDir, outputInputPath)}`);
console.log(`未発掘から通常候補入力下書きレポートを生成しました: ${path.relative(rootDir, outputReportPath)}`);
console.log(`未発掘下書き候補: ${rows.length}/${targets.length}件`);

function toDraftInputRow(row) {
  const price = Number(row.price);
  const assumedPbr = row.signal === "上昇中押し目" ? 0.85 : 1.0;
  const assumedPer = row.strategy === "高値更新" ? 18 : 16;
  const shares = 10_000_000;
  const bps = Math.max(1, Math.round(price / assumedPbr));
  const eps = Math.max(1, Math.round((price / assumedPer) * 10) / 10);
  const netAssets = Math.round((bps * shares) / 1_000_000);
  const cash = Math.round(netAssets * 0.25);
  const interestDebt = Math.round(netAssets * 0.1);
  const pbrLow = Math.max(0.3, Math.round(assumedPbr * 0.75 * 100) / 100);
  const pbrHigh = Math.round(Math.max(1.2, assumedPbr * 1.8) * 100) / 100;
  return {
    code: row.code,
    name: row.name,
    sector: row.sector || "未分類",
    price,
    shares,
    cash,
    interestDebt,
    netAssets,
    bps,
    eps,
    pbrLow,
    pbrHigh,
    note: `未発掘下書き。${row.assistAction}。${row.comment || row.reason}。確認前: BPS/EPS/現金/有利子負債/発行株数/直近決算`,
    asOf: row.asOf,
    hiddenScore: row.hiddenScore,
    winRate: row.winRate,
    averageReturn: row.averageReturn,
    maxDrawdown: row.maxDrawdown,
    history: row.history,
  };
}

function writeDraftInput(rows) {
  const headers = ["code", "name", "sector", "price", "shares", "cash", "interestDebt", "netAssets", "bps", "eps", "pbrLow", "pbrHigh", "note", "history"];
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")),
  ].join("\n");
  fs.writeFileSync(outputInputPath, `${csv}\n`, "utf8");
}

function writeReport(rows, allQuotes) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const failed = allQuotes.filter((row) => !row.price);
  const lines = [
    "# 未発掘から通常候補入力下書き",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    "未発掘候補のうち、今すぐ財務確認になったものだけを通常候補マスタへ入れる前の下書きにしています。",
    "株価は取得値ですが、BPS、EPS、現金、有利子負債、発行株数は確認前の仮置きです。買い候補ではありません。",
    "",
    `下書き生成: ${rows.length}件`,
    `株価取得失敗: ${failed.length}件`,
    "",
    "## 入力下書き",
    "",
    ...draftReportItems(rows),
    "",
    "## 使い方",
    "",
    "- 上から有報と決算短信でBPS、EPS、現金、有利子負債、発行株数を確認します",
    "- 財務が弱い、材料が一過性、出来高が薄いものは通常候補へ入れません",
    "- 確認できたものだけ stock-master-input.csv へ移します",
  ];
  fs.writeFileSync(outputReportPath, `${lines.join("\n")}\n`, "utf8");
}

function draftReportItems(rows) {
  if (!rows.length) return ["- 該当なし"];
  return rows.map((row, index) =>
    `- ${index + 1}. ${row.code} ${row.name}: 株価${row.price}円 / 未発掘点${row.hiddenScore} / 勝率${row.winRate}% / 平均${row.averageReturn}% / 最大下落${row.maxDrawdown}% / ${row.note}`
  );
}

async function fetchDailyPrices(code, daysBack) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - daysBack * 24 * 60 * 60;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.T?period1=${start}&period2=${end}&interval=1d&events=history&includeAdjustedClose=true`;
  const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const json = await response.json();
  const result = json.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  return timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      close: closes[index],
    }))
    .filter((item) => Number.isFinite(item.close) && item.close > 0);
}

async function mapLimit(items, size, mapper) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}
