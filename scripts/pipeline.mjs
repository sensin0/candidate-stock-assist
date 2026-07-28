import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pythonExecutable } from "./python-runtime.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const steps = [
  ["全体自動買い候補の昇格判定", "node", ["scripts/review-universe-buy-candidates.mjs"]],
  ["短い価格履歴の自動補完", "node", ["scripts/refresh-short-history.mjs"]],
  ["株価自動更新", "node", ["scripts/refresh-price-updates.mjs"]],
  ["バックテスト更新", "node", ["scripts/backtest-timing.mjs"]],
  ["通常候補追加プレビュー生成", "node", ["scripts/build-stock-master-expanded-preview.mjs"]],
  ["データ更新", "node", ["scripts/update-data.mjs"]],
  ["株価更新キュー生成", "node", ["scripts/build-price-refresh-queue.mjs"]],
  ["価格検証キュー生成", "node", ["scripts/build-price-validation-queue.mjs"]],
  ["SQLiteストア生成", pythonExecutable(), ["scripts/build_sqlite_store.py"]],
  ["画面用調査データ生成", "node", ["scripts/build-research-data.mjs"]],
  ["CSVストア監査", "node", ["scripts/audit-csv-store.mjs"]],
  ["月次シグナルバックテスト", pythonExecutable(), ["scripts/monthly_signal_backtest.py"]],
  ["本番化残作業レポート生成", "node", ["scripts/build-production-next-steps.mjs"]],
  ["画面ロジック構文チェック", "node", ["--check", "app/app.js"]],
  ["更新ジョブ構文チェック", "node", ["--check", "scripts/update-data.mjs"]],
  ["画面スモークテスト", "node", ["app/smoke-test.mjs"]],
  ["朝レポート生成", "node", ["scripts/generate-morning-report.mjs"]],
];

for (const [label, command, args] of steps) {
  console.log(`\n== ${label} ==`);
  const result = runWithRetry(label, command, args);
  if (result !== 0) {
    console.error(`\n${label} に失敗しました`);
    process.exit(result ?? 1);
  }
}

console.log("\n一気通貫パイプライン完了");

function runWithRetry(label, command, args, attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const result = spawnSync(command, args, { cwd: rootDir, stdio: "inherit", shell: false });
    if (result.status === 0) return 0;
    if (attempt < attempts) {
      console.warn(`${label} を再試行します (${attempt + 1}/${attempts})`);
      sleep(750 * attempt);
    } else {
      return result.status ?? 1;
    }
  }
  return 1;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
