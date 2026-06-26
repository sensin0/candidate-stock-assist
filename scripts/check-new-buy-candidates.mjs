import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(rootDir, "reports", "latest-morning-report.md");
const stateDir = path.join(rootDir, ".notification-state");
const statePath = path.join(stateDir, "buy-candidates.json");
const outputPath = process.env.GITHUB_OUTPUT;
const notifyInitial = process.env.NOTIFY_INITIAL_BUY === "1";

if (!fs.existsSync(reportPath)) {
  console.error("朝レポートが見つかりません");
  process.exit(1);
}

const current = extractBuyCandidates(fs.readFileSync(reportPath, "utf8"));
const previous = readPreviousState();
const previousCodes = new Set(previous.candidates.map((candidate) => candidate.code));
const newCandidates = current.filter((candidate) => !previousCodes.has(candidate.code));
const hasBaseline = previous.exists;
const shouldNotify = newCandidates.length > 0 && (hasBaseline || notifyInitial);

fs.mkdirSync(stateDir, { recursive: true });
fs.writeFileSync(statePath, `${JSON.stringify({
  updatedAt: new Date().toISOString(),
  candidates: current,
}, null, 2)}\n`, "utf8");

const outputs = {
  has_new: shouldNotify ? "true" : "false",
  new_count: String(shouldNotify ? newCandidates.length : 0),
  current_count: String(current.length),
  new_codes: shouldNotify ? newCandidates.map((candidate) => candidate.code).join(",") : "",
  reason: reasonText({ hasBaseline, current, newCandidates, shouldNotify }),
};

writeOutputs(outputs);

console.log(`今買い候補: ${current.length}件`);
console.log(`新規今買い候補: ${outputs.new_count}件`);
console.log(outputs.reason);

function extractBuyCandidates(report) {
  const section = report.match(/## 今買い候補\n([\s\S]*?)(\n## |$)/);
  if (!section || section[1].includes("該当なし")) return [];
  return section[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => {
      const body = line.replace(/^- /, "");
      const match = body.match(/^([0-9A-Z]+)\s+([^:]+):\s*(.*)$/);
      if (!match) return null;
      return {
        code: match[1],
        name: match[2].trim(),
        summary: match[3].trim(),
      };
    })
    .filter(Boolean);
}

function readPreviousState() {
  if (!fs.existsSync(statePath)) return { exists: false, candidates: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(statePath, "utf8"));
    return {
      exists: true,
      candidates: Array.isArray(parsed.candidates) ? parsed.candidates : [],
    };
  } catch {
    return { exists: false, candidates: [] };
  }
}

function reasonText({ hasBaseline, current, newCandidates, shouldNotify }) {
  if (shouldNotify) {
    return `前回から新しい今買い候補が${newCandidates.length}件増えました: ${newCandidates.map((candidate) => `${candidate.code} ${candidate.name}`).join(" / ")}`;
  }
  if (!hasBaseline) {
    return `初回の基準を保存しました。今買い候補${current.length}件は次回以降の比較対象になります。`;
  }
  if (!newCandidates.length) {
    return "新しい今買い候補はありません。Discord通知は送らない状態です。";
  }
  return "Discord通知は送らない状態です。";
}

function writeOutputs(outputs) {
  if (outputPath) {
    fs.appendFileSync(outputPath, Object.entries(outputs).map(([key, value]) => `${key}=${escapeOutput(value)}`).join("\n") + "\n", "utf8");
  }
}

function escapeOutput(value) {
  return String(value).replaceAll("%", "%25").replaceAll("\n", "%0A").replaceAll("\r", "%0D");
}
