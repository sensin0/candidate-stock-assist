import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const result = spawnSync(process.execPath, ["scripts/production-check.mjs"], {
  cwd: rootDir,
  encoding: "utf8",
});

assert.equal(result.status, 0, result.stderr);
assert.match(result.stdout, /本番準備チェック/);
assert.match(result.stdout, /本番準備度: \d+%/);
assert.match(result.stdout, /対象銘柄数: \d+件/);
assert.match(result.stdout, /株価カバレッジ:/);
assert.match(result.stdout, /EDINET相当カバレッジ:/);

console.log("production-check-test ok");
