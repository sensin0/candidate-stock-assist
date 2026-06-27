import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords, parseCsvRows } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const manifestPath = path.join(dataDir, "csv-store-manifest.json");
const reportPath = path.join(reportsDir, "latest-csv-store-audit.md");
const maxReasonableBytes = 5_000_000;

const uniqueCodeFiles = new Set([
  "listed-universe.csv",
  "stock-master.csv",
  "stock-master-input.csv",
  "stock-master-universe-promotion-draft.csv",
  "universe-metrics.csv",
  "universe-check-status.csv",
  "universe-financial-facts.csv",
  "universe-buy-candidates.csv",
  "universe-buy-candidate-review.csv",
  "price-updates.csv",
  "backtest-results.csv",
  "promotion-candidates.csv",
  "financial-confirmation-queue.csv",
  "financial-confirmation-worklist.csv",
  "financial-worklist-screened.csv",
]);

const requiredHeadersByFile = new Map([
  ["listed-universe.csv", ["code", "name", "market", "sector"]],
  ["stock-master.csv", ["code", "name", "price", "shares", "bps", "eps", "dataConfidence"]],
  ["universe-metrics.csv", ["code", "price", "bps", "eps", "shares", "asOf"]],
  ["universe-price-backtest.csv", ["code", "latestSignal", "judgement"]],
  ["universe-check-status.csv", ["code", "status", "priceStatus", "financialStatus"]],
  ["universe-buy-candidates.csv", ["code", "status", "autoBuyScore", "buyRatio", "upside"]],
  ["universe-buy-candidate-review.csv", ["code", "reviewStatus", "reasons", "cautions"]],
  ["price-updates.csv", ["code", "price", "asOf"]],
  ["backtest-results.csv", ["code", "timingLabel", "winRate", "averageReturn"]],
]);

const previousManifest = readPreviousManifest();
const files = fs.readdirSync(dataDir)
  .filter((name) => name.endsWith(".csv"))
  .sort();

const audits = files.map(auditFile);
const problems = audits.flatMap((audit) => audit.problems.map((problem) => `${audit.name}: ${problem}`));

const manifest = {
  generatedAt: new Date().toISOString(),
  totalFiles: audits.length,
  totalRows: audits.reduce((sum, audit) => sum + audit.rows, 0),
  totalBytes: audits.reduce((sum, audit) => sum + audit.bytes, 0),
  problems,
  files: audits.map(({ records, ...audit }) => audit),
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
writeReport(manifest);

console.log(`CSV監査完了: ${audits.length}ファイル / ${manifest.totalRows}行 / 問題${problems.length}件`);
console.log(path.relative(rootDir, reportPath));

if (problems.some((problem) => problem.includes("必須列なし") || problem.includes("コード重複"))) {
  process.exit(1);
}

function auditFile(name) {
  const filePath = path.join(dataDir, name);
  const text = fs.readFileSync(filePath, "utf8");
  const stat = fs.statSync(filePath);
  const rows = parseCsvRows(text);
  const headers = rows[0]?.map((value) => value.trim()) ?? [];
  const records = rows.length ? parseCsvRecords(text) : [];
  const previous = previousManifest.files?.find((file) => file.name === name);
  const problems = [];
  const warnings = [];

  if (!headers.length) problems.push("ヘッダーなし");
  if (stat.size === 0) problems.push("空ファイル");
  if (stat.size > maxReasonableBytes) warnings.push(`サイズが大きい ${stat.size} bytes`);

  const requiredHeaders = requiredHeadersByFile.get(name) ?? [];
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length) problems.push(`必須列なし ${missing.join("/")}`);

  const duplicateCodes = duplicateValues(records.map((row) => row.code).filter(Boolean));
  if (uniqueCodeFiles.has(name) && duplicateCodes.length) {
    problems.push(`コード重複 ${duplicateCodes.slice(0, 8).join("/")}`);
  }

  if (previous && previous.rows > 100 && records.length < previous.rows * 0.5) {
    warnings.push(`行数が前回から半減 ${previous.rows} -> ${records.length}`);
  }

  return {
    name,
    bytes: stat.size,
    rows: records.length,
    columns: headers.length,
    headers,
    duplicateCodes: duplicateCodes.length,
    warnings,
    problems,
    records,
  };
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function readPreviousManifest() {
  if (!fs.existsSync(manifestPath)) return { files: [] };
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    return { files: [] };
  }
}

function writeReport(manifest) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const largeFiles = manifest.files
    .filter((file) => file.bytes > 100_000)
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 12);
  const lines = [
    "# CSVストア監査",
    "",
    `生成日時: ${manifest.generatedAt}`,
    "",
    `CSVファイル: ${manifest.totalFiles}件`,
    `総行数: ${manifest.totalRows.toLocaleString("ja-JP")}行`,
    `総サイズ: ${formatBytes(manifest.totalBytes)}`,
    `問題: ${manifest.problems.length}件`,
    "",
    "## 判定",
    "",
    manifest.problems.length
      ? "- CSV管理は継続できますが、下の問題を先に直してください。"
      : "- 現時点ではCSV管理を継続して問題ありません。件数は軽量で、監査可能です。",
    "- ただし、データ量が数十MBを超える、履歴を長期保持する、複数人が同時更新する段階ではDB移行を検討します。",
    "",
    "## 問題",
    "",
    ...(manifest.problems.length ? manifest.problems.map((problem) => `- ${problem}`) : ["- なし"]),
    "",
    "## 大きいCSV",
    "",
    ...largeFiles.map((file) => `- ${file.name}: ${file.rows.toLocaleString("ja-JP")}行 / ${formatBytes(file.bytes)}`),
    "",
    "## 全CSV",
    "",
    ...manifest.files.map((file) =>
      `- ${file.name}: ${file.rows.toLocaleString("ja-JP")}行 / ${file.columns}列 / ${formatBytes(file.bytes)}${file.warnings.length ? ` / 注意: ${file.warnings.join(" / ")}` : ""}`
    ),
  ];
  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

function formatBytes(bytes) {
  if (bytes >= 1_000_000) return `${Math.round(bytes / 10_000) / 100}MB`;
  if (bytes >= 1_000) return `${Math.round(bytes / 10) / 100}KB`;
  return `${bytes}B`;
}
