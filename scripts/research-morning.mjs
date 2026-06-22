import { spawnSync } from "node:child_process";

process.env.UNIVERSE_BACKTEST_LIMIT ??= "3728";
process.env.UNIVERSE_BACKTEST_CONCURRENCY ??= "8";

const steps = [
  ["日本株価格バックテスト", "scripts/research-universe-price-backtest.mjs"],
  ["2倍候補調査", "scripts/analyze-multibagger-candidates.mjs"],
  ["通常候補への昇格候補抽出", "scripts/build-promotion-candidates.mjs"],
  ["通常候補入力下書き生成", "scripts/build-stock-master-draft-from-promotions.mjs"],
  ["通常候補追加プレビュー生成", "scripts/build-stock-master-expanded-preview.mjs"],
  ["通常候補への昇格準備チェック生成", "scripts/build-promotion-readiness.mjs"],
  ["未発掘候補生成", "scripts/build-hidden-gems.mjs"],
  ["画面用調査データ生成", "scripts/build-research-data.mjs"],
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
