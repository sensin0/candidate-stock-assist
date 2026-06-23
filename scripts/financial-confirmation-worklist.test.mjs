import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const worklistPath = path.join(rootDir, "data", "financial-confirmation-worklist.csv");
const reportPath = path.join(rootDir, "reports", "latest-financial-confirmation-worklist.md");

assert.ok(fs.existsSync(worklistPath), "financial-confirmation-worklist.csv がありません");
assert.ok(fs.existsSync(reportPath), "latest-financial-confirmation-worklist.md がありません");

const rows = parseCsvRecords(fs.readFileSync(worklistPath, "utf8"));
const report = fs.readFileSync(reportPath, "utf8");

assert.ok(rows.length >= 1, "財務確認ワークシートが空です");
assert.ok(rows[0].checkedBps !== undefined, "checkedBps 列がありません");
assert.ok(rows[0].checkedEps !== undefined, "checkedEps 列がありません");
assert.equal(rows[0].confirmed, "false");
assert.match(report, /財務確認ワークシート/);
assert.match(report, /confirmed/);

console.log("financial-confirmation-worklist-test ok");
