import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = path.join(rootDir, "data", "financial-confirmed-input.csv");
const previewPath = path.join(rootDir, "data", "stock-master-promoted.csv");
const reportPath = path.join(rootDir, "reports", "latest-promoted-candidates.md");
const original = fs.readFileSync(inputPath, "utf8");
const originalPreview = fs.existsSync(previewPath) ? fs.readFileSync(previewPath, "utf8") : null;
const originalReport = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, "utf8") : null;

try {
  fs.writeFileSync(
    inputPath,
    `${original.trim()}\n9991,確認済みテスト,情報通信,1000,10000000,0,3000,0,0,500,12000,0,0,1200,80,0.6,0.9,1.4,10,16,24,確認済み,true,false,,確認済みテスト,900|940|960|980|1000\n`,
    "utf8",
  );
  const result = spawnSync(process.execPath, ["scripts/promote-confirmed-candidates.mjs"], {
    cwd: rootDir,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr);
  const rows = parseCsvRecords(fs.readFileSync(previewPath, "utf8"));
  assert.ok(rows.some((row) => row.code === "9991" && row.dataConfidence === "確認済み"));
  assert.match(fs.readFileSync(reportPath, "utf8"), /確認済み候補の通常候補昇格/);
  console.log("promote-confirmed-candidates-test ok");
} finally {
  fs.writeFileSync(inputPath, original, "utf8");
  if (originalPreview === null) fs.rmSync(previewPath, { force: true });
  else fs.writeFileSync(previewPath, originalPreview, "utf8");
  if (originalReport === null) fs.rmSync(reportPath, { force: true });
  else fs.writeFileSync(reportPath, originalReport, "utf8");
}
