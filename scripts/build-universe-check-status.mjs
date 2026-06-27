import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");

const listed = readCsv("listed-universe.csv");
const priceBacktest = new Map(readCsv("universe-price-backtest.csv").map((row) => [row.code, row]));
const financialFacts = new Map(readCsv("universe-financial-facts.csv").map((row) => [row.code, row]));
const metrics = new Map(readCsv("universe-metrics.csv").map((row) => [row.code, row]));

const rows = listed.map((issue) => {
  const price = priceBacktest.get(issue.code);
  const fact = financialFacts.get(issue.code);
  const metric = metrics.get(issue.code);
  const priceOk = Boolean(price && !price.error && Number(price.lastClose || 0) > 0);
  const financialOk = fact?.status === "取得成功";
  const metricSource = metric?.asOf || "";

  const status = classify({ priceOk, financialOk, metricSource });
  return {
    code: issue.code,
    name: issue.name,
    market: issue.market,
    sector: issue.sector,
    status,
    priceStatus: priceOk ? "価格取得済み" : "価格取得不可",
    financialStatus: financialOk ? "財務取得済み" : fact?.status === "取得失敗" ? "財務取得不可" : "財務未取得",
    metricSource: metricSource || "なし",
    action: actionFor(status),
    lastClose: price?.lastClose || fact?.price || "",
    priceJudgement: price?.judgement || "",
    financialError: fact?.error || "",
  };
});

fs.writeFileSync(path.join(dataDir, "universe-check-status.csv"), toCsv(rows), "utf8");
writeReport(rows);

const completed = rows.filter((row) => row.status !== "未チェック");
console.log(`日本株全体チェック状態を生成しました: ${completed.length}/${rows.length}件`);
console.log(`${path.relative(rootDir, path.join(dataDir, "universe-check-status.csv"))}`);

function classify({ priceOk, financialOk, metricSource }) {
  if (financialOk && priceOk) return "自動チェック完了";
  if (financialOk && !priceOk) return "財務のみ完了";
  if (metricSource === "priceEstimate") return "代替推定済み";
  if (metricSource === "unavailable") return "取得不可で自動除外";
  if (priceOk) return "価格のみ完了";
  return "未チェック";
}

function actionFor(status) {
  if (status === "自動チェック完了") return "ランキング判定に利用";
  if (status === "財務のみ完了") return "価格が取れたらランキング判定";
  if (status === "代替推定済み") return "探索用。買い候補にはしない";
  if (status === "取得不可で自動除外") return "自動除外。通知しない";
  if (status === "価格のみ完了") return "財務データを次回再取得";
  return "次回自動更新で再確認";
}

function writeReport(items) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const completed = items.filter((row) => row.status !== "未チェック");
  const lines = [
    "# 日本株全体 自動チェック状態",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    `母集団: ${items.length}件`,
    `自動チェック済み: ${completed.length}/${items.length}件`,
    ...Object.entries(groupCount(items, "status")).map(([label, count]) => `- ${label}: ${count}件`),
    "",
    "## 取得不可で自動除外",
    "",
    ...items
      .filter((row) => row.status === "取得不可で自動除外")
      .slice(0, 50)
      .map((row, index) => `- ${index + 1}. ${row.code} ${row.name}: ${row.financialError || "価格・財務の自動取得が不足"}`),
    ...(items.some((row) => row.status === "取得不可で自動除外") ? [] : ["- 該当なし"]),
    "",
    "## 運用ルール",
    "",
    "- 自動チェック完了は、財務と価格の両方を使ってランキング判定します。",
    "- 代替推定済みは、探索用に残しますが、今買い候補には上げません。",
    "- 取得不可で自動除外は、通知にもランキング上位にも出しません。次回更新で再取得できたら自動復帰します。",
  ];
  fs.writeFileSync(path.join(reportsDir, "latest-universe-check-status.md"), `${lines.join("\n")}\n`, "utf8");
}

function readCsv(name) {
  const filePath = path.join(dataDir, name);
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function groupCount(items, key) {
  return items.reduce((acc, item) => {
    acc[item[key] || "未設定"] = (acc[item[key] || "未設定"] ?? 0) + 1;
    return acc;
  }, {});
}

function toCsv(items) {
  const headers = [
    "code",
    "name",
    "market",
    "sector",
    "status",
    "priceStatus",
    "financialStatus",
    "metricSource",
    "action",
    "lastClose",
    "priceJudgement",
    "financialError",
  ];
  return `${headers.join(",")}\n${items.map((item) => headers.map((header) => escapeCsv(item[header])).join(",")).join("\n")}\n`;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll("\"", "\"\"")}"`;
  return text;
}
