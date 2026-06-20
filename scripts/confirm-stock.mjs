import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseCsvRows } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stockMasterPath = path.join(rootDir, "data", "stock-master.csv");
const code = process.argv.find((arg) => /^\d{4}$/.test(arg));
const write = process.argv.includes("--write");
const skipRefresh = process.argv.includes("--skip-refresh");

if (!code) {
  console.error("銘柄コードを指定してください。例: npm run manual:confirm -- 6505");
  process.exit(1);
}

const text = fs.readFileSync(stockMasterPath, "utf8");
const rows = parseCsvRows(text);
const headers = rows[0] ?? [];
const codeIndex = headers.indexOf("code");
const nameIndex = headers.indexOf("name");
const confidenceIndex = headers.indexOf("dataConfidence");

if (codeIndex < 0 || confidenceIndex < 0) {
  console.error("stock-master.csv に code または dataConfidence 列がありません");
  process.exit(1);
}

const rowIndex = rows.findIndex((row, index) => index > 0 && row[codeIndex] === code);
if (rowIndex < 0) {
  console.error(`銘柄コードが見つかりません: ${code}`);
  process.exit(1);
}

const row = rows[rowIndex];
const before = row[confidenceIndex] || "未設定";
const name = row[nameIndex] || "";

if (before === "確認済み") {
  console.log(`${code} ${name} はすでに確認済みです`);
  process.exit(0);
}

console.log("確認済みへの変更");
console.log(`銘柄: ${code} ${name}`);
console.log(`変更: ${before} -> 確認済み`);

if (!write) {
  console.log("");
  console.log("まだCSVは変更していません。変更する場合:");
  console.log(`npm run manual:confirm -- ${code} --write`);
  process.exit(0);
}

row[confidenceIndex] = "確認済み";
fs.writeFileSync(stockMasterPath, stringifyCsvRows(rows), "utf8");
console.log("data/stock-master.csv を更新しました");
const remainingManualRows = rows
  .slice(1)
  .filter((candidate) => candidate[confidenceIndex] === "一部手入力");
console.log(`一部手入力の残り: ${remainingManualRows.length}件`);
if (remainingManualRows.length) {
  const next = remainingManualRows[0];
  console.log(`次に確認: ${next[codeIndex]} ${next[nameIndex] || ""}`.trim());
}
if (!skipRefresh) {
  runStep("更新データ再生成", ["scripts/update-data.mjs"]);
  runStep("朝レポート再生成", ["scripts/generate-morning-report.mjs"]);
  console.log("更新データと朝レポートを再生成しました");
}
console.log("次に npm run production:check で本番準備度を確認してください");

function stringifyCsvRows(rowsToWrite) {
  return `${rowsToWrite.map((rowToWrite) => rowToWrite.map(csvCell).join(",")).join("\n")}\n`;
}

function csvCell(value) {
  const textValue = String(value ?? "");
  if (!/[",\n\r]/.test(textValue)) return textValue;
  return `"${textValue.replaceAll("\"", "\"\"")}"`;
}

function runStep(label, args) {
  const result = spawnSync(process.execPath, args, { cwd: rootDir, encoding: "utf8" });
  if (result.status !== 0) {
    console.error(`${label}に失敗しました`);
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
}
