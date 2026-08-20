import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(rootDir, "reports", "latest-morning-report.md");
const universeBuyCandidatesReportPath = path.join(rootDir, "reports", "latest-universe-buy-candidates.md");
const autoFinancialFollowupReportPath = path.join(rootDir, "reports", "latest-auto-financial-followup.md");
const generatedDataPath = path.join(rootDir, "app", "generated-data.js");
const generatedResearchPath = path.join(rootDir, "app", "generated-research.js");
const stateDir = path.join(rootDir, ".notification-state");
const statePath = path.join(stateDir, "buy-candidates.json");
const outputPath = process.env.GITHUB_OUTPUT;
const notifyInitial = process.env.NOTIFY_INITIAL_BUY === "1";

if (!fs.existsSync(reportPath)) {
  console.error("朝レポートが見つかりません");
  process.exit(1);
}

const report = fs.readFileSync(reportPath, "utf8");
const universeBuyCandidatesReport = readText(universeBuyCandidatesReportPath);
const autoFinancialFollowupReport = readText(autoFinancialFollowupReportPath);
const generatedPayload = parseGeneratedData(readText(generatedDataPath));
const researchPayload = parseGeneratedData(readText(generatedResearchPath), "AUTO_RESEARCH_DATA");
const current = extractBuyLikeCandidates({ report, universeBuyCandidatesReport, autoFinancialFollowupReport });
const growthBuyCandidates = extractGrowthBuyCandidates({
  report,
  universeBuyCandidatesReport,
  autoFinancialFollowupReport,
  generatedPayload,
  researchPayload,
});
const previous = readPreviousState();
const previousGrowthKeys = new Set((previous.growthBuyCandidates ?? previous.candidates ?? []).map(candidateKey));
const newCandidates = growthBuyCandidates.filter((candidate) => !previousGrowthKeys.has(candidateKey(candidate)));
const hasBaseline = previous.exists;
const shouldNotify = newCandidates.length > 0 && (hasBaseline || notifyInitial);

fs.mkdirSync(stateDir, { recursive: true });
fs.writeFileSync(statePath, `${JSON.stringify({
  updatedAt: new Date().toISOString(),
  candidates: current,
  growthBuyCandidates,
}, null, 2)}\n`, "utf8");

const outputs = {
  has_new: shouldNotify ? "true" : "false",
  new_count: String(shouldNotify ? newCandidates.length : 0),
  current_count: String(current.length),
  growth_buy_count: String(growthBuyCandidates.length),
  new_codes: shouldNotify ? newCandidates.map((candidate) => candidate.code).join(",") : "",
  reason: reasonText({ hasBaseline, current, newCandidates, shouldNotify }),
};

writeOutputs(outputs);

console.log(`買い系候補: ${current.length}件`);
console.log(`売上+20%買い系候補: ${growthBuyCandidates.length}件`);
console.log(`新規売上+20%買い系候補: ${outputs.new_count}件`);
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

function extractBuyLikeCandidates({ report, universeBuyCandidatesReport, autoFinancialFollowupReport }) {
  const candidates = new Map();
  for (const [text, title] of [
    [report, "今買い候補"],
    [report, "今日見る優先順位"],
    [report, "自動財務確認・後追い確認"],
    [universeBuyCandidatesReport, "予備軍上位"],
    [autoFinancialFollowupReport, "買い場接近"],
  ]) {
    for (const item of firstReportCandidateItems(text, title, 200)) {
      if (isBuyLikeText(item.summary)) addCandidate(candidates, item, title);
    }
  }
  return [...candidates.values()].sort((a, b) => buyPriority(b) - buyPriority(a) || a.code.localeCompare(b.code));
}

function extractGrowthBuyCandidates({ report, universeBuyCandidatesReport, autoFinancialFollowupReport, generatedPayload, researchPayload }) {
  const candidates = new Map();
  const buySections = [
    [report, "今買い候補"],
    [report, "今日見る優先順位"],
    [report, "自動財務確認・後追い確認"],
    [universeBuyCandidatesReport, "予備軍上位"],
    [autoFinancialFollowupReport, "買い場接近"],
  ];

  for (const [text, title] of buySections) {
    for (const item of firstReportCandidateItems(text, title, 200)) {
      if (isBuyLikeText(item.summary) && hasSalesGrowthSignal(item.summary)) addCandidate(candidates, item, title);
    }
  }

  for (const stock of generatedPayload?.stocks ?? []) {
    if (isBuyLikeText([stock.assist?.label, stock.status, stock.backtest?.timingLabel, stock.action, stock.comment].join(" ")) && hasSalesGrowthSignal(stock)) {
      addCandidate(candidates, generatedCandidate(stock), "通常候補");
    }
  }

  for (const item of [
    ...(researchPayload?.autoBuyCandidates ?? []),
    ...(researchPayload?.universeBuyCandidates ?? []),
    ...(researchPayload?.universeAll ?? []),
  ]) {
    if (isBuyLikeText([item.signal, item.status, item.timingAction, item.action, item.comment].join(" ")) && hasSalesGrowthSignal(item)) {
      addCandidate(candidates, generatedCandidate(item), "全体自動判定");
    }
  }

  return [...candidates.values()].sort((a, b) => buyPriority(b) - buyPriority(a) || growthValue(b) - growthValue(a) || a.code.localeCompare(b.code));
}

function firstReportCandidateItems(text, title, limit = 3) {
  const match = text.match(new RegExp(`## ${title}\\n([\\s\\S]*?)(\\n## |$)`));
  if (!match || match[1].includes("該当なし")) return [];
  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .slice(0, limit)
    .map((line) => reportCandidate(line.replace(/^- /, "")))
    .filter(Boolean);
}

function reportCandidate(body) {
  const ranked = body.match(/^(?:\d+\.\s*)?([0-9A-Z]+)\s+([^:]+):\s*(.*)$/);
  if (!ranked) return null;
  const summary = ranked[3].trim();
  return {
    code: ranked[1],
    name: ranked[2].trim(),
    summary,
    salesGrowth: extractSalesGrowthPercent(summary),
  };
}

function generatedCandidate(item) {
  return {
    code: String(item.code ?? ""),
    name: String(item.name ?? item.sourceName ?? ""),
    summary: [
      item.assist?.label,
      item.status,
      item.signal,
      item.timingAction,
      item.action,
      salesGrowthText(item),
    ].filter(Boolean).join(" / "),
    salesGrowth: salesGrowthValue(item),
  };
}

function hasSalesGrowthSignal(value) {
  const salesGrowth = salesGrowthValue(value);
  if (Number.isFinite(salesGrowth) && salesGrowth >= 20) return true;
  return extractSalesGrowthPercent(flattenText(value)) >= 20;
}

function salesGrowthValue(value) {
  if (!value || typeof value !== "object") return NaN;
  for (const key of [
    "salesGrowth",
    "salesGrowthRate",
    "revenueGrowth",
    "revenueGrowthRate",
    "quarterlySalesGrowth",
    "latestSalesGrowth",
    "salesYoY",
    "revenueYoY",
  ]) {
    const number = Number(value[key]);
    if (Number.isFinite(number)) return number;
  }
  return NaN;
}

function salesGrowthText(item) {
  const value = salesGrowthValue(item);
  return Number.isFinite(value) ? `売上高+${round(value)}%` : "";
}

function extractSalesGrowthPercent(text) {
  const normalized = normalizeNumberText(text).replace(/\s+/g, "");
  const patterns = [
    /(?:売上高|売上|増収|revenue|sales)(?:前年比|前年同期比|YoY|yoy|が|は|:|：|[+＋]){0,4}(-?\d+(?:\.\d+)?)%以上?/i,
    /(?:売上高|売上|増収|revenue|sales)(?:前年比|前年同期比|YoY|yoy|が|は|:|：|[+＋]){0,4}(-?\d+(?:\.\d+)?)%/i,
    /[+＋](-?\d+(?:\.\d+)?)%以上?(?:の)?(?:売上高|売上|増収|revenue|sales)/i,
    /[+＋](-?\d+(?:\.\d+)?)%(?:の)?(?:売上高|売上|増収|revenue|sales)/i,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) return Number(match[1]);
  }
  return NaN;
}

function normalizeNumberText(value) {
  return String(value ?? "")
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[％]/g, "%")
    .replace(/[．]/g, ".");
}

function isBuyLikeText(text) {
  return /今買い|買い場|買い候補|押し目買い|安値反転|上昇タイミング|自動今買い|自動買い/.test(String(text ?? ""));
}

function addCandidate(candidates, candidate, source) {
  if (!candidate?.code) return;
  const key = candidateKey(candidate);
  const current = candidates.get(key);
  const next = {
    ...candidate,
    source,
    summary: candidate.summary || source,
  };
  if (!current || buyPriority(next) > buyPriority(current) || growthValue(next) > growthValue(current)) {
    candidates.set(key, next);
  }
}

function candidateKey(candidate) {
  return String(candidate?.code ?? "");
}

function buyPriority(candidate) {
  const text = `${candidate?.summary ?? ""} ${candidate?.source ?? ""}`;
  if (/今買い/.test(text)) return 4;
  if (/買い場/.test(text)) return 3;
  if (/押し目買い|安値反転/.test(text)) return 2;
  if (/買い候補|自動買い/.test(text)) return 1;
  return 0;
}

function growthValue(candidate) {
  return Number.isFinite(Number(candidate?.salesGrowth)) ? Number(candidate.salesGrowth) : extractSalesGrowthPercent(candidate?.summary);
}

function flattenText(value) {
  if (value == null) return "";
  if (typeof value !== "object") return String(value);
  return Object.values(value).map((entry) => typeof entry === "object" ? flattenText(entry) : String(entry ?? "")).join(" ");
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

function parseGeneratedData(text, name = "AUTO_STOCK_DATA") {
  const match = text.match(new RegExp(`window\\.${name} = ([\\s\\S]*);\\s*$`));
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function round(value) {
  return Math.round(Number(value) * 10) / 10;
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
    return `前回から新しい売上+20%買い系候補が${newCandidates.length}件増えました: ${newCandidates.map((candidate) => `${candidate.code} ${candidate.name}`).join(" / ")}`;
  }
  if (!hasBaseline) {
    return `初回の基準を保存しました。買い系候補${current.length}件と売上+20%候補は次回以降の比較対象になります。`;
  }
  if (!newCandidates.length) {
    return "新しい売上+20%買い系候補はありません。Discord通知は送らない状態です。";
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
