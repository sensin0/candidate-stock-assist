import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseStockCsv } from "./providers/csv-provider.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stockMasterPath = path.join(rootDir, "data", "stock-master.csv");
const original = fs.readFileSync(stockMasterPath, "utf8");
const originalRows = parseStockCsv(original);
const originalManualCount = originalRows.filter((stock) => stock.dataConfidence === "一部手入力").length;

try {
  const preview = spawnSync(process.execPath, ["scripts/confirm-stock.mjs", "6505"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  assert.equal(preview.status, 0, preview.stderr);
  assert.match(preview.stdout, /まだCSVは変更していません/);
  assert.equal(fs.readFileSync(stockMasterPath, "utf8"), original, "プレビューでCSVが変わっています");

  const write = spawnSync(process.execPath, ["scripts/confirm-stock.mjs", "6505", "--write", "--skip-refresh"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  assert.equal(write.status, 0, write.stderr);
  assert.match(write.stdout, /data\/stock-master\.csv を更新しました/);
  assert.match(write.stdout, new RegExp(`一部手入力の残り: ${originalManualCount - 1}件`));
  assert.match(write.stdout, /次に確認: 9672 東京都競馬/);

  const rows = parseStockCsv(fs.readFileSync(stockMasterPath, "utf8"));
  const target = rows.find((stock) => stock.code === "6505");
  const untouched = rows.find((stock) => stock.code === "9672");
  assert.equal(target?.dataConfidence, "確認済み");
  assert.equal(untouched?.dataConfidence, "一部手入力");

  const missing = spawnSync(process.execPath, ["scripts/confirm-stock.mjs", "9999"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /銘柄コードが見つかりません/);

  console.log("confirm-stock-test ok");
} finally {
  fs.writeFileSync(stockMasterPath, original, "utf8");
}
