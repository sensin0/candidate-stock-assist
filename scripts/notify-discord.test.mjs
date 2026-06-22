import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const result = spawnSync(process.execPath, ["scripts/notify-discord.mjs", "--dry-run"], {
  cwd: rootDir,
  encoding: "utf8",
  env: {
    ...process.env,
    PAGES_URL: "https://example.com/candidate-stock-assist/",
  },
});

assert.equal(result.status, 0, result.stderr);
assert.match(result.stdout, /Discord通知プレビュー/);
assert.match(result.stdout, /対象銘柄数: \d+件/);
assert.match(result.stdout, /銘柄マスタ:/);
assert.match(result.stdout, /本番準備度: \d+%/);
assert.match(result.stdout, /今買い候補: \d+件/);
assert.match(result.stdout, /今日見る優先順位/);
assert.match(result.stdout, /2倍監視候補/);
assert.match(result.stdout, /通常候補への昇格確認/);
assert.match(result.stdout, /通常候補入力下書き/);
assert.match(result.stdout, /次に直す: \d+件/);
assert.match(result.stdout, /https:\/\/example\.com\/candidate-stock-assist\/reports\/latest-morning-report\.md/);
assert.match(result.stdout, /https:\/\/example\.com\/candidate-stock-assist\/reports\/latest-multibagger-candidates\.md/);
assert.match(result.stdout, /https:\/\/example\.com\/candidate-stock-assist\/reports\/latest-promotion-candidates\.md/);
assert.match(result.stdout, /https:\/\/example\.com\/candidate-stock-assist\/reports\/latest-stock-master-draft\.md/);

console.log("notify-discord-test ok");
