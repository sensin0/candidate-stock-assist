import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "package.json",
  "README.md",
  "STOCK_MASTER_COLUMNS.md",
  "PRODUCTION_CHECKLIST.md",
  "OPERATIONS_RUNBOOK.md",
  ".gitignore",
  ".github/workflows/morning-pages.yml",
  "app/index.html",
  "app/app.js",
  "app/styles.css",
  "scripts/update-data.mjs",
  "scripts/backtest-core.mjs",
  "scripts/backtest-timing.mjs",
  "scripts/build-stock-master-from-input.mjs",
  "scripts/production-check.mjs",
  "scripts/build-pages.mjs",
  "scripts/generate-morning-report.mjs",
  "scripts/csv-utils.mjs",
  "scripts/csv-utils.test.mjs",
  "scripts/stock-master.test.mjs",
  "scripts/build-stock-master-from-input.test.mjs",
  "scripts/confirm-stock.mjs",
  "scripts/confirm-stock.test.mjs",
  "scripts/privacy-check.mjs",
  "scripts/universe-check.mjs",
  "scripts/universe-screen.mjs",
  "scripts/production-check.test.mjs",
  "scripts/data-quality.test.mjs",
  "scripts/sheet-templates.test.mjs",
  "scripts/notify-discord.test.mjs",
  "GOOGLE_SHEETS_SETUP.md",
  "sheet-templates/stock-master.csv",
  "sheet-templates/stock-master-input.csv",
  "sheet-templates/price-updates.csv",
  "sheet-templates/disclosures.csv",
  "sheet-templates/edinet-facts.csv",
  "sheet-templates/watchlist.csv",
  "sheet-templates/listed-universe.csv",
  "sheet-templates/universe-metrics.csv",
  "data/stock-master.csv",
  "data/listed-universe.csv",
  "data/universe-metrics.csv",
  "data/stock-master-input.csv",
  "data/price-updates.csv",
  "data/disclosures.csv",
  "data/edinet-facts.csv",
  "data/watchlist.csv",
  "scripts/providers/watchlist-provider.mjs",
  "scripts/providers/backtest-provider.mjs",
  "data/backtest-results.csv",
  "sheet-templates/backtest-results.csv",
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(rootDir, file)));
if (missing.length) {
  console.error(`不足ファイル: ${missing.join(", ")}`);
  process.exit(1);
}

const checks = [
  ["csv parser", process.execPath, ["scripts/csv-utils.test.mjs"]],
  ["stock master", process.execPath, ["scripts/stock-master.test.mjs"]],
  ["stock master builder", process.execPath, ["scripts/build-stock-master-from-input.test.mjs"]],
  ["manual confirm helper", process.execPath, ["scripts/confirm-stock.test.mjs"]],
  ["privacy guard", process.execPath, ["scripts/privacy-check.mjs"]],
  ["listed universe", process.execPath, ["scripts/universe-check.mjs"]],
  ["universe screening", process.execPath, ["scripts/universe-screen.mjs"]],
  ["backtest timing", process.execPath, ["scripts/backtest-timing.mjs"]],
  ["sheet templates", process.execPath, ["scripts/sheet-templates.test.mjs"]],
  ["data quality", process.execPath, ["scripts/data-quality.test.mjs"]],
  ["discord notification preview", process.execPath, ["scripts/notify-discord.test.mjs"]],
  ["production readiness", process.execPath, ["scripts/production-check.test.mjs"]],
  ["pipeline", process.execPath, ["scripts/pipeline.mjs"]],
  ["pages build", process.execPath, ["scripts/build-pages.mjs"]],
];

for (const [label, command, args] of checks) {
  const result = spawnSync(command, args, { cwd: rootDir, stdio: "inherit", shell: false });
  if (result.status !== 0) {
    console.error(`${label} に失敗しました`);
    process.exit(result.status ?? 1);
  }
}

console.log("GitHub Pages公開準備OK");
