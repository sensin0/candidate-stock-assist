import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = path.join(rootDir, "data", "promotion-readiness.csv");
const reportPath = path.join(rootDir, "reports", "latest-promotion-readiness.md");
const appDataPath = path.join(rootDir, "app", "generated-promotion-readiness.js");

assert.ok(fs.existsSync(csvPath), "promotion-readiness.csv がありません");
assert.ok(fs.existsSync(reportPath), "latest-promotion-readiness.md がありません");
assert.ok(fs.existsSync(appDataPath), "generated-promotion-readiness.js がありません");

const rows = parseCsvRecords(fs.readFileSync(csvPath, "utf8"));
assert.ok(rows.length >= 20, "昇格準備チェックは20件以上必要です");

const priorityRows = rows.filter((row) => row.status === "最優先で財務確認");
assert.ok(priorityRows.length >= 5, "最優先で財務確認する候補が少なすぎます");

for (const row of rows.slice(0, 10)) {
  assert.match(row.code, /^[0-9A-Z]{4}$/);
  assert.ok(Number(row.readinessScore) > 0, `${row.code}: 準備点がありません`);
  assert.ok(String(row.checklist).includes("BPS"), `${row.code}: 確認項目がありません`);
}

const report = fs.readFileSync(reportPath, "utf8");
assert.match(report, /通常候補への昇格準備チェック/);
assert.match(report, /最優先で財務確認/);

console.log("promotion-readiness-test ok");
