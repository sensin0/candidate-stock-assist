import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDataPath = path.join(rootDir, "app", "generated-data.js");
const watchlistPath = path.join(rootDir, "data", "watchlist.csv");
const originalWatchlist = fs.readFileSync(watchlistPath, "utf8");

try {
  fs.writeFileSync(
    watchlistPath,
    `${originalWatchlist.trim()}\n9999,監視,存在しない銘柄コードの検出テスト\n`,
    "utf8",
  );
  const result = spawnSync(process.execPath, ["scripts/update-data.mjs"], {
    cwd: rootDir,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);

  const generated = fs.readFileSync(appDataPath, "utf8");
  const payload = JSON.parse(generated.match(/window\.AUTO_STOCK_DATA = ([\s\S]*);\s*$/)[1]);
  assert.equal(payload.dataQuality.ok, false);
  assert.ok(
    payload.dataQuality.externalReferenceWarnings.some((warning) => warning.includes("9999")),
    "存在しない監視コードを検出できませんでした",
  );
  console.log("data-quality-test ok");
} finally {
  fs.writeFileSync(watchlistPath, originalWatchlist, "utf8");
  spawnSync(process.execPath, ["scripts/update-data.mjs"], {
    cwd: rootDir,
    stdio: "inherit",
  });
}
