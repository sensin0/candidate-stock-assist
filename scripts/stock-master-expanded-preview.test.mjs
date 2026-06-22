import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const previewPath = path.join(rootDir, "data", "stock-master-expanded-preview.csv");
const reportPath = path.join(rootDir, "reports", "latest-stock-master-expanded-preview.md");
const masterPath = path.join(rootDir, "data", "stock-master.csv");

assert.ok(fs.existsSync(previewPath), "stock-master-expanded-preview.csv がありません");
assert.ok(fs.existsSync(reportPath), "latest-stock-master-expanded-preview.md がありません");

const previewRows = parseCsvRecords(fs.readFileSync(previewPath, "utf8"));
const masterRows = parseCsvRecords(fs.readFileSync(masterPath, "utf8"));

assert.ok(previewRows.length > masterRows.length, "追加候補がプレビューに入っていません");
assert.ok(previewRows.length >= 50, "プレビュー後の候補数は50件以上を目安にします");

const addedRows = previewRows.filter((row) => row.dataConfidence === "推定");
assert.ok(addedRows.length >= 20, "推定の追加候補が20件以上必要です");

for (const row of addedRows.slice(0, 10)) {
  assert.match(row.code, /^[0-9A-Z]{4}$/);
  assert.ok(Number(row.price) > 0, `${row.code}: 株価がありません`);
  assert.equal(row.qualitativeDone, "false", `${row.code}: 財務確認前は qualitativeDone=false にします`);
  assert.match(row.risk, /財務確認前/, `${row.code}: 財務確認前の注意がありません`);
}

console.log("stock-master-expanded-preview-test ok");
