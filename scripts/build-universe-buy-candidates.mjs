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

const listedByCode = new Map(listed.map((row) => [row.code, row]));
const priceByCode = new Map(priceRows.map((row) => [row.code, row]));
const statusByCode = new Map(statusRows.map((row) => [row.code, row]));
const stockMasterCodes = new Set(stockMaster.map((row) => row.code));
const defaultTiming = {
  pbrLow: 0.64,
  pbrHigh: 1.53,
  perLow: 10,
  perHigh: 24,
};

const candidates = metrics
  .filter((row) => listedByCode.has(row.code))
  .map(toCandidate)
  .filter(Boolean)
  .sort((a, b) => b.autoBuyScore - a.autoBuyScore || a.buyRatio - b.buyRatio || b.upside - a.upside);

const top = candidates.slice(0, 120);
fs.writeFileSync(path.join(dataDir, "universe-buy-candidates.csv"), toCsv(top), "utf8");
writeReport(top, candidates.length);

console.log(`全体自動買い候補予備軍を生成しました: ${top.length}/${candidates.length}件`);
console.log(path.relative(rootDir, path.join(dataDir, "universe-buy-candidates.csv")));

function toCandidate(row) {
  const listedRow = listedByCode.get(row.code);
  const priceRow = priceByCode.get(row.code);
  const statusRow = statusByCode.get(row.code);
  const metricSource = row.asOf || "";
  const price = number(priceRow?.lastClose || row.price);
  const bps = number(row.bps);
  const eps = number(row.eps);
  const shares = Math.max(0, number(row.shares) - number(row.treasuryShares));
  if (!price || !bps || !eps || !shares) return null;
  if (metricSource === "unavailable" || metricSource === "priceEstimate") return null;
  if (statusRow?.status && !["自動チェック完了", "財務のみ完了"].includes(statusRow.status)) return null;

  const marketCap = (price * shares) / 1_000_000;
  const pbr = price / bps;
  const per = eps > 0 ? price / eps : 0;
  const netCash = number(row.cash) + number(row.securities) + number(row.investmentSecurities) - number(row.interestDebt);
  const netCashRatio = marketCap > 0 ? netCash / marketCap : 0;
  const { buyLine, targetPrice } = timingInputs({ bps, eps, ...defaultTiming });
  const buyRatio = buyLine > 0 ? price / buyLine : 999;
  const upside = targetPrice > 0 ? (targetPrice / price - 1) * 100 : 0;
  const winRate = number(priceRow?.winRate);
  const averageReturn = number(priceRow?.averageReturn);
  const maxDrawdown = number(priceRow?.maxDrawdown);
  const judgement = priceRow?.judgement || "";
  const signal = priceRow?.latestSignal || "";

  if (judgement !== "良さそう") return null;
  if (!["上昇中押し目", "安値反転候補"].includes(signal)) return null;
  if (buyRatio > 1.1 || upside < 50 || pbr <= 0 || pbr > 1 || per <= 0 || per > 20) return null;
  if (winRate < 60 || averageReturn < 8 || maxDrawdown <= -15) return null;

  const safety = netCashRatio >= 0 || pbr <= 0.6 ? "自動買い候補予備軍" : "財務注意つき予備軍";
  const alreadyNormal = stockMasterCodes.has(row.code);
  const autoBuyScore = score({
    pbr,
    per,
    netCashRatio,
    buyRatio,
    upside,
    winRate,
    averageReturn,
    maxDrawdown,
    signal,
    alreadyNormal,
  });

  return {
    rank: 0,
    code: row.code,
    name: listedRow?.name || statusRow?.name || row.code,
    market: listedRow?.market || statusRow?.market || "",
    sector: listedRow?.sector || statusRow?.sector || "",
    status: safety,
    normalCandidate: alreadyNormal ? "通常候補登録済み" : "通常候補前",
    autoBuyScore: round(autoBuyScore),
    price: round(price),
    buyLine: round(buyLine),
    targetPrice: round(targetPrice),
    buyRatio: round(buyRatio),
    upside: round(upside),
    pbr: round(pbr),
    per: round(per),
    netCashRatio: round(netCashRatio * 100),
    winRate: round(winRate),
    averageReturn: round(averageReturn),
    maxDrawdown: round(maxDrawdown),
    signal,
    judgement,
    metricSource,
    action: alreadyNormal ? "正式候補の財務ガードで最終確認" : "通常候補へ昇格する前に有報と決算短信を確認",
    comment: `${signal}。買いライン近辺で、上昇余地と価格検証は条件内です`,
    caution: safety === "財務注意つき予備軍" ? "ネット有利子負債が重め。負債と利益継続性を先に確認" : "正式な今買い前に原資料確認",
  };
}

function score(item) {
  let value = 0;
  value += Math.max(0, 1 - item.buyRatio) * 42;
  value += Math.min(42, item.upside / 5);
  value += item.pbr <= 0.5 ? 18 : item.pbr <= 0.7 ? 12 : 6;
  value += item.per <= 10 ? 14 : item.per <= 15 ? 8 : 3;
  value += item.netCashRatio >= 0.5 ? 18 : item.netCashRatio >= 0 ? 10 : -8;
  value += item.winRate * 0.16;
  value += item.averageReturn * 0.7;
  value += Math.max(-20, item.maxDrawdown) * 0.8;
  if (item.signal === "上昇中押し目") value += 10;
  if (item.alreadyNormal) value += 4;
  return value;
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
    "これは正式な今買いではありません。通常候補へ昇格し、原資料確認が済んだものだけ正式な今買い候補にします。",
    "",
    `抽出候補: ${total}件`,
    `表示候補: ${rows.length}件`,
    `通常候補前: ${rows.filter((row) => row.normalCandidate === "通常候補前").length}件`,
    `通常候補登録済み: ${rows.filter((row) => row.normalCandidate === "通常候補登録済み").length}件`,
    "",
    "## 予備軍上位",
    "",
    ...rows.slice(0, 30).map((row) =>
      `- ${row.rank}. ${row.code} ${row.name}: ${row.status} / 点${row.autoBuyScore} / 買い比率${row.buyRatio} / 上昇余地${row.upside}% / PBR ${row.pbr} / PER ${row.per} / ネット現金${row.netCashRatio}% / ${row.signal} / 次: ${row.action}`
    ),
    "",
    "## 運用ルール",
    "",
    "- 正式な今買い候補とは分けて表示します。",
    "- 予備軍は、買いライン以下でも有報と決算短信の確認が終わるまで買い表示にしません。",
    "- 財務注意つき予備軍は、負債と利益継続性の確認が済むまで通常候補へ昇格させません。",
  ];
  fs.writeFileSync(path.join(reportsDir, "latest-universe-buy-candidates.md"), `${lines.join("\n")}\n`, "utf8");
}

function readCsv(name) {
  const filePath = path.join(dataDir, name);
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
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
    "price",
    "buyLine",
    "targetPrice",
    "buyRatio",
    "upside",
    "pbr",
    "per",
    "netCashRatio",
    "winRate",
    "averageReturn",
    "maxDrawdown",
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
