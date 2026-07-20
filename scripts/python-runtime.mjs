import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

let cachedPython = null;

export function pythonExecutable() {
  if (cachedPython) return cachedPython;
  const candidates = [
    process.env.PYTHON,
    "python",
    "python3",
    path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate.includes(path.sep) && !fs.existsSync(candidate)) continue;
    const result = spawnSync(candidate, ["--version"], { encoding: "utf8", shell: false });
    if (result.status === 0) {
      cachedPython = candidate;
      return cachedPython;
    }
  }

  throw new Error("Python executable was not found. Set PYTHON to a usable Python path.");
}
