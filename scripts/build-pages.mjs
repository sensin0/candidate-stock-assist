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
  rootIndexHtml(),
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

function rootIndexHtml() {
  return fs.readFileSync(path.join(appDir, "index.html"), "utf8")
    .replaceAll('href="./styles.css"', 'href="./app/styles.css"')
    .replaceAll('src="./generated-data.js"', 'src="./app/generated-data.js"')
    .replaceAll('src="./generated-research.js"', 'src="./app/generated-research.js"')
    .replaceAll('src="./generated-expansion-preview.js"', 'src="./app/generated-expansion-preview.js"')
    .replaceAll('src="./generated-promotion-readiness.js"', 'src="./app/generated-promotion-readiness.js"')
    .replaceAll('src="./generated-hidden-gems.js"', 'src="./app/generated-hidden-gems.js"')
    .replaceAll('src="./generated-hidden-gems-draft.js"', 'src="./app/generated-hidden-gems-draft.js"')
    .replaceAll('src="./generated-financial-confirmation.js"', 'src="./app/generated-financial-confirmation.js"')
    .replaceAll('src="./generated-financial-screening.js"', 'src="./app/generated-financial-screening.js"')
    .replaceAll('src="./app.js"', 'src="./app/app.js"')
    .replaceAll('href="../reports/', 'href="./reports/');
}
