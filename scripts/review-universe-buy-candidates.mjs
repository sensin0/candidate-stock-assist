import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");

const candidatesPath = path.join(dataDir, "universe-buy-candidates.csv");
const metricsPath = path.join(dataDir, "universe-metrics.csv");
const masterPath = path.join(dataDir, "stock-master.csv");
const reviewPath = path.join(dataDir, "universe-buy-candidate-review.csv");
const draftPath = path.join(dataDir, "stock-master-universe-promotion-draft.csv");
const reportPath = path.join(reportsDir, "latest-universe-buy-candidate-review.md");

const specialSectors = new Set(["銀行業", "電気・ガス業", "陸運業", "不動産業", "その他金融業"]);
const stockInputHeaders = [
  "code",
  "name",
  "sector",
  "price",
  "shares",
  "cash",
  "interestDebt",
  "netAssets",
  "bps",
  "eps",
  "pbrLow",
  "pbrHigh",
  "note",
  "history",
];

const candidates = readCsv(candidatesPath);
const metricsByCode = new Map(readCsv(metricsPath).map((row) => [row.code, row]));
const existingCodes = new Set(readCsv(masterPath).map((row) => row.code));

const reviewed = candidates.map((row) => reviewCandidate(row, metricsByCode.get(row.code)));
const approved = reviewed
  .filter((row) => row.reviewStatus === "通常候補へ昇格OK")
  .filter((row) => !existingCodes.has(row.code))
  .slice(0, 20);

fs.writeFileSync(reviewPath, toCsv(reviewed), "utf8");
fs.writeFileSync(draftPath, toStockInputCsv(approved), "utf8");
writeReport(reviewed, approved);

console.log(`全体自動買い候補の昇格判定を生成しました: ${approved.length}/${reviewed.length}件`);
console.log(path.relative(rootDir, reviewPath));
console.log(path.relative(rootDir, draftPath));

function reviewCandidate(row, metric = {}) {
  const reasons = [];
  const blockers = [];
  const confirmations = [];
  const sector = row.sector || "";
  const isExisting = row.normalCandidate === "通常候補登録済み" || existingCodes.has(row.code);
  const isSpecialSector = specialSectors.has(sector);
  const netCashRatio = number(row.netCashRatio);
  const pbr = number(row.pbr);
  const per = number(row.per);
  const buyRatio = number(row.buyRatio);
  const upside = number(row.upside);
  const winRate = number(row.winRate);
  const averageReturn = number(row.averageReturn);
  const maxDrawdown = number(row.maxDrawdown);

  if (isExisting) confirmations.push("通常候補登録済みのため既存候補側で最終確認");
  if (isSpecialSector) confirmations.push(`${sector}は財務構造が特殊なため原資料確認を優先`);
  if (netCashRatio < -75) confirmations.push(`ネット有利子負債が重い ${netCashRatio}%`);
  if (maxDrawdown <= -8) confirmations.push(`過去検証の最大下落が大きい ${maxDrawdown}%`);
  if (buyRatio > 0.95) confirmations.push(`買いラインへの余裕が小さい ${buyRatio}倍`);

  if (pbr <= 0 || pbr > 0.8) blockers.push(`PBRが昇格基準外 ${pbr}倍`);
  if (per <= 0 || per > 12) blockers.push(`PERが昇格基準外 ${per}倍`);
  if (upside < 70) blockers.push(`上昇余地が不足 ${upside}%`);
  if (winRate < 80) blockers.push(`価格検証の勝率が不足 ${winRate}%`);
  if (averageReturn < 8) blockers.push(`価格検証の平均利益が不足 ${averageReturn}%`);

  if (pbr > 0 && pbr <= 0.7) reasons.push(`低PBR ${pbr}倍`);
  if (per > 0 && per <= 10) reasons.push(`低PER ${per}倍`);
  if (netCashRatio >= 15) reasons.push(`ネット現金厚め ${netCashRatio}%`);
  if (buyRatio <= 0.9) reasons.push(`買いライン以下 ${buyRatio}倍`);
  if (upside >= 100) reasons.push(`上昇余地大 ${upside}%`);
  if (winRate >= 80 && averageReturn >= 8) reasons.push(`価格検証良好 勝率${winRate}%/平均${averageReturn}%`);

  let reviewStatus = "追加確認";
  if (blockers.length) reviewStatus = "今回は見送り";
  else if (!isExisting && !isSpecialSector && netCashRatio >= 0 && buyRatio <= 0.95 && maxDrawdown > -8) reviewStatus = "通常候補へ昇格OK";

  const nextAction = reviewStatus === "通常候補へ昇格OK"
    ? "自動ランキングへ反映済み。通常候補追加プレビューへも反映"
    : reviewStatus === "今回は見送り"
      ? "ランキング上位から外す。条件改善まで買い表示しない"
      : "自動ランキングには反映。原資料チェックで信頼度を上げる";

  return {
    code: row.code,
    name: row.name,
    sector,
    reviewStatus,
    score: row.autoBuyScore,
    price: row.price,
    buyLine: row.buyLine,
    targetPrice: row.targetPrice,
    buyRatio: row.buyRatio,
    upside: row.upside,
    pbr: row.pbr,
    per: row.per,
    netCashRatio: row.netCashRatio,
    winRate: row.winRate,
    averageReturn: row.averageReturn,
    maxDrawdown: row.maxDrawdown,
    signal: row.signal,
    metricSource: row.metricSource,
    reasons: reasons.join(" / ") || "条件内だが決め手は弱め",
    cautions: [...blockers, ...confirmations].join(" / ") || "大きな自動除外理由なし",
    nextAction,
    shares: Math.max(0, number(metric.shares) - number(metric.treasuryShares)),
    cash: number(metric.cash),
    interestDebt: number(metric.interestDebt),
    netAssets: number(metric.netAssets),
    bps: number(metric.bps),
    eps: number(metric.eps),
  };
}

function toStockInputCsv(rows) {
  const stockRows = rows.map((row) => {
    const pbr = number(row.pbr);
    const pbrLow = pbr > 0 ? Math.max(0.45, Math.min(0.75, pbr * 0.9)) : 0.64;
    const pbrHigh = pbr > 0 ? Math.max(1.05, Math.min(1.8, pbr * 1.8)) : 1.53;
    return {
      code: row.code,
      name: row.name,
      sector: row.sector,
      price: row.price,
      shares: row.shares || 10_000_000,
      cash: row.cash,
      interestDebt: row.interestDebt,
      netAssets: row.netAssets,
      bps: row.bps,
      eps: row.eps,
      pbrLow: round(pbrLow),
      pbrHigh: round(pbrHigh),
      note: `全体自動判定から昇格OK。${row.reasons}。自動ランキング反映済み。原資料確認で精度向上`,
      history: makeHistory(row.price),
    };
  });
  return `${stockInputHeaders.join(",")}\n${stockRows.map((row) => stockInputHeaders.map((header) => escapeCsv(row[header] ?? "")).join(",")).join("\n")}\n`;
}

function writeReport(rows, approvedRows) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const approvedCount = rows.filter((row) => row.reviewStatus === "通常候補へ昇格OK").length;
  const pendingCount = rows.filter((row) => row.reviewStatus === "追加確認").length;
  const rejectedCount = rows.filter((row) => row.reviewStatus === "今回は見送り").length;
  const lines = [
    "# 全体自動買い候補 昇格判定",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    "日本株全体から抽出した自動買い候補を、自動ランキングへ反映した上で信頼度を分けます。",
    "昇格OKは通常候補追加プレビューにも入れます。追加確認はランキングに出しつつ、原資料チェックで精度を上げます。",
    "",
    `対象: ${rows.length}件`,
    `通常候補へ昇格OK: ${approvedCount}件`,
    `追加確認: ${pendingCount}件`,
    `今回は見送り: ${rejectedCount}件`,
    `追加プレビュー反映: ${approvedRows.length}件`,
    "",
    "## 昇格OK",
    "",
    ...sectionRows(rows.filter((row) => row.reviewStatus === "通常候補へ昇格OK")),
    "",
    "## 追加確認",
    "",
    ...sectionRows(rows.filter((row) => row.reviewStatus === "追加確認")),
    "",
    "## 今回は見送り",
    "",
    ...sectionRows(rows.filter((row) => row.reviewStatus === "今回は見送り")),
    "",
    "## ルール",
    "",
    "- 特殊業種、重いネット有利子負債、下落余地が大きい候補は昇格OKにしません。",
    "- 昇格OKは通常候補追加プレビューにも入れます。自動ランキングではすでに表示します。",
    "- 見送りはランキング下位へ回し、誤って買い誘導しないため理由を残します。",
  ];
  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

function sectionRows(rows) {
  if (!rows.length) return ["- 該当なし"];
  return rows.slice(0, 30).map((row, index) =>
    `- ${index + 1}. ${row.code} ${row.name}: ${row.reasons} / 注意: ${row.cautions} / 次: ${row.nextAction}`
  );
}

function readCsv(filePath) {
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

function makeHistory(priceText) {
  const price = number(priceText);
  if (!price) return "";
  return [0.9, 0.93, 0.95, 0.98, 1].map((rate) => Math.round(price * rate)).join("|");
}

function toCsv(rows) {
  const headers = [
    "code",
    "name",
    "sector",
    "reviewStatus",
    "score",
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
    "metricSource",
    "reasons",
    "cautions",
    "nextAction",
  ];
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")).join("\n")}\n`;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replaceAll("\"", "\"\"")}"`;
}
