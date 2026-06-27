import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(rootDir, "reports", "latest-morning-report.md");
const multibaggerReportPath = path.join(rootDir, "reports", "latest-multibagger-candidates.md");
const promotionReportPath = path.join(rootDir, "reports", "latest-promotion-candidates.md");
const readinessReportPath = path.join(rootDir, "reports", "latest-promotion-readiness.md");
const hiddenGemsReportPath = path.join(rootDir, "reports", "latest-hidden-gems.md");
const hiddenGemsDraftReportPath = path.join(rootDir, "reports", "latest-hidden-gems-stock-master-draft.md");
const financialConfirmationReportPath = path.join(rootDir, "reports", "latest-financial-confirmation.md");
const financialWorklistReportPath = path.join(rootDir, "reports", "latest-financial-confirmation-worklist.md");
const financialConfirmedInputReportPath = path.join(rootDir, "reports", "latest-financial-confirmed-input.md");
const promotedReportPath = path.join(rootDir, "reports", "latest-promoted-candidates.md");
const autoFinancialFollowupReportPath = path.join(rootDir, "reports", "latest-auto-financial-followup.md");
const financialCoverageReportPath = path.join(rootDir, "reports", "latest-universe-financial-coverage.md");
const universeCheckStatusReportPath = path.join(rootDir, "reports", "latest-universe-check-status.md");
const productionNextReportPath = path.join(rootDir, "reports", "latest-production-next-steps.md");
const draftReportPath = path.join(rootDir, "reports", "latest-stock-master-draft.md");
const expandedPreviewReportPath = path.join(rootDir, "reports", "latest-stock-master-expanded-preview.md");
const generatedDataPath = path.join(rootDir, "app", "generated-data.js");
const generatedResearchPath = path.join(rootDir, "app", "generated-research.js");
const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
const dryRun = process.env.DISCORD_DRY_RUN === "1" || process.argv.includes("--dry-run");
const siteUrl = process.env.PAGES_URL || "https://sensin0.github.io/candidate-stock-assist/";
const reportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-morning-report.md`;
const multibaggerReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-multibagger-candidates.md`;
const promotionReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-promotion-candidates.md`;
const readinessReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-promotion-readiness.md`;
const hiddenGemsReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-hidden-gems.md`;
const hiddenGemsDraftReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-hidden-gems-stock-master-draft.md`;
const financialConfirmationReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-financial-confirmation.md`;
const financialWorklistReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-financial-confirmation-worklist.md`;
const financialConfirmedInputReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-financial-confirmed-input.md`;
const promotedReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-promoted-candidates.md`;
const autoFinancialFollowupReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-auto-financial-followup.md`;
const financialCoverageReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-universe-financial-coverage.md`;
const universeCheckStatusReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-universe-check-status.md`;
const productionNextReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-production-next-steps.md`;
const draftReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-stock-master-draft.md`;
const expandedPreviewReportUrl = `${siteUrl.replace(/\/$/, "")}/reports/latest-stock-master-expanded-preview.md`;

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
const readinessReport = fs.existsSync(readinessReportPath) ? fs.readFileSync(readinessReportPath, "utf8") : "";
const hiddenGemsReport = fs.existsSync(hiddenGemsReportPath) ? fs.readFileSync(hiddenGemsReportPath, "utf8") : "";
const hiddenGemsDraftReport = fs.existsSync(hiddenGemsDraftReportPath) ? fs.readFileSync(hiddenGemsDraftReportPath, "utf8") : "";
const financialConfirmationReport = fs.existsSync(financialConfirmationReportPath) ? fs.readFileSync(financialConfirmationReportPath, "utf8") : "";
const financialWorklistReport = fs.existsSync(financialWorklistReportPath) ? fs.readFileSync(financialWorklistReportPath, "utf8") : "";
const financialConfirmedInputReport = fs.existsSync(financialConfirmedInputReportPath) ? fs.readFileSync(financialConfirmedInputReportPath, "utf8") : "";
const promotedReport = fs.existsSync(promotedReportPath) ? fs.readFileSync(promotedReportPath, "utf8") : "";
const autoFinancialFollowupReport = fs.existsSync(autoFinancialFollowupReportPath) ? fs.readFileSync(autoFinancialFollowupReportPath, "utf8") : "";
const financialCoverageReport = fs.existsSync(financialCoverageReportPath) ? fs.readFileSync(financialCoverageReportPath, "utf8") : "";
const universeCheckStatusReport = fs.existsSync(universeCheckStatusReportPath) ? fs.readFileSync(universeCheckStatusReportPath, "utf8") : "";
const productionNextReport = fs.existsSync(productionNextReportPath) ? fs.readFileSync(productionNextReportPath, "utf8") : "";
const draftReport = fs.existsSync(draftReportPath) ? fs.readFileSync(draftReportPath, "utf8") : "";
const expandedPreviewReport = fs.existsSync(expandedPreviewReportPath) ? fs.readFileSync(expandedPreviewReportPath, "utf8") : "";
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
const autoFinancialStocks = (generatedPayload?.stocks ?? []).filter((stock) => stock.dataConfidence === "自動財務確認");
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
  `自動財務確認: ${autoFinancialStocks.length}件（買う前に後追い確認）`,
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
  ...firstItems("今日見る優先順位", 3).map((item) => `- ${clipItem(item)}`),
  "",
  "今買い候補",
  ...firstItems("今買い候補").map((item) => `- ${clipItem(item)}`),
  "",
  "自動財務確認・後追い確認",
  ...firstItems("自動財務確認・後追い確認", 3).map((item) => `- ${clipItem(item)}`),
  "",
  "2倍監視候補",
  ...firstReportItems(multibaggerReport, "2倍監視候補", 2).map((item) => `- ${clipItem(item)}`),
  "",
  "通常候補への昇格確認",
  ...firstReportItems(promotionReport, "優先して財務確認", 2).map((item) => `- ${clipItem(item)}`),
  "",
  "昇格準備チェック",
  ...firstReportItems(readinessReport, "最優先で財務確認", 2).map((item) => `- ${clipItem(item)}`),
  "",
  "財務確認キュー",
  ...firstReportItems(financialConfirmationReport, "最優先で財務確認", 2).map((item) => `- ${clipItem(item)}`),
  "",
  "財務確認ワークシート",
  ...firstReportItems(financialWorklistReport, "入力待ち", 2).map((item) => `- ${clipItem(item)}`),
  "",
  "確認済み入力",
  ...firstReportItems(financialConfirmedInputReport, "今回反映", 2).map((item) => `- ${clipItem(item)}`),
  "",
  "確認済み昇格",
  ...firstReportItems(promotedReport, "昇格対象", 2).map((item) => `- ${clipItem(item)}`),
  "",
  "自動財務確認の優先確認",
  ...firstReportItems(autoFinancialFollowupReport, "優先確認", 3).map((item) => `- ${clipItem(item)}`),
  "",
  "自動財務確認の後回し",
  ...firstReportItems(autoFinancialFollowupReport, "後回し・見送り寄り", 2).map((item) => `- ${clipItem(item)}`),
  "",
  "財務データ範囲",
  ...firstReportItems(financialCoverageReport, "確認前推定の内訳", 3).map((item) => `- ${clipItem(item)}`),
  "",
  "日本株全件チェック状態",
  ...firstReportItems(universeCheckStatusReport, "取得不可で自動除外", 3).map((item) => `- ${clipItem(item)}`),
  "",
  "本番化残作業",
  ...firstReportItems(productionNextReport, "優先順", 3).map((item) => `- ${clipItem(item)}`),
  "",
  "未発掘候補",
  ...firstReportItems(hiddenGemsReport, "今すぐ財務確認", 2).map((item) => `- ${clipItem(item)}`),
  "",
  "未発掘から通常候補入力下書き",
  ...firstReportItems(hiddenGemsDraftReport, "入力下書き", 2).map((item) => `- ${clipItem(item)}`),
  "",
  "通常候補入力下書き",
  ...firstReportItems(draftReport, "上位下書き", 2).map((item) => `- ${clipItem(item)}`),
  "",
  "通常候補追加プレビュー",
  ...firstReportItems(expandedPreviewReport, "追加候補", 2).map((item) => `- ${clipItem(item)}`),
  ...providerWarningLines(dataQuality),
  ...stockUniverseWarningLines(stockCount),
  ...dataWarningLines("入力値の注意", dataQuality?.validationWarnings),
  ...dataWarningLines("参照の注意", dataQuality?.externalReferenceWarnings),
  "",
  siteUrl,
  reportUrl,
  multibaggerReportUrl,
  promotionReportUrl,
  readinessReportUrl,
  financialConfirmationReportUrl,
  financialWorklistReportUrl,
  financialConfirmedInputReportUrl,
  promotedReportUrl,
  autoFinancialFollowupReportUrl,
  financialCoverageReportUrl,
  universeCheckStatusReportUrl,
  productionNextReportUrl,
  hiddenGemsReportUrl,
  hiddenGemsDraftReportUrl,
  draftReportUrl,
  expandedPreviewReportUrl,
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

function clipItem(item, max = 165) {
  const text = String(item ?? "");
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
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
