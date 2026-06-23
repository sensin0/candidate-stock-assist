import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const appDir = path.join(rootDir, "app");
const worklistPath = path.join(dataDir, "financial-confirmation-worklist.csv");
const outputCsvPath = path.join(dataDir, "financial-worklist-screened.csv");
const outputReportPath = path.join(reportsDir, "latest-financial-worklist-screening.md");
const outputJsPath = path.join(appDir, "generated-financial-screening.js");

const rows = readCsv(worklistPath).map(screenRow).sort((a, b) => b.screenScore - a.screenScore);

fs.writeFileSync(outputCsvPath, toCsv(rows), "utf8");
writeReport(rows);
writeAppData(rows);

console.log(`財務確認候補をスクリーニングしました: ${rows.length}件`);
console.log(path.relative(rootDir, outputReportPath));

function screenRow(row) {
  const price = number(row.price);
  const shares = Math.max(0, number(row.checkedShares) - number(row.checkedTreasuryShares));
  const marketCap = shares > 0 ? (price * shares) / 1_000_000 : 0;
  const netCash = number(row.checkedCash) + number(row.checkedSecurities) + number(row.checkedInvestmentSecurities) - number(row.checkedInterestDebt);
  const bps = number(row.checkedBps);
  const eps = number(row.checkedEps);
  const pbr = bps > 0 ? price / bps : 0;
  const per = eps > 0 ? price / eps : 0;
  const netCashRatio = marketCap > 0 ? netCash / marketCap : 0;
  const debtAssetRatio = number(row.checkedNetAssets) > 0 ? number(row.checkedInterestDebt) / number(row.checkedNetAssets) : 0;
  const missing = missingFields(row);
  const reasons = [];
  const cautions = [];
  let score = 50;

  if (missing.length) {
    score -= 60;
    cautions.push(`未入力: ${missing.join(" / ")}`);
  }
  if (pbr > 0 && pbr <= 0.7) {
    score += 24;
    reasons.push(`PBR ${round(pbr)}倍で割安寄り`);
  } else if (pbr > 0 && pbr <= 1) {
    score += 12;
    reasons.push(`PBR ${round(pbr)}倍で確認余地`);
  } else if (pbr > 1.4) {
    score -= 24;
    cautions.push(`PBR ${round(pbr)}倍で割安感が薄い`);
  }

  if (eps <= 0) {
    score -= 35;
    cautions.push("EPSが赤字または未確認");
  } else if (per <= 10) {
    score += 20;
    reasons.push(`PER ${round(per)}倍で利益面は軽い`);
  } else if (per <= 16) {
    score += 10;
    reasons.push(`PER ${round(per)}倍`);
  } else if (per >= 35) {
    score -= 24;
    cautions.push(`PER ${round(per)}倍で高い`);
  }

  if (netCashRatio >= 0.5) {
    score += 22;
    reasons.push(`ネットキャッシュが時価総額の${pct(netCashRatio)}相当`);
  } else if (netCashRatio >= 0.15) {
    score += 10;
    reasons.push(`ネットキャッシュあり ${pct(netCashRatio)}`);
  } else if (netCashRatio < -0.4) {
    score -= 22;
    cautions.push(`ネット有利子負債が重い ${pct(netCashRatio)}`);
  }

  if (hasValue(row.checkedInterestDebt) && debtAssetRatio <= 0.15) {
    score += 8;
    reasons.push("有利子負債は軽め");
  } else if (debtAssetRatio >= 1) {
    score -= 28;
    cautions.push("有利子負債が純資産を上回る");
  } else if (debtAssetRatio >= 0.6) {
    score -= 14;
    cautions.push("有利子負債がやや重い");
  }

  const status = statusFor(score, missing);
  return {
    rank: row.priorityRank,
    code: row.code,
    name: row.name,
    sector: row.sector,
    status,
    screenScore: clamp(round(score), 0, 100),
    price,
    marketCap: round(marketCap),
    pbr: round(pbr),
    per: round(per),
    netCash: round(netCash),
    netCashRatio: round(netCashRatio * 100),
    debtAssetRatio: round(debtAssetRatio * 100),
    sourceUrl: row.sourceUrl,
    action: actionFor(status),
    reasons: reasons.slice(0, 3).join(" / ") || "確認材料が不足",
    cautions: cautions.slice(0, 3).join(" / ") || "大きな注意なし",
  };
}

function missingFields(row) {
  return [
    ["発行株数", row.checkedShares],
    ["現金等", row.checkedCash],
    ["有利子負債", row.checkedInterestDebt],
    ["純資産", row.checkedNetAssets],
    ["BPS", row.checkedBps],
    ["EPS", row.checkedEps],
  ].filter(([, value]) => !hasValue(value)).map(([label]) => label);
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function statusFor(score, missing) {
  if (missing.length) return "入力待ち";
  if (score >= 78) return "昇格確認優先";
  if (score >= 58) return "慎重確認";
  return "見送り寄り";
}

function actionFor(status) {
  if (status === "昇格確認優先") return "決算短信と有報を見て、問題なければconfirmed候補";
  if (status === "慎重確認") return "負債、利益の継続性、材料の一過性を確認";
  if (status === "入力待ち") return "不足項目を埋める";
  return "通常候補へ入れない方向で確認";
}

function writeReport(items) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const groups = ["昇格確認優先", "慎重確認", "入力待ち", "見送り寄り"];
  const lines = [
    "# 財務確認候補スクリーニング",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    "自動入力済みの財務候補を、通常候補へ進める前に一次判定しています。",
    "これは売買判断ではなく、どれを先に確認するかを決めるための整理です。",
    "",
    ...groups.flatMap((group) => section(group, items.filter((item) => item.status === group))),
  ];
  fs.writeFileSync(outputReportPath, `${lines.join("\n")}\n`, "utf8");
}

function writeAppData(items) {
  const payload = {
    generatedAt: new Date().toISOString(),
    source: "data/financial-worklist-screened.csv",
    total: items.length,
    priorityCount: items.filter((item) => item.status === "昇格確認優先").length,
    cautionCount: items.filter((item) => item.status === "見送り寄り").length,
    top: items.slice(0, 80),
  };
  fs.writeFileSync(outputJsPath, `window.AUTO_FINANCIAL_SCREENING = ${JSON.stringify(payload, null, 2)};\n`, "utf8");
}

function section(title, items) {
  return [
    `## ${title}`,
    "",
    ...(items.length ? items.slice(0, 10).map((item, index) =>
      `- ${index + 1}. ${item.code} ${item.name}: 点${item.screenScore} / PBR ${item.pbr}倍 / PER ${item.per || "-"}倍 / ネット現金比率 ${item.netCashRatio}% / ${item.reasons} / 注意: ${item.cautions} / 次: ${item.action}`
    ) : ["- 該当なし"]),
    "",
  ];
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function toCsv(items) {
  const headers = [
    "rank",
    "code",
    "name",
    "sector",
    "status",
    "screenScore",
    "price",
    "marketCap",
    "pbr",
    "per",
    "netCash",
    "netCashRatio",
    "debtAssetRatio",
    "sourceUrl",
    "action",
    "reasons",
    "cautions",
  ];
  return `${headers.join(",")}\n${items.map((item) => headers.map((header) => escapeCsv(item[header] ?? "")).join(",")).join("\n")}\n`;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function pct(value) {
  return `${round(value * 100)}%`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}
