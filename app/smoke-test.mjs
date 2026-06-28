import fs from "node:fs";
import vm from "node:vm";

const elements = new Map();

function makeElement(id = "") {
  return {
    id,
    value: "",
    textContent: "",
    innerHTML: "",
    className: "",
    style: {},
    dataset: {},
    addEventListener() {},
    select() {},
    closest() {
      return null;
    },
    scrollIntoView() {},
  };
}

const documentStub = {
  body: makeElement("body"),
  getElementById(id) {
    if (!elements.has(id)) elements.set(id, makeElement(id));
    return elements.get(id);
  },
  createElement() {
    return {
      href: "",
      download: "",
      click() {},
    };
  },
};

const sandbox = {
  window: {},
  document: documentStub,
  navigator: { clipboard: { writeText: async () => {} } },
  Blob: class Blob {},
  URL: {
    createObjectURL: () => "blob:test",
    revokeObjectURL: () => {},
  },
  setTimeout,
  console,
  matchMedia: () => ({ matches: false }),
};

sandbox.window = sandbox;

vm.createContext(sandbox);

const generatedData = fs.readFileSync(new URL("./generated-data.js", import.meta.url), "utf8");
const generatedResearch = fs.existsSync(new URL("./generated-research.js", import.meta.url))
  ? fs.readFileSync(new URL("./generated-research.js", import.meta.url), "utf8")
  : "";
const generatedExpansion = fs.existsSync(new URL("./generated-expansion-preview.js", import.meta.url))
  ? fs.readFileSync(new URL("./generated-expansion-preview.js", import.meta.url), "utf8")
  : "";
const generatedPromotionReadiness = fs.existsSync(new URL("./generated-promotion-readiness.js", import.meta.url))
  ? fs.readFileSync(new URL("./generated-promotion-readiness.js", import.meta.url), "utf8")
  : "";
const generatedHiddenGems = fs.existsSync(new URL("./generated-hidden-gems.js", import.meta.url))
  ? fs.readFileSync(new URL("./generated-hidden-gems.js", import.meta.url), "utf8")
  : "";
const generatedHiddenGemsDraft = fs.existsSync(new URL("./generated-hidden-gems-draft.js", import.meta.url))
  ? fs.readFileSync(new URL("./generated-hidden-gems-draft.js", import.meta.url), "utf8")
  : "";
const generatedFinancialConfirmation = fs.existsSync(new URL("./generated-financial-confirmation.js", import.meta.url))
  ? fs.readFileSync(new URL("./generated-financial-confirmation.js", import.meta.url), "utf8")
  : "";
const generatedFinancialScreening = fs.existsSync(new URL("./generated-financial-screening.js", import.meta.url))
  ? fs.readFileSync(new URL("./generated-financial-screening.js", import.meta.url), "utf8")
  : "";
const code = fs.readFileSync(new URL("./app.js", import.meta.url), "utf8");

vm.runInContext(
  `${generatedData}
  ${generatedResearch}
  ${generatedExpansion}
  ${generatedPromotionReadiness}
  ${generatedHiddenGems}
  ${generatedHiddenGemsDraft}
  ${generatedFinancialConfirmation}
  ${generatedFinancialScreening}
  ${code}
  document.getElementById("rankingSelect").value = "today";
  selectTopRankingItem();
  renderRanking();
  renderDetail();
  const selectedTopRanking = rankingFor("today")[0];
  const selectedTopName = selectedTopRanking?.item?.name ?? "";
  const selectedTopDetailTitle = document.getElementById("detailTitle").textContent;
  const normalChart = document.getElementById("chart").innerHTML;
  const normalLynchChart = document.getElementById("lynchChart").innerHTML;
  const inlineLynchPreview = document.getElementById("rankingList").innerHTML;
  const normalLifecycle = document.getElementById("lifecycleAssist").innerHTML;
  const normalTimingPanel = document.getElementById("timingPanel").innerHTML;
  const normalBuyTimingAlert = document.getElementById("buyTimingAlert").innerHTML;
  const dataCheckList = document.getElementById("dataCheckList").innerHTML;
  const todayRanking = document.getElementById("rankingList").innerHTML;
  const todayRankingRows = todayRanking.match(/class="ranking-row/g)?.length ?? 0;
  const todayRankingTop = rankingFor("today")[0];
  const firstStockRanking = rankingFor("today").find((entry) => entry.kind === "stock");
  if (firstStockRanking) {
    selectedResearch = null;
    selectedCode = firstStockRanking.code;
    renderRanking();
    renderDetail();
  }
  const stockDetailChart = document.getElementById("chart").innerHTML;
  const stockDetailLynchChart = document.getElementById("lynchChart").innerHTML;
  const stockDetailLifecycle = document.getElementById("lifecycleAssist").innerHTML;
  const stockDetailTimingPanel = document.getElementById("timingPanel").innerHTML;
  document.getElementById("rankingSelect").value = "researchUniverse";
  renderRanking();
  const researchRanking = document.getElementById("rankingList").innerHTML;
  document.getElementById("rankingSelect").value = "researchTiming";
  renderRanking();
  const researchTimingRanking = document.getElementById("rankingList").innerHTML;
  document.getElementById("rankingSelect").value = "researchMultibagger";
  renderRanking();
  const multibaggerRanking = document.getElementById("rankingList").innerHTML;
  document.getElementById("rankingSelect").value = "expansionPreview";
  renderRanking();
  const expansionRanking = document.getElementById("rankingList").innerHTML;
  document.getElementById("rankingSelect").value = "hiddenGems";
  renderRanking();
  const hiddenGemsRanking = document.getElementById("rankingList").innerHTML;
  document.getElementById("rankingSelect").value = "hiddenGemsDraft";
  renderRanking();
  const hiddenGemsDraftRanking = document.getElementById("rankingList").innerHTML;
  document.getElementById("rankingSelect").value = "financialConfirmation";
  renderRanking();
  const financialConfirmationRanking = document.getElementById("rankingList").innerHTML;
  document.getElementById("rankingSelect").value = "financialScreening";
  renderRanking();
  const financialScreeningRanking = document.getElementById("rankingList").innerHTML;
  const hiddenGemActionItem = window.AUTO_HIDDEN_GEMS.top.find((item) => item.assistAction === "今すぐ財務確認");
  if (hiddenGemActionItem) {
    selectedResearch = { type: "hiddenGems", code: hiddenGemActionItem.code };
    renderDetail();
  }
  const hiddenGemDetailAlert = document.getElementById("buyTimingAlert").innerHTML;
  selectedResearch = { type: "researchUniverse", code: window.AUTO_RESEARCH_DATA.universeTop[0].code };
  renderDetail();
  const researchDetailTitle = document.getElementById("detailTitle").textContent;
  const researchDetailChart = document.getElementById("chart").innerHTML;
  const researchLynchChart = document.getElementById("lynchChart").innerHTML;
  selectedResearch = { type: "expansionPreview", code: window.AUTO_EXPANSION_PREVIEW.items[0].code };
  renderDetail();
  const expansionDetailTitle = document.getElementById("detailTitle").textContent;
  const expansionDetailChart = document.getElementById("chart").innerHTML;
  const expansionLynchChart = document.getElementById("lynchChart").innerHTML;
  if (window.AUTO_FINANCIAL_CONFIRMATION?.top?.[0]) {
    selectedResearch = { type: "financialConfirmation", code: window.AUTO_FINANCIAL_CONFIRMATION.top[0].code };
    renderDetail();
  }
  const financialConfirmationDetail = document.getElementById("buyTimingAlert").innerHTML + document.getElementById("chart").innerHTML;
  if (window.AUTO_FINANCIAL_SCREENING?.top?.[0]) {
    selectedResearch = { type: "financialScreening", code: window.AUTO_FINANCIAL_SCREENING.top[0].code };
    renderDetail();
  }
  const financialScreeningDetail = document.getElementById("buyTimingAlert").innerHTML + document.getElementById("chart").innerHTML;
  globalThis.__result = {
    buyNow: byAssist("今買い候補").length,
    sellNow: byAssist("今売り検討").length + byAssist("一部利益確定検討").length,
    risk: byAssist("リスクで見送り").length + byAssist("検証弱く見送り").length,
    watched: stocks.filter((stock) => stock.watchlist).length,
    report: document.getElementById("morningReport").value,
    chart: stockDetailChart || normalChart,
    lynchChart: stockDetailLynchChart || normalLynchChart,
    inlineLynchPreview,
    lifecycle: stockDetailLifecycle || normalLifecycle,
    buyTimingAlert: normalBuyTimingAlert,
    selectedTopName,
    selectedTopDetailTitle,
    dataCheckList,
    todayRanking,
    todayRankingRows,
    todayRankingTopLabel: todayRankingTop?.item?.assist?.label ?? todayRankingTop?.label ?? "",
    researchOverview: document.getElementById("researchOverview").innerHTML,
    researchRanking,
    researchTimingRanking,
    multibaggerRanking,
    expansionRanking,
    hiddenGemsRanking,
    hiddenGemsDraftRanking,
    financialConfirmationRanking,
    financialConfirmationTotal: window.AUTO_FINANCIAL_CONFIRMATION?.total ?? 0,
    financialScreeningTotal: window.AUTO_FINANCIAL_SCREENING?.total ?? 0,
    financialConfirmationDetail,
    financialScreeningRanking,
    financialScreeningDetail,
    hiddenGemDetailAlert,
    researchDetailTitle,
    researchDetailChart,
    researchLynchChart,
    expansionDetailTitle,
    expansionDetailChart,
    expansionLynchChart,
    summaryTitle: document.getElementById("todaySummaryTitle").textContent,
    timingPanel: stockDetailTimingPanel || normalTimingPanel
  };`,
  sandbox,
  { filename: "app.js" },
);

const result = sandbox.__result;
const failures = [];

if (result.buyNow + result.risk < 1) failures.push("買い候補または見送り判断が1件以上必要です");
if (result.risk < 1) failures.push("リスク確認が1件以上必要です");
if (result.watched < 1) failures.push("監視リストが1件以上必要です");
if (!result.report.includes("# 朝レポート")) failures.push("朝レポートが生成されていません");
if (!result.report.includes("## 監視リスト")) failures.push("朝レポートに監視リストがありません");
if (!result.report.includes("## 未発掘・今すぐ財務確認")) failures.push("朝レポートに未発掘候補がありません");
if (!result.dataCheckList.includes("昇格準備")) failures.push("データ確認に昇格準備がありません");
if (result.selectedTopName && !result.selectedTopDetailTitle.includes(result.selectedTopName)) {
  failures.push("初期表示のリンチ・チャートがランキング1位と一致していません");
}
if (!result.todayRanking.includes("総合") || result.todayRankingRows > 10) {
  failures.push("総合おすすめランキングが10件以内で生成されていません");
}
if (result.buyNow > 0 && result.todayRankingTopLabel !== "今買い候補") {
  failures.push("今買い候補が総合おすすめの上位に出ていません");
}
if (!result.chart.includes("ここで買い候補") && !result.chart.includes("ここから売り検討") && !result.chart.includes("見送り")) {
  failures.push("チャートの売買アシスト吹き出しが生成されていません");
}
if (!result.timingPanel.includes("バックテスト売買タイミング")) {
  failures.push("バックテスト売買タイミングが生成されていません");
}
if (!result.lifecycle.includes("買いから売りまで")) {
  failures.push("買いから売りまでのアシストが生成されていません");
}
if (!result.lynchChart.includes("リンチ・チャート")) {
  failures.push("リンチ・チャートが生成されていません");
}
if (!/\d{4}\/\d{2}/.test(result.lynchChart)) {
  failures.push("リンチ・チャートに日付ラベルがありません");
}
if (!result.inlineLynchPreview.includes("inline-mobile-lynch-preview") || !result.inlineLynchPreview.includes("リンチ・チャート")) {
  failures.push("選択銘柄直下のリンチ・チャートプレビューが生成されていません");
}
if (!result.inlineLynchPreview.includes("inline-selected-summary") || !result.inlineLynchPreview.includes("買い")) {
  failures.push("選択銘柄直下の要約情報が生成されていません");
}
if (!result.researchOverview.includes("日本株全体") || !result.researchOverview.includes("2倍監視")) {
  failures.push("広域バックテスト候補が生成されていません");
}
if (!result.researchRanking.includes("広域候補")) {
  failures.push("ランキングに広域候補が生成されていません");
}
if (!result.researchTimingRanking.includes("上昇タイミング")) {
  failures.push("ランキングに上昇タイミング候補が生成されていません");
}
if (!result.multibaggerRanking.includes("2倍監視")) {
  failures.push("ランキングに2倍監視が生成されていません");
}
if (!result.expansionRanking.includes("確認前")) {
  failures.push("ランキングに追加候補確認が生成されていません");
}
if (!result.hiddenGemsRanking.includes("未発掘")) {
  failures.push("ランキングに未発掘候補が生成されていません");
}
if (!result.hiddenGemsDraftRanking.includes("下書き")) {
  failures.push("ランキングに未発掘下書きが生成されていません");
}
if (
  result.financialConfirmationTotal > result.financialScreeningTotal
  && !result.financialConfirmationRanking.includes("財務確認")
) {
  failures.push("ランキングに財務確認キューが生成されていません");
}
if (
  !result.financialScreeningRanking.includes("昇格確認優先")
  && !result.financialScreeningRanking.includes("慎重確認")
  && !result.financialScreeningRanking.includes("見送り寄り")
) {
  failures.push("ランキングに財務優先確認が生成されていません");
}
if (!result.financialConfirmationDetail.includes("確認完了まで買わない") && !result.financialConfirmationDetail.includes("財務確認アシスト")) {
  failures.push("財務確認キューの詳細が生成されていません");
}
if (!result.financialScreeningDetail.includes("財務スクリーニング")) {
  failures.push("財務優先確認の詳細が生成されていません");
}
if (!result.hiddenGemDetailAlert.includes("未発掘候補アシスト")) {
  failures.push("未発掘候補の上部アシストが生成されていません");
}
if (!result.researchDetailTitle || !result.researchDetailChart.includes("価格バックテストの見え方")) {
  failures.push("広域候補の詳細が生成されていません");
}
if (!result.researchLynchChart.includes("財務確認後に表示")) {
  failures.push("広域候補のリンチ・チャート案内が生成されていません");
}
if (!result.expansionDetailTitle || !result.expansionDetailChart.includes("買い判断は財務確認後")) {
  failures.push("追加候補確認の詳細が生成されていません");
}
if (!result.expansionLynchChart.includes("リンチ・チャートは財務確認後")) {
  failures.push("追加候補確認のリンチ・チャート案内が生成されていません");
}
if (result.buyNow > 0 && !result.buyTimingAlert.includes("買いタイミング点灯中")) {
  failures.push("買いタイミング表示が生成されていません");
}
if (result.buyNow === 0 && result.buyTimingAlert.includes("買いタイミング点灯中")) {
  failures.push("買いタイミングではない銘柄に表示が出ています");
}
if (result.buyNow > 0 && !result.summaryTitle.includes("買いタイミング")) {
  failures.push("全体の買いタイミング表示が出ていません");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("smoke-test ok");
