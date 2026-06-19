import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredFiles = [
  "package.json",
  "README.md",
  ".gitignore",
  ".github/workflows/morning-pages.yml",
  "app/index.html",
  "app/app.js",
  "app/styles.css",
  "scripts/update-data.mjs",
  "scripts/build-pages.mjs",
  "scripts/generate-morning-report.mjs",
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
