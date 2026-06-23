import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = path.join(rootDir, "data", "financial-confirmation-queue.csv");
const reportPath = path.join(rootDir, "reports", "latest-financial-confirmation.md");
const appDataPath = path.join(rootDir, "app", "generated-financial-confirmation.js");

assert.ok(fs.existsSync(csvPath), "financial-confirmation-queue.csv がありません");
assert.ok(fs.existsSync(reportPath), "latest-financial-confirmation.md がありません");
assert.ok(fs.existsSync(appDataPath), "generated-financial-confirmation.js がありません");

const rows = parseCsvRecords(fs.readFileSync(csvPath, "utf8"));
const report = fs.readFileSync(reportPath, "utf8");
const appData = fs.readFileSync(appDataPath, "utf8");

assert.ok(rows.length >= 1, "財務確認キューが空です");

for (const row of rows.slice(0, 5)) {
  assert.ok(row.code, "コードがありません");
  assert.ok(row.name, "銘柄名がありません");
  assert.ok(Number(row.confirmationScore) > 0, `${row.code} の確認スコアが不正です`);
  assert.match(row.buyGuard, /買わない/, `${row.code} の買い抑止文言がありません`);
  assert.match(row.checklist, /BPS/, `${row.code} の確認項目にBPSがありません`);
  assert.match(row.checklist, /EPS/, `${row.code} の確認項目にEPSがありません`);
}

assert.match(report, /# 財務確認キュー/);
assert.match(report, /確認.*買わない/);
assert.match(report, /## 最優先で財務確認/);
assert.match(appData, /window\.AUTO_FINANCIAL_CONFIRMATION/);

console.log("financial-confirmation-test ok");
