import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(rootDir, "app");
const reportsDir = path.join(rootDir, "reports");
const generatedDataPath = path.join(appDir, "generated-data.js");
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
};

sandbox.window = sandbox;
vm.createContext(sandbox);

const code = [
  fs.readFileSync(generatedDataPath, "utf8"),
  fs.readFileSync(appJsPath, "utf8"),
  "globalThis.__report = document.getElementById('morningReport').value;",
].join("\n");

vm.runInContext(code, sandbox, { filename: "generate-morning-report" });

const report = sandbox.__report;
if (!report?.includes("# 朝レポート")) {
  console.error("朝レポートを生成できませんでした");
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
fs.mkdirSync(reportsDir, { recursive: true });

const datedReportPath = path.join(reportsDir, `morning-report-${today}.md`);
const latestReportPath = path.join(reportsDir, "latest-morning-report.md");

fs.writeFileSync(datedReportPath, report, "utf8");
fs.writeFileSync(latestReportPath, report, "utf8");

console.log(`朝レポートを生成しました: ${datedReportPath}`);
