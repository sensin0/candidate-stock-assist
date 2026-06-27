import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readAutoPromotionStocks } from "./runtime-stock-data.mjs";
import { fetchStocksFromCsv } from "./providers/csv-provider.mjs";
import { applyBacktestResults, fetchBacktestResults } from "./providers/backtest-provider.mjs";
import { applyDisclosures, fetchDisclosures } from "./providers/disclosure-provider.mjs";
import { applyEdinetFacts, fetchEdinetFacts } from "./providers/edinet-provider.mjs";
import { applyPriceUpdates, fetchPriceUpdates } from "./providers/price-provider.mjs";
import { applyWatchlist, fetchWatchlist } from "./providers/watchlist-provider.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(rootDir, "app");
const dataDir = path.join(rootDir, "data");
const inputCsv = path.join(dataDir, "stock-master.csv");
const inputPriceCsv = path.join(dataDir, "price-updates.csv");
const inputDisclosureCsv = path.join(dataDir, "disclosures.csv");
const inputEdinetCsv = path.join(dataDir, "edinet-facts.csv");
const inputWatchlistCsv = path.join(dataDir, "watchlist.csv");
const inputBacktestCsv = path.join(dataDir, "backtest-results.csv");
const autoPromotionDraftCsv = path.join(dataDir, "stock-master-universe-promotion-draft.csv");
const universeMetricsCsv = path.join(dataDir, "universe-metrics.csv");
const outputJs = path.join(appDir, "generated-data.js");
const outputReport = path.join(appDir, "latest-update-report.md");
const msPerDay = 24 * 60 * 60 * 1000;

async function fetchWithFallback(label, primaryFetch, fallbackFetch) {
  try {
    const result = await primaryFetch();
    return {
      ...result,
      providerStatus: {
        label,
        ok: true,
        message: "取得成功",
        source: result.source,
      },
    };
  } catch (error) {
    const fallback = await fallbackFetch();
    return {
      ...fallback,
      providerStatus: {
        label,
        ok: false,
        message: `${error.message} / 予備データで継続`,
        source: fallback.source,
      },
    };
  }
}

function buildDataQuality(payload) {
  const stocks = payload.stocks;
  const missingPrice = stocks.filter((stock) => !stock.priceAsOf).map((stock) => `${stock.code} ${stock.name}`);
  const stalePrice = stocks
    .filter((stock) => stock.priceAsOf && daysSince(stock.priceAsOf) > 5)
    .sort((a, b) => priceRefreshPriority(b) - priceRefreshPriority(a))
    .map((stock) => `${stock.code} ${stock.name}: 株価が${daysSince(stock.priceAsOf)}日前`);
  const missingEdinet = stocks.filter((stock) => !stock.edinet?.periodEnd).map((stock) => `${stock.code} ${stock.name}`);
  const validationWarnings = validateStocks(stocks);
  const externalReferenceWarnings = validateExternalReferences(payload);
  const stale = stocks
    .filter((stock) => stock.dataConfidence === "未確認" || !stock.priceAsOf || !stock.edinet?.periodEnd)
    .map((stock) => `${stock.code} ${stock.name}`);
  const manualInputs = stocks
    .filter((stock) => stock.dataConfidence === "一部手入力")
    .map((stock) => `${stock.code} ${stock.name}`);
  const providerWarnings = payload.providerStatuses.filter((status) => !status.ok);
  const coverage = {
    price: `${stocks.length - missingPrice.length}/${stocks.length}`,
    freshPrice: `${stocks.length - missingPrice.length - stalePrice.length}/${stocks.length}`,
    edinet: `${stocks.length - missingEdinet.length}/${stocks.length}`,
  };

  return {
    ok: !providerWarnings.length
      && !missingPrice.length
      && !stalePrice.length
      && !missingEdinet.length
      && !validationWarnings.length
      && !externalReferenceWarnings.length,
    providerWarnings,
    validationWarnings,
    externalReferenceWarnings,
    missingBacktest: stocks.filter((stock) => !stock.backtest).map((stock) => `${stock.code} ${stock.name}`),
    missingPrice,
    stalePrice,
    missingEdinet,
    manualInputs,
    stale,
    nextFixes: buildNextFixes({
      providerWarnings,
      validationWarnings,
      externalReferenceWarnings,
      missingPrice,
      stalePrice,
      missingEdinet,
    }),
    readiness: buildReadiness({
      stockCount: stocks.length,
      priceReady: stocks.length - missingPrice.length,
      freshPriceReady: stocks.length - missingPrice.length - stalePrice.length,
      edinetReady: stocks.length - missingEdinet.length,
      providerWarnings,
      validationWarnings,
      externalReferenceWarnings,
      providerStatuses: payload.providerStatuses,
    }),
    coverage,
  };
}

function buildReadiness({
  stockCount,
  priceReady,
  freshPriceReady,
  edinetReady,
  providerWarnings,
  validationWarnings,
  externalReferenceWarnings,
  providerStatuses,
}) {
  const minimumProductionCount = 20;
  const stockScore = Math.min(40, Math.round((stockCount / minimumProductionCount) * 40));
  const priceScore = stockCount ? Math.round((freshPriceReady / stockCount) * 25) : 0;
  const edinetScore = stockCount ? Math.round((edinetReady / stockCount) * 25) : 0;
  const qualityPenalty = Math.min(10, providerWarnings.length * 4 + validationWarnings.length * 2 + externalReferenceWarnings.length * 2);
  const score = Math.max(0, Math.min(100, stockScore + priceScore + edinetScore + 10 - qualityPenalty));
  const blockers = [];
  if (stockCount < 20) blockers.push(`銘柄数を20件以上へ増やす: 現在${stockCount}件`);
  if (stockCount && freshPriceReady < stockCount) blockers.push(`最新株価を更新: ${freshPriceReady}/${stockCount}`);
  if (stockCount && priceReady < stockCount) blockers.push(`株価未取得を埋める: ${priceReady}/${stockCount}`);
  if (stockCount && edinetReady / stockCount < 0.8) blockers.push(`EDINET相当を80%以上へ増やす: ${edinetReady}/${stockCount}`);
  if (providerWarnings.length) blockers.push("外部データ取得元の注意を解消");
  if (validationWarnings.length || externalReferenceWarnings.length) blockers.push("入力値または参照コードの注意を解消");
  return {
    score,
    label: score >= 85 ? "本番運用OK" : score >= 65 ? "あと少し" : "準備中",
    blockers,
  };
}

function buildNextFixes({ providerWarnings, validationWarnings, externalReferenceWarnings, missingPrice, stalePrice, missingEdinet }) {
  return [
    ...providerWarnings.map((item) => `取得元を確認: ${item.label} ${item.message}`),
    ...validationWarnings.map((item) => `銘柄マスタを修正: ${item}`),
    ...externalReferenceWarnings.map((item) => `外部CSVのコードを確認: ${item}`),
    ...stalePrice.map((item) => `最新株価を確認: ${item}`),
    ...missingPrice.map((item) => `株価CSVに追加: ${item}`),
    ...missingEdinet.map((item) => `EDINET相当CSVに追加: ${item}`),
  ].slice(0, 12);
}

function priceRefreshPriority(stock) {
  let priority = 0;
  if (stock.backtest?.timingLabel === "買い候補") priority += 40;
  if (stock.backtest?.timingLabel === "買い場待ち") priority += 25;
  if (stock.held) priority += 20;
  if (stock.backtest && Number(stock.backtest.averageReturn || 0) > 0 && Number(stock.backtest.winRate || 0) >= 60) priority += 12;
  priority += Math.min(10, daysSince(stock.priceAsOf));
  return priority;
}

function daysSince(dateText) {
  if (!dateText) return Infinity;
  const date = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(date.getTime())) return Infinity;
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.floor((todayOnly - date) / msPerDay);
}

function validateStocks(stocks) {
  const warnings = [];
  const seenCodes = new Set();

  if (!stocks.length) warnings.push("銘柄マスタが空です");

  for (const stock of stocks) {
    const label = `${stock.code || "コード未設定"} ${stock.name || ""}`.trim();
    if (!stock.code) warnings.push("銘柄コードが未設定の行があります");
    if (stock.code && seenCodes.has(stock.code)) warnings.push(`銘柄コード重複: ${stock.code}`);
    if (stock.code) seenCodes.add(stock.code);
    if (!stock.name) warnings.push(`${label}: 銘柄名が未設定`);
    if (!Number.isFinite(stock.price) || stock.price <= 0) warnings.push(`${label}: 株価が不正`);
    if (!Number.isFinite(stock.shares) || stock.shares <= 0) warnings.push(`${label}: 発行株数が不正`);
    if (!Number.isFinite(stock.bps) || stock.bps <= 0) warnings.push(`${label}: BPSが不正`);
    if (!Number.isFinite(stock.netAssets) || stock.netAssets <= 0) warnings.push(`${label}: 純資産が不正`);
    if (Number.isFinite(stock.treasuryShares) && stock.treasuryShares >= stock.shares) {
      warnings.push(`${label}: 自己株式数が発行株数以上`);
    }
  }

  return [...new Set(warnings)];
}

function validateExternalReferences(payload) {
  const warnings = [];
  const codes = new Set(payload.stocks.map((stock) => stock.code));

  const checks = [
    ["株価", payload.rawInputs.priceUpdates ?? []],
    ["開示", payload.rawInputs.disclosures ?? []],
    ["EDINET相当", payload.rawInputs.edinetFacts ?? []],
    ["監視リスト", payload.rawInputs.watchlistItems ?? []],
  ];

  for (const [label, records] of checks) {
    const seen = new Set();
    for (const record of records) {
      if (!record.code) continue;
      if (seen.has(record.code) && label !== "開示") warnings.push(`${label}: コード重複 ${record.code}`);
      seen.add(record.code);
      if (!codes.has(record.code)) warnings.push(`${label}: 銘柄マスタにないコード ${record.code}`);
    }
  }

  return [...new Set(warnings)];
}

function publicSource(source) {
  if (!source) return "none";
  if (/^https?:\/\//.test(source) || source === "csv" || source === "none") return source;
  const relative = path.relative(rootDir, source);
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
    return relative.replace(/\\/g, "/");
  }
  return path.basename(source);
}

function publicProviderStatus(status) {
  return {
    ...status,
    source: publicSource(status.source),
  };
}

function writeGeneratedData(providerResult, priceResult, disclosureResult, edinetResult, watchlistResult, backtestResult) {
  const autoPromotionRows = readAutoPromotionStocks(providerResult.stocks, autoPromotionDraftCsv, universeMetricsCsv);
  const masterStocks = mergeAutoPromotionRows(providerResult.stocks, autoPromotionRows);
  const edinetUpdated = applyInlineFinancialFacts(applyEdinetFacts(masterStocks, edinetResult.facts));
  const priceUpdated = applyPriceUpdates(edinetUpdated, priceResult.prices);
  const disclosureUpdated = applyDisclosures(priceUpdated, disclosureResult.disclosures);
  const watchlistUpdated = applyWatchlist(disclosureUpdated, watchlistResult.items);
  const stocks = applyBacktestResults(watchlistUpdated, backtestResult.results);
  const providerStatuses = [
    providerResult.providerStatus,
    priceResult.providerStatus,
    disclosureResult.providerStatus,
    edinetResult.providerStatus,
    watchlistResult.providerStatus,
  ].map(publicProviderStatus);
  const payload = {
    generatedAt: new Date().toISOString(),
    source: publicSource(providerResult.source),
    priceSource: publicSource(priceResult.source),
    disclosureSource: publicSource(disclosureResult.source),
    edinetSource: publicSource(edinetResult.source),
    watchlistSource: publicSource(watchlistResult.source),
    fetchedAt: providerResult.fetchedAt,
    priceFetchedAt: priceResult.fetchedAt,
    disclosureFetchedAt: disclosureResult.fetchedAt,
    edinetFetchedAt: edinetResult.fetchedAt,
    nextSources: ["price-api", "edinet-api", "tdnet"],
    priceUpdates: priceResult.prices.length,
    disclosureUpdates: disclosureResult.disclosures.length,
    edinetUpdates: edinetResult.facts.length,
    watchlistUpdates: watchlistResult.items.length,
    backtestUpdates: backtestResult.results.length,
    autoPromotionUpdates: autoPromotionRows.length,
    providerStatuses,
    rawInputs: {
      priceUpdates: priceResult.prices,
      disclosures: disclosureResult.disclosures,
      edinetFacts: edinetResult.facts,
      watchlistItems: watchlistResult.items,
    },
    stocks,
  };
  payload.dataQuality = buildDataQuality(payload);
  delete payload.rawInputs;
  const js = `window.AUTO_STOCK_DATA = ${JSON.stringify(payload, null, 2)};\n`;
  fs.writeFileSync(outputJs, js, "utf8");
  return payload;
}

function mergeAutoPromotionRows(stocks, promotedRows) {
  if (!promotedRows.length) return stocks;
  return [...stocks, ...promotedRows];
}

function applyInlineFinancialFacts(stocks) {
  return stocks.map((stock) => {
    if (stock.edinet?.periodEnd) return stock;
    if (!["確認済み", "自動財務確認"].includes(stock.dataConfidence)) return stock;
    if (!Number.isFinite(stock.bps) || stock.bps <= 0 || !Number.isFinite(stock.netAssets) || stock.netAssets <= 0) return stock;
    return {
      ...stock,
      edinet: {
        documentType: stock.dataConfidence === "自動財務確認" ? "auto-financial" : "confirmed-financial",
        periodEnd: "stock-master",
        submittedAt: "",
        cash: stock.cash,
        securities: stock.securities,
        investmentSecurities: stock.investmentSecurities,
        interestDebt: stock.interestDebt,
        netAssets: stock.netAssets,
        rentalBook: stock.rentalBook,
        rentalMarket: stock.rentalMarket,
        bps: stock.bps,
        eps: stock.eps,
        sourceUrl: "",
      },
    };
  });
}

function writeReport(payload) {
  const lines = [
    "# データ更新レポート",
    "",
    `更新日時: ${payload.generatedAt}`,
    `入力元: ${payload.source}`,
    `株価入力元: ${payload.priceSource}`,
    `株価更新件数: ${payload.priceUpdates}`,
    `開示入力元: ${payload.disclosureSource}`,
    `開示件数: ${payload.disclosureUpdates}`,
    `EDINET入力元: ${payload.edinetSource}`,
    `EDINET更新件数: ${payload.edinetUpdates}`,
    `監視リスト入力元: ${payload.watchlistSource}`,
    `監視リスト件数: ${payload.watchlistUpdates}`,
    `バックテスト件数: ${payload.backtestUpdates}`,
    `自動昇格反映: ${payload.autoPromotionUpdates}件`,
    `銘柄数: ${payload.stocks.length}`,
    `データ状態: ${payload.dataQuality.ok ? "OK" : "要確認"}`,
    `本番準備度: ${payload.dataQuality.readiness.score}% ${payload.dataQuality.readiness.label}`,
    `一部手入力: ${payload.dataQuality.manualInputs.length}件`,
    "",
    "## データ取得状態",
    "",
    ...payload.providerStatuses.map((status) =>
      `- ${status.ok ? "OK" : "要確認"} ${status.label}: ${status.message} (${status.source})`
    ),
    "",
    "## データカバレッジ",
    "",
    `- 株価: ${payload.dataQuality.coverage.price}`,
    `- EDINET相当: ${payload.dataQuality.coverage.edinet}`,
    `- バックテスト: ${payload.stocks.length - payload.dataQuality.missingBacktest.length}/${payload.stocks.length}`,
    ...payload.dataQuality.missingPrice.map((item) => `- 株価未取得: ${item}`),
    ...payload.dataQuality.missingEdinet.map((item) => `- EDINET相当未取得: ${item}`),
    ...payload.dataQuality.validationWarnings.map((item) => `- 入力値要確認: ${item}`),
    ...payload.dataQuality.externalReferenceWarnings.map((item) => `- 参照要確認: ${item}`),
    ...payload.dataQuality.manualInputs.map((item) => `- 一部手入力: ${item}`),
    "",
    "## 次に直すデータ",
    "",
    ...(payload.dataQuality.nextFixes.length
      ? payload.dataQuality.nextFixes.map((item) => `- ${item}`)
      : ["- なし"]),
    "",
    "## 本番化の残り",
    "",
    ...(payload.dataQuality.readiness.blockers.length
      ? payload.dataQuality.readiness.blockers.map((item) => `- ${item}`)
      : ["- 本番運用開始の目安を満たしています"]),
    "",
    "## 次に接続する取得元",
    "",
    "- 株価API",
    "- EDINET API",
    "- TDnet",
    "",
    "## 銘柄",
    "",
    ...payload.stocks.map((stock) => `- ${stock.code} ${stock.name}`),
    "",
    "## 開示",
    "",
    ...payload.stocks
      .flatMap((stock) => (stock.disclosures ?? []).map((item) => `- ${stock.code} ${stock.name}: ${item.title}`)),
    "",
    "## EDINET更新",
    "",
    ...payload.stocks
      .filter((stock) => stock.edinet)
      .map((stock) => `- ${stock.code} ${stock.name}: ${stock.edinet.documentType} ${stock.edinet.periodEnd}`),
    "",
    "## 監視リスト",
    "",
    ...payload.stocks
      .filter((stock) => stock.watchlist)
      .map((stock) => `- ${stock.code} ${stock.name}: ${stock.watchlist.status} ${stock.watchlist.note}`),
    "",
  ];
  fs.writeFileSync(outputReport, lines.join("\n"), "utf8");
}

const providerResult = await fetchWithFallback(
  "銘柄マスタ",
  () => fetchStocksFromCsv({
    inputCsv,
    stockMasterCsvUrl: process.env.STOCK_MASTER_CSV_URL,
  }),
  () => fetchStocksFromCsv({ inputCsv: path.join(appDir, "sample-data.csv") }),
);
const priceResult = await fetchWithFallback(
  "株価",
  () => fetchPriceUpdates({
    inputPriceCsv,
    priceCsvUrl: process.env.PRICE_CSV_URL,
  }),
  () => fetchPriceUpdates({ inputPriceCsv }),
);
const disclosureResult = await fetchWithFallback(
  "適時開示",
  () => fetchDisclosures({
    inputDisclosureCsv,
    disclosureCsvUrl: process.env.DISCLOSURE_CSV_URL,
  }),
  () => fetchDisclosures({ inputDisclosureCsv }),
);
const edinetResult = await fetchWithFallback(
  "EDINET相当",
  () => fetchEdinetFacts({
    inputEdinetCsv,
    edinetCsvUrl: process.env.EDINET_FACTS_CSV_URL,
  }),
  () => fetchEdinetFacts({ inputEdinetCsv }),
);
const watchlistResult = await fetchWithFallback(
  "監視リスト",
  () => fetchWatchlist({
    inputWatchlistCsv,
    watchlistCsvUrl: process.env.WATCHLIST_CSV_URL,
  }),
  () => fetchWatchlist({ inputWatchlistCsv }),
);
const backtestResult = await fetchBacktestResults({ inputBacktestCsv });
const payload = writeGeneratedData(providerResult, priceResult, disclosureResult, edinetResult, watchlistResult, backtestResult);
writeReport(payload);

console.log(`generated ${payload.stocks.length} stocks`);
