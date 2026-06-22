import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const draftPath = path.join(rootDir, "data", "stock-master-input-draft.csv");
const reportPath = path.join(rootDir, "reports", "latest-stock-master-draft.md");

assert.ok(fs.existsSync(draftPath), "stock-master-input-draft.csv がありません");
assert.ok(fs.existsSync(reportPath), "latest-stock-master-draft.md がありません");

const rows = parseCsvRecords(fs.readFileSync(draftPath, "utf8"));
assert.ok(rows.length >= 20, "通常候補入力下書きは20件以上必要です");

for (const row of rows.slice(0, 10)) {
  assert.match(row.code, /^[0-9A-Z]{4}$/);
  assert.ok(Number(row.price) > 0, `${row.code}: 株価がありません`);
  assert.ok(Number(row.shares) > 0, `${row.code}: 発行株数の仮置きがありません`);
  assert.ok(Number(row.bps) > 0, `${row.code}: BPSの仮置きがありません`);
  assert.ok(String(row.note).includes("推定下書き"), `${row.code}: 推定下書きの注記がありません`);
}

console.log("stock-master-draft-test ok");
