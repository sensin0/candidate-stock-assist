import { spawnSync } from "node:child_process";

process.env.UNIVERSE_BACKTEST_LIMIT ??= "3728";
process.env.UNIVERSE_BACKTEST_CONCURRENCY ??= "8";

const steps = [
  ["日本株価格バックテスト", "scripts/research-universe-price-backtest.mjs"],
  ["2倍候補調査", "scripts/analyze-multibagger-candidates.mjs"],
];

for (const [label, script] of steps) {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(process.execPath, [script], {
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.status !== 0) {
    console.warn(`${label} に失敗しました。既存レポートがあればそれを使って継続します。`);
    process.exit(0);
  }
}

console.log("\n調査レポート更新完了");
