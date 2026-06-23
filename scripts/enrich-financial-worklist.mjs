import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const worklistPath = path.join(dataDir, "financial-confirmation-worklist.csv");
const outputReportPath = path.join(reportsDir, "latest-financial-worklist-enrichment.md");
const limit = Number(process.env.FINANCIAL_ENRICH_LIMIT || 30);
const concurrency = Number(process.env.FINANCIAL_ENRICH_CONCURRENCY || 3);

const rows = readCsv(worklistPath);
const targets = rows
  .filter((row) => row.confirmed !== "true")
  .filter((row) => missingCoreFields(row))
  .slice(0, limit);

const enriched = await mapLimit(targets, concurrency, async (row) => {
  const result = await fetchIrbankMetrics(row.code).catch((error) => ({ ok: false, error: error.message }));
  return { row, result };
});

const byCode = new Map(enriched.map((item) => [item.row.code, item.result]));
const outputRows = rows.map((row) => applySuggestion(row, byCode.get(row.code)));

fs.writeFileSync(worklistPath, toCsv(outputRows), "utf8");
writeReport(enriched);

const okCount = enriched.filter((item) => item.result.ok).length;
console.log(`財務確認ワークシートを自動補助しました: ${okCount}/${targets.length}件`);
console.log(path.relative(rootDir, outputReportPath));

function missingCoreFields(row) {
  return !row.checkedShares || !row.checkedCash || !row.checkedInterestDebt || !row.checkedNetAssets || !row.checkedBps || !row.checkedEps;
}

function applySuggestion(row, result) {
  if (!result?.ok) return row;
  return {
    ...row,
    status: row.status === "入力待ち" ? "自動入力・要確認" : row.status,
    checkedShares: row.checkedShares || result.shares,
    checkedTreasuryShares: row.checkedTreasuryShares || "0",
    checkedCash: row.checkedCash || result.cash,
    checkedSecurities: row.checkedSecurities || "0",
    checkedInvestmentSecurities: row.checkedInvestmentSecurities || "0",
    checkedInterestDebt: row.checkedInterestDebt || result.interestDebt,
    checkedNetAssets: row.checkedNetAssets || result.netAssets,
    checkedRentalBook: row.checkedRentalBook || "0",
    checkedRentalMarket: row.checkedRentalMarket || "0",
    checkedBps: row.checkedBps || result.bps,
    checkedEps: row.checkedEps || result.eps,
    sourceUrl: row.sourceUrl || result.sourceUrl,
    memo: `${row.memo || "財務確認"} / IRBANK自動入力: ${result.period}。確認後にconfirmedとqualitativeDoneをtrue`,
  };
}

async function fetchIrbankMetrics(code) {
  const sourceUrl = `https://irbank.net/${encodeURIComponent(code)}/results`;
  const response = await fetch(sourceUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  const html = await response.text();
  const bps = latestMetric(html, "BPS", "number");
  const eps = latestMetric(html, "EPS", "number");
  const netAssets = latestMetric(html, "純資産", "money");
  const interestDebt = latestMetric(html, "有利子負債", "money");
  const cash = latestMetric(html, "現金等", "money");
  const period = bps.period || eps.period || netAssets.period || cash.period || "";
  const shares = bps.value > 0 && netAssets.value > 0
    ? Math.round((netAssets.value * 1_000_000) / bps.value)
    : 0;
  if (!bps.value || !netAssets.value || !shares) throw new Error("BPS、純資産、株数推定が不足");
  return {
    ok: true,
    period,
    sourceUrl,
    shares,
    bps: round(bps.value),
    eps: round(eps.value),
    netAssets: round(netAssets.value),
    interestDebt: round(interestDebt.value),
    cash: round(cash.value),
  };
}

function latestMetric(html, title, type) {
  const block = metricBlock(html, title);
  const matches = [...block.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>[\s\S]*?<span class="text">([\s\S]*?)<\/span>/g)];
  const parsed = matches
    .map((match) => ({
      period: stripTags(match[1]).match(/\d{4}\/\d{2}/)?.[0] ?? "",
      value: type === "money" ? parseJapaneseMoney(stripTags(match[2])) : parseNumber(stripTags(match[2])),
    }))
    .filter((item) => item.period && Number.isFinite(item.value));
  return parsed.at(-1) ?? { period: "", value: 0 };
}

function metricBlock(html, title) {
  const sections = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2><dl class="gdl">([\s\S]*?)<\/dl>/g)];
  const section = sections.find((match) => stripTags(match[1]).replace(/#\d+|\*/g, "").trim() === title);
  return section?.[2] ?? "";
}

function parseJapaneseMoney(text) {
  const value = text.replace(/,/g, "").trim();
  if (!value || value === "-") return 0;
  if (value.includes("億")) {
    const [okuText, restText = ""] = value.split("億");
    return round(parseNumber(okuText) * 100 + (restText.includes("万") ? parseNumber(restText.replace("万", "")) / 100 : 0));
  }
  if (value.includes("百万")) return round(parseNumber(value.replace("百万", "")));
  if (value.includes("万")) return round(parseNumber(value.replace("万", "")) / 100);
  return parseNumber(value);
}

function parseNumber(text) {
  const normalized = text.replace(/,/g, "").replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stripTags(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&thinsp;|&nbsp;/g, "")
    .replace(/&amp;/g, "&")
    .trim();
}

async function mapLimit(items, size, mapper) {
  const results = [];
  let cursor = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function writeReport(items) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const lines = [
    "# 財務確認ワークシート 自動入力補助",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    "IRBANKの公開ページから、BPS、EPS、純資産、有利子負債、現金等をワークシートに仮入力しました。",
    "これは確認補助であり、通常候補へ昇格するには内容を見て `confirmed` と `qualitativeDone` を `true` にする必要があります。",
    "",
    `対象: ${items.length}件`,
    `自動入力成功: ${items.filter((item) => item.result.ok).length}件`,
    "",
    "## 結果",
    "",
    ...items.map((item, index) => reportLine(item, index)),
  ];
  fs.writeFileSync(outputReportPath, `${lines.join("\n")}\n`, "utf8");
}

function reportLine(item, index) {
  const { row, result } = item;
  if (!result.ok) return `- ${index + 1}. ${row.code} ${row.name}: 取得失敗 / ${result.error}`;
  return `- ${index + 1}. ${row.code} ${row.name}: ${result.period} / BPS ${result.bps} / EPS ${result.eps} / 純資産 ${result.netAssets}百万円 / 現金等 ${result.cash}百万円 / 有利子負債 ${result.interestDebt}百万円`;
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function toCsv(items) {
  const headers = [
    "priorityRank",
    "code",
    "name",
    "sector",
    "source",
    "status",
    "price",
    "checkedShares",
    "checkedTreasuryShares",
    "checkedCash",
    "checkedSecurities",
    "checkedInvestmentSecurities",
    "checkedInterestDebt",
    "checkedNetAssets",
    "checkedRentalBook",
    "checkedRentalMarket",
    "checkedBps",
    "checkedEps",
    "checkedPbrLow",
    "checkedPbrAvg",
    "checkedPbrHigh",
    "checkedPerLow",
    "checkedPerAvg",
    "checkedPerHigh",
    "confirmed",
    "qualitativeDone",
    "risk",
    "catalyst",
    "history",
    "sourceUrl",
    "memo",
    "draftShares",
    "draftCash",
    "draftInterestDebt",
    "draftNetAssets",
    "draftBps",
    "draftEps",
  ];
  return `${headers.join(",")}\n${items.map((row) => headers.map((header) => escapeCsv(row[header] ?? "")).join(",")).join("\n")}\n`;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}
