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
const code = fs.readFileSync(new URL("./app.js", import.meta.url), "utf8");

vm.runInContext(
  `${generatedData}
  ${code}
  selectedCode = byAssist("今買い候補")[0]?.code
    ?? byAssist("検証弱く見送り")[0]?.code
    ?? byAssist("リスクで見送り")[0]?.code
    ?? selectedCode;
  renderDetail();
  globalThis.__result = {
    buyNow: byAssist("今買い候補").length,
    sellNow: byAssist("今売り検討").length + byAssist("一部利益確定検討").length,
    risk: byAssist("リスクで見送り").length + byAssist("検証弱く見送り").length,
    watched: stocks.filter((stock) => stock.watchlist).length,
    report: document.getElementById("morningReport").value,
    chart: document.getElementById("chart").innerHTML,
    timingPanel: document.getElementById("timingPanel").innerHTML
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

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("smoke-test ok");
