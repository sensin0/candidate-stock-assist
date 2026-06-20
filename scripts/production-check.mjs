import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const generatedDataPath = path.join(rootDir, "app", "generated-data.js");

const update = spawnSync(process.execPath, ["scripts/update-data.mjs"], {
  cwd: rootDir,
  encoding: "utf8",
});

if (update.status !== 0) {
  console.error(update.stderr || update.stdout);
  process.exit(update.status ?? 1);
}

const text = fs.readFileSync(generatedDataPath, "utf8");
const payload = parseGeneratedData(text);
const quality = payload.dataQuality;
const readiness = quality.readiness;

console.log("本番準備チェック");
console.log(`本番準備度: ${readiness.score}% ${readiness.label}`);
console.log(`対象銘柄数: ${payload.stocks.length}件`);
console.log(`株価カバレッジ: ${quality.coverage.price}`);
console.log(`EDINET相当カバレッジ: ${quality.coverage.edinet}`);
console.log(`次に直すデータ: ${quality.nextFixes.length}件`);

if (readiness.blockers.length) {
  console.log("");
  console.log("本番化の残り");
  readiness.blockers.forEach((item) => console.log(`- ${item}`));
}

if (quality.nextFixes.length) {
  console.log("");
  console.log("次に直すデータ");
  quality.nextFixes.slice(0, 8).forEach((item) => console.log(`- ${item}`));
}

if (readiness.score >= 85 && !quality.nextFixes.length) {
  console.log("");
  console.log("本番運用開始の目安を満たしています");
  process.exit(0);
}

console.log("");
console.log("まだ本番化前です。上の残り作業を埋めてください。");

function parseGeneratedData(text) {
  const match = text.match(/window\.AUTO_STOCK_DATA = ([\s\S]*);\s*$/);
  if (!match) {
    throw new Error("generated-data.js を読み取れませんでした");
  }
  return JSON.parse(match[1]);
}
