import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const csvPath = path.join(rootDir, "data", "stock-master-hidden-gems-draft.csv");
const reportPath = path.join(rootDir, "reports", "latest-hidden-gems-stock-master-draft.md");
const hiddenGemsPath = path.join(rootDir, "data", "hidden-gems.csv");
const stockMasterPath = path.join(rootDir, "data", "stock-master.csv");

assert.ok(fs.existsSync(csvPath), "stock-master-hidden-gems-draft.csv がありません");
assert.ok(fs.existsSync(reportPath), "latest-hidden-gems-stock-master-draft.md がありません");

const rows = parseCsvRecords(fs.readFileSync(csvPath, "utf8"));
const hiddenGems = parseCsvRecords(fs.readFileSync(hiddenGemsPath, "utf8"));
const hiddenPriorityCodes = new Set(hiddenGems.filter((row) => row.assistAction === "今すぐ財務確認").map((row) => row.code));
const stockCodes = new Set(parseCsvRecords(fs.readFileSync(stockMasterPath, "utf8")).map((row) => row.code));

assert.ok(rows.length >= 1, "未発掘下書きは1件以上必要です");

for (const row of rows) {
  assert.match(row.code, /^[0-9A-Z]{4}$/);
  assert.ok(hiddenPriorityCodes.has(row.code), `${row.code}: 今すぐ財務確認ではありません`);
  assert.ok(!stockCodes.has(row.code), `${row.code}: 既存通常候補と重複しています`);
  assert.ok(Number(row.price) > 0, `${row.code}: 株価がありません`);
  assert.ok(Number(row.bps) > 0, `${row.code}: 仮BPSがありません`);
  assert.ok(Number(row.eps) > 0, `${row.code}: 仮EPSがありません`);
  assert.match(row.note, /確認前/);
}

const report = fs.readFileSync(reportPath, "utf8");
assert.match(report, /未発掘から通常候補入力下書き/);
assert.match(report, /入力下書き/);
assert.match(report, /買い候補ではありません/);

console.log("hidden-gems-draft-test ok");
