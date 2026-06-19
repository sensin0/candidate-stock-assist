import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchStocksFromCsv } from "./providers/csv-provider.mjs";
import { applyDisclosures, fetchDisclosures } from "./providers/disclosure-provider.mjs";
import { applyEdinetFacts, fetchEdinetFacts } from "./providers/edinet-provider.mjs";
import { applyPriceUpdates, fetchPriceUpdates } from "./providers/price-provider.mjs";
import { applyWatchlist, fetchWatchlist } from "./providers/watchlist-provider.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.join(rootDir, "app");
const dataDir = path.join(rootDir, "data");
const inputCsv = path.join(appDir, "sample-data.csv");
const inputPriceCsv = path.join(dataDir, "price-updates.csv");
const inputDisclosureCsv = path.join(dataDir, "disclosures.csv");
const inputEdinetCsv = path.join(dataDir, "edinet-facts.csv");
const inputWatchlistCsv = path.join(dataDir, "watchlist.csv");
const outputJs = path.join(appDir, "generated-data.js");
const outputReport = path.join(appDir, "latest-update-report.md");

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
  const missingEdinet = stocks.filter((stock) => !stock.edinet?.periodEnd).map((stock) => `${stock.code} ${stock.name}`);
  const validationWarnings = validateStocks(stocks);
  const externalReferenceWarnings = validateExternalReferences(payload);
  const stale = stocks
    .filter((stock) => stock.dataConfidence === "未確認" || !stock.priceAsOf || !stock.edinet?.periodEnd)
    .map((stock) => `${stock.code} ${stock.name}`);
  const providerWarnings = payload.providerStatuses.filter((status) => !status.ok);

  return {
    ok: !providerWarnings.length
      && !missingPrice.length
      && !missingEdinet.length
      && !validationWarnings.length
      && !externalReferenceWarnings.length,
    providerWarnings,
    validationWarnings,
    externalReferenceWarnings,
    missingPrice,
    missingEdinet,
    stale,
    coverage: {
      price: `${stocks.length - missingPrice.length}/${stocks.length}`,
      edinet: `${stocks.length - missingEdinet.length}/${stocks.length}`,
    },
  };
}

function validateStocks(stocks) {
  const warnings = [];
  const seenCodes = new Set();

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

function writeGeneratedData(providerResult, priceResult, disclosureResult, edinetResult, watchlistResult) {
  const edinetUpdated = applyEdinetFacts(providerResult.stocks, edinetResult.facts);
  const priceUpdated = applyPriceUpdates(edinetUpdated, priceResult.prices);
  const disclosureUpdated = applyDisclosures(priceUpdated, disclosureResult.disclosures);
  const stocks = applyWatchlist(disclosureUpdated, watchlistResult.items);
  const providerStatuses = [
    {
      label: "銘柄マスタ",
      ok: true,
      message: "取得成功",
      source: providerResult.source,
    },
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
    `銘柄数: ${payload.stocks.length}`,
    `データ状態: ${payload.dataQuality.ok ? "OK" : "要確認"}`,
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
    ...payload.dataQuality.missingPrice.map((item) => `- 株価未取得: ${item}`),
    ...payload.dataQuality.missingEdinet.map((item) => `- EDINET相当未取得: ${item}`),
    ...payload.dataQuality.validationWarnings.map((item) => `- 入力値要確認: ${item}`),
    ...payload.dataQuality.externalReferenceWarnings.map((item) => `- 参照要確認: ${item}`),
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

const providerResult = await fetchStocksFromCsv({ inputCsv });
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
const payload = writeGeneratedData(providerResult, priceResult, disclosureResult, edinetResult, watchlistResult);
writeReport(payload);

console.log(`generated ${payload.stocks.length} stocks`);
