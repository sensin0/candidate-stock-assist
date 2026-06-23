import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const worklistPath = path.join(rootDir, "data", "financial-confirmation-worklist.csv");
const confirmedInputPath = path.join(rootDir, "data", "financial-confirmed-input.csv");
const reportPath = path.join(rootDir, "reports", "latest-financial-confirmed-input.md");
const originalWorklist = fs.readFileSync(worklistPath, "utf8");
const originalInput = fs.readFileSync(confirmedInputPath, "utf8");
const originalReport = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, "utf8") : null;

try {
  const rows = parseCsvRecords(originalWorklist);
  const target = {
    ...rows[0],
    checkedShares: "10000000",
    checkedTreasuryShares: "0",
    checkedCash: "3000",
    checkedSecurities: "0",
    checkedInvestmentSecurities: "0",
    checkedInterestDebt: "500",
    checkedNetAssets: "12000",
    checkedRentalBook: "0",
    checkedRentalMarket: "0",
    checkedBps: "1200",
    checkedEps: "80",
    confirmed: "true",
    qualitativeDone: "true",
  };
  const headers = Object.keys(rows[0]);
  const patched = [headers.join(","), [target, ...rows.slice(1)].map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")).join("\n"), ""].join("\n");
  fs.writeFileSync(worklistPath, patched, "utf8");

  const result = spawnSync(process.execPath, ["scripts/apply-financial-worklist.mjs"], {
    cwd: rootDir,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  const confirmedRows = parseCsvRecords(fs.readFileSync(confirmedInputPath, "utf8"));
  assert.ok(confirmedRows.some((row) => row.code === target.code && row.dataConfidence === "確認済み"));
  assert.match(fs.readFileSync(reportPath, "utf8"), /今回反映: 1件/);
  console.log("apply-financial-worklist-test ok");
} finally {
  fs.writeFileSync(worklistPath, originalWorklist, "utf8");
  fs.writeFileSync(confirmedInputPath, originalInput, "utf8");
  if (originalReport === null) fs.rmSync(reportPath, { force: true });
  else fs.writeFileSync(reportPath, originalReport, "utf8");
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}
