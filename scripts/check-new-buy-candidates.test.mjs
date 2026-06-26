import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scriptPath = path.join(rootDir, "scripts", "check-new-buy-candidates.mjs");
const reportPath = path.join(rootDir, "reports", "latest-morning-report.md");

assert.equal(fs.existsSync(scriptPath), true);
assert.equal(fs.existsSync(reportPath), true);

const script = fs.readFileSync(scriptPath, "utf8");
assert.match(script, /## 今買い候補/);
assert.match(script, /has_new/);
assert.match(script, /buy-candidates\.json/);

const report = fs.readFileSync(reportPath, "utf8");
assert.match(report, /## 今買い候補/);

console.log("check-new-buy-candidates ok");
