import { spawnSync } from "node:child_process";

const steps = [
  ["データ更新", "node", ["scripts/update-data.mjs"]],
  ["画面ロジック構文チェック", "node", ["--check", "app/app.js"]],
  ["更新ジョブ構文チェック", "node", ["--check", "scripts/update-data.mjs"]],
  ["画面スモークテスト", "node", ["app/smoke-test.mjs"]],
  ["朝レポート生成", "node", ["scripts/generate-morning-report.mjs"]],
];

for (const [label, command, args] of steps) {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    console.error(`\n${label} に失敗しました`);
    process.exit(result.status ?? 1);
  }
}

console.log("\n一気通貫パイプライン完了");
