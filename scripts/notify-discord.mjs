import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(rootDir, "reports", "latest-morning-report.md");
const multibaggerReportPath = path.join(rootDir, "reports", "latest-multibagger-candidates.md");
const promotionReportPath = path.join(rootDir, "reports", "latest-promotion-candidates.md");
const draftReportPath = path.join(rootDir, "reports", "latest-stock-master-draft.md");
const generatedDataPath = path.join(rootDir, "app", "generated-data.js");
const generatedResearchPath = path.join(rootDir, "app", "generated-research.js");
const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
const dryRun = process.env.DISCORD_DRY_RUN === "1" || process.argv.includes("--dry-run");
const siteUrl = process.env.PAGES_URL || "https://sensin0.github.io/candidate-stock-assist/";
const reportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-morning-report.md`;
const multibaggerReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-multibagger-candidates.md`;
const promotionReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-promotion-candidates.md`;
const draftReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-stock-master-draft.md`;

if (!webhookUrl && !dryRun) {
  console.log("DISCORD_WEBHOOK_URL が未設定のため、Discord通知をスキップします");
  process.exit(0);
}

if (!fs.existsSync(reportPath)) {
  console.error("朝レポートが見つかりません");
  process.exit(1);
}

const report = fs.readFileSync(reportPath, "utf8");
const multibaggerReport = fs.existsSync(multibaggerReportPath) ? fs.readFileSync(multibaggerReportPath, "utf8") : "";
const promotionReport = fs.existsSync(promotionReportPath) ? fs.readFileSync(promotionReportPath, "utf8") : "";
const draftReport = fs.existsSync(draftReportPath) ? fs.readFileSync(draftReportPath, "utf8") : "";
const generatedData = fs.existsSync(generatedDataPath) ? fs.readFileSync(generatedDataPath, "utf8") : "";
const generatedResearch = fs.existsSync(generatedResearchPath) ? fs.readFileSync(generatedResearchPath, "utf8") : "";
const generatedPayload = parseGeneratedData(generatedData);
const researchPayload = parseGeneratedData(generatedResearch, "AUTO_RESEARCH_DATA");
const dataQuality = generatedPayload?.dataQuality ?? null;

function countSection(title) {
  const match = report.match(new RegExp(`## ${title}\\n([\\s\\S]*?)(\\n## |$)`));
  if (!match || match[1].includes("該当なし")) return 0;
  return match[1].split("\n").filter((line) => line.startsWith("- ")).length;
}

function firstItems(title, limit = 3) {
  return firstReportItems(report, title, limit);
}

function firstReportItems(text, title, limit = 3) {
  const match = text.match(new RegExp(`## ${title}\\n([\\s\\S]*?)(\\n## |$)`));
  if (!match || match[1].includes("該当なし")) return ["該当なし"];
  return match[1]
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .slice(0, limit)
    .map((line) => line.replace(/^- /, ""));
}

const buyCount = countSection("今買い候補");
const sellCount = countSection("今売り検討");
const watchCount = countSection("監視リスト");
const staleCount = countSection("データ要確認");
const riskCount = countSection("リスク確認");
const providerWarningCount = dataQuality?.providerWarnings?.length ?? 0;
const validationWarningCount = dataQuality?.validationWarnings?.length ?? 0;
const referenceWarningCount = dataQuality?.externalReferenceWarnings?.length ?? 0;
const stockCount = generatedPayload?.stocks?.length ?? 0;
const universe = researchPayload?.universe ?? null;
const stockCountWarning = stockCount > 0 && stockCount < 20 ? "（少なめ）" : "";
const dataSource = generatedPayload?.source ?? "不明";
const nextFixes = dataQuality?.nextFixes ?? [];
const readiness = dataQuality?.readiness ?? { score: 0, label: "準備中", blockers: [] };
const manualInputCount = dataQuality?.manualInputs?.length ?? 0;

const message = [
  "候補銘柄アシスト 朝レポートを更新しました",
  "",
  `対象銘柄数: ${stockCount}件${stockCountWarning}`,
  universe ? `日本株全体: ${universe.success}/${universe.total}件取得 / 上昇タイミング候補 ${universe.buyTiming ?? 0}件` : "日本株全体: 調査データ待ち",
  `銘柄マスタ: ${dataSource}`,
  `本番準備度: ${readiness.score}% ${readiness.label}`,
  `今買い候補: ${buyCount}件`,
  `今売り検討: ${sellCount}件`,
  `監視リスト: ${watchCount}件`,
  `データ要確認: ${staleCount}件`,
  `リスク確認: ${riskCount}件`,
  `取得元の注意: ${providerWarningCount}件`,
  `入力値の注意: ${validationWarningCount}件`,
  `参照の注意: ${referenceWarningCount}件`,
  `次に直す: ${nextFixes.length}件`,
  `一部手入力: ${manualInputCount}件`,
  ...readinessLines(readiness),
  ...nextFixLines(nextFixes),
  "",
  "今日見る優先順位",
  ...firstItems("今日見る優先順位", 3).map((item) => `- ${item}`),
  "",
  "今買い候補",
  ...firstItems("今買い候補").map((item) => `- ${item}`),
  "",
  "2倍監視候補",
  ...firstReportItems(multibaggerReport, "2倍監視候補", 2).map((item) => `- ${item}`),
  "",
  "通常候補への昇格確認",
  ...firstReportItems(promotionReport, "優先して財務確認", 2).map((item) => `- ${item}`),
  "",
  "通常候補入力下書き",
  ...firstReportItems(draftReport, "上位下書き", 2).map((item) => `- ${item}`),
  ...providerWarningLines(dataQuality),
  ...stockUniverseWarningLines(stockCount),
  ...dataWarningLines("入力値の注意", dataQuality?.validationWarnings),
  ...dataWarningLines("参照の注意", dataQuality?.externalReferenceWarnings),
  "",
  siteUrl,
  reportUrl,
  multibaggerReportUrl,
  promotionReportUrl,
  draftReportUrl,
].join("\n");

const body = JSON.stringify({
  username: "候補銘柄アシスト",
  content: message.slice(0, 1900),
});

if (dryRun) {
  console.log("Discord通知プレビュー");
  console.log(message);
  process.exit(0);
}

const request = https.request(webhookUrl, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(body),
  },
}, (response) => {
  let responseBody = "";
  response.on("data", (chunk) => {
    responseBody += chunk;
  });
  response.on("end", () => {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      console.log("Discord通知を送信しました");
      return;
    }
    console.error(`Discord通知に失敗しました: ${response.statusCode} ${responseBody}`);
    process.exit(1);
  });
});

request.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

request.write(body);
request.end();

function parseGeneratedData(text, name = "AUTO_STOCK_DATA") {
  const match = text.match(new RegExp(`window\\.${name} = ([\\s\\S]*);\\s*$`));
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function providerWarningLines(dataQuality) {
  const warnings = dataQuality?.providerWarnings ?? [];
  if (!warnings.length) return [];
  return [
    "",
    "取得元の注意",
    ...warnings.slice(0, 3).map((warning) => `- ${warning.label}: ${warning.message}`),
  ];
}

function dataWarningLines(title, warnings = []) {
  if (!warnings.length) return [];
  return [
    "",
    title,
    ...warnings.slice(0, 3).map((warning) => `- ${warning}`),
  ];
}

function nextFixLines(nextFixes = []) {
  if (!nextFixes.length) return [];
  return [
    "",
    "次に直すデータ",
    ...nextFixes.slice(0, 3).map((item) => `- ${item}`),
  ];
}

function readinessLines(readiness) {
  const blockers = readiness?.blockers ?? [];
  if (!blockers.length) return [];
  return [
    "",
    "本番化の残り",
    ...blockers.slice(0, 3).map((item) => `- ${item}`),
  ];
}

function stockUniverseWarningLines(stockCount) {
  if (!stockCount || stockCount >= 20) return [];
  return [
    "",
    "銘柄数の注意",
    `- 対象銘柄が${stockCount}件です。stock-masterを増やすとランキングの精度が上がります。`,
  ];
}
