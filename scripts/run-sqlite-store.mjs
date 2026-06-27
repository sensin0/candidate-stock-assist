import { spawnSync } from "node:child_process";

const result = spawnSync("python", ["scripts/build_sqlite_store.py"], {
  stdio: "inherit",
  shell: false,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
