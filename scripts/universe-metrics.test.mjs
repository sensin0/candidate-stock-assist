import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const metricsPath = path.join(rootDir, "data", "universe-metrics.csv");
const reportPath = path.join(rootDir, "reports", "latest-universe-financial-coverage.md");

assert.ok(fs.existsSync(metricsPath), "universe-metrics.csv がありません");
assert.ok(fs.existsSync(reportPath), "latest-universe-financial-coverage.md がありません");

const metrics = parseCsvRecords(fs.readFileSync(metricsPath, "utf8"));
const report = fs.readFileSync(reportPath, "utf8");

assert.ok(metrics.length >= 20, "財務メトリクス対象が少なすぎます");
assert.ok(metrics.some((row) => row.asOf === "confirmed" || row.asOf === "stockMaster"), "通常候補のメトリクスがありません");
assert.match(report, /確認前推定は探索用/);

console.log("universe-metrics-test ok");
