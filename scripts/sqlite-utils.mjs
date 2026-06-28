import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultDbPath = path.join(rootDir, "data", "candidate-stock-assist.sqlite");

export function sqliteAvailable(dbPath = defaultDbPath) {
  return fs.existsSync(dbPath);
}

export function sqliteFreshFor(inputPaths, dbPath = defaultDbPath) {
  if (!sqliteAvailable(dbPath)) return false;
  const dbMtime = fs.statSync(dbPath).mtimeMs;
  return inputPaths
    .filter((inputPath) => fs.existsSync(inputPath))
    .every((inputPath) => fs.statSync(inputPath).mtimeMs <= dbMtime);
}

export function querySqlite(sql, params = [], dbPath = defaultDbPath) {
  if (!sqliteAvailable(dbPath)) return [];
  const runner = `
import json
import sqlite3
import sys

payload = json.loads(sys.stdin.read())
conn = sqlite3.connect(payload["dbPath"])
conn.row_factory = sqlite3.Row
rows = conn.execute(payload["sql"], payload.get("params", [])).fetchall()
print(json.dumps([dict(row) for row in rows], ensure_ascii=False))
conn.close()
`;
  const result = spawnSync("python", ["-c", runner], {
    input: JSON.stringify({ dbPath, sql, params }),
    encoding: "utf8",
    shell: false,
    env: { ...process.env, PYTHONUTF8: "1" },
    maxBuffer: 1024 * 1024 * 128,
  });
  if (result.status !== 0) {
    throw new Error(`SQLite query failed: ${result.stderr || result.stdout}`);
  }
  return JSON.parse(result.stdout || "[]");
}

export function tableRows(tableName, dbPath = defaultDbPath) {
  if (!/^[A-Za-z0-9_]+$/.test(tableName)) {
    throw new Error(`Invalid SQLite table name: ${tableName}`);
  }
  return querySqlite(`SELECT * FROM "${tableName}"`, [], dbPath);
}
