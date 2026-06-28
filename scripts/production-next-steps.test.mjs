import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(rootDir, "reports", "latest-production-next-steps.md");

assert.ok(fs.existsSync(reportPath), "latest-production-next-steps.md がありません");

const report = fs.readFileSync(reportPath, "utf8");
assert.match(report, /# 本番化 残作業/);
assert.match(report, /財務確認キュー:/);
assert.match(report, /最優先の未スクリーニング:/);
assert.match(report, /財務スクリーニング済み:/);
assert.match(report, /日本株財務メトリクス:/);
assert.match(report, /新規今買い通知/);

console.log("production-next-steps-test ok");
