import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const appDir = path.join(rootDir, "app");
const outputReportPath = path.join(reportsDir, "latest-production-next-steps.md");
const pagesUrl = process.env.PAGES_URL || "https://sensin0.github.io/candidate-stock-assist/";

const stockMaster = readCsv(path.join(dataDir, "stock-master.csv"));
const universe = readCsv(path.join(dataDir, "listed-universe.csv"));
const universeMetrics = readCsv(path.join(dataDir, "universe-metrics.csv"));
const financialQueue = readCsv(path.join(dataDir, "financial-confirmation-queue.csv"));
const worklist = readCsv(path.join(dataDir, "financial-confirmation-worklist.csv"));
const confirmedInput = readCsv(path.join(dataDir, "financial-confirmed-input.csv"));
const promoted = readCsv(path.join(dataDir, "stock-master-promoted.csv"));
const researchBacktest = readCsv(path.join(dataDir, "universe-price-backtest.csv"));
const generatedData = readGeneratedData();
const pagesStatus = await checkPages(pagesUrl);

const confirmedMetricCount = universeMetrics.filter((row) => row.asOf === "confirmed").length;
const estimatedMetricCount = universeMetrics.filter((row) => row.asOf !== "confirmed").length;
const universeCoverage = universe.length ? pct(universeMetrics.length / universe.length) : "0%";
const pendingFinancial = financialQueue.filter((row) => row.status === "最優先で財務確認").length;
const worklistReady = worklist.filter((row) => row.confirmed === "true" && row.qualitativeDone === "true").length;
const confirmedInputReady = confirmedInput.filter((row) => row.dataConfidence === "確認済み" || row.confirmed === "true").length;
const promotedNewCount = Math.max(0, promoted.length - stockMaster.length);
const successfulBacktests = researchBacktest.filter((row) => !row.error).length;
const goodBacktests = researchBacktest.filter((row) => row.judgement === "良さそう").length;

const tasks = buildTasks();
writeReport(tasks);

console.log(`本番化残作業レポートを生成しました: ${path.relative(rootDir, outputReportPath)}`);
console.log(`残作業: ${tasks.filter((task) => task.status !== "完了").length}件`);

function buildTasks() {
  return [
    task({
      title: "Pages公開の成功確認",
      status: pagesStatus.ok ? "完了" : "確認中",
      reason: pagesStatus.ok
        ? `公開ページがHTTP ${pagesStatus.status}で表示されています。`
        : `公開ページ確認は未完了です。${pagesStatus.message}`,
      next: pagesStatus.ok ? "次は財務確認キュー上位の実データ入力" : "Actionsの最新runでbuild/deployがsuccessか確認",
    }),
    task({
      title: "財務確認キュー上位の実データ入力",
      status: pendingFinancial > 0 ? "要対応" : "完了",
      reason: `最優先の財務確認待ちが${pendingFinancial}件あります。`,
      next: "financial-confirmation-worklist.csv の checked 列を埋める",
    }),
    task({
      title: "確認済み候補の通常候補昇格",
      status: confirmedInputReady || worklistReady || promotedNewCount ? "確認中" : "要対応",
      reason: `確認済み入力 ${confirmedInputReady}件 / ワークシート確認済み ${worklistReady}件 / 昇格プレビュー追加 ${promotedNewCount}件です。`,
      next: "確認済みになったものを financial-confirmed-input.csv に入れて npm run financial:promote",
    }),
    task({
      title: "日本株全体の探索範囲",
      status: universeMetrics.length >= universe.length * 0.95 ? "完了" : "要対応",
      reason: `財務メトリクス対象は${universeMetrics.length}/${universe.length}件、カバー率${universeCoverage}です。`,
      next: "未判定が残る場合は universe:metrics と listed-universe を確認",
    }),
    task({
      title: "推定データと確認済みデータの分離",
      status: estimatedMetricCount > 0 && confirmedMetricCount > 0 ? "完了" : "要対応",
      reason: `確認済み${confirmedMetricCount}件、確認前推定${estimatedMetricCount}件です。`,
      next: "推定だけの銘柄を買い候補にしないガードを維持",
    }),
    task({
      title: "ランキング精度の継続改善",
      status: goodBacktests >= 100 ? "確認中" : "要対応",
      reason: `価格バックテスト成功${successfulBacktests}件、良さそう${goodBacktests}件です。`,
      next: "勝率、平均利益、最大下落、確認済み財務をランキングに反映し続ける",
    }),
    task({
      title: "朝7:10通知の本番確認",
      status: "確認中",
      reason: "push時は通知しない設計で、scheduleまたは手動実行時にDiscordへ送ります。",
      next: "次回scheduleまたはRun workflowでDiscord到着時刻を確認",
    }),
  ];
}

function task({ title, status, reason, next }) {
  return { title, status, reason, next };
}

function writeReport(tasks) {
  fs.mkdirSync(reportsDir, { recursive: true });
  const openTasks = tasks.filter((task) => task.status !== "完了");
  const lines = [
    "# 本番化 残作業",
    "",
    `生成日時: ${new Date().toISOString()}`,
    "",
    `残作業: ${openTasks.length}件`,
    `通常候補: ${stockMaster.length}件`,
    `日本株財務メトリクス: ${universeMetrics.length}/${universe.length}件`,
    `確認済み財務メトリクス: ${confirmedMetricCount}件`,
    `確認前推定: ${estimatedMetricCount}件`,
    `財務確認キュー: ${financialQueue.length}件`,
    `最優先で財務確認: ${pendingFinancial}件`,
    `本番準備度: ${generatedData?.dataQuality?.readiness?.score ?? "-"}% ${generatedData?.dataQuality?.readiness?.label ?? ""}`.trim(),
    `公開URL: ${pagesUrl}`,
    "",
    "## 優先順",
    "",
    ...tasks.map((item, index) => [
      `### ${index + 1}. ${item.title}`,
      `- 状態: ${item.status}`,
      `- 理由: ${item.reason}`,
      `- 次: ${item.next}`,
      "",
    ].join("\n")),
  ];
  fs.writeFileSync(outputReportPath, `${lines.join("\n")}\n`, "utf8");
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function readGeneratedData() {
  const filePath = path.join(appDir, "generated-data.js");
  if (!fs.existsSync(filePath)) return null;
  const match = fs.readFileSync(filePath, "utf8").match(/window\.AUTO_STOCK_DATA = ([\s\S]*);\s*$/);
  if (!match) return null;
  return JSON.parse(match[1]);
}

async function checkPages(url) {
  try {
    const response = await fetch(url, { headers: { "User-Agent": "Codex" } });
    return {
      ok: response.ok,
      status: response.status,
      message: response.ok ? "OK" : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error.message,
    };
  }
}

function pct(value) {
  return `${Math.round(value * 1000) / 10}%`;
}
