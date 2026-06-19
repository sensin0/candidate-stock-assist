const fallbackStocks = [
  {
    code: "8841",
    name: "テーオーシー",
    sector: "不動産",
    price: 836,
    shares: 88217703,
    treasuryShares: 0,
    cash: 8300,
    securities: 4200,
    investmentSecurities: 18000,
    interestDebt: 7100,
    netAssets: 100230,
    rentalBook: 57880,
    rentalMarket: 184360,
    bps: 1136,
    eps: 42,
    pbrLow: 0.5,
    pbrAvg: 0.7,
    pbrHigh: 0.95,
    perLow: 12,
    perAvg: 16,
    perHigh: 22,
    dataConfidence: "確認済み",
    qualitativeDone: true,
    held: false,
    risk: "",
    catalyst: "不動産含み益",
    history: [610, 650, 620, 690, 720, 760, 800, 836],
  },
  {
    code: "6505",
    name: "東洋電機製造",
    sector: "電機",
    price: 1180,
    shares: 9735500,
    treasuryShares: 420000,
    cash: 8100,
    securities: 600,
    investmentSecurities: 9800,
    interestDebt: 3200,
    netAssets: 32100,
    rentalBook: 2100,
    rentalMarket: 4700,
    bps: 3400,
    eps: 96,
    pbrLow: 0.32,
    pbrAvg: 0.52,
    pbrHigh: 0.78,
    perLow: 10,
    perAvg: 18,
    perHigh: 24,
    dataConfidence: "一部手入力",
    qualitativeDone: true,
    held: true,
    risk: "",
    catalyst: "業績回復",
    history: [880, 930, 900, 1010, 1080, 1120, 1160, 1180],
  },
  {
    code: "3123",
    name: "サイボー",
    sector: "繊維・不動産",
    price: 625,
    shares: 12891200,
    treasuryShares: 0,
    cash: 2600,
    securities: 300,
    investmentSecurities: 4200,
    interestDebt: 2200,
    netAssets: 13200,
    rentalBook: 24640,
    rentalMarket: 41120,
    bps: 1024,
    eps: 28,
    pbrLow: 0.55,
    pbrAvg: 0.75,
    pbrHigh: 1.0,
    perLow: 11,
    perAvg: 16,
    perHigh: 22,
    dataConfidence: "確認済み",
    qualitativeDone: false,
    held: false,
    risk: "",
    catalyst: "含み資産",
    history: [590, 610, 600, 615, 640, 630, 620, 625],
  },
  {
    code: "3765",
    name: "ガンホー",
    sector: "情報通信",
    price: 2625,
    shares: 54337100,
    treasuryShares: 0,
    cash: 131804,
    securities: 0,
    investmentSecurities: 12000,
    interestDebt: 0,
    netAssets: 159000,
    rentalBook: 0,
    rentalMarket: 0,
    bps: 2926,
    eps: 140,
    pbrLow: 0.75,
    pbrAvg: 0.95,
    pbrHigh: 1.25,
    perLow: 15,
    perAvg: 19,
    perHigh: 25,
    dataConfidence: "確認済み",
    qualitativeDone: true,
    held: false,
    risk: "利益減少傾向",
    catalyst: "キャッシュリッチ",
    history: [3050, 2940, 2810, 2740, 2690, 2660, 2640, 2625],
  },
  {
    code: "8802",
    name: "三菱地所",
    sector: "不動産",
    price: 3940,
    shares: 1220000000,
    treasuryShares: 0,
    cash: 430000,
    securities: 0,
    investmentSecurities: 560000,
    interestDebt: 3200000,
    netAssets: 3900000,
    rentalBook: 4787815,
    rentalMarket: 9833537,
    bps: 3196,
    eps: 225,
    pbrLow: 0.95,
    pbrAvg: 1.2,
    pbrHigh: 1.45,
    perLow: 15,
    perAvg: 19,
    perHigh: 23,
    dataConfidence: "確認済み",
    qualitativeDone: true,
    held: true,
    risk: "",
    catalyst: "累進配当",
    history: [2750, 2920, 3100, 3350, 3620, 3810, 3880, 3940],
  },
  {
    code: "2484",
    name: "出前館",
    sector: "サービス",
    price: 135,
    shares: 111550000,
    treasuryShares: 0,
    cash: 28538,
    securities: 0,
    investmentSecurities: 0,
    interestDebt: 0,
    netAssets: 42000,
    rentalBook: 0,
    rentalMarket: 0,
    bps: 376,
    eps: -35,
    pbrLow: 0.35,
    pbrAvg: 0.6,
    pbrHigh: 0.9,
    perLow: 0,
    perAvg: 0,
    perHigh: 0,
    dataConfidence: "確認済み",
    qualitativeDone: false,
    held: false,
    risk: "赤字継続",
    catalyst: "ネットキャッシュ",
    history: [210, 190, 178, 160, 148, 142, 138, 135],
  },
  {
    code: "1897",
    name: "金下建設",
    sector: "建設",
    price: 2850,
    shares: 3800000,
    treasuryShares: 220000,
    cash: 16800,
    securities: 900,
    investmentSecurities: 6200,
    interestDebt: 500,
    netAssets: 31200,
    rentalBook: 1200,
    rentalMarket: 3900,
    bps: 6500,
    eps: 350,
    pbrLow: 0.48,
    pbrAvg: 0.68,
    pbrHigh: 0.95,
    perLow: 11,
    perAvg: 16,
    perHigh: 22,
    dataConfidence: "確認済み",
    qualitativeDone: true,
    held: false,
    risk: "",
    catalyst: "ネットキャッシュ",
    history: [3600, 3420, 3250, 3100, 3020, 2940, 2890, 2850],
  },
  {
    code: "9672",
    name: "東京都競馬",
    sector: "不動産・レジャー",
    price: 5850,
    shares: 28764000,
    treasuryShares: 900000,
    cash: 22500,
    securities: 2000,
    investmentSecurities: 8500,
    interestDebt: 18000,
    netAssets: 112000,
    rentalBook: 4280,
    rentalMarket: 210000,
    bps: 4020,
    eps: 280,
    pbrLow: 0.85,
    pbrAvg: 1.05,
    pbrHigh: 1.28,
    perLow: 14,
    perAvg: 18,
    perHigh: 20,
    dataConfidence: "一部手入力",
    qualitativeDone: true,
    held: true,
    risk: "",
    catalyst: "事業用不動産",
    history: [3900, 4200, 4550, 4920, 5250, 5600, 5780, 5850],
  },
];

let stocks = [];
let selectedCode = null;
let searchQuery = "";
let assistFilter = "all";

const csvHeaders = [
  "code",
  "name",
  "sector",
  "price",
  "shares",
  "treasuryShares",
  "cash",
  "securities",
  "investmentSecurities",
  "interestDebt",
  "netAssets",
  "rentalBook",
  "rentalMarket",
  "bps",
  "eps",
  "pbrLow",
  "pbrAvg",
  "pbrHigh",
  "perLow",
  "perAvg",
  "perHigh",
  "dataConfidence",
  "qualitativeDone",
  "held",
  "risk",
  "catalyst",
  "history",
];

const requiredCsvHeaders = [
  "code",
  "name",
  "price",
  "shares",
  "cash",
  "interestDebt",
  "netAssets",
  "bps",
  "eps",
  "pbrLow",
  "pbrHigh",
  "dataConfidence",
  "qualitativeDone",
  "held",
];

const yen = (value) => `${Math.round(value).toLocaleString("ja-JP")}円`;
const pct = (value) => `${Math.round(value * 10) / 10}%`;
const times = (value) => `${Math.round(value * 100) / 100}倍`;
const oku = (millionYen) => `${Math.round(millionYen / 100).toLocaleString("ja-JP")}億円`;
const msPerDay = 24 * 60 * 60 * 1000;

function daysSince(dateText) {
  if (!dateText) return Infinity;
  const date = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(date.getTime())) return Infinity;
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.floor((todayOnly - date) / msPerDay);
}

function evaluateDataFreshness(stock) {
  const warnings = [];
  const priceAge = daysSince(stock.priceAsOf);
  const edinetAge = daysSince(stock.edinet?.submittedAt);

  if (!stock.priceAsOf) warnings.push("株価日付が未確認");
  else if (priceAge > 5) warnings.push(`株価が${priceAge}日前`);

  if (!stock.edinet?.periodEnd) warnings.push("有報データ未取得");
  else if (edinetAge > 140) warnings.push("有報データが古い");

  if (stock.dataConfidence === "未確認" || stock.dataConfidence === "推定") {
    warnings.push(`データ信頼度: ${stock.dataConfidence}`);
  }

  if (!warnings.length) {
    return { level: "ok", label: "データ新鮮", warnings: ["株価と有報データを確認済み"] };
  }
  if (warnings.some((warning) => warning.includes("未") || warning.includes("古い"))) {
    return { level: "danger", label: "要確認", warnings };
  }
  return { level: "warn", label: "少し古い", warnings };
}

function effectiveMarketCap(stock) {
  return (stock.price * (stock.shares - stock.treasuryShares)) / 1_000_000;
}

function calculate(stock) {
  const dataFreshness = evaluateDataFreshness(stock);
  const marketCap = effectiveMarketCap(stock);
  const netCash = stock.cash + stock.securities - stock.interestDebt;
  const rentalGain = Math.max(0, stock.rentalMarket - stock.rentalBook);
  const taxAdjustedRentalGain = rentalGain * 0.7;
  const modifiedAssets = stock.netAssets + taxAdjustedRentalGain;
  const nonBusinessAssets =
    stock.cash + stock.securities + stock.investmentSecurities + stock.rentalMarket - stock.interestDebt;
  const businessValue = Math.max(0, stock.eps * (stock.shares - stock.treasuryShares) * 14 / 1_000_000);
  const intrinsicValue = businessValue + nonBusinessAssets;
  const pbrBuy = stock.bps * stock.pbrLow;
  const pbrTarget = stock.bps * stock.pbrHigh;
  const perBuy = stock.eps > 0 && stock.perLow > 0 ? stock.eps * stock.perLow : pbrBuy;
  const perTarget = stock.eps > 0 && stock.perHigh > 0 ? stock.eps * stock.perHigh : pbrTarget;
  const buyLine = Math.max(1, Math.min(pbrBuy, perBuy));
  const targetPrice = Math.max(pbrTarget, perTarget, buyLine * 1.5);
  const upside = (targetPrice / stock.price - 1) * 100;
  const buyRatio = stock.price / buyLine;
  const netCashRatio = netCash / marketCap;
  const nonBusinessAssetRatio = nonBusinessAssets / marketCap;
  const intrinsicValueRatio = intrinsicValue / marketCap;
  const modifiedPbr = marketCap / modifiedAssets;
  const realEstateGainRatio = rentalGain / marketCap;
  const score = scoreStock({
    netCashRatio,
    nonBusinessAssetRatio,
    intrinsicValueRatio,
    modifiedPbr,
    upside,
    buyRatio,
    stock,
  });

  return {
    ...stock,
    marketCap,
    netCash,
    rentalGain,
    modifiedAssets,
    nonBusinessAssets,
    businessValue,
    intrinsicValue,
    buyLine,
    targetPrice,
    upside,
    buyRatio,
    netCashRatio,
    nonBusinessAssetRatio,
    intrinsicValueRatio,
    modifiedPbr,
    realEstateGainRatio,
    score,
    dataFreshness,
  };
}

function scoreStock(v) {
  let score = 0;
  score += Math.min(24, Math.max(0, v.nonBusinessAssetRatio) * 14);
  score += Math.min(16, Math.max(0, v.netCashRatio) * 10);
  score += v.modifiedPbr <= 0.5 ? 16 : v.modifiedPbr <= 0.8 ? 10 : v.modifiedPbr <= 1 ? 5 : 0;
  score += v.buyRatio <= 1 ? 18 : v.buyRatio <= 1.05 ? 14 : v.buyRatio <= 1.15 ? 8 : 0;
  score += v.upside >= 50 ? 12 : v.upside >= 30 ? 8 : v.upside >= 15 ? 4 : 0;
  score += v.stock.qualitativeDone ? 8 : 0;
  score += v.stock.catalyst ? 6 : 0;
  score -= v.stock.risk ? 14 : 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function assistFor(stock) {
  const seriousRisk = Boolean(stock.risk);
  const confirmed = stock.dataConfidence === "確認済み" || stock.dataConfidence === "一部手入力";
  const freshEnough = stock.dataFreshness?.level === "ok";

  if (seriousRisk) {
    return makeAssist("リスクで見送り", "label-risk", [
      stock.risk,
      "数字だけでは判断できません",
      "リスク理由の確認が先です",
    ], ["悪化理由を確認", "現金の減り方を確認"]);
  }

  if (stock.held && stock.price >= stock.targetPrice) {
    return makeAssist("今売り検討", "label-sell", [
      "目標株価に到達しています",
      "安全域が小さくなっています",
      "代替候補と比較してください",
    ], ["保有比率を確認", "税金と入れ替え候補を確認"]);
  }

  if (stock.held && stock.price >= stock.targetPrice * 0.9) {
    return makeAssist("一部利益確定検討", "label-sell", [
      "目標株価に近づいています",
      "上昇余地が小さくなっています",
    ], ["売却ではなく一部調整も検討", "他候補の安全域を確認"]);
  }

  if (!confirmed || !stock.qualitativeDone || !freshEnough) {
    if (stock.buyRatio <= 1.05 && stock.upside >= 50) {
      return makeAssist("調査が先", "label-research", [
        "数値上は買い場に近いです",
        stock.dataFreshness?.warnings[0] ?? "データ確認が必要です",
        "データ確認後に判断してください",
      ], ["有価証券報告書を確認", "不動産と政策保有株を確認"]);
    }
  }

  if (stock.buyRatio <= 1 && stock.upside >= 50 && stock.score >= 70 && stock.qualitativeDone && freshEnough) {
    return makeAssist("今買い候補", "label-buy", [
      "買いラインを下回っています",
      `目標株価まで${pct(stock.upside)}の余地があります`,
      `非事業資産倍率が${times(stock.nonBusinessAssetRatio)}あります`,
    ], ["有報の資産欄を再確認", "直近決算の悪化要因を確認"]);
  }

  if (stock.buyRatio <= 1.05 && stock.upside >= 50) {
    return makeAssist("買い場に近い", "label-near", [
      "買い目安にかなり近いです",
      `目標株価まで${pct(stock.upside)}の余地があります`,
    ], ["有報確認が完了しているか確認", "買いラインの根拠を確認"]);
  }

  if (stock.held) {
    return makeAssist("保有継続候補", "label-near", [
      "目標株価まで余地があります",
      "重大なリスク警告はありません",
    ], ["保有比率を確認", "次回決算予定を確認"]);
  }

  return makeAssist("まだ待つ", "label-wait", [
    "買いラインまで距離があります",
    "急いで判断する状態ではありません",
  ], ["監視リストで継続確認", "買いライン到達を待つ"]);
}

function makeAssist(label, className, reasons, nextActions) {
  return { label, className, reasons: reasons.slice(0, 3), nextActions };
}

function enrichAll(data) {
  return data.map(calculate).map((stock) => ({ ...stock, assist: assistFor(stock) }));
}

function loadSample() {
  stocks = enrichAll(fallbackStocks);
  selectedCode = stocks[0]?.code ?? null;
  setImportStatus("サンプルデータを表示中");
  setAutoUpdateStatus("サンプル表示中");
  render();
}

function loadInitialData() {
  if (window.AUTO_STOCK_DATA?.stocks?.length) {
    stocks = enrichAll(window.AUTO_STOCK_DATA.stocks);
    selectedCode = stocks[0]?.code ?? null;
    const generatedAt = window.AUTO_STOCK_DATA.generatedAt
      ? new Date(window.AUTO_STOCK_DATA.generatedAt).toLocaleString("ja-JP")
      : "日時不明";
    const priceUpdates = window.AUTO_STOCK_DATA.priceUpdates ?? 0;
    const edinetUpdates = window.AUTO_STOCK_DATA.edinetUpdates ?? 0;
    const qualityLabel = window.AUTO_STOCK_DATA.dataQuality?.ok ? "データ状態OK" : "データ要確認";
    setImportStatus(`自動更新データを表示中: ${generatedAt} / ${qualityLabel} / 株価更新 ${priceUpdates}件 / EDINET ${edinetUpdates}件`, !window.AUTO_STOCK_DATA.dataQuality?.ok);
    setAutoUpdateStatus("自動更新データ 読込済み");
    render();
    return;
  }
  loadSample();
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const headers = lines.shift().split(",").map((h) => h.trim());
  validateCsvHeaders(headers);
  return lines.map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return normalizeCsvRow(row);
  });
}

function validateCsvHeaders(headers) {
  const missing = requiredCsvHeaders.filter((header) => !headers.includes(header));
  if (missing.length) {
    throw new Error(`CSVの必須列が足りません: ${missing.join(", ")}`);
  }
}

function normalizeCsvRow(row) {
  const numberFields = [
    "price",
    "shares",
    "treasuryShares",
    "cash",
    "securities",
    "investmentSecurities",
    "interestDebt",
    "netAssets",
    "rentalBook",
    "rentalMarket",
    "bps",
    "eps",
    "pbrLow",
    "pbrAvg",
    "pbrHigh",
    "perLow",
    "perAvg",
    "perHigh",
  ];
  const stock = {
    code: row.code,
    name: row.name,
    sector: row.sector || "未分類",
    dataConfidence: row.dataConfidence || "未確認",
    qualitativeDone: row.qualitativeDone === "true" || row.qualitativeDone === "1",
    held: row.held === "true" || row.held === "1",
    risk: row.risk || "",
    catalyst: row.catalyst || "",
    history: row.history ? row.history.split("|").map(Number) : [],
  };
  numberFields.forEach((field) => {
    stock[field] = Number(row[field] || 0);
  });
  if (!stock.history.length) {
    stock.history = [stock.price * 0.9, stock.price * 0.95, stock.price];
  }
  return stock;
}

function render() {
  renderSummary();
  renderAssistColumns();
  renderRanking();
  renderDetail();
  renderMorningReport();
}

function visibleStocks() {
  const q = searchQuery.trim().toLowerCase();
  return stocks.filter((stock) => {
    const text = `${stock.code} ${stock.name} ${stock.sector}`.toLowerCase();
    const searchOk = !q || text.includes(q);
    const assistOk = assistFilter === "all" || stock.assist.label === assistFilter;
    return searchOk && assistOk;
  });
}

function byAssist(label, source = visibleStocks()) {
  return source.filter((stock) => stock.assist.label === label);
}

function renderSummary() {
  const visible = visibleStocks();
  const buyNow = byAssist("今買い候補", visible).length;
  const sellNow = byAssist("今売り検討", visible).length + byAssist("一部利益確定検討", visible).length;
  const risk = byAssist("リスクで見送り", visible).length;
  const near = byAssist("買い場に近い", visible).length;
  const watched = visible.filter((stock) => stock.watchlist).length;
  const qualityWarning = window.AUTO_STOCK_DATA?.dataQuality?.ok === false
    ? " データ要確認の項目があります。"
    : "";
  document.getElementById("todaySummary").textContent =
    `表示中の${visible.length}銘柄では、今買い候補${buyNow}件、今売り検討${sellNow}件、買い場に近い銘柄${near}件、監視中${watched}件、リスク確認${risk}件です。${qualityWarning}`;
  document.getElementById("summaryStats").innerHTML = [
    ["今買い", buyNow],
    ["売り検討", sellNow],
    ["買い場近い", near],
    ["監視中", watched],
    ["リスク", risk],
  ]
    .map(([label, value]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`)
    .join("");
}

function renderAssistColumns() {
  const visible = visibleStocks();
  const sections = {
    buyNow: byAssist("今買い候補", visible),
    nearBuy: byAssist("買い場に近い", visible).concat(byAssist("調査が先", visible)),
    sellNow: byAssist("今売り検討", visible).concat(byAssist("一部利益確定検討", visible)),
    risk: byAssist("リスクで見送り", visible),
  };
  Object.entries(sections).forEach(([key, list]) => {
    document.getElementById(`${key}Count`).textContent = list.length;
    document.getElementById(`${key}List`).innerHTML =
      list.slice(0, 5).map(renderCandidateCard).join("") || `<p class="reason">該当なし</p>`;
  });
}

function renderCandidateCard(stock) {
  return `
    <article class="candidate-card ${stock.code === selectedCode ? "active" : ""}" data-code="${stock.code}">
      <div class="card-top">
        <div>
          <div class="stock-name">${stock.name}</div>
          <div class="stock-code">${stock.code} / ${stock.sector}</div>
        </div>
        <span class="assist-label ${stock.assist.className}">${stock.assist.label}</span>
      </div>
      <p class="reason">${stock.assist.reasons[0] ?? ""}</p>
      ${renderWatchlistLine(stock)}
      ${renderFreshnessLine(stock)}
      ${renderMiniMeter(stock)}
    </article>
  `;
}

function renderMiniMeter(stock) {
  const pos = markerPosition(stock);
  return `<div class="mini-meter"><span class="meter-marker" style="left:${pos}%"></span></div>`;
}

function markerPosition(stock) {
  const min = Math.max(1, stock.buyLine * 0.75);
  const max = Math.max(stock.targetPrice * 1.15, stock.price);
  return Math.max(0, Math.min(98, ((stock.price - min) / (max - min)) * 100));
}

function rankingFor(type) {
  const copy = [...visibleStocks()];
  if (type === "watchlist") return copy.filter((s) => s.watchlist).sort((a, b) => b.score - a.score);
  if (type === "buyNow") return copy.filter((s) => s.assist.label === "今買い候補");
  if (type === "nearBuy") return copy.filter((s) => ["買い場に近い", "調査が先"].includes(s.assist.label));
  if (type === "safe") return copy.sort((a, b) => b.nonBusinessAssetRatio - a.nonBusinessAssetRatio);
  if (type === "upside") return copy.sort((a, b) => b.upside - a.upside);
  if (type === "realEstate") return copy.sort((a, b) => b.realEstateGainRatio - a.realEstateGainRatio);
  if (type === "netCash") return copy.sort((a, b) => b.netCashRatio - a.netCashRatio);
  return copy.sort((a, b) => b.score - a.score);
}

function renderRanking() {
  const type = document.getElementById("rankingSelect").value;
  const list = rankingFor(type).slice(0, 20);
  document.getElementById("rankingList").innerHTML =
    list.map((stock, index) => renderRankingRow(stock, index)).join("") || `<p class="reason">該当なし</p>`;
}

function renderRankingRow(stock, index) {
  return `
    <article class="ranking-row ${stock.code === selectedCode ? "active" : ""}" data-code="${stock.code}">
      <div class="ranking-top">
        <div>
          <strong>${index + 1}. ${stock.name}</strong>
          <div class="stock-code">${stock.code}</div>
        </div>
        <span class="assist-label ${stock.assist.className}">${stock.assist.label}</span>
      </div>
      <p class="reason">${topReason(stock)}</p>
      <div class="ranking-meta">
        ${stock.watchlist ? `<span>${stock.watchlist.status}</span>` : ""}
        <span>スコア ${stock.score}</span>
        <span>上昇余地 ${pct(stock.upside)}</span>
        <span>修正PBR ${times(stock.modifiedPbr)}</span>
        <span>${stock.dataFreshness.label}</span>
      </div>
      ${renderMiniMeter(stock)}
    </article>
  `;
}

function topReason(stock) {
  if (stock.assist.reasons[0]) return stock.assist.reasons[0];
  if (stock.nonBusinessAssetRatio >= 1) return "非事業資産が時価総額を上回っています";
  if (stock.netCashRatio >= 0.7) return "ネットキャッシュが厚い銘柄です";
  return "総合スコア順で上位です";
}

function renderDetail() {
  const visible = visibleStocks();
  const stock = visible.find((item) => item.code === selectedCode) ?? visible[0] ?? stocks[0];
  if (!stock) return;
  selectedCode = stock.code;
  document.getElementById("detailAssist").textContent = stock.assist.label;
  document.getElementById("detailAssist").className = `assist-label ${stock.assist.className}`;
  document.getElementById("detailTitle").textContent = `${stock.name} (${stock.code})`;
  document.getElementById("detailBadges").innerHTML = [
    stock.held ? "保有中" : "未保有",
    stock.dataConfidence,
    stock.watchlist ? stock.watchlist.status : "未監視",
    stock.qualitativeDone ? "有報確認済み" : "有報確認待ち",
    stock.edinet?.periodEnd ? `有報 ${stock.edinet.periodEnd}` : "有報未取得",
  ].map((label) => `<span class="badge">${label}</span>`).join("") + renderFreshnessBadge(stock);
  document.getElementById("tradeMeter").innerHTML = renderTradeMeter(stock);
  document.getElementById("chart").innerHTML = renderChart(stock);
  document.getElementById("reasonList").innerHTML = stock.assist.reasons.map((r) => `<li>${r}</li>`).join("");
  document.getElementById("nextActionList").innerHTML = stock.assist.nextActions.map((a) => `<li>${a}</li>`).join("");
  document.getElementById("metricGrid").innerHTML = renderMetrics(stock);
}

function renderTradeMeter(stock) {
  const pos = markerPosition(stock);
  return `
    <div class="card-top">
      <strong>${stock.assist.label}</strong>
      <span>${yen(stock.price)}</span>
    </div>
    <div class="meter-track"><span class="meter-marker" style="left:${pos}%"></span></div>
    <div class="meter-labels">
      <span>買いライン ${yen(stock.buyLine)}</span>
      <span>現在 ${yen(stock.price)}</span>
      <span>目標 ${yen(stock.targetPrice)}</span>
    </div>
  `;
}

function renderMetrics(stock) {
  const providerWarnings = window.AUTO_STOCK_DATA?.dataQuality?.providerWarnings ?? [];
  const metrics = [
    ["監視状態", stock.watchlist?.status || "未監視"],
    ["監視メモ", stock.watchlist?.note || "なし"],
    ["データ鮮度", stock.dataFreshness?.label || "未確認"],
    ["鮮度メモ", stock.dataFreshness?.warnings?.[0] || "確認済み"],
    ["取得状態", providerWarnings.length ? `${providerWarnings.length}件要確認` : "OK"],
    ["株価日付", stock.priceAsOf || "未確認"],
    ["有報対象期", stock.edinet?.periodEnd || "未取得"],
    ["有報提出日", stock.edinet?.submittedAt || "未取得"],
    ["直近カタリスト", stock.catalyst || "なし"],
    ["開示件数", `${stock.disclosures?.length ?? 0}件`],
    ["実質時価総額", oku(stock.marketCap)],
    ["ネットキャッシュ倍率", times(stock.netCashRatio)],
    ["非事業資産倍率", times(stock.nonBusinessAssetRatio)],
    ["内在価値倍率", times(stock.intrinsicValueRatio)],
    ["修正PBR", times(stock.modifiedPbr)],
    ["不動産含み益/時価総額", times(stock.realEstateGainRatio)],
    ["買いライン接近率", times(stock.buyRatio)],
    ["上昇余地", pct(stock.upside)],
    ["総合スコア", `${stock.score}点`],
  ];
  return metrics.map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`).join("");
}

function renderFreshnessBadge(stock) {
  const freshness = stock.dataFreshness ?? { level: "danger", label: "要確認" };
  return `<span class="badge freshness freshness-${freshness.level}">${freshness.label}</span>`;
}

function renderFreshnessLine(stock) {
  const freshness = stock.dataFreshness;
  if (!freshness || freshness.level === "ok") return "";
  return `<p class="freshness-line">${freshness.label}: ${freshness.warnings[0]}</p>`;
}

function renderWatchlistLine(stock) {
  if (!stock.watchlist) return "";
  return `<p class="watchlist-line">${stock.watchlist.status}: ${stock.watchlist.note || "継続確認"}</p>`;
}

function renderChart(stock) {
  const width = 880;
  const height = 330;
  const pad = { left: 58, right: 28, top: 28, bottom: 42 };
  const values = [...stock.history, stock.buyLine, stock.targetPrice, stock.price];
  const min = Math.max(1, Math.min(...values) * 0.82);
  const max = Math.max(...values) * 1.12;
  const x = (index) => pad.left + (index / Math.max(1, stock.history.length - 1)) * (width - pad.left - pad.right);
  const y = (value) => pad.top + (1 - (value - min) / (max - min)) * (height - pad.top - pad.bottom);
  const points = stock.history.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const buyY = y(stock.buyLine);
  const targetY = y(stock.targetPrice);
  const currentX = x(stock.history.length - 1);
  const currentY = y(stock.price);
  const buyZoneHeight = Math.max(0, height - pad.bottom - buyY);
  const sellZoneHeight = Math.max(0, targetY - pad.top);
  const assistText = stock.assist.label === "今売り検討" || stock.assist.label === "一部利益確定検討"
    ? "ここから売り検討"
    : stock.assist.label === "今買い候補"
      ? "ここで買い候補"
      : stock.assist.label;
  const calloutColor = stock.assist.className.includes("sell") ? "#c44536" : stock.assist.className.includes("buy") ? "#1f8a55" : "#246a9f";

  return `
    <svg viewBox="0 0 ${width} ${height}" aria-label="${stock.name}の株価チャート">
      <rect x="${pad.left}" y="${pad.top}" width="${width - pad.left - pad.right}" height="${height - pad.top - pad.bottom}" fill="#ffffff" />
      <rect x="${pad.left}" y="${buyY}" width="${width - pad.left - pad.right}" height="${buyZoneHeight}" fill="#dff3e8" />
      <rect x="${pad.left}" y="${pad.top}" width="${width - pad.left - pad.right}" height="${sellZoneHeight}" fill="#f7dedb" />
      <line x1="${pad.left}" x2="${width - pad.right}" y1="${buyY}" y2="${buyY}" stroke="#1f8a55" stroke-width="2" stroke-dasharray="6 6" />
      <line x1="${pad.left}" x2="${width - pad.right}" y1="${targetY}" y2="${targetY}" stroke="#c44536" stroke-width="2" stroke-dasharray="6 6" />
      <polyline points="${points}" fill="none" stroke="#246a9f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${currentX}" cy="${currentY}" r="7" fill="#1d2522" />
      <g transform="translate(${Math.min(currentX + 18, width - 250)}, ${Math.max(42, currentY - 50)})">
        <rect width="220" height="48" rx="8" fill="#ffffff" stroke="${calloutColor}" />
        <text x="12" y="20" class="callout" fill="${calloutColor}">${assistText}</text>
        <text x="12" y="38" font-size="12" fill="#65706b">${stock.assist.reasons[0] ?? ""}</text>
      </g>
      <text x="${pad.left}" y="${buyY - 8}" font-size="12" fill="#1f8a55">買いライン ${yen(stock.buyLine)}</text>
      <text x="${pad.left}" y="${targetY - 8}" font-size="12" fill="#c44536">目標株価 ${yen(stock.targetPrice)}</text>
      <text x="${currentX - 42}" y="${currentY + 24}" font-size="12" fill="#1d2522">現在 ${yen(stock.price)}</text>
    </svg>
  `;
}

function renderMorningReport() {
  const visible = visibleStocks();
  const buyNow = byAssist("今買い候補", visible).slice(0, 5);
  const sellNow = byAssist("今売り検討", visible).concat(byAssist("一部利益確定検討", visible)).slice(0, 5);
  const near = byAssist("買い場に近い", visible).concat(byAssist("調査が先", visible)).slice(0, 10);
  const risk = byAssist("リスクで見送り", visible).slice(0, 5);
  const watched = visible.filter((stock) => stock.watchlist).slice(0, 10);
  const disclosures = visible.filter((stock) => stock.disclosures?.length).slice(0, 10);
  const stale = visible.filter((stock) => stock.dataFreshness?.level !== "ok").slice(0, 10);
  const report = [
    "# 朝レポート",
    "",
    `今日は今買い候補${buyNow.length}件、今売り検討${sellNow.length}件、買い場に近い銘柄${near.length}件です。`,
    "",
    sectionMarkdown("今買い候補", buyNow),
    sectionMarkdown("今売り検討", sellNow),
    watchlistMarkdown("監視リスト", watched),
    sectionMarkdown("買い場に近い・調査が先", near),
    disclosureMarkdown("カタリスト・開示", disclosures),
    freshnessMarkdown("データ要確認", stale),
    sectionMarkdown("リスク確認", risk),
    "",
    "注意: このレポートは売買推奨ではありません。候補を確認するためのアシストです。",
  ].join("\n");
  document.getElementById("morningReport").value = report;
}

function sectionMarkdown(title, list) {
  if (!list.length) return `## ${title}\n該当なし\n`;
  return [
    `## ${title}`,
    ...list.map((stock) =>
      `- ${stock.code} ${stock.name}: ${stock.assist.label}。${stock.assist.reasons[0]} / 次に確認: ${stock.assist.nextActions[0]}`
    ),
    "",
  ].join("\n");
}

function disclosureMarkdown(title, list) {
  if (!list.length) return `## ${title}\n該当なし\n`;
  return [
    `## ${title}`,
    ...list.flatMap((stock) =>
      stock.disclosures.map((item) => `- ${stock.code} ${stock.name}: ${item.title}`)
    ),
    "",
  ].join("\n");
}

function watchlistMarkdown(title, list) {
  if (!list.length) return `## ${title}\n該当なし\n`;
  return [
    `## ${title}`,
    ...list.map((stock) => `- ${stock.code} ${stock.name}: ${stock.watchlist.status}。${stock.watchlist.note || stock.assist.reasons[0]}`),
    "",
  ].join("\n");
}

function freshnessMarkdown(title, list) {
  if (!list.length) return `## ${title}\n該当なし\n`;
  return [
    `## ${title}`,
    ...list.map((stock) => `- ${stock.code} ${stock.name}: ${stock.dataFreshness.label}。${stock.dataFreshness.warnings.join(" / ")}`),
    "",
  ].join("\n");
}

function setupEvents() {
  document.body.addEventListener("click", (event) => {
    const card = event.target.closest("[data-code]");
    if (!card) return;
    selectedCode = card.dataset.code;
    render();
  });
  document.getElementById("rankingSelect").addEventListener("change", renderRanking);
  document.getElementById("sampleButton").addEventListener("click", loadSample);
  document.getElementById("templateButton").addEventListener("click", downloadCsvTemplate);
  document.getElementById("searchInput").addEventListener("input", (event) => {
    searchQuery = event.target.value;
    render();
  });
  document.getElementById("assistFilter").addEventListener("change", (event) => {
    assistFilter = event.target.value;
    render();
  });
  document.getElementById("copyReportButton").addEventListener("click", async () => {
    const text = document.getElementById("morningReport").value;
    try {
      await navigator.clipboard.writeText(text);
      document.getElementById("copyReportButton").textContent = "コピー済み";
      setTimeout(() => (document.getElementById("copyReportButton").textContent = "Markdownをコピー"), 1400);
    } catch {
      document.getElementById("morningReport").select();
    }
  });
  document.getElementById("csvInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      stocks = enrichAll(parsed);
      selectedCode = stocks[0]?.code ?? null;
      setImportStatus(`${file.name} を${stocks.length}件読み込みました`);
      render();
    } catch (error) {
      setImportStatus(error.message || "CSVの読み込みに失敗しました", true);
    } finally {
      event.target.value = "";
    }
  });
}

function setImportStatus(message, isError = false) {
  const element = document.getElementById("importStatus");
  if (!element) return;
  element.textContent = message;
  element.style.background = isError ? "var(--red-soft)" : "var(--gray-soft)";
  element.style.color = isError ? "var(--red)" : "var(--muted)";
}

function setAutoUpdateStatus(message) {
  const element = document.getElementById("autoUpdateButton");
  if (!element) return;
  element.textContent = message;
}

function downloadCsvTemplate() {
  const example = csvHeaders.map((header) => {
    const sample = fallbackStocks[0];
    if (header === "history") return sample.history.join("|");
    return sample[header] ?? "";
  });
  const csv = `${csvHeaders.join(",")}\n${example.join(",")}\n`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "candidate-stock-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

setupEvents();
loadInitialData();
