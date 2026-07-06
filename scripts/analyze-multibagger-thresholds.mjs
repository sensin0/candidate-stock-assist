import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const priceBacktestPath = path.join(rootDir, "data", "universe-price-backtest.csv");
const metricsPath = path.join(rootDir, "data", "universe-metrics.csv");
const reportPath = path.join(rootDir, "reports", "latest-multibagger-thresholds.md");
const csvPath = path.join(rootDir, "data", "multibagger-thresholds.csv");

const metricsByCode = new Map(
  parseCsvRecords(fs.readFileSync(metricsPath, "utf8")).map((row) => [row.code, row])
);

const records = parseCsvRecords(fs.readFileSync(priceBacktestPath, "utf8"))
  .filter((row) => !row.error)
  .map((row) => enrich(row, metricsByCode.get(row.code)))
  .filter((row) => row.periodReturn !== null);

const base = summarize("全体", records);
const thresholdRows = buildThresholds(records)
  .filter((row) => row.sample >= 30)
  .sort((a, b) => b.lift - a.lift || b.hitRate - a.hitRate || b.sample - a.sample);
const combinedRows = buildCombinedThresholds(records)
  .filter((row) => row.sample >= 20)
  .sort((a, b) => b.lift - a.lift || b.hitRate - a.hitRate || b.sample - a.sample);

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, renderReport(), "utf8");
fs.writeFileSync(csvPath, toCsv([...thresholdRows, ...combinedRows]), "utf8");

console.log(`2倍化しきい値検証: ${records.length}件 / 2倍以上 ${base.hits}件`);
console.log(`単独条件上位: ${thresholdRows[0]?.label} 的中率${thresholdRows[0]?.hitRate}% リフト${thresholdRows[0]?.lift}倍`);
console.log(`複合条件上位: ${combinedRows[0]?.label} 的中率${combinedRows[0]?.hitRate}% リフト${combinedRows[0]?.lift}倍`);
console.log(path.relative(rootDir, reportPath));

function enrich(priceRow, metricsRow = {}) {
  const price = number(metricsRow.price || priceRow.lastClose);
  const bps = number(metricsRow.bps);
  const eps = number(metricsRow.eps);
  const shares = Math.max(0, number(metricsRow.shares) - number(metricsRow.treasuryShares));
  const marketCapOku = price > 0 && shares > 0 ? (price * shares / 1_000_000) / 100 : null;
  const netCash = number(metricsRow.cash) + number(metricsRow.securities) + number(metricsRow.investmentSecurities) - number(metricsRow.interestDebt);
  const marketCapMillion = price > 0 && shares > 0 ? price * shares / 1_000_000 : 0;
  return {
    code: priceRow.code,
    name: priceRow.name,
    market: priceRow.market,
    sector: priceRow.sector,
    periodReturn: numberOrNull(priceRow.periodReturn),
    doubled: number(priceRow.periodReturn) >= 100,
    bestStrategy: priceRow.bestStrategy,
    latestSignal: priceRow.latestSignal,
    judgement: priceRow.judgement,
    trades: number(priceRow.trades),
    winRate: number(priceRow.winRate),
    averageReturn: number(priceRow.averageReturn),
    maxDrawdown: number(priceRow.maxDrawdown),
    priceScore: number(priceRow.priceScore),
    pbr: price > 0 && bps > 0 ? price / bps : null,
    per: price > 0 && eps > 0 ? price / eps : null,
    netCashRatio: marketCapMillion > 0 ? (netCash / marketCapMillion) * 100 : null,
    marketCapOku,
  };
}

function buildThresholds(items) {
  const specs = [
    ...lte("PBR", "pbr", [0.3, 0.5, 0.7, 1.0, 1.5]),
    ...between("PER", "per", [[0, 5], [0, 10], [0, 15], [0, 20], [0, 30]]),
    ...gte("ネットキャッシュ比率", "netCashRatio", [0, 25, 50, 75, 100]),
    ...lte("時価総額", "marketCapOku", [30, 50, 100, 200, 500], "億円"),
    ...gte("価格スコア", "priceScore", [35, 50, 70, 90], ""),
    ...gte("平均リターン", "averageReturn", [5, 10, 15, 20]),
    ...gte("勝率", "winRate", [55, 70, 80, 90], "%"),
    ...gte("取引回数", "trades", [2, 3, 5, 8], ""),
    ...gt("最大下落", "maxDrawdown", [-20, -15, -10, -5]),
    ...equals("最新シグナル", "latestSignal", ["上昇中押し目", "安値反転候補", "高値圏", "待ち"]),
    ...equals("最良戦略", "bestStrategy", ["上昇中押し目", "安値反転", "高値更新"]),
    ...equals("判定", "judgement", ["良さそう", "中立", "見送り寄り"]),
  ];
  return specs.map((spec) => summarize(spec.label, items.filter(spec.test), spec));
}

function buildCombinedThresholds(items) {
  const specs = [
    {
      label: "小型+低PBR+ネットキャッシュ厚め",
      test: (row) => row.marketCapOku <= 200 && row.pbr <= 1 && row.netCashRatio >= 50,
    },
    {
      label: "小型+低PER+価格スコア良好",
      test: (row) => row.marketCapOku <= 200 && row.per > 0 && row.per <= 15 && row.priceScore >= 50,
    },
    {
      label: "上昇中押し目+勝率70%以上+平均10%以上",
      test: (row) => row.latestSignal === "上昇中押し目" && row.winRate >= 70 && row.averageReturn >= 10,
    },
    {
      label: "良さそう+取引2回以上+最大下落-15%超",
      test: (row) => row.judgement === "良さそう" && row.trades >= 2 && row.maxDrawdown > -15,
    },
    {
      label: "良さそう+上昇中押し目+価格スコア50以上",
      test: (row) => row.judgement === "良さそう" && row.latestSignal === "上昇中押し目" && row.priceScore >= 50,
    },
    {
      label: "低PBR+低PER+時価総額500億以下",
      test: (row) => row.pbr <= 1 && row.per > 0 && row.per <= 15 && row.marketCapOku <= 500,
    },
    {
      label: "低PBR+ネットキャッシュ50%以上+上昇中押し目",
      test: (row) => row.pbr <= 1 && row.netCashRatio >= 50 && row.latestSignal === "上昇中押し目",
    },
    {
      label: "買いやすい2倍監視条件",
      test: (row) => row.judgement === "良さそう" && row.trades >= 2 && row.winRate >= 70 && row.averageReturn >= 15 && row.maxDrawdown > -15 && row.latestSignal !== "高値圏",
    },
  ];
  return specs.map((spec) => summarize(spec.label, items.filter(spec.test), { type: "複合" }));
}

function summarize(label, items, spec = { type: "全体" }) {
  const hits = items.filter((row) => row.doubled).length;
  const hitRate = items.length ? (hits / items.length) * 100 : 0;
  const baseRate = records.length ? (records.filter((row) => row.doubled).length / records.length) * 100 : 0;
  return {
    type: spec.type || "単独",
    label,
    sample: items.length,
    hits,
    hitRate: round(hitRate),
    lift: round(baseRate ? hitRate / baseRate : 0, 2),
    avgPeriodReturn: round(average(items.map((row) => row.periodReturn))),
    medianPeriodReturn: round(median(items.map((row) => row.periodReturn))),
  };
}

function renderReport() {
  return [
    "# 2倍化しきい値検証",
    "",
    `生成日時: ${new Date().toISOString()}`,
    `対象: ${records.length.toLocaleString()}件`,
    `過去1年で2倍以上: ${base.hits.toLocaleString()}件`,
    `全体の2倍化率: ${base.hitRate}%`,
    "",
    "注意: 財務指標は現時点の取得値です。過去1年のスタート時点での財務を完全再現した検証ではありません。",
    "注意: 2倍化率は「条件を満たした銘柄のうち、期間騰落+100%以上だった割合」です。売買推奨ではなく、ランキング条件調整の材料です。",
    "",
    "## 単独指標 上位",
    "",
    table(thresholdRows.slice(0, 20)),
    "",
    "## 複合条件",
    "",
    table(combinedRows),
    "",
    "## 実装向けの目安",
    "",
    "- 2倍狙い枠は、通常ランキングとは別枠にする。勝率重視ランキングに混ぜると過熱株が上がりすぎます。",
    "- 強い条件は「上昇中押し目」「価格スコア50以上」「平均リターン10%以上」「勝率70%以上」「最大下落-15%より浅い」です。",
    "- 財務条件は、PBR1倍以下、PER15倍以下、ネットキャッシュ比率50%以上、時価総額500億円以下を加点に使うのが妥当です。",
    "- ただし高値圏は買い候補ではなく監視に回す。2倍化済み銘柄ほど高値掴みリスクも高いです。",
    "",
  ].join("\n");
}

function table(rows) {
  if (!rows.length) return "- なし";
  return [
    "| 条件 | 件数 | 2倍件数 | 2倍化率 | 全体比 | 平均騰落 | 中央騰落 |",
    "|---|---:|---:|---:|---:|---:|---:|",
    ...rows.map((row) =>
      `| ${row.label} | ${row.sample} | ${row.hits} | ${row.hitRate}% | ${row.lift}倍 | ${row.avgPeriodReturn}% | ${row.medianPeriodReturn}% |`
    ),
  ].join("\n");
}

function lte(name, key, values, unit = "") {
  return values.map((value) => ({ label: `${name} <= ${value}${unit}`, test: (row) => finite(row[key]) && row[key] <= value }));
}

function gt(name, key, values) {
  return values.map((value) => ({ label: `${name} > ${value}%`, test: (row) => finite(row[key]) && row[key] > value }));
}

function gte(name, key, values, unit = "%") {
  return values.map((value) => ({ label: `${name} >= ${value}${unit}`, test: (row) => finite(row[key]) && row[key] >= value }));
}

function between(name, key, ranges) {
  return ranges.map(([min, max]) => ({ label: `${name} ${min}超-${max}以下`, test: (row) => finite(row[key]) && row[key] > min && row[key] <= max }));
}

function equals(name, key, values) {
  return values.map((value) => ({ label: `${name} = ${value}`, test: (row) => row[key] === value }));
}

function toCsv(rows) {
  const headers = ["type", "label", "sample", "hits", "hitRate", "lift", "avgPeriodReturn", "medianPeriodReturn"];
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
    "",
  ].join("\n");
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll("\"", "\"\"")}"`;
  return text;
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function numberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function finite(value) {
  return Number.isFinite(value);
}

function average(values) {
  const nums = values.filter(Number.isFinite);
  return nums.length ? nums.reduce((sum, value) => sum + value, 0) / nums.length : 0;
}

function median(values) {
  const nums = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!nums.length) return 0;
  const middle = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[middle] : (nums[middle - 1] + nums[middle]) / 2;
}

function round(value, digits = 1) {
  const unit = 10 ** digits;
  return Math.round(Number(value || 0) * unit) / unit;
}
