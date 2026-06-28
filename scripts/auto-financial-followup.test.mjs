import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync(process.execPath, ["scripts/build-auto-financial-followup.mjs"], {
  cwd: rootDir,
  encoding: "utf8",
});

assert.equal(result.status, 0, result.stderr || result.stdout);

const csvPath = path.join(rootDir, "data", "auto-financial-followup.csv");
const reportPath = path.join(rootDir, "reports", "latest-auto-financial-followup.md");
assert.equal(fs.existsSync(csvPath), true);
assert.equal(fs.existsSync(reportPath), true);

const rows = parseCsvRecords(fs.readFileSync(csvPath, "utf8"));
assert.ok(rows.length >= 1);
assert.ok(rows.every((row) => row.action));
assert.ok(rows.every((row) => Number(row.followupScore) >= 0));
const firstPriceHistoryIndex = rows.findIndex((row) => row.action === "価格履歴を先に増やす");
const lastPriorityIndex = Math.max(
  rows.findLastIndex((row) => row.action === "自動確認済み・買い場接近"),
  rows.findLastIndex((row) => row.action === "財務確認を進める"),
);
if (firstPriceHistoryIndex >= 0 && lastPriorityIndex >= 0) {
  assert.ok(lastPriorityIndex < firstPriceHistoryIndex);
}

const report = fs.readFileSync(reportPath, "utf8");
assert.match(report, /# 自動財務確認/);
assert.match(report, /## 買い場接近/);
assert.match(report, /## 買いライン待ち/);
assert.match(report, /## 価格履歴不足/);
assert.match(report, /## 後回し・見送り寄り/);

console.log("auto-financial-followup ok");
