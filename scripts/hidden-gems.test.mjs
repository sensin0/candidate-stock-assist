import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = path.join(rootDir, "data", "hidden-gems.csv");
const reportPath = path.join(rootDir, "reports", "latest-hidden-gems.md");
const appDataPath = path.join(rootDir, "app", "generated-hidden-gems.js");
const promotionPath = path.join(rootDir, "data", "promotion-candidates.csv");
const stockMasterPath = path.join(rootDir, "data", "stock-master.csv");

assert.ok(fs.existsSync(csvPath), "hidden-gems.csv がありません");
assert.ok(fs.existsSync(reportPath), "latest-hidden-gems.md がありません");
assert.ok(fs.existsSync(appDataPath), "generated-hidden-gems.js がありません");

const rows = parseCsvRecords(fs.readFileSync(csvPath, "utf8"));
const promotionCodes = new Set(parseCsvRecords(fs.readFileSync(promotionPath, "utf8")).map((row) => row.code));
const stockCodes = new Set(parseCsvRecords(fs.readFileSync(stockMasterPath, "utf8")).map((row) => row.code));

assert.ok(rows.length >= 20, "未発掘候補は20件以上必要です");

for (const row of rows.slice(0, 20)) {
  assert.match(row.code, /^[0-9A-Z]{4}$/);
  assert.ok(Number(row.hiddenScore) >= 70, `${row.code}: 未発掘点が低すぎます`);
  assert.ok(row.assistAction, `${row.code}: アシスト表示がありません`);
  assert.ok(!promotionCodes.has(row.code), `${row.code}: 既存昇格候補と重複しています`);
  assert.ok(!stockCodes.has(row.code), `${row.code}: 通常候補と重複しています`);
}

const report = fs.readFileSync(reportPath, "utf8");
assert.match(report, /未発掘候補/);
assert.match(report, /今すぐ財務確認/);
assert.ok(rows.some((row) => row.assistAction === "今すぐ財務確認"), "今すぐ財務確認の候補が必要です");
assert.match(report, /上位候補/);

console.log("hidden-gems-test ok");
