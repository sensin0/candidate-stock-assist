import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const allowedMarkdown = new Set([
  "GITHUB_DEPLOY.md",
  "GOOGLE_SHEETS_SETUP.md",
  "OPERATIONS_RUNBOOK.md",
  "PRODUCTION_CHECKLIST.md",
  "README.md",
  "STOCK_MASTER_COLUMNS.md",
  "app/README.md",
  "app/latest-update-report.md",
  "reports/latest-hidden-gems.md",
  "reports/latest-hidden-gems-stock-master-draft.md",
  "reports/latest-financial-confirmation.md",
  "reports/latest-financial-confirmation-worklist.md",
  "reports/latest-financial-worklist-enrichment.md",
  "reports/latest-financial-worklist-screening.md",
  "reports/latest-financial-confirmed-input.md",
  "reports/latest-promoted-candidates.md",
  "reports/latest-auto-financial-followup.md",
  "reports/latest-universe-analysis-summary.md",
  "reports/latest-universe-financial-facts.md",
  "reports/latest-universe-financial-coverage.md",
  "reports/latest-universe-check-status.md",
  "reports/latest-universe-buy-candidates.md",
  "reports/latest-universe-buy-candidate-review.md",
  "reports/latest-production-next-steps.md",
  "reports/latest-morning-report.md",
  "reports/latest-multibagger-candidates.md",
  "reports/latest-price-refresh.md",
  "reports/latest-price-refresh-queue.md",
  "reports/latest-price-backtest.md",
  "reports/latest-promotion-candidates.md",
  "reports/latest-promotion-readiness.md",
  "reports/latest-stock-master-expanded-preview.md",
  "reports/latest-stock-master-draft.md",
  "reports/latest-universe-price-backtest.md",
  "scripts/providers/README.md",
]);
const forbiddenPathPatterns = [
  /source/i,
  /private/i,
  /book-notes/i,
  /raw/i,
  /ocr/i,
  /仕様/,
  /_\d{8}\.md$/i,
];
const maxPublicMarkdownBytes = 120_000;

const trackedFiles = gitLines(["ls-files"]);
const historyFiles = gitLines(["log", "--all", "--name-only", "--pretty=format:"]);
const problems = [
  ...checkTrackedFiles(trackedFiles),
  ...checkHistoricalPaths(historyFiles),
];

if (problems.length) {
  console.error("公開前プライバシーチェックに失敗しました");
  problems.forEach((problem) => console.error(`- ${problem}`));
  process.exit(1);
}

console.log("privacy-check ok");

function checkTrackedFiles(files) {
  const issues = [];
  for (const file of files) {
    const normalized = file.replace(/\\/g, "/");
    if (forbiddenPathPatterns.some((pattern) => pattern.test(normalized))) {
      issues.push(`非公開向けの名前が追跡されています: ${normalized}`);
    }
    if (normalized.endsWith(".md") && !allowedMarkdown.has(normalized)) {
      issues.push(`許可リスト外のMarkdownが追跡されています: ${normalized}`);
    }
    if (normalized.endsWith(".md")) {
      const size = fs.statSync(path.join(rootDir, normalized)).size;
      if (size > maxPublicMarkdownBytes) {
        issues.push(`Markdownが大きすぎます: ${normalized} ${size} bytes`);
      }
    }
  }
  return issues;
}

function checkHistoricalPaths(files) {
  const uniqueFiles = [...new Set(files.filter(Boolean).map((file) => file.replace(/\\/g, "/")))];
  return uniqueFiles
    .filter((file) => file.endsWith(".md") && !allowedMarkdown.has(file))
    .map((file) => `履歴に許可リスト外のMarkdownがあります: ${file}`);
}

function gitLines(args) {
  const result = spawnSync("git", args, { cwd: rootDir, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout);
  }
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}
