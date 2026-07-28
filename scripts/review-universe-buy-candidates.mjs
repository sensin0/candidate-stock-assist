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
  const trades = number(row.trades);
  const signal = row.signal || "";
  const isNowBuy = signal === "今買い候補";
  const hasPriceValidation = trades >= 3;
  const financialRisk = financialRiskLevel({ isSpecialSector, netCashRatio, pbr, per, upside });
  const priceValidation = priceValidationLevel({ trades, winRate, averageReturn, maxDrawdown });

  if (isExisting) confirmations.push("通常候補登録済みのため既存候補側で最終確認");
  if (isSpecialSector) confirmations.push(`${sector}は財務構造が特殊なため原資料確認を優先`);
  if (netCashRatio < -75) confirmations.push(`ネット有利子負債が重い ${netCashRatio}%`);
  if (maxDrawdown <= -8) confirmations.push(`過去検証の最大下落が大きい ${maxDrawdown}%`);
  if (buyRatio > 1.02) confirmations.push(`買いラインを少し上回る ${buyRatio}倍`);
  if (!hasPriceValidation) confirmations.push(`価格検証取引少 ${trades}回。財務と現在価格を優先`);

  if (pbr <= 0 || pbr > 0.8) blockers.push(`PBRが昇格基準外 ${pbr}倍`);
  if (per <= 0 || per > 12) blockers.push(`PERが昇格基準外 ${per}倍`);
  if (upside < 70) blockers.push(`上昇余地が不足 ${upside}%`);
  if (hasPriceValidation && winRate < 45) blockers.push(`価格検証の勝率が低い ${winRate}%`);
  if (hasPriceValidation && averageReturn < -3) blockers.push(`価格検証の平均利益がマイナス ${averageReturn}%`);

  if (pbr > 0 && pbr <= 0.7) reasons.push(`低PBR ${pbr}倍`);
  if (per > 0 && per <= 10) reasons.push(`低PER ${per}倍`);
  if (netCashRatio >= 15) reasons.push(`ネット現金厚め ${netCashRatio}%`);
  if (buyRatio <= 1.02) reasons.push(`買いライン圏 ${buyRatio}倍`);
  if (upside >= 100) reasons.push(`上昇余地大 ${upside}%`);
  if (hasPriceValidation && winRate >= 60 && averageReturn >= 0) reasons.push(`価格検証許容 勝率${winRate}%/平均${averageReturn}%`);

  let reviewStatus = "追加確認";
  if (blockers.length) reviewStatus = "今回は見送り";
  else if (!isExisting && !isSpecialSector && isNowBuy && netCashRatio >= -75 && buyRatio <= 1.02 && maxDrawdown > -12) reviewStatus = "通常候補へ昇格OK";

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
    trades: row.trades,
    signal: row.signal,
    metricSource: row.metricSource,
    financialRiskLevel: financialRisk.level,
    financialRiskReasons: financialRisk.reasons.join(" / ") || "財務ガード通過",
    priceValidationLevel: priceValidation.level,
    priceValidationReasons: priceValidation.reasons.join(" / ") || "価格検証ガード通過",
    trustLevel: trustLevel({ reviewStatus, financialRisk, priceValidation }),
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

function financialRiskLevel({ isSpecialSector, netCashRatio, pbr, per, upside }) {
  const reasons = [];
  let points = 0;
  if (isSpecialSector) {
    points += 2;
    reasons.push("特殊業種");
  }
  if (netCashRatio < -150) {
    points += 3;
    reasons.push(`ネット有利子負債がかなり重い ${netCashRatio}%`);
  } else if (netCashRatio < -75) {
    points += 2;
    reasons.push(`ネット有利子負債が重い ${netCashRatio}%`);
  }
  if (pbr <= 0 || pbr > 0.8) {
    points += 3;
    reasons.push(`PBR基準外 ${pbr}倍`);
  }
  if (per <= 0 || per > 12) {
    points += 2;
    reasons.push(`PER基準外 ${per}倍`);
  }
  if (upside < 70) {
    points += 2;
    reasons.push(`上昇余地不足 ${upside}%`);
  }
  const level = points >= 5 ? "high" : points >= 2 ? "medium" : "low";
  return { level, reasons };
}

function priceValidationLevel({ trades, winRate, averageReturn, maxDrawdown }) {
  const reasons = [];
  if (trades < 3) {
    reasons.push(`検証取引少 ${trades}回`);
    return { level: "thin", reasons };
  }
  if (winRate < 45 || averageReturn < -3 || maxDrawdown <= -18) {
    if (winRate < 45) reasons.push(`勝率低い ${winRate}%`);
    if (averageReturn < -3) reasons.push(`平均利益マイナス ${averageReturn}%`);
    if (maxDrawdown <= -18) reasons.push(`最大下落大 ${maxDrawdown}%`);
    return { level: "weak", reasons };
  }
  if (winRate >= 60 && averageReturn >= 0 && maxDrawdown > -12) {
    reasons.push(`許容 勝率${winRate}%/平均${averageReturn}%`);
    return { level: "good", reasons };
  }
  reasons.push(`中立 勝率${winRate}%/平均${averageReturn}%`);
  return { level: "neutral", reasons };
}

function trustLevel({ reviewStatus, financialRisk, priceValidation }) {
  if (reviewStatus === "今回は見送り" || priceValidation.level === "weak" || financialRisk.level === "high") return "avoid";
  if (financialRisk.level === "medium") return "financialCaution";
  if (priceValidation.level === "thin") return "thinValidation";
  if (reviewStatus === "通常候補へ昇格OK" && priceValidation.level === "good" && financialRisk.level === "low") return "high";
  return "watch";
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
  const nowBuyRows = rows.filter((row) => row.signal === "今買い候補");
  const nowBuyApprovedCount = nowBuyRows.filter((row) => row.reviewStatus === "通常候補へ昇格OK").length;
  const nowBuyPendingCount = nowBuyRows.filter((row) => row.reviewStatus === "追加確認").length;
  const nowBuyRejectedCount = nowBuyRows.filter((row) => row.reviewStatus === "今回は見送り").length;
  const lowPriceValidationCount = rows.filter((row) => number(row.trades) < 3).length;
  const trustCounts = countBy(rows, "trustLevel");
  const financialRiskCounts = countBy(rows, "financialRiskLevel");
  const priceValidationCounts = countBy(rows, "priceValidationLevel");
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
    "## 今買い候補の内訳",
    "",
    `今買い候補: ${nowBuyRows.length}件`,
    `今買いから昇格OK: ${nowBuyApprovedCount}件`,
    `今買いから追加確認: ${nowBuyPendingCount}件`,
    `今買いから見送り: ${nowBuyRejectedCount}件`,
    `価格検証サンプル少: ${lowPriceValidationCount}件`,
    "",
    "## 信頼度の内訳",
    "",
    `高信頼: ${trustCounts.high || 0}件`,
    `検証少: ${trustCounts.thinValidation || 0}件`,
    `財務注意: ${trustCounts.financialCaution || 0}件`,
    `監視: ${trustCounts.watch || 0}件`,
    `見送り: ${trustCounts.avoid || 0}件`,
    "",
    "## 財務・価格ガード",
    "",
    `財務低リスク: ${financialRiskCounts.low || 0}件`,
    `財務中リスク: ${financialRiskCounts.medium || 0}件`,
    `財務高リスク: ${financialRiskCounts.high || 0}件`,
    `価格検証良好: ${priceValidationCounts.good || 0}件`,
    `価格検証中立: ${priceValidationCounts.neutral || 0}件`,
    `価格検証少: ${priceValidationCounts.thin || 0}件`,
    `価格検証弱い: ${priceValidationCounts.weak || 0}件`,
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
    "- 価格検証サンプルが少ない場合は0%敗北扱いにせず、財務と現在価格が揃っていればランキングへ反映します。",
    "- 今買い候補は買いラインちょうどから少し上までを買いライン圏として扱います。",
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

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = row[key] || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
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
    "trades",
    "signal",
    "metricSource",
    "financialRiskLevel",
    "financialRiskReasons",
    "priceValidationLevel",
    "priceValidationReasons",
    "trustLevel",
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
