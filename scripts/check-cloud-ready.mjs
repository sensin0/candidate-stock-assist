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
  "app/generated-research.js",
  "app/generated-expansion-preview.js",
  "app/generated-promotion-readiness.js",
  "app/generated-hidden-gems.js",
  "scripts/update-data.mjs",
  "scripts/backtest-core.mjs",
  "scripts/backtest-timing.mjs",
  "scripts/research-universe-price-backtest.mjs",
  "scripts/analyze-multibagger-candidates.mjs",
  "scripts/build-promotion-candidates.mjs",
  "scripts/build-promotion-readiness.mjs",
  "scripts/build-hidden-gems.mjs",
  "scripts/build-stock-master-draft-from-hidden-gems.mjs",
  "scripts/build-research-data.mjs",
  "scripts/build-stock-master-draft-from-promotions.mjs",
  "scripts/build-stock-master-expanded-preview.mjs",
  "scripts/research-morning.mjs",
  "scripts/build-stock-master-from-input.mjs",
  "scripts/production-check.mjs",
  "scripts/build-pages.mjs",
  "scripts/generate-morning-report.mjs",
  "scripts/csv-utils.mjs",
  "scripts/csv-utils.test.mjs",
  "scripts/stock-master.test.mjs",
  "scripts/stock-master-draft.test.mjs",
  "scripts/stock-master-expanded-preview.test.mjs",
  "scripts/promotion-readiness.test.mjs",
  "scripts/hidden-gems.test.mjs",
  "scripts/hidden-gems-draft.test.mjs",
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
  "data/universe-price-backtest.csv",
  "data/multibagger-candidates.csv",
  "data/promotion-candidates.csv",
  "data/promotion-readiness.csv",
  "data/hidden-gems.csv",
  "data/stock-master-hidden-gems-draft.csv",
  "data/stock-master-input-draft.csv",
  "data/stock-master-expanded-preview.csv",
  "reports/latest-universe-price-backtest.md",
  "reports/latest-multibagger-candidates.md",
  "reports/latest-promotion-candidates.md",
  "reports/latest-promotion-readiness.md",
  "reports/latest-hidden-gems.md",
  "reports/latest-hidden-gems-stock-master-draft.md",
  "reports/latest-stock-master-draft.md",
  "reports/latest-stock-master-expanded-preview.md",
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(rootDir, file)));
if (missing.length) {
  console.error(`不足ファイル: ${missing.join(", ")}`);
  process.exit(1);
}

const checks = [
  ["csv parser", process.execPath, ["scripts/csv-utils.test.mjs"]],
  ["stock master", process.execPath, ["scripts/stock-master.test.mjs"]],
  ["stock master draft", process.execPath, ["scripts/stock-master-draft.test.mjs"]],
  ["stock master expanded preview", process.execPath, ["scripts/stock-master-expanded-preview.test.mjs"]],
  ["promotion readiness", process.execPath, ["scripts/promotion-readiness.test.mjs"]],
  ["hidden gems", process.execPath, ["scripts/hidden-gems.test.mjs"]],
  ["hidden gems draft", process.execPath, ["scripts/hidden-gems-draft.test.mjs"]],
  ["stock master builder", process.execPath, ["scripts/build-stock-master-from-input.test.mjs"]],
  ["manual confirm helper", process.execPath, ["scripts/confirm-stock.test.mjs"]],
  ["privacy guard", process.execPath, ["scripts/privacy-check.mjs"]],
  ["listed universe", process.execPath, ["scripts/universe-check.mjs"]],
  ["universe screening", process.execPath, ["scripts/universe-screen.mjs"]],
  ["backtest timing", process.execPath, ["scripts/backtest-timing.mjs"]],
  ["promotion candidates syntax", process.execPath, ["--check", "scripts/build-promotion-candidates.mjs"]],
  ["promotion readiness syntax", process.execPath, ["--check", "scripts/build-promotion-readiness.mjs"]],
  ["hidden gems syntax", process.execPath, ["--check", "scripts/build-hidden-gems.mjs"]],
  ["hidden gems draft syntax", process.execPath, ["--check", "scripts/build-stock-master-draft-from-hidden-gems.mjs"]],
  ["research data syntax", process.execPath, ["--check", "scripts/build-research-data.mjs"]],
  ["stock master draft syntax", process.execPath, ["--check", "scripts/build-stock-master-draft-from-promotions.mjs"]],
  ["stock master expanded preview syntax", process.execPath, ["--check", "scripts/build-stock-master-expanded-preview.mjs"]],
  ["morning research syntax", process.execPath, ["--check", "scripts/research-morning.mjs"]],
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
