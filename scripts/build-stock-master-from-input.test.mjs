import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseStockCsv } from "./providers/csv-provider.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const inputPath = path.join(rootDir, "data", "stock-master-input.csv");
const outputPath = path.join(rootDir, "data", "stock-master.csv");
const generatedPath = path.join(rootDir, "data", "stock-master.generated.csv");
const originalInput = fs.readFileSync(inputPath, "utf8");
const originalOutput = fs.readFileSync(outputPath, "utf8");
const originalGenerated = fs.existsSync(generatedPath) ? fs.readFileSync(generatedPath, "utf8") : null;

try {
  fs.writeFileSync(
    inputPath,
    [
      "code,name,sector,price,shares,cash,interestDebt,netAssets,bps,eps,pbrLow,pbrHigh,note",
      "9998,テスト候補,サービス,1200,10000000,5000,1000,12000,1200,80,0.5,1,入力テスト",
      "",
    ].join("\n"),
    "utf8",
  );
  const result = spawnSync(process.execPath, ["scripts/build-stock-master-from-input.mjs"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const rows = parseStockCsv(fs.readFileSync(generatedPath, "utf8"));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].code, "9998");
  assert.equal(rows[0].dataConfidence, "未確認");
  assert.equal(rows[0].qualitativeDone, false);
  assert.ok(rows[0].history.length >= 3);
  console.log("build-stock-master-from-input-test ok");
} finally {
  fs.writeFileSync(inputPath, originalInput, "utf8");
  fs.writeFileSync(outputPath, originalOutput, "utf8");
  if (originalGenerated === null) {
    fs.rmSync(generatedPath, { force: true });
  } else {
    fs.writeFileSync(generatedPath, originalGenerated, "utf8");
  }
}
