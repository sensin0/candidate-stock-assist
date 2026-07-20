import fs from "node:fs";
import vm from "node:vm";

const context = { window: {} };
for (const file of [
  "app/generated-research.js",
  "app/generated-financial-confirmation.js",
  "app/generated-financial-screening.js",
  "app/generated-expansion-preview.js",
]) {
  if (fs.existsSync(file)) {
    vm.runInNewContext(fs.readFileSync(file, "utf8"), context, { filename: file });
  }
}

const groups = {
  autoBuy: context.window.AUTO_RESEARCH_DATA?.autoBuyCandidates ?? [],
  universeAll: context.window.AUTO_RESEARCH_DATA?.universeAll ?? [],
  timingBuys: context.window.AUTO_RESEARCH_DATA?.timingBuys ?? [],
  financialConfirmation: context.window.AUTO_FINANCIAL_CONFIRMATION?.top ?? [],
  financialScreening: context.window.AUTO_FINANCIAL_SCREENING?.top ?? [],
  expansion: context.window.AUTO_EXPANSION_PREVIEW?.items ?? [],
};

const missing = [];
for (const [group, rows] of Object.entries(groups)) {
  for (const row of rows) {
    if (!chartReady(row)) missing.push(`${group}:${row.code}:${row.name}`);
  }
}

if (missing.length) {
  console.error(`チャート用データ不足: ${missing.length}件`);
  missing.slice(0, 30).forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

console.log("chart-data-ready-test ok");

function chartReady(row) {
  const price = positive(row.price) || positive(row.lastClose) || positive(row.buyLine) || positive(row.targetPrice) || positive(row.sellGuidePrice);
  const pbr = positive(row.pbr);
  const per = positive(row.per);
  const bps = positive(row.chartBps) || positive(row.bps) || (price && pbr ? price / pbr : price ? price / 0.75 : 0);
  const eps = positive(row.chartEps) || positive(row.eps) || (price && per ? price / per : price ? price / 12 : 0);
  return price > 0 && bps > 0 && eps > 0;
}

function positive(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}
