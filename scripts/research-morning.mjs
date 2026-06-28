import { spawnSync } from "node:child_process";

process.env.UNIVERSE_BACKTEST_LIMIT ??= "3728";
process.env.UNIVERSE_BACKTEST_CONCURRENCY ??= "8";
process.env.UNIVERSE_FINANCIAL_FETCH_LIMIT ??= "3728";
process.env.UNIVERSE_FINANCIAL_FETCH_CONCURRENCY ??= "8";
process.env.FINANCIAL_WORKLIST_LIMIT ??= "120";
process.env.FINANCIAL_ENRICH_LIMIT ??= "120";
process.env.FINANCIAL_ENRICH_CONCURRENCY ??= "6";

const steps = [
  ["日本株価格バックテスト", "scripts/research-universe-price-backtest.mjs"],
  ["日本株全体財務データ取得", "scripts/refresh-universe-financial-facts.mjs"],
  ["日本株財務メトリクス範囲更新", "scripts/build-universe-metrics.mjs"],
  ["日本株全体チェック状態生成", "scripts/build-universe-check-status.mjs"],
  ["全体自動買い候補予備軍生成", "scripts/build-universe-buy-candidates.mjs"],
  ["全体自動買い候補の昇格判定", "scripts/review-universe-buy-candidates.mjs"],
  ["短い価格履歴の自動補完", "scripts/refresh-short-history.mjs"],
  ["自動昇格候補を含めた株価更新", "scripts/refresh-price-updates.mjs"],
  ["自動昇格候補を含めたバックテスト", "scripts/backtest-timing.mjs"],
  ["自動昇格候補を通常候補データへ反映", "scripts/update-data.mjs"],
  ["2倍候補調査", "scripts/analyze-multibagger-candidates.mjs"],
  ["通常候補への昇格候補抽出", "scripts/build-promotion-candidates.mjs"],
  ["通常候補入力下書き生成", "scripts/build-stock-master-draft-from-promotions.mjs"],
  ["通常候補追加プレビュー生成", "scripts/build-stock-master-expanded-preview.mjs"],
  ["通常候補への昇格準備チェック生成", "scripts/build-promotion-readiness.mjs"],
  ["未発掘候補生成", "scripts/build-hidden-gems.mjs"],
  ["未発掘から通常候補入力下書き生成", "scripts/build-stock-master-draft-from-hidden-gems.mjs"],
  ["財務確認キュー生成", "scripts/build-financial-confirmation-queue.mjs"],
  ["財務確認ワークシート生成", "scripts/build-financial-confirmation-worklist.mjs"],
  ["財務確認ワークシート自動入力補助", "scripts/enrich-financial-worklist.mjs"],
  ["財務確認候補スクリーニング", "scripts/screen-financial-worklist.mjs"],
  ["財務確認ワークシート反映", "scripts/apply-financial-worklist.mjs"],
  ["確認済み候補の通常候補自動反映", "scripts/promote-confirmed-candidates.mjs", ["--write"]],
  ["昇格後の株価再更新", "scripts/refresh-price-updates.mjs"],
  ["昇格後のバックテスト再更新", "scripts/backtest-timing.mjs"],
  ["昇格後の通常候補データ再生成", "scripts/update-data.mjs"],
  ["自動財務確認の後追い確認レポート生成", "scripts/build-auto-financial-followup.mjs"],
  ["画面用調査データ生成", "scripts/build-research-data.mjs"],
  ["日本株全体分析サマリー生成", "scripts/build-universe-analysis-summary.mjs"],
  ["CSVストア監査", "scripts/audit-csv-store.mjs"],
  ["SQLiteストア生成", "scripts/run-sqlite-store.mjs"],
  ["本番化残作業レポート生成", "scripts/build-production-next-steps.mjs"],
];

for (const [label, script, args = []] of steps) {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(process.execPath, [script, ...args], {
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
