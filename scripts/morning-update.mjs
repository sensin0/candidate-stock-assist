import { spawnSync } from "node:child_process";

const steps = [
  ["一気通貫パイプライン", "node", ["scripts/pipeline.mjs"]],
];

for (const [label, command, args] of steps) {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    console.error(`\n${label} に失敗しました`);
    process.exit(result.status ?? 1);
  }
}

console.log("\n朝更新が完了しました");
