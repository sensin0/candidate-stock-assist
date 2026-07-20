import { spawnSync } from "node:child_process";
import { pythonExecutable } from "./python-runtime.mjs";

const result = spawnSync(pythonExecutable(), ["scripts/build_sqlite_store.py"], {
  stdio: "inherit",
  shell: false,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
