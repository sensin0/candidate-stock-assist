import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(rootDir, "app");
const reportsDir = path.join(rootDir, "reports");
const generatedDataPath = path.join(appDir, "generated-data.js");
const generatedResearchPath = path.join(appDir, "generated-research.js");
const generatedExpansionPath = path.join(appDir, "generated-expansion-preview.js");
const generatedPromotionReadinessPath = path.join(appDir, "generated-promotion-readiness.js");
const generatedHiddenGemsPath = path.join(appDir, "generated-hidden-gems.js");
const appJsPath = path.join(appDir, "app.js");

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
    scrollIntoView() {},
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
    createObjectURL: () => "blob:morning-report",
    revokeObjectURL: () => {},
  },
  setTimeout,
  console,
  matchMedia: () => ({ matches: false }),
};

sandbox.window = sandbox;
vm.createContext(sandbox);

const code = [
  fs.readFileSync(generatedDataPath, "utf8"),
  fs.existsSync(generatedResearchPath) ? fs.readFileSync(generatedResearchPath, "utf8") : "",
  fs.existsSync(generatedExpansionPath) ? fs.readFileSync(generatedExpansionPath, "utf8") : "",
  fs.existsSync(generatedPromotionReadinessPath) ? fs.readFileSync(generatedPromotionReadinessPath, "utf8") : "",
  fs.existsSync(generatedHiddenGemsPath) ? fs.readFileSync(generatedHiddenGemsPath, "utf8") : "",
  fs.readFileSync(appJsPath, "utf8"),
  "globalThis.__report = document.getElementById('morningReport').value;",
].join("\n");

vm.runInContext(code, sandbox, { filename: "generate-morning-report" });

const report = sandbox.__report;
if (!report?.includes("# 朝レポート")) {
  console.error("朝レポートを生成できませんでした");
  process.exit(1);
}

function todayInJapan() {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

const today = todayInJapan();
fs.mkdirSync(reportsDir, { recursive: true });

const datedReportPath = path.join(reportsDir, `morning-report-${today}.md`);
const latestReportPath = path.join(reportsDir, "latest-morning-report.md");

fs.writeFileSync(datedReportPath, report, "utf8");
fs.writeFileSync(latestReportPath, report, "utf8");

console.log(`朝レポートを生成しました: ${datedReportPath}`);
