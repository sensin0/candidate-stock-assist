import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(rootDir, "app");
const reportsDir = path.join(rootDir, "reports");
const distDir = path.join(rootDir, "dist");
const distAppDir = path.join(distDir, "app");
const distReportsDir = path.join(distDir, "reports");

fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(distAppDir, { recursive: true });

for (const entry of fs.readdirSync(appDir, { withFileTypes: true })) {
  const source = path.join(appDir, entry.name);
  const target = path.join(distAppDir, entry.name);
  if (entry.isDirectory()) {
    fs.cpSync(source, target, { recursive: true, force: true });
  } else {
    fs.copyFileSync(source, target);
  }
}
fs.writeFileSync(
  path.join(distDir, "index.html"),
  '<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=./app/"><title>候補銘柄アシスト</title></head><body><a href="./app/">候補銘柄アシストを開く</a></body></html>\n',
  "utf8",
);

if (fs.existsSync(reportsDir)) {
  fs.mkdirSync(distReportsDir, { recursive: true });
  for (const entry of fs.readdirSync(reportsDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    fs.copyFileSync(path.join(reportsDir, entry.name), path.join(distReportsDir, entry.name));
  }
}

fs.writeFileSync(path.join(distDir, ".nojekyll"), "", "utf8");

console.log(`Pages用ファイルを生成しました: ${distDir}`);
