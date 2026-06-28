import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const previewPath = path.join(rootDir, "data", "stock-master-expanded-preview.csv");
const reportPath = path.join(rootDir, "reports", "latest-stock-master-expanded-preview.md");
const appDataPath = path.join(rootDir, "app", "generated-expansion-preview.js");
const masterPath = path.join(rootDir, "data", "stock-master.csv");

assert.ok(fs.existsSync(previewPath), "stock-master-expanded-preview.csv がありません");
assert.ok(fs.existsSync(reportPath), "latest-stock-master-expanded-preview.md がありません");
assert.ok(fs.existsSync(appDataPath), "generated-expansion-preview.js がありません");

const previewRows = parseCsvRecords(fs.readFileSync(previewPath, "utf8"));
const masterRows = parseCsvRecords(fs.readFileSync(masterPath, "utf8"));

assert.ok(previewRows.length > masterRows.length, "追加候補がプレビューに入っていません");
assert.ok(previewRows.length >= 45, "品質フィルタ後でも候補数45件以上を目安にします");

const addedRows = previewRows.filter((row) => row.dataConfidence === "推定");
assert.ok(addedRows.length >= 10, "品質フィルタ後でも推定の追加候補が10件以上必要です");
assert.ok(!addedRows.some((row) => ["5363", "5458"].includes(row.code)), "価格検証が弱い候補は追加プレビューから外します");

const appData = fs.readFileSync(appDataPath, "utf8");
assert.match(appData, /AUTO_EXPANSION_PREVIEW/, "画面用の追加候補データがありません");
assert.match(appData, /推定表示/, "画面用データに推定表示の注意がありません");

for (const row of addedRows.slice(0, 10)) {
  assert.match(row.code, /^[0-9A-Z]{4}$/);
  assert.ok(Number(row.price) > 0, `${row.code}: 株価がありません`);
  assert.equal(row.qualitativeDone, "false", `${row.code}: 推定表示は qualitativeDone=false にします`);
  assert.match(row.risk, /推定表示/, `${row.code}: 推定表示の注意がありません`);
}

console.log("stock-master-expanded-preview-test ok");
