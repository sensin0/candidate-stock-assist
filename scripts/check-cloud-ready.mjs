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
  ".gitignore",
  ".github/workflows/morning-pages.yml",
  "app/index.html",
  "app/app.js",
  "app/styles.css",
  "scripts/update-data.mjs",
  "scripts/build-pages.mjs",
  "scripts/generate-morning-report.mjs",
  "scripts/csv-utils.mjs",
  "scripts/csv-utils.test.mjs",
  "scripts/stock-master.test.mjs",
  "scripts/data-quality.test.mjs",
  "scripts/sheet-templates.test.mjs",
  "scripts/notify-discord.test.mjs",
  "GOOGLE_SHEETS_SETUP.md",
  "sheet-templates/stock-master.csv",
  "sheet-templates/price-updates.csv",
  "sheet-templates/disclosures.csv",
  "sheet-templates/edinet-facts.csv",
  "sheet-templates/watchlist.csv",
  "data/stock-master.csv",
  "data/price-updates.csv",
  "data/disclosures.csv",
  "data/edinet-facts.csv",
  "data/watchlist.csv",
  "scripts/providers/watchlist-provider.mjs",
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(rootDir, file)));
if (missing.length) {
  console.error(`不足ファイル: ${missing.join(", ")}`);
  process.exit(1);
}

const checks = [
  ["csv parser", process.execPath, ["scripts/csv-utils.test.mjs"]],
  ["stock master", process.execPath, ["scripts/stock-master.test.mjs"]],
  ["sheet templates", process.execPath, ["scripts/sheet-templates.test.mjs"]],
  ["data quality", process.execPath, ["scripts/data-quality.test.mjs"]],
  ["discord notification preview", process.execPath, ["scripts/notify-discord.test.mjs"]],
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
