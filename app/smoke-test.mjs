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
};

sandbox.window = sandbox;

vm.createContext(sandbox);

const generatedData = fs.readFileSync(new URL("./generated-data.js", import.meta.url), "utf8");
const generatedResearch = fs.existsSync(new URL("./generated-research.js", import.meta.url))
  ? fs.readFileSync(new URL("./generated-research.js", import.meta.url), "utf8")
  : "";
const code = fs.readFileSync(new URL("./app.js", import.meta.url), "utf8");

vm.runInContext(
  `${generatedData}
  ${generatedResearch}
  ${code}
  selectedCode = byAssist("今買い候補")[0]?.code
    ?? byAssist("検証弱く見送り")[0]?.code
    ?? byAssist("リスクで見送り")[0]?.code
    ?? selectedCode;
  renderDetail();
  const normalChart = document.getElementById("chart").innerHTML;
  const normalTimingPanel = document.getElementById("timingPanel").innerHTML;
  const normalBuyTimingAlert = document.getElementById("buyTimingAlert").innerHTML;
  document.getElementById("rankingSelect").value = "researchUniverse";
  renderRanking();
  const researchRanking = document.getElementById("rankingList").innerHTML;
  document.getElementById("rankingSelect").value = "researchMultibagger";
  renderRanking();
  const multibaggerRanking = document.getElementById("rankingList").innerHTML;
  selectedResearch = { type: "researchUniverse", code: window.AUTO_RESEARCH_DATA.universeTop[0].code };
  renderDetail();
  const researchDetailTitle = document.getElementById("detailTitle").textContent;
  const researchDetailChart = document.getElementById("chart").innerHTML;
  globalThis.__result = {
    buyNow: byAssist("今買い候補").length,
    sellNow: byAssist("今売り検討").length + byAssist("一部利益確定検討").length,
    risk: byAssist("リスクで見送り").length + byAssist("検証弱く見送り").length,
    watched: stocks.filter((stock) => stock.watchlist).length,
    report: document.getElementById("morningReport").value,
    chart: normalChart,
    buyTimingAlert: normalBuyTimingAlert,
    researchOverview: document.getElementById("researchOverview").innerHTML,
    researchRanking,
    multibaggerRanking,
    researchDetailTitle,
    researchDetailChart,
    summaryTitle: document.getElementById("todaySummaryTitle").textContent,
    timingPanel: normalTimingPanel
  };`,
  sandbox,
  { filename: "app.js" },
);

const result = sandbox.__result;
const failures = [];

if (result.buyNow + result.risk < 1) failures.push("買い候補または見送り判断が1件以上必要です");
if (result.sellNow < 1) failures.push("今売り検討が1件以上必要です");
if (result.risk < 1) failures.push("リスク確認が1件以上必要です");
if (result.watched < 1) failures.push("監視リストが1件以上必要です");
if (!result.report.includes("# 朝レポート")) failures.push("朝レポートが生成されていません");
if (!result.report.includes("## 監視リスト")) failures.push("朝レポートに監視リストがありません");
if (!result.chart.includes("ここで買い候補") && !result.chart.includes("ここから売り検討") && !result.chart.includes("見送り")) {
  failures.push("チャートの売買アシスト吹き出しが生成されていません");
}
if (!result.timingPanel.includes("バックテスト売買タイミング")) {
  failures.push("バックテスト売買タイミングが生成されていません");
}
if (!result.researchOverview.includes("日本株全体") || !result.researchOverview.includes("2倍監視")) {
  failures.push("広域バックテスト候補が生成されていません");
}
if (!result.researchRanking.includes("広域候補")) {
  failures.push("ランキングに広域候補が生成されていません");
}
if (!result.multibaggerRanking.includes("2倍監視")) {
  failures.push("ランキングに2倍監視が生成されていません");
}
if (!result.researchDetailTitle || !result.researchDetailChart.includes("価格バックテストの見え方")) {
  failures.push("広域候補の詳細が生成されていません");
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
