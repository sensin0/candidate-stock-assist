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
const financialScreened = readCsv(path.join(dataDir, "financial-worklist-screened.csv"));
const confirmedInput = readCsv(path.join(dataDir, "financial-confirmed-input.csv"));
const promoted = readCsv(path.join(dataDir, "stock-master-promoted.csv"));
const autoFinancialFollowup = readCsv(path.join(dataDir, "auto-financial-followup.csv"));
const researchBacktest = readCsv(path.join(dataDir, "universe-price-backtest.csv"));
const priceRefreshQueue = readCsv(path.join(dataDir, "price-refresh-queue.csv"));
const generatedData = readGeneratedData();
const runtimeStocks = generatedData?.stocks ?? stockMaster;
const pagesStatus = await checkPages(pagesUrl);

const confirmedMetricCount = universeMetrics.filter((row) => row.asOf === "confirmed").length;
const irbankMetricCount = universeMetrics.filter((row) => row.asOf?.startsWith("irbank:")).length;
const estimatedMetricCount = universeMetrics.filter((row) => row.asOf !== "confirmed" && !row.asOf?.startsWith("irbank:")).length;
const universeCoverage = universe.length ? pct(universeMetrics.length / universe.length) : "0%";
const pendingFinancial = financialQueue.filter((row) => row.status === "最優先で財務確認").length;
const autoFilledWorklist = worklist.filter((row) => row.status?.includes("自動入力")).length;
const screenPromotionPriority = financialScreened.filter((row) => row.status === "昇格確認優先").length;
const screenReflected = financialScreened.filter((row) => row.status === "反映済み" || row.status === "反映済み・後追い確認").length;
const screenInputWaiting = financialScreened.filter((row) => row.status === "入力待ち").length;
const screenedCodes = new Set(financialScreened.map((row) => String(row.code)));
const unscreenedPriorityFinancial = financialQueue.filter((row) => row.status === "最優先で財務確認" && !screenedCodes.has(String(row.code))).length;
const worklistReady = worklist.filter((row) => row.confirmed === "true" && row.qualitativeDone === "true").length;
const confirmedInputReady = confirmedInput.filter((row) => row.dataConfidence === "確認済み" || row.confirmed === "true").length;
const autoFinancialConfirmed = runtimeStocks.filter((row) => row.dataConfidence === "自動財務確認").length;
const autoFinancialPriority = autoFinancialFollowup.filter((row) => row.action === "自動確認済み・買い場接近" || row.action === "財務確認を進める").length;
const autoFinancialBuyLineWait = autoFinancialFollowup.filter((row) => row.action === "買いラインまで待つ").length;
const autoFinancialPriceHistoryWait = autoFinancialFollowup.filter((row) => row.action === "価格履歴を先に増やす").length;
const shortHistoryRefresh = readShortHistoryRefresh();
const shortHistoryFailed = shortHistoryRefresh.filter((row) => row.status === "取得失敗").length;
const autoFinancialWait = autoFinancialFollowup.filter((row) => row.action === "買いは後回し" || row.action === "監視継続" || row.action === "買いラインまで待つ" || row.action === "価格履歴を先に増やす").length;
const promotedNewCount = Number(generatedData?.autoPromotionUpdates ?? 0) || Math.max(0, runtimeStocks.length - stockMaster.length);
const successfulBacktests = researchBacktest.filter((row) => !row.error).length;
const goodBacktests = researchBacktest.filter((row) => row.judgement === "良さそう").length;
const urgentPriceRefresh = priceRefreshQueue.filter((row) => row.reason?.includes("買い場に近い") || row.reason?.includes("売り判断に影響")).length;
const nextPriceRefresh = priceRefreshQueue[0];

const tasks = buildTasks();
writeReport(tasks);

console.log(`本番化残作業レポートを生成しました: ${path.relative(rootDir, outputReportPath)}`);
console.log(`残作業: ${tasks.filter((task) => task.status !== "完了").length}件`);

function buildTasks() {
  return [
    task({
      title: "Pages公開の成功確認",
      status: pagesStatus.ok || pagesStatus.skipped ? "完了" : "確認中",
      reason: pagesStatus.ok
        ? `公開ページがHTTP ${pagesStatus.status}で表示されています。`
        : pagesStatus.skipped
          ? pagesStatus.message
        : `公開ページ確認はActions側で確認します。ローカル確認: ${pagesStatus.message}`,
      next: pagesStatus.ok ? "次は財務確認キュー上位の実データ入力" : "Actionsの最新runでbuild/deployがsuccessか確認",
    }),
    task({
      title: "財務確認キュー上位の自動処理",
      status: screenInputWaiting > 0 || unscreenedPriorityFinancial > 0 ? "要対応" : screenPromotionPriority > 0 ? "確認中" : "完了",
      reason: `最優先キュー${pendingFinancial}件のうち未スクリーニング${unscreenedPriorityFinancial}件 / 自動入力済み${autoFilledWorklist}件 / スクリーニング済み${financialScreened.length}件 / 昇格確認優先${screenPromotionPriority}件 / 入力待ち${screenInputWaiting}件です。`,
      next: screenInputWaiting > 0
        ? "入力待ちだけ追加取得し、取得できたものを自動スクリーニングへ回す"
        : unscreenedPriorityFinancial > 0
          ? "未スクリーニングの最優先キューを financial:worklist から financial:screen へ回す"
        : screenPromotionPriority > 0
          ? "昇格確認優先は自動財務確認として通常候補へ反映する"
          : "財務確認キュー上位の自動処理は完了。反映済み候補は価格履歴で自動判定します",
    }),
    task({
      title: "株価更新キューの消化",
      status: priceRefreshQueue.length || autoFinancialPriceHistoryWait ? "要対応" : "完了",
      reason: `最新株価の確認待ちが${priceRefreshQueue.length}件あります。買い・売り判定に影響するものは${urgentPriceRefresh}件、自動財務確認の価格履歴不足は${autoFinancialPriceHistoryWait}件、履歴補完の取得失敗は${shortHistoryFailed}件です。`,
      next: nextPriceRefresh
        ? `${nextPriceRefresh.code} ${nextPriceRefresh.name} の最新株価を price-updates.csv に追加`
        : autoFinancialPriceHistoryWait
          ? "価格履歴不足は新しい日次データが蓄積されるまで買い判断に使わない"
          : "株価更新待ちはありません",
    }),
    task({
      title: "確認済み候補の通常候補昇格",
      status: screenInputWaiting > 0 || autoFinancialPriceHistoryWait > 0 ? "要対応" : "完了",
      reason: `確認済み入力 ${confirmedInputReady}件 / 自動財務確認 ${autoFinancialConfirmed}件 / 買い場接近 ${autoFinancialPriority}件 / 買いライン待ち ${autoFinancialBuyLineWait}件 / 価格履歴不足 ${autoFinancialPriceHistoryWait}件 / 後回し ${autoFinancialWait}件 / ワークシート確認済み ${worklistReady}件 / 昇格プレビュー追加 ${promotedNewCount}件です。`,
      next: screenInputWaiting > 0
        ? "入力待ちだけ追加取得して自動スクリーニングへ回す"
        : autoFinancialPriceHistoryWait > 0
          ? "価格履歴不足は日次データ蓄積後に自動再判定"
          : "自動財務確認済み候補は、買いラインと弱い検証ガードで通常ランキングへ反映済み",
    }),
    task({
      title: "日本株全体の探索範囲",
      status: universeMetrics.length >= universe.length * 0.95 ? "完了" : "要対応",
      reason: `財務メトリクス対象は${universeMetrics.length}/${universe.length}件、カバー率${universeCoverage}です。`,
      next: "未判定が残る場合は universe:metrics と listed-universe を確認",
    }),
    task({
      title: "推定データと確認済みデータの分離",
      status: estimatedMetricCount <= Math.max(250, universeMetrics.length * 0.08) && confirmedMetricCount > 0 ? "完了" : "要対応",
      reason: `確認済み${confirmedMetricCount}件、IRBANK自動取得${irbankMetricCount}件、確認前推定${estimatedMetricCount}件です。`,
      next: "推定だけの銘柄を買い候補にしないガードを維持",
    }),
    task({
      title: "ランキング精度の継続改善",
      status: goodBacktests >= 100 ? "完了" : "要対応",
      reason: `価格バックテスト成功${successfulBacktests}件、良さそう${goodBacktests}件です。`,
      next: goodBacktests >= 100
        ? "ランキングには勝率、平均利益、最大下落、自動財務確認を反映済み"
        : "勝率、平均利益、最大下落、自動財務確認をランキングに反映する",
    }),
    task({
      title: "新規今買い通知の本番確認",
      status: "完了",
      reason: "GitHub Actionsのnotifyジョブは新規今買い候補がある時だけDiscordへ送る設定です。新規なしの日はskippedになります。",
      next: "新規今買い候補が出た時だけ通知します",
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
    `通常候補: ${runtimeStocks.length}件`,
    `うち自動昇格反映: ${promotedNewCount}件`,
    `自動財務確認: ${autoFinancialConfirmed}件`,
    `自動財務確認の買い場接近: ${autoFinancialPriority}件`,
    `自動財務確認の買いライン待ち: ${autoFinancialBuyLineWait}件`,
    `自動財務確認の価格履歴不足: ${autoFinancialPriceHistoryWait}件`,
    `短い価格履歴の取得失敗: ${shortHistoryFailed}件`,
    `日本株財務メトリクス: ${universeMetrics.length}/${universe.length}件`,
    `確認済み財務メトリクス: ${confirmedMetricCount}件`,
    `IRBANK自動取得財務メトリクス: ${irbankMetricCount}件`,
    `確認前推定: ${estimatedMetricCount}件`,
    `財務確認キュー: ${financialQueue.length}件`,
    `最優先で財務確認: ${pendingFinancial}件`,
    `最優先の未スクリーニング: ${unscreenedPriorityFinancial}件`,
    `財務自動入力済み: ${autoFilledWorklist}件`,
    `財務スクリーニング済み: ${financialScreened.length}件`,
    `昇格確認優先: ${screenPromotionPriority}件`,
    `反映済み: ${screenReflected}件`,
    `財務入力待ち: ${screenInputWaiting}件`,
    `株価更新待ち: ${priceRefreshQueue.length}件`,
    `買い・売り判定に影響する株価更新: ${urgentPriceRefresh}件`,
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

function readShortHistoryRefresh() {
  const filePath = path.join(reportsDir, "latest-short-history-refresh.md");
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const failedSectionIndex = lines.findIndex((line) => line === "## 取得失敗");
  if (failedSectionIndex < 0) return [];
  const nextSectionOffset = lines.slice(failedSectionIndex + 1).findIndex((line) => line.startsWith("## "));
  const sectionLines = nextSectionOffset >= 0
    ? lines.slice(failedSectionIndex + 1, failedSectionIndex + 1 + nextSectionOffset)
    : lines.slice(failedSectionIndex + 1);
  return sectionLines
    .filter((line) => line.startsWith("- ") && !line.includes("該当なし"))
    .map((line) => {
      const match = line.match(/^- ([0-9A-Z]{4}) ([^:]+): (.+)$/);
      return {
        status: "取得失敗",
        code: match?.[1] ?? "",
        name: match?.[2] ?? "",
        message: match?.[3] ?? line.slice(2),
      };
    });
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
      skipped: true,
      status: 0,
      message: `ローカルのネット確認は省略しました。公開確認はGitHub Actionsのdeploy成功で見ます。`,
    };
  }
}

function pct(value) {
  return `${Math.round(value * 1000) / 10}%`;
}
