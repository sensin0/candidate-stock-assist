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
let selectedResearch = null;
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
  const backtest = normalizeBacktest(stock.backtest, { ...stock, buyLine, targetPrice });
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
    backtest,
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
    backtest,
  };
}

function normalizeBacktest(backtest, stock) {
  if (backtest) return backtest;
  const sampleCount = stock.history?.length ?? 0;
  return {
    bestStrategyId: "value-line",
    bestStrategyLabel: "買いライン到達で買い",
    timingLabel: sampleCount >= 4 ? "参考" : "未検証",
    buyTiming: `買いライン到達 (${yen(stock.buyLine)}以下)`,
    sellTiming: `目標の90%付近 (${yen(stock.targetPrice * 0.9)}目安)`,
    confidence: sampleCount >= 4 ? "参考" : "未検証",
    sampleCount,
    trades: 0,
    winRate: 0,
    averageReturn: 0,
    maxDrawdown: 0,
    bestScore: 0,
  };
}

function scoreStock(v) {
  let score = 0;
  score += Math.min(24, Math.max(0, v.nonBusinessAssetRatio) * 14);
  score += Math.min(16, Math.max(0, v.netCashRatio) * 10);
  score += v.modifiedPbr <= 0.5 ? 16 : v.modifiedPbr <= 0.8 ? 10 : v.modifiedPbr <= 1 ? 5 : 0;
  score += v.buyRatio <= 1 ? 18 : v.buyRatio <= 1.05 ? 14 : v.buyRatio <= 1.15 ? 8 : 0;
  score += v.upside >= 50 ? 12 : v.upside >= 30 ? 8 : v.upside >= 15 ? 4 : 0;
  score += isGoodBacktest(v.backtest) ? 8 : 0;
  score -= isBadBacktest(v.backtest) ? 28 : 0;
  score += v.stock.qualitativeDone ? 8 : 0;
  score += v.stock.catalyst ? 6 : 0;
  score -= v.stock.risk ? 14 : 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function isBadBacktest(backtest) {
  if (!backtest || backtest.trades < 1) return false;
  return backtest.averageReturn < 0 || backtest.winRate < 50 || backtest.maxDrawdown <= -15;
}

function isGoodBacktest(backtest) {
  if (!backtest || backtest.trades < 1) return false;
  return backtest.averageReturn > 0 && backtest.winRate >= 60 && backtest.maxDrawdown > -15;
}

function financialScreeningFor(stock) {
  const code = String(stock.code ?? "").trim();
  if (!code) return null;
  return (window.AUTO_FINANCIAL_SCREENING?.top ?? []).find((item) => String(item.code) === code) ?? null;
}

function autoFinancialFollowupFor(stock) {
  const code = String(stock.code ?? "").trim();
  if (!code) return null;
  return (window.AUTO_FINANCIAL_FOLLOWUP?.top ?? []).find((item) => String(item.code) === code) ?? null;
}

function isPriorityAutoFinancialFollowup(stock) {
  const followup = autoFinancialFollowupFor(stock);
  return followup && ["自動確認済み・買い場接近", "財務確認を進める"].includes(followup.action);
}

function financialScreeningGuardAssist(stock) {
  const screening = financialScreeningFor(stock);
  if (!screening || stock.held || stock.buyRatio > 1.05 || stock.upside < 50) return null;

  if (screening.status === "見送り寄り") {
    return makeAssist("財務で見送り", "label-risk", [
      screening.cautions && screening.cautions !== "大きな注意なし"
        ? screening.cautions
        : "財務スクリーニングで通常候補へ入れない判定です",
      screening.reasons || "割安に見えても財務面の確認材料が不足しています",
      "今買い候補には上げません",
    ], ["PERと利益の継続性を確認", "負債と純資産を再確認"]);
  }

  if (screening.status === "慎重確認") {
    return makeAssist("財務慎重確認", "label-research", [
      screening.cautions && screening.cautions !== "大きな注意なし"
        ? screening.cautions
        : "財務の追加確認が必要です",
      screening.reasons || "数値上は候補ですが確認前です",
      "確認が済むまで今買い候補には上げません",
    ], ["負債の重さを確認", "利益が一過性でないか確認"]);
  }

  return null;
}

function assistFor(stock) {
  const seriousRisk = Boolean(stock.risk);
  const confirmed = isConfirmedEnough(stock);
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

  if (!stock.held && isBadBacktest(stock.backtest)) {
    return makeAssist("検証弱く見送り", "label-risk", [
      `バックテスト平均が${pct(stock.backtest.averageReturn)}です`,
      `勝率${pct(stock.backtest.winRate)}、最大下落${pct(stock.backtest.maxDrawdown)}です`,
      "割安でもタイミングの相性が悪い可能性があります",
    ], ["過去価格を増やして再検証", "決算悪化や需給を確認"]);
  }

  const financialGuard = financialScreeningGuardAssist(stock);
  if (financialGuard) return financialGuard;

  if (!confirmed || !stock.qualitativeDone || !freshEnough) {
    if (stock.buyRatio <= 1.05 && stock.upside >= 50) {
      if (!freshEnough) {
        return makeAssist("データ更新待ち", "label-research", [
          "買い場に近いですが株価データが古いです",
          stock.dataFreshness?.warnings[0] ?? "データ確認が必要です",
          "最新株価に更新してから判断してください",
        ], ["最新株価を確認", "更新後に買いラインを再判定"]);
      }
      return makeAssist("財務確認待ち", "label-research", [
        "買い場に近いですが財務確認が未完了です",
        "確認前なので買い候補には上げません",
        "有報と決算短信を見てから判断してください",
      ], ["有価証券報告書を確認", "不動産と政策保有株を確認"]);
    }
  }

  if (isAutoFinancial(stock) && isPriorityAutoFinancialFollowup(stock)) {
    const followup = autoFinancialFollowupFor(stock);
    return makeAssist("買い場に近い", "label-near", [
      "自動財務確認済みで買い場に近いです",
      `フォローアップスコア${Math.round(Number(followup.followupScore ?? 0))}点、買い目安${yen(followup.buyLine)}`,
      "正式今買いは買いラインと検証条件を満たした時だけ点灯します",
    ], ["買いライン到達を確認", "急騰を追いかけない"]);
  }

  if (isAutoFinancial(stock) && stock.buyRatio <= 1.05 && stock.upside >= 50) {
    return makeAssist("買い場に近い", "label-near", [
      "自動財務確認済みで買い場に近いです",
      "低PBR、上昇余地、買いライン接近を満たしています",
      "正式今買いは買いラインと検証条件を満たした時だけ点灯します",
    ], ["買いライン到達を確認", "急騰を追いかけない"]);
  }

  if (stock.buyRatio <= 1 && stock.upside >= 50 && stock.score >= 70 && stock.qualitativeDone && freshEnough) {
    return makeAssist("今買い候補", "label-buy", [
      "買いラインを下回っています",
      `目標株価まで${pct(stock.upside)}の余地があります`,
      isGoodBacktest(stock.backtest)
        ? `検証平均リターンが${pct(stock.backtest.averageReturn)}です`
        : `非事業資産倍率が${times(stock.nonBusinessAssetRatio)}あります`,
    ], ["有報の資産欄を再確認", "直近決算の悪化要因を確認"]);
  }

  if (stock.buyRatio <= 1.05 && stock.upside >= 50) {
    return makeAssist("買い場に近い", "label-near", [
      "買い目安にかなり近いです",
      `目標株価まで${pct(stock.upside)}の余地があります`,
      isGoodBacktest(stock.backtest) ? `検証勝率は${pct(stock.backtest.winRate)}です` : "バックテストは参考扱いです",
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
  selectTopRankingItem();
  setImportStatus("サンプルデータを表示中");
  setAutoUpdateStatus("サンプル表示中");
  render();
}

function loadInitialData() {
  if (window.AUTO_STOCK_DATA?.stocks?.length) {
    stocks = enrichAll(window.AUTO_STOCK_DATA.stocks);
    selectTopRankingItem();
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
  const rows = parseCsvRows(text).filter((row) => row.some((value) => value.trim() !== ""));
  const headers = rows.shift().map((h) => h.trim());
  validateCsvHeaders(headers);
  return rows.map((values) => {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return normalizeCsvRow(row);
  });
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        value += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value.trim());
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  if (value || row.length) {
    row.push(value.trim());
    rows.push(row);
  }

  return rows;
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
  renderDataCheck();
  renderResearchOverview();
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
    const assistOk = assistFilter === "all"
      || stock.assist.label === assistFilter
      || (assistFilter === "manual" && stock.dataConfidence === "一部手入力");
    return searchOk && assistOk;
  });
}

function byAssist(label, source = visibleStocks()) {
  return source.filter((stock) => stock.assist.label === label);
}

function isNearOrPending(label) {
  return ["買い場に近い", "財務確認待ち", "データ更新待ち", "財務慎重確認"].includes(label);
}

function isAvoidAssist(label) {
  return ["リスクで見送り", "検証弱く見送り", "財務で見送り"].includes(label);
}

function renderSummary() {
  const visible = visibleStocks();
  const expansion = window.AUTO_EXPANSION_PREVIEW;
  const previewAddCount = expansion?.previewAddCount ?? expansion?.items?.length ?? 0;
  const expandedCount = expansion?.expandedCount ?? visible.length + previewAddCount;
  const buyNow = byAssist("今買い候補", visible).length;
  const autoBuyCandidateCount = window.AUTO_RESEARCH_DATA?.autoBuyCandidates?.length ?? 0;
  const sellNow = byAssist("今売り検討", visible).length + byAssist("一部利益確定検討", visible).length;
  const risk = visible.filter((stock) => isAvoidAssist(stock.assist.label)).length;
  const near = byAssist("買い場に近い", visible).length;
  const nearOrPending = visible.filter((stock) => isNearOrPending(stock.assist.label)).length;
  const watched = visible.filter((stock) => stock.watchlist).length;
  const autoFinancial = visible.filter(isAutoFinancial).length;
  const qualityWarning = window.AUTO_STOCK_DATA?.dataQuality?.ok === false
    ? " データ要確認の項目があります。"
    : "";
  document.getElementById("summaryBand").className = `summary-band${buyNow ? " summary-buy-active" : ""}`;
  document.getElementById("todaySummaryTitle").textContent = buyNow ? "買いタイミング点灯中" : "今日の結論";
  document.getElementById("todaySummary").textContent =
    buyNow
      ? `今買い候補が${buyNow}件あります。銘柄詳細の緑の表示を確認してください。条件から外れたらこの表示は消えます。${qualityWarning}`
      : `通常候補${visible.length}件、追加候補確認${previewAddCount}件、確認後イメージ${expandedCount}件です。今買い候補${buyNow}件、自動買い候補予備軍${autoBuyCandidateCount}件、今売り検討${sellNow}件、買い場に近い${near}件、買い場候補合計${nearOrPending}件、自動財務確認${autoFinancial}件、リスク確認${risk}件です。${qualityWarning}`;
  document.getElementById("summaryStats").innerHTML = [
    ["通常候補", visible.length],
    ["追加確認", previewAddCount],
    ["今買い", buyNow],
    ["予備軍", autoBuyCandidateCount],
    ["売り検討", sellNow],
    ["買い場近い", near],
    ["買い場候補", nearOrPending],
    ["自動財務", autoFinancial],
    ["監視中", watched],
    ["リスク", risk],
  ]
    .map(([label, value]) => `<div class="stat"><strong>${value}</strong><span>${label}</span></div>`)
    .join("");
}

function renderDataCheck() {
  const data = window.AUTO_STOCK_DATA;
  const research = window.AUTO_RESEARCH_DATA;
  const expansion = window.AUTO_EXPANSION_PREVIEW;
  const readinessData = window.AUTO_PROMOTION_READINESS;
  const quality = data?.dataQuality;
  const stockCount = stocks.length;
  const previewAddCount = expansion?.previewAddCount ?? expansion?.items?.length ?? 0;
  const expandedCount = expansion?.expandedCount ?? stockCount + previewAddCount;
  const priorityReadyCount = readinessData?.priorityCount ?? 0;
  const universeCount = research?.universe?.success ?? 0;
  const universeTotal = research?.universe?.total ?? 0;
  const providerWarnings = quality?.providerWarnings ?? [];
  const validationWarnings = quality?.validationWarnings ?? [];
  const referenceWarnings = quality?.externalReferenceWarnings ?? [];
  const missingPrice = quality?.missingPrice ?? [];
  const missingEdinet = quality?.missingEdinet ?? [];
  const manualInputs = quality?.manualInputs ?? [];
  const allWarnings = quality?.nextFixes ?? [
    ...providerWarnings.map((item) => `${item.label}: ${item.message}`),
    ...validationWarnings,
    ...referenceWarnings,
    ...missingPrice.map((item) => `株価未取得: ${item}`),
    ...missingEdinet.map((item) => `有報データ未取得: ${item}`),
  ];
  const source = data?.source ?? "サンプル";
  const sourceLabel = source.includes("stock-master") ? "銘柄マスタ" : source;
  const countTone = stockCount >= 50 ? "good" : stockCount >= 20 ? "warn" : "alert";
  const countMessage = stockCount >= 50
    ? "候補数は十分あります"
    : stockCount >= 20
      ? "候補数は増やせます"
      : "まだ少なめです";
  const generatedAt = data?.generatedAt ? new Date(data.generatedAt).toLocaleString("ja-JP") : "未更新";
  const warningPreview = allWarnings.slice(0, 3);
  const manualPreview = manualInputs.slice(0, 3);
  const readiness = quality?.readiness ?? { score: 0, label: "準備中", blockers: [] };
  const readinessTone = readiness.score >= 85 ? "good" : readiness.score >= 65 ? "warn" : "alert";
  const autoFinancialCount = stocks.filter(isAutoFinancial).length;
  const autoFinancialFollowup = window.AUTO_FINANCIAL_FOLLOWUP;
  const autoFinancialPriorityCount = autoFinancialFollowup?.priorityCount ?? 0;
  const autoBuyCandidateCount = research?.universe?.autoBuyCandidates ?? window.AUTO_RESEARCH_DATA?.autoBuyCandidates?.length ?? 0;

  document.getElementById("dataCheckList").innerHTML = [
    dataCheckItem("本番度", `${readiness.score}%`, readiness.label, readinessTone),
    dataCheckItem("通常候補", `${stockCount}件`, countMessage, countTone),
    dataCheckItem(
      "追加候補",
      `${previewAddCount}件`,
      previewAddCount ? `財務確認後の候補数イメージは${expandedCount}件です` : "追加候補はまだありません",
      previewAddCount ? "warn" : "alert",
    ),
    dataCheckItem(
      "昇格準備",
      `${priorityReadyCount}件`,
      priorityReadyCount ? "最優先で財務確認する候補があります" : "昇格準備データ待ちです",
      priorityReadyCount ? "warn" : "alert",
    ),
    dataCheckItem(
      "買い予備軍",
      `${autoBuyCandidateCount}件`,
      autoBuyCandidateCount ? "正式今買い前の全体自動判定候補です" : "条件内の予備軍はありません",
      autoBuyCandidateCount ? "warn" : "good",
    ),
    dataCheckItem(
      "自動財務",
      `${autoFinancialCount}件`,
      autoFinancialPriorityCount
        ? `買い場接近${autoFinancialPriorityCount}件。自動取得財務でランキング反映済みです`
        : autoFinancialCount ? "自動取得財務でランキング反映済みです" : "自動財務確認の候補はありません",
      autoFinancialCount ? "warn" : "good",
    ),
    dataCheckItem(
      "日本株全体",
      universeCount ? `${universeCount}/${universeTotal}件` : "準備中",
      universeCount ? "価格検証済み。通常候補へ入れる前に財務確認します" : "広域調査データ待ちです",
      universeCount ? "good" : "warn",
    ),
    dataCheckItem("入力元", sourceLabel, source, providerWarnings.length ? "warn" : "good"),
    dataCheckItem("更新日時", generatedAt, quality?.ok ? "データ状態OK" : "確認が必要です", quality?.ok ? "good" : "warn"),
    dataCheckItem(
      "一部手入力",
      `${manualInputs.length}件`,
      manualPreview.length ? `${manualPreview.join(" / ")} から確認` : "正式確認済みです",
      manualInputs.length ? "warn" : "good",
    ),
    dataCheckItem(
      "注意",
      `${allWarnings.length}件`,
      warningPreview.length ? warningPreview.join(" / ") : "大きな注意はありません",
      allWarnings.length ? "alert" : "good",
    ),
  ].join("");
}

function dataCheckItem(label, value, note, tone) {
  return `
    <div class="data-check-item data-check-${tone}">
      <span>${label}</span>
      <strong>${value}</strong>
      <p>${note}</p>
    </div>
  `;
}

function renderResearchOverview() {
  const element = document.getElementById("researchOverview");
  if (!element) return;
  const research = window.AUTO_RESEARCH_DATA;
  if (!research) {
    element.innerHTML = `<p class="reason">調査データを生成すると、日本株全体からの注目候補がここに出ます。</p>`;
    return;
  }

  const universeCards = (research.universeTop ?? []).slice(0, 4).map((item, index) =>
    renderResearchCard(item, index, "全体候補", "research-card-blue"),
  );
  const multibaggerCards = (research.multibaggerWatch ?? []).slice(0, 4).map((item, index) =>
    renderResearchCard(item, index, "2倍監視", "research-card-green"),
  );

  element.innerHTML = [
    `<div class="research-summary-card">
      <span>日本株全体が対象</span>
      <strong>${research.universe?.success ?? 0}/${research.universe?.total ?? 0}件</strong>
      <p>価格バックテストで「良さそう」${research.universe?.good ?? 0}件、上昇タイミング候補${research.universe?.buyTiming ?? 0}件、見送り寄り${research.universe?.avoid ?? 0}件です。</p>
    </div>`,
    ...universeCards,
    ...multibaggerCards,
  ].join("");
}

function renderResearchCard(item, index, label, className) {
  const caution = item.caution ? `<p class="research-caution">${escapeHtml(item.caution)}</p>` : "";
  const comment = item.comment || signalComment(item);
  return `
    <article class="research-card ${className}">
      <div class="research-card-top">
        <span>${label}</span>
        <strong>${index + 1}</strong>
      </div>
      <h3>${escapeHtml(item.name)} (${escapeHtml(item.code)})</h3>
      <p>${escapeHtml(comment)}</p>
      ${caution}
      <div class="research-meta">
        <span>${escapeHtml(item.timingAction || "監視")}</span>
        <span>${escapeHtml(item.signal || "待ち")}</span>
        <span>平均 ${pct(item.averageReturn ?? 0)}</span>
        <span>勝率 ${pct(item.winRate ?? 0)}</span>
        <span>下落 ${pct(item.maxDrawdown ?? 0)}</span>
        <span>品質 ${Math.round((item.qualityRank ?? item.timingRank ?? item.score ?? 0) * 10) / 10}</span>
      </div>
    </article>
  `;
}

function signalComment(item) {
  if (item.signal === "上昇中押し目") return "上昇トレンド中の押し目候補です。決算成長と出来高を確認します。";
  if (item.signal === "高値圏") return "すでに上がっています。飛びつかず押し目や出来高継続を確認します。";
  if (item.strategy === "高値更新") return "高値更新型です。勢いはありますが、材料と過熱感を確認します。";
  return "価格だけの一次候補です。財務と開示を確認してから判断します。";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function renderAssistColumns() {
  const visible = visibleStocks();
  const sections = {
    buyNow: byAssist("今買い候補", visible),
    nearBuy: visible.filter((stock) => isNearOrPending(stock.assist.label)),
    sellNow: byAssist("今売り検討", visible).concat(byAssist("一部利益確定検討", visible)),
    risk: visible.filter((stock) => isAvoidAssist(stock.assist.label)),
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
  if (type === "today") return todayRankingItems();
  if (type === "expansionPreview") return filteredExpansionItems(window.AUTO_EXPANSION_PREVIEW?.items ?? []);
  if (type === "hiddenGemsDraft") return filteredExpansionItems(window.AUTO_HIDDEN_GEMS_DRAFT?.items ?? []);
  if (type === "financialConfirmation") return filteredFinancialConfirmationItems(window.AUTO_FINANCIAL_CONFIRMATION?.top ?? []);
  if (type === "financialScreening") return filteredFinancialScreeningItems(window.AUTO_FINANCIAL_SCREENING?.top ?? []);
  if (type === "hiddenGems") return filteredHiddenGemItems(window.AUTO_HIDDEN_GEMS?.top ?? []);
  if (type === "autoBuyCandidates") return filteredAutoBuyCandidateItems(window.AUTO_RESEARCH_DATA?.autoBuyCandidates ?? []);
  if (type === "researchTiming") return filteredResearchItems(window.AUTO_RESEARCH_DATA?.timingBuys ?? []);
  if (type === "researchUniverse") return filteredResearchItems(window.AUTO_RESEARCH_DATA?.universeAll ?? window.AUTO_RESEARCH_DATA?.universeTop ?? []);
  if (type === "researchMultibagger") return filteredResearchItems(window.AUTO_RESEARCH_DATA?.multibaggerWatch ?? []);
  const copy = [...visibleStocks()];
  if (type === "watchlist") return copy.filter((s) => s.watchlist).sort((a, b) => b.score - a.score);
  if (type === "buyNow") return copy.filter((s) => s.assist.label === "今買い候補");
  if (type === "nearBuy") return copy.filter((s) => isNearOrPending(s.assist.label));
  if (type === "safe") return copy.sort((a, b) => b.nonBusinessAssetRatio - a.nonBusinessAssetRatio);
  if (type === "upside") return copy.sort((a, b) => b.upside - a.upside);
  if (type === "realEstate") return copy.sort((a, b) => b.realEstateGainRatio - a.realEstateGainRatio);
  if (type === "netCash") return copy.sort((a, b) => b.netCashRatio - a.netCashRatio);
  if (type === "backtest") return copy.sort((a, b) => (b.backtest?.bestScore ?? 0) - (a.backtest?.bestScore ?? 0));
  return copy.sort((a, b) => b.score - a.score);
}

function renderRanking() {
  const type = document.getElementById("rankingSelect").value;
  const list = rankingFor(type).slice(0, rankingLimitFor(type));
  if (type === "today") {
    document.getElementById("rankingList").innerHTML =
      list.map((item, index) => renderTodayRankingRow(item, index)).join("") || `<p class="reason">該当なし</p>`;
    return;
  }
  if (type === "expansionPreview") {
    document.getElementById("rankingList").innerHTML =
      list.map((item, index) => renderExpansionRankingRow(item, index)).join("") || `<p class="reason">該当なし</p>`;
    return;
  }
  if (type === "hiddenGemsDraft") {
    document.getElementById("rankingList").innerHTML =
      list.map((item, index) => renderHiddenGemDraftRankingRow(item, index)).join("") || `<p class="reason">該当なし</p>`;
    return;
  }
  if (type === "financialConfirmation") {
    document.getElementById("rankingList").innerHTML =
      list.map((item, index) => renderFinancialConfirmationRankingRow(item, index)).join("") || `<p class="reason">該当なし</p>`;
    return;
  }
  if (type === "financialScreening") {
    document.getElementById("rankingList").innerHTML =
      list.map((item, index) => renderFinancialScreeningRankingRow(item, index)).join("") || `<p class="reason">該当なし</p>`;
    return;
  }
  if (type === "hiddenGems") {
    document.getElementById("rankingList").innerHTML =
      list.map((item, index) => renderHiddenGemRankingRow(item, index)).join("") || `<p class="reason">該当なし</p>`;
    return;
  }
  if (type === "researchUniverse" || type === "researchMultibagger" || type === "researchTiming" || type === "autoBuyCandidates") {
    document.getElementById("rankingList").innerHTML =
      list.map((item, index) => renderResearchRankingRow(item, index, type)).join("") || `<p class="reason">該当なし</p>`;
    return;
  }
  document.getElementById("rankingList").innerHTML =
    list.map((stock, index) => renderRankingRow(stock, index)).join("") || `<p class="reason">該当なし</p>`;
}

function rankingLimitFor(type) {
  return 10;
}

function selectTopRankingItem(type = document.getElementById("rankingSelect")?.value || "today") {
  const first = rankingFor(type).slice(0, rankingLimitFor(type))[0];
  if (!first) {
    selectedResearch = null;
    selectedCode = visibleStocks()[0]?.code ?? stocks[0]?.code ?? null;
    return;
  }

  if (type === "today") {
    if (first.kind === "stock") {
      selectedResearch = null;
      selectedCode = first.code;
      return;
    }
    selectedCode = null;
    selectedResearch = { type: first.sourceType, code: first.code };
    return;
  }

  if (isResearchRankingType(type)) {
    selectedCode = null;
    selectedResearch = { type, code: first.code };
    return;
  }

  selectedResearch = null;
  selectedCode = first.code;
}

function isResearchRankingType(type) {
  return [
    "expansionPreview",
    "hiddenGemsDraft",
    "financialConfirmation",
    "financialScreening",
    "hiddenGems",
    "autoBuyCandidates",
    "researchTiming",
    "researchUniverse",
    "researchMultibagger",
  ].includes(type);
}

function todayRankingItems() {
  const hasSearch = searchQuery.trim().length > 0;
  const stockItems = visibleStocks().map((stock) => ({
    kind: "stock",
    code: stock.code,
    sourceType: "today",
    priority: todayStockPriority(stock),
    sortScore: todayStockScore(stock),
    reason: todayStockReason(stock),
    item: stock,
  }));
  const researchItems = [
    ...filteredResearchItems(window.AUTO_RESEARCH_DATA?.autoBuyCandidates ?? [])
      .slice(0, 40)
      .map((item) => todayResearchItem(item, "autoBuyCandidates", "自動買い候補", 38)),
    ...filteredResearchItems(window.AUTO_RESEARCH_DATA?.timingBuys ?? [])
      .slice(0, 80)
      .map((item) => todayResearchItem(item, "researchTiming", "上昇タイミング", 12)),
    ...filteredHiddenGemItems(window.AUTO_HIDDEN_GEMS?.top ?? [])
      .slice(0, 80)
      .map((item) => todayHiddenGemItem(item)),
    ...filteredResearchItems(window.AUTO_RESEARCH_DATA?.multibaggerWatch ?? [])
      .slice(0, 60)
      .map((item) => todayResearchItem(item, "researchMultibagger", "2倍監視", 4)),
    ...(hasSearch ? filteredResearchItems(window.AUTO_RESEARCH_DATA?.universeAll ?? window.AUTO_RESEARCH_DATA?.universeTop ?? [])
      .slice(0, 80)
      .map((item) => todayResearchItem(item, "researchUniverse", "広域候補", 0)) : []),
    ...filteredFinancialConfirmationItems(window.AUTO_FINANCIAL_CONFIRMATION?.top ?? [])
      .slice(0, 40)
      .map((item) => todayFinancialItem(item)),
  ];

  const byCode = new Map();
  for (const entry of [...stockItems, ...researchItems]) {
    const current = byCode.get(entry.code);
    if (!current || entry.priority > current.priority || (entry.priority === current.priority && entry.sortScore > current.sortScore)) {
      byCode.set(entry.code, entry);
    }
  }
  return [...byCode.values()].sort((a, b) => b.priority - a.priority || b.sortScore - a.sortScore);
}

function todayStockPriority(stock) {
  if (stock.assist.label === "今買い候補") return 100;
  if (stock.assist.label === "買い場に近い") return 90;
  if (isPriorityAutoFinancialFollowup(stock)) return 86;
  if (stock.assist.label === "財務確認待ち") return 76;
  if (stock.assist.label === "データ更新待ち") return 54;
  if (stock.assist.label === "今売り検討" || stock.assist.label === "一部利益確定検討") return 72;
  if (stock.assist.label === "保有継続候補") return 48;
  if (stock.assist.label === "まだ待つ") return 36;
  if (stock.assist.label === "財務慎重確認") return 42;
  if (stock.assist.label === "検証弱く見送り") return 22;
  if (stock.assist.label === "財務で見送り") return 18;
  if (stock.assist.label === "リスクで見送り") return 12;
  return 50;
}

function todayStockScore(stock) {
  let score = stock.score;
  const autoFollowup = autoFinancialFollowupFor(stock);
  if (stock.assist.label === "今買い候補") score += 46;
  if (stock.assist.label === "買い場に近い") score += 30;
  if (stock.assist.label === "財務確認待ち") score += 16;
  if (isPriorityAutoFinancialFollowup(stock)) score += Math.min(28, Number(autoFollowup?.followupScore ?? 0) * 0.22);
  if (autoFollowup?.action === "買いは後回し") score -= 36;
  if (autoFollowup?.action === "価格履歴を先に増やす") score -= 20;
  if (stock.assist.label === "データ更新待ち") score += 8;
  if (stock.assist.label === "今売り検討" || stock.assist.label === "一部利益確定検討") score += 18;
  if (stock.watchlist) score += 10;
  score += backtestQualityScore(stock.backtest);
  if (stock.dataFreshness?.level !== "ok") score -= 12;
  if (stock.assist.label === "財務慎重確認") score -= 32;
  if (stock.assist.label === "検証弱く見送り") score -= 55;
  if (stock.assist.label === "財務で見送り") score -= 60;
  if (stock.assist.label === "リスクで見送り") score -= 65;
  return Math.round(score * 10) / 10;
}

function backtestQualityScore(backtest) {
  if (!backtest || Number(backtest.trades || 0) < 1) return -10;
  const trades = Number(backtest.trades || 0);
  const winRate = Number(backtest.winRate || 0);
  const averageReturn = Number(backtest.averageReturn || 0);
  const maxDrawdown = Number(backtest.maxDrawdown || 0);
  let score = 0;
  score += Math.min(10, trades * 3);
  score += Math.max(-18, Math.min(18, (winRate - 50) * 0.45));
  score += Math.max(-22, Math.min(24, averageReturn * 1.5));
  score += Math.max(-20, Math.min(8, maxDrawdown * 0.7 + 10));
  if (isGoodBacktest(backtest)) score += 10;
  if (isBadBacktest(backtest)) score -= 32;
  return Math.round(score * 10) / 10;
}

function todayStockReason(stock) {
  if (stock.assist.label === "今買い候補") return "買いタイミング優先";
  if (stock.assist.label === "買い場に近い") return "買い場接近";
  if (isPriorityAutoFinancialFollowup(stock)) return "財務優先確認";
  if (stock.assist.label === "財務確認待ち") return "財務確認待ち";
  if (stock.assist.label === "データ更新待ち") return "データ更新待ち";
  if (stock.assist.label === "今売り検討" || stock.assist.label === "一部利益確定検討") return "売り判断の確認";
  if (stock.assist.label === "財務慎重確認") return "財務を追加確認";
  if (stock.assist.label === "財務で見送り") return "財務で見送り";
  if (stock.watchlist) return "監視中";
  return "通常候補";
}

function todayResearchItem(item, sourceType, label, bonus) {
  const backtestScore =
    (Number(item.trades ?? item.backtestTrades ?? 0) >= 1 ? 6 : -8)
    + Math.max(-14, Math.min(18, Number(item.averageReturn ?? item.backtestAverageReturn ?? 0) * 1.3))
    + Math.max(-12, Math.min(14, (Number(item.winRate ?? item.backtestWinRate ?? 0) - 50) * 0.35))
    + Math.max(-12, Math.min(6, Number(item.maxDrawdown ?? item.backtestMaxDrawdown ?? 0) * 0.5 + 7));
  const score = (item.qualityRank ?? item.timingRank ?? item.score ?? 0)
    + (item.timingAction === "押し目買い候補" ? 26 : 0)
    + (item.timingAction === "初回買い候補" ? 22 : 0)
    + (item.timingAction === "買わない" ? -80 : 0)
    + (item.signal === "高値圏" ? -18 : 0)
    + backtestScore
    + bonus;
  return {
    kind: "research",
    code: item.code,
    sourceType,
    label,
    priority: researchPriority(item, sourceType),
    sortScore: Math.round(score * 10) / 10,
    reason: item.timingAction || item.signal || label,
    item,
  };
}

function researchPriority(item, sourceType) {
  if (sourceType === "autoBuyCandidates") return 74;
  if (sourceType === "researchTiming") {
    return ["押し目買い候補", "初回買い候補"].includes(item.timingAction) ? 70 : 48;
  }
  if (sourceType === "researchMultibagger") return 42;
  return 32;
}

function todayHiddenGemItem(item) {
  const score = (item.hiddenScore ?? item.qualityRank ?? item.score ?? 0)
    + (item.assistAction === "今すぐ財務確認" ? 22 : 0)
    + (item.signal === "上昇中押し目" ? 10 : 0)
    + Math.max(-14, Math.min(18, Number(item.averageReturn ?? 0) * 1.3))
    + Math.max(-12, Math.min(14, (Number(item.winRate ?? 0) - 50) * 0.35))
    + Math.max(-12, Math.min(6, Number(item.maxDrawdown ?? 0) * 0.5 + 7))
    + (item.caution ? -8 : 0);
  return {
    kind: "hiddenGems",
    code: item.code,
    sourceType: "hiddenGems",
    label: "未発掘",
    priority: item.assistAction === "今すぐ財務確認" ? 72 : 38,
    sortScore: Math.round(score * 10) / 10,
    reason: item.assistAction || item.status || "未発掘候補",
    item,
  };
}

function todayFinancialItem(item) {
  const backtestScore =
    (Number(item.backtestTrades ?? 0) >= 1 ? 6 : -8)
    + Math.max(-14, Math.min(18, Number(item.backtestAverageReturn ?? 0) * 1.3))
    + Math.max(-12, Math.min(14, (Number(item.backtestWinRate ?? 0) - 50) * 0.35))
    + Math.max(-12, Math.min(6, Number(item.backtestMaxDrawdown ?? 0) * 0.5 + 7));
  const score = Math.min(105, (item.confirmationScore ?? 0) * 0.55) + 8 + backtestScore;
  return {
    kind: "financialConfirmation",
    code: item.code,
    sourceType: "financialConfirmation",
    label: "財務確認",
    priority: (item.status || "").includes("最優先") ? 68 : 62,
    sortScore: Math.round(score * 10) / 10,
    reason: item.status || "買う前に確認",
    item,
  };
}

function renderMobileLynchPreview(content, title) {
  const element = document.getElementById("mobileLynchPreview");
  if (!element) return;
  element.innerHTML = "";
}

function renderInlineMobileLynchPreview(content, title, summary = "") {
  return `
    <div class="inline-mobile-lynch-preview" aria-live="polite">
      <div class="section-heading">
        <div>
          <p class="eyebrow">選択中</p>
          <h3>${escapeHtml(title)}</h3>
        </div>
      </div>
      <div class="chart" role="img" aria-label="選択中銘柄のリンチ・チャート">${content}</div>
      ${summary}
    </div>
  `;
}

function renderInlineStockSummary(stock) {
  const stats = [
    ["判断", stock.assist.label],
    ["株価", yen(stock.price)],
    ["買い", yen(stock.buyLine)],
    ["売り目安", yen(stock.targetPrice)],
    ["上昇余地", pct(stock.upside)],
    ["修正PBR", times(stock.modifiedPbr)],
    ["勝率", pct(stock.backtest?.winRate ?? 0)],
    ["平均", pct(stock.backtest?.averageReturn ?? 0)],
  ];
  const actions = [
    ...(stock.assist.reasons ?? []).slice(0, 2),
    ...(stock.assist.nextActions ?? []).slice(0, 2),
  ].slice(0, 4);
  return `
    <div class="inline-selected-summary">
      <div class="inline-summary-grid">
        ${stats.map(([label, value]) => `
          <div class="inline-summary-cell">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
          </div>
        `).join("")}
      </div>
      <ul class="inline-action-list">
        ${actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderInlineResearchSummary(item, type) {
  const registered = stocks.find((stock) => String(stock.code) === String(item.code));
  if (registered) return renderInlineStockSummary(registered);

  const stats = [
    ["判断", item.reviewStatus || item.status || item.signal || "確認"],
    ["株価", item.price ? yen(item.price) : "-"],
    ["買い", item.buyLine ? yen(item.buyLine) : "-"],
    ["売り目安", item.targetPrice ? yen(item.targetPrice) : "-"],
    ["買い比率", item.buyRatio ? times(item.buyRatio) : "-"],
    ["上昇余地", item.upside != null ? pct(item.upside) : "-"],
    ["勝率", item.winRate != null ? pct(item.winRate) : "-"],
    ["平均", item.averageReturn != null ? pct(item.averageReturn) : "-"],
  ];
  const notes = [
    item.comment || item.reason || signalComment(item),
    item.action || item.nextStep || item.timingAction,
    item.caution || item.blockers,
  ].filter(Boolean).slice(0, 3);
  return `
    <div class="inline-selected-summary">
      <div class="inline-summary-grid">
        ${stats.map(([label, value]) => `
          <div class="inline-summary-cell">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(String(value))}</strong>
          </div>
        `).join("")}
      </div>
      <ul class="inline-action-list">
        ${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
      </ul>
    </div>
  `;
}

function filteredExpansionItems(items) {
  const q = searchQuery.trim().toLowerCase();
  return items
    .filter((item) => {
      const text = `${item.code} ${item.name} ${item.sector}`.toLowerCase();
      return !q || text.includes(q);
    })
    .sort((a, b) => a.rank - b.rank);
}

function filteredHiddenGemItems(items) {
  const q = searchQuery.trim().toLowerCase();
  return items
    .filter((item) => {
      const text = `${item.code} ${item.name} ${item.sector} ${item.market}`.toLowerCase();
      return !q || text.includes(q);
    })
    .sort((a, b) => (b.hiddenScore ?? 0) - (a.hiddenScore ?? 0));
}

function filteredFinancialConfirmationItems(items) {
  const q = searchQuery.trim().toLowerCase();
  const screenedCodes = new Set((window.AUTO_FINANCIAL_SCREENING?.top ?? []).map((item) => String(item.code)));
  return items
    .filter((item) => {
      const text = `${item.code} ${item.name} ${item.sector} ${item.source} ${item.status}`.toLowerCase();
      const matchesSearch = !q || text.includes(q);
      return matchesSearch && !screenedCodes.has(String(item.code));
    })
    .sort((a, b) => (b.confirmationScore ?? 0) - (a.confirmationScore ?? 0));
}

function filteredFinancialScreeningItems(items) {
  const q = searchQuery.trim().toLowerCase();
  return items
    .filter((item) => {
      const text = `${item.code} ${item.name} ${item.sector} ${item.status}`.toLowerCase();
      return !q || text.includes(q);
    })
    .sort((a, b) => (b.screenScore ?? 0) - (a.screenScore ?? 0));
}

function filteredResearchItems(items) {
  const q = searchQuery.trim().toLowerCase();
  return items
    .filter((item) => {
      const text = `${item.code} ${item.name} ${item.sector} ${item.market}`.toLowerCase();
      return !q || text.includes(q);
    })
    .sort((a, b) => (b.qualityRank ?? b.timingRank ?? b.score ?? 0) - (a.qualityRank ?? a.timingRank ?? a.score ?? 0));
}

function filteredAutoBuyCandidateItems(items) {
  return filteredResearchItems(items)
    .sort((a, b) => reviewPriority(b.reviewStatus) - reviewPriority(a.reviewStatus)
      || (b.qualityRank ?? b.autoBuyScore ?? 0) - (a.qualityRank ?? a.autoBuyScore ?? 0));
}

function reviewPriority(status) {
  if (status === "通常候補へ昇格OK") return 3;
  if (status === "追加確認") return 2;
  if (status === "今回は見送り") return 1;
  return 0;
}

function renderTodayRankingRow(entry, index) {
  if (entry.kind === "stock") {
    const stock = entry.item;
    return `
      <article class="ranking-row ${stock.code === selectedCode ? "active" : ""}" data-code="${stock.code}">
        <div class="ranking-top">
          <div>
            <strong>${index + 1}. ${stock.name}</strong>
            <div class="stock-code">${stock.code} / ${entry.reason}</div>
          </div>
          <span class="assist-label ${stock.assist.className}">${stock.assist.label}</span>
        </div>
        <p class="reason">${topReason(stock)}</p>
        <div class="ranking-meta">
          <span>総合 ${Math.round(entry.sortScore * 10) / 10}</span>
          <span>通常候補</span>
          <span>スコア ${stock.score}</span>
          <span>上昇余地 ${pct(stock.upside)}</span>
          <span>${stock.dataFreshness.label}</span>
        </div>
        ${renderMiniMeter(stock)}
      </article>
      ${stock.code === selectedCode ? renderInlineMobileLynchPreview(renderLynchChart(stock), `${stock.name}のリンチ・チャート`, renderInlineStockSummary(stock)) : ""}
    `;
  }

  const item = entry.item;
  const type = entry.sourceType;
  const isActive = selectedResearch?.type === type && selectedResearch?.code === item.code;
  const labelClass = type === "financialConfirmation" ? "label-risk" : type === "hiddenGems" ? "label-research" : "label-near";
  const detailText = type === "financialConfirmation"
    ? (item.buyGuard || item.nextStep || "買う前に財務確認")
    : (item.comment || item.reason || signalComment(item));
  const lynch = type === "financialConfirmation"
    ? renderFinancialConfirmationPlaceholder(item)
    : renderResearchLynch(item, type);

  return `
    <article class="ranking-row research-ranking-row ${isActive ? "active" : ""}" data-research-type="${type}" data-research-code="${escapeHtml(item.code)}">
      <div class="ranking-top">
        <div>
          <strong>${index + 1}. ${escapeHtml(item.name)}</strong>
          <div class="stock-code">${escapeHtml(item.code)} / ${escapeHtml(item.sector || "未分類")} / ${escapeHtml(entry.reason)}</div>
        </div>
        <span class="assist-label ${labelClass}">${escapeHtml(entry.label)}</span>
      </div>
      <p class="reason">${escapeHtml(detailText)}</p>
      <div class="ranking-meta">
        <span>総合 ${Math.round(entry.sortScore * 10) / 10}</span>
        <span>${escapeHtml(item.market || item.source || "広域調査")}</span>
        <span>${escapeHtml(item.signal || item.status || "確認")}</span>
        <span>平均 ${pct(item.averageReturn ?? 0)}</span>
        <span>勝率 ${pct(item.winRate ?? 0)}</span>
        <span>最大下落 ${pct(item.maxDrawdown ?? 0)}</span>
      </div>
    </article>
    ${isActive ? renderInlineMobileLynchPreview(lynch, `${item.name}の確認`, renderInlineResearchSummary(item, type)) : ""}
  `;
}

function renderExpansionRankingRow(item, index) {
  const isActive = selectedResearch?.type === "expansionPreview" && selectedResearch?.code === item.code;
  return `
    <article class="ranking-row research-ranking-row ${isActive ? "active" : ""}" data-research-type="expansionPreview" data-research-code="${escapeHtml(item.code)}">
      <div class="ranking-top">
        <div>
          <strong>${index + 1}. ${escapeHtml(item.name)}</strong>
          <div class="stock-code">${escapeHtml(item.code)} / ${escapeHtml(item.sector || "未分類")}</div>
        </div>
        <span class="assist-label label-research">確認前</span>
      </div>
      <p class="reason">通常候補へ入れる前の追加候補です。株価は取得済み、財務は確認前です。</p>
      <div class="ranking-meta">
        <span>${escapeHtml(item.dataConfidence || "推定")}</span>
        <span>株価 ${yen(item.price)}</span>
        <span>BPS確認 ${yen(item.bps)}</span>
        <span>EPS確認 ${Math.round((item.eps ?? 0) * 10) / 10}</span>
        <span>財務確認前</span>
      </div>
    </article>
    ${isActive ? renderInlineMobileLynchPreview(renderExpansionLynchPlaceholder(item), `${item.name}のリンチ・チャート`, renderInlineResearchSummary(item, "expansionPreview")) : ""}
  `;
}

function renderHiddenGemDraftRankingRow(item, index) {
  const isActive = selectedResearch?.type === "hiddenGemsDraft" && selectedResearch?.code === item.code;
  return `
    <article class="ranking-row research-ranking-row ${isActive ? "active" : ""}" data-research-type="hiddenGemsDraft" data-research-code="${escapeHtml(item.code)}">
      <div class="ranking-top">
        <div>
          <strong>${index + 1}. ${escapeHtml(item.name)}</strong>
          <div class="stock-code">${escapeHtml(item.code)} / ${escapeHtml(item.sector || "未分類")}</div>
        </div>
        <span class="assist-label label-research">下書き</span>
      </div>
      <p class="reason">${escapeHtml(item.note || "未発掘候補から通常候補へ入れる前の確認下書きです")}</p>
      <div class="ranking-meta">
        <span>株価 ${yen(item.price)}</span>
        <span>未発掘点 ${Math.round((item.hiddenScore ?? 0) * 10) / 10}</span>
        <span>勝率 ${pct(item.winRate ?? 0)}</span>
        <span>平均 ${pct(item.averageReturn ?? 0)}</span>
        <span>最大下落 ${pct(item.maxDrawdown ?? 0)}</span>
        <span>財務確認前</span>
      </div>
    </article>
    ${isActive ? renderInlineMobileLynchPreview(renderExpansionLynchPlaceholder(item), `${item.name}のリンチ・チャート`, renderInlineResearchSummary(item, "hiddenGemsDraft")) : ""}
  `;
}

function renderHiddenGemRankingRow(item, index) {
  const isActive = selectedResearch?.type === "hiddenGems" && selectedResearch?.code === item.code;
  return `
    <article class="ranking-row research-ranking-row ${isActive ? "active" : ""}" data-research-type="hiddenGems" data-research-code="${escapeHtml(item.code)}">
      <div class="ranking-top">
        <div>
          <strong>${index + 1}. ${escapeHtml(item.name)}</strong>
          <div class="stock-code">${escapeHtml(item.code)} / ${escapeHtml(item.sector || "未分類")}</div>
        </div>
        <span class="assist-label label-research">未発掘</span>
      </div>
      <p class="reason">${escapeHtml(item.reason || "既存候補外から見つけた候補です")}</p>
      <div class="ranking-meta">
        <span>${escapeHtml(item.assistAction || item.timingAction || "監視")}</span>
        <span>${escapeHtml(item.status || "監視")}</span>
        <span>${escapeHtml(item.signal || "待ち")}</span>
        <span>点 ${Math.round((item.hiddenScore ?? 0) * 10) / 10}</span>
        <span>平均 ${pct(item.averageReturn ?? 0)}</span>
        <span>勝率 ${pct(item.winRate ?? 0)}</span>
        <span>最大下落 ${pct(item.maxDrawdown ?? 0)}</span>
        <span>${escapeHtml(item.caution || "注意なし")}</span>
      </div>
    </article>
    ${isActive ? renderInlineMobileLynchPreview(renderResearchLynch(item, "hiddenGems"), `${item.name}のリンチ・チャート`, renderInlineResearchSummary(item, "hiddenGems")) : ""}
  `;
}

function renderFinancialConfirmationRankingRow(item, index) {
  const isActive = selectedResearch?.type === "financialConfirmation" && selectedResearch?.code === item.code;
  return `
    <article class="ranking-row research-ranking-row ${isActive ? "active" : ""}" data-research-type="financialConfirmation" data-research-code="${escapeHtml(item.code)}">
      <div class="ranking-top">
        <div>
          <strong>${index + 1}. ${escapeHtml(item.name)}</strong>
          <div class="stock-code">${escapeHtml(item.code)} / ${escapeHtml(item.sector || "未分類")}</div>
        </div>
        <span class="assist-label label-risk">財務確認</span>
      </div>
      <p class="reason">${escapeHtml(item.buyGuard || "確認完了まで買わない")}。${escapeHtml(item.nextStep || "財務確認が先です")}</p>
      <div class="ranking-meta">
        <span>${escapeHtml(item.source || "確認元")}</span>
        <span>${escapeHtml(item.status || "確認")}</span>
        <span>点 ${Math.round((item.confirmationScore ?? 0) * 10) / 10}</span>
        <span>株価 ${yen(item.price)}</span>
        <span>${escapeHtml(item.blockers || "注意なし")}</span>
      </div>
    </article>
    ${isActive ? renderInlineMobileLynchPreview(renderFinancialConfirmationPlaceholder(item), `${item.name}の財務確認`, renderInlineResearchSummary(item, "financialConfirmation")) : ""}
  `;
}

function renderFinancialScreeningRankingRow(item, index) {
  const isActive = selectedResearch?.type === "financialScreening" && selectedResearch?.code === item.code;
  const labelClass = item.status === "昇格確認優先" ? "label-near" : item.status === "見送り寄り" ? "label-risk" : "label-research";
  return `
    <article class="ranking-row research-ranking-row ${isActive ? "active" : ""}" data-research-type="financialScreening" data-research-code="${escapeHtml(item.code)}">
      <div class="ranking-top">
        <div>
          <strong>${index + 1}. ${escapeHtml(item.name)}</strong>
          <div class="stock-code">${escapeHtml(item.code)} / ${escapeHtml(item.sector || "未分類")}</div>
        </div>
        <span class="assist-label ${labelClass}">${escapeHtml(item.status || "確認")}</span>
      </div>
      <p class="reason">${escapeHtml(item.action || "財務確認を進めます")}</p>
      <div class="ranking-meta">
        <span>点 ${Math.round((item.screenScore ?? 0) * 10) / 10}</span>
        <span>PBR ${times(item.pbr ?? 0)}</span>
        <span>PER ${(item.per ?? 0) ? times(item.per) : "-"}</span>
        <span>ネット現金 ${percentPoint(item.netCashRatio ?? 0)}</span>
        <span>${escapeHtml(item.cautions || "注意なし")}</span>
      </div>
    </article>
    ${isActive ? renderInlineMobileLynchPreview(renderFinancialScreeningPlaceholder(item), `${item.name}の財務スクリーニング`, renderInlineResearchSummary(item, "financialScreening")) : ""}
  `;
}

function renderResearchRankingRow(item, index, type) {
  const label = type === "researchMultibagger"
    ? "2倍監視"
    : type === "autoBuyCandidates"
      ? "自動買い候補"
      : type === "researchTiming"
        ? "上昇タイミング"
        : "広域候補";
  const comment = item.comment || signalComment(item);
  const caution = item.caution ? `<p class="freshness-line">${escapeHtml(item.caution)}</p>` : "";
  const review = type === "autoBuyCandidates" && item.reviewStatus ? `<p class="freshness-line">昇格判定: ${escapeHtml(item.reviewStatus)}${item.reviewReasons ? ` / ${escapeHtml(item.reviewReasons)}` : ""}</p>` : "";
  const isActive = selectedResearch?.type === type && selectedResearch?.code === item.code;
  const labelClass = type === "autoBuyCandidates" ? "label-research" : "label-near";
  return `
    <article class="ranking-row research-ranking-row ${isActive ? "active" : ""}" data-research-type="${type}" data-research-code="${escapeHtml(item.code)}">
      <div class="ranking-top">
        <div>
          <strong>${index + 1}. ${escapeHtml(item.name)}</strong>
          <div class="stock-code">${escapeHtml(item.code)} / ${escapeHtml(item.sector || "未分類")}</div>
        </div>
        <span class="assist-label ${labelClass}">${label}</span>
      </div>
      <p class="reason">${escapeHtml(comment)}</p>
      ${review}
      ${caution}
      <div class="ranking-meta">
        <span>${escapeHtml(item.market || "市場不明")}</span>
        ${type === "autoBuyCandidates" ? `<span>${escapeHtml(item.normalCandidate || "通常候補前")}</span>` : ""}
        ${type === "autoBuyCandidates" && item.reviewStatus ? `<span>${escapeHtml(item.reviewStatus)}</span>` : ""}
        <span>${escapeHtml(item.signal || "待ち")}</span>
        <span>${escapeHtml(item.strategy || "価格検証")}</span>
        <span>${escapeHtml(item.timingAction || "監視")}</span>
        <span>品質 ${Math.round((item.autoBuyScore ?? item.qualityRank ?? item.timingRank ?? item.score ?? 0) * 10) / 10}</span>
        ${type === "autoBuyCandidates" ? `<span>買い比率 ${times(item.buyRatio ?? 0)}</span><span>上昇余地 ${pct(item.upside ?? 0)}</span><span>PBR ${times(item.pbr ?? 0)}</span><span>PER ${times(item.per ?? 0)}</span>` : ""}
        <span>${escapeHtml(item.qualityNote || "利益と下落耐性")}</span>
        <span>平均 ${pct(item.averageReturn ?? 0)}</span>
        <span>勝率 ${pct(item.winRate ?? 0)}</span>
        <span>最大下落 ${pct(item.maxDrawdown ?? 0)}</span>
      </div>
    </article>
    ${isActive ? renderInlineMobileLynchPreview(renderResearchLynch(item, type), `${item.name}のリンチ・チャート`, renderInlineResearchSummary(item, type)) : ""}
  `;
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
        <span>検証 ${stock.backtest?.confidence ?? "未検証"}</span>
        <span>${stock.dataFreshness.label}</span>
      </div>
      ${renderMiniMeter(stock)}
    </article>
    ${stock.code === selectedCode ? renderInlineMobileLynchPreview(renderLynchChart(stock), `${stock.name}のリンチ・チャート`, renderInlineStockSummary(stock)) : ""}
  `;
}

function topReason(stock) {
  if (stock.assist.label === "検証弱く見送り") return stock.assist.reasons[0];
  if (stock.assist.reasons[0]) return stock.assist.reasons[0];
  if (stock.nonBusinessAssetRatio >= 1) return "非事業資産が時価総額を上回っています";
  if (stock.netCashRatio >= 0.7) return "ネットキャッシュが厚い銘柄です";
  return "総合スコア順で上位です";
}

function renderDetail() {
  const researchItem = selectedResearch ? findResearchItem(selectedResearch.type, selectedResearch.code) : null;
  if (researchItem) {
    if (selectedResearch.type === "expansionPreview" || selectedResearch.type === "hiddenGemsDraft") {
      renderExpansionDetail(researchItem);
    } else {
      renderResearchDetail(researchItem, selectedResearch.type);
    }
    return;
  }

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
    qualitativeStatusLabel(stock),
    stock.edinet?.periodEnd ? `有報 ${stock.edinet.periodEnd}` : "有報未取得",
  ].map((label) => `<span class="badge">${label}</span>`).join("") + renderFreshnessBadge(stock);
  document.getElementById("buyTimingAlert").innerHTML = renderAutoFinancialAlert(stock) + renderBuyTimingAlert(stock);
  document.getElementById("timingPanel").innerHTML = renderTimingPanel(stock);
  document.getElementById("lifecycleAssist").innerHTML = renderLifecycleAssist(stock);
  document.getElementById("tradeMeter").innerHTML = renderTradeMeter(stock);
  document.getElementById("chart").innerHTML = renderChart(stock);
  const lynchChart = renderLynchChart(stock);
  document.getElementById("lynchChart").innerHTML = lynchChart;
  renderMobileLynchPreview(lynchChart, `${stock.name}のリンチ・チャート`);
  document.getElementById("reasonList").innerHTML = stock.assist.reasons.map((r) => `<li>${r}</li>`).join("");
  document.getElementById("nextActionList").innerHTML = stock.assist.nextActions.map((a) => `<li>${a}</li>`).join("");
  document.getElementById("metricGrid").innerHTML = renderMetrics(stock);
}

function isConfirmedEnough(stock) {
  return stock.dataConfidence === "確認済み"
    || stock.dataConfidence === "一部手入力"
    || stock.dataConfidence === "自動財務確認";
}

function isAutoFinancial(stock) {
  return stock.dataConfidence === "自動財務確認";
}

function qualitativeStatusLabel(stock) {
  if (stock.dataConfidence === "自動財務確認") return "財務自動確認";
  return stock.qualitativeDone ? "有報確認済み" : "有報確認待ち";
}

function findResearchItem(type, code) {
  if (type === "expansionPreview") {
    return (window.AUTO_EXPANSION_PREVIEW?.items ?? []).find((item) => item.code === code) ?? null;
  }
  if (type === "hiddenGemsDraft") {
    return (window.AUTO_HIDDEN_GEMS_DRAFT?.items ?? []).find((item) => item.code === code) ?? null;
  }
  if (type === "hiddenGems") {
    return (window.AUTO_HIDDEN_GEMS?.top ?? []).find((item) => item.code === code) ?? null;
  }
  if (type === "financialConfirmation") {
    return (window.AUTO_FINANCIAL_CONFIRMATION?.top ?? []).find((item) => item.code === code) ?? null;
  }
  if (type === "financialScreening") {
    return (window.AUTO_FINANCIAL_SCREENING?.top ?? []).find((item) => item.code === code) ?? null;
  }
  const items = type === "researchMultibagger"
    ? window.AUTO_RESEARCH_DATA?.multibaggerWatch ?? []
    : type === "autoBuyCandidates"
      ? window.AUTO_RESEARCH_DATA?.autoBuyCandidates ?? []
    : type === "researchTiming"
      ? window.AUTO_RESEARCH_DATA?.timingBuys ?? []
      : window.AUTO_RESEARCH_DATA?.universeAll ?? window.AUTO_RESEARCH_DATA?.universeTop ?? [];
  return items.find((item) => item.code === code) ?? null;
}

function renderExpansionDetail(item) {
  document.getElementById("detailAssist").textContent = "追加候補確認";
  document.getElementById("detailAssist").className = "assist-label label-research";
  document.getElementById("detailTitle").textContent = `${item.name} (${item.code})`;
  document.getElementById("detailBadges").innerHTML = [
    "通常候補前",
    item.dataConfidence || "推定",
    "財務確認前",
    item.sector || "未分類",
  ].map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join("");
  document.getElementById("buyTimingAlert").innerHTML = "";
  document.getElementById("timingPanel").innerHTML = renderExpansionTimingPanel(item);
  document.getElementById("lifecycleAssist").innerHTML = renderExpansionLifecycleAssist(item);
  document.getElementById("tradeMeter").innerHTML = renderExpansionMeter(item);
  document.getElementById("chart").innerHTML = renderExpansionChart(item);
  const lynchChart = renderExpansionLynchPlaceholder(item);
  document.getElementById("lynchChart").innerHTML = lynchChart;
  renderMobileLynchPreview(lynchChart, `${item.name}のリンチ・チャート`);
  document.getElementById("reasonList").innerHTML = [
    "日本株全体スクリーニングから通常候補への追加候補に入っています",
    "まだ買い候補ではなく、BPS、EPS、現金、有利子負債、発行株数の確認が先です",
    item.catalyst || "価格と財務を確認してから昇格判断します",
  ].map((reason) => `<li>${escapeHtml(reason)}</li>`).join("");
  document.getElementById("nextActionList").innerHTML = [
    "有報と決算短信でBPSとEPSを確認",
    "現金、有利子負債、発行株数を確認",
    "急騰直後ではないか、出来高が続いているか確認",
    "確認できたら通常候補マスタへ昇格",
  ].map((action) => `<li>${escapeHtml(action)}</li>`).join("");
  document.getElementById("metricGrid").innerHTML = renderExpansionMetrics(item);
}

function renderResearchDetail(item, type) {
  if (type === "financialConfirmation") {
    renderFinancialConfirmationDetail(item);
    return;
  }
  if (type === "financialScreening") {
    renderFinancialScreeningDetail(item);
    return;
  }
  const label = type === "researchMultibagger" ? "2倍監視" : type === "autoBuyCandidates" ? "自動買い候補予備軍" : type === "hiddenGems" ? "未発掘候補" : "広域候補";
  const comment = item.comment || signalComment(item);
  document.getElementById("detailAssist").textContent = label;
  document.getElementById("detailAssist").className = `assist-label ${type === "autoBuyCandidates" ? "label-research" : "label-near"}`;
  document.getElementById("detailTitle").textContent = `${item.name} (${item.code})`;
  document.getElementById("detailBadges").innerHTML = [
    "日本株全体調査",
    item.judgement || "価格検証",
    item.timingAction || item.status || "監視",
    item.qualityNote || "利益と下落耐性",
    item.signal || "待ち",
    item.market || "市場不明",
  ].map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join("");
  document.getElementById("buyTimingAlert").innerHTML = type === "hiddenGems" ? renderHiddenGemAssistAlert(item) : type === "autoBuyCandidates" ? renderAutoBuyCandidateAlert(item) : "";
  document.getElementById("timingPanel").innerHTML = renderResearchTimingPanel(item, label);
  document.getElementById("lifecycleAssist").innerHTML = renderResearchLifecycleAssist(item);
  document.getElementById("tradeMeter").innerHTML = renderResearchMeter(item);
  document.getElementById("chart").innerHTML = renderResearchChart(item);
  const lynchChart = renderResearchLynch(item, type);
  document.getElementById("lynchChart").innerHTML = lynchChart;
  renderMobileLynchPreview(lynchChart, `${item.name}のリンチ・チャート`);
  document.getElementById("reasonList").innerHTML = [
    comment,
    type === "autoBuyCandidates"
      ? `買いライン比率${times(item.buyRatio ?? 0)}、上昇余地${pct(item.upside ?? 0)}、PBR ${times(item.pbr ?? 0)}、PER ${times(item.per ?? 0)}です`
      : `価格検証の平均は${pct(item.averageReturn ?? 0)}、勝率は${pct(item.winRate ?? 0)}です`,
    item.caution || "価格だけの一次候補なので、財務と開示の確認が必要です",
  ].map((reason) => `<li>${escapeHtml(reason)}</li>`).join("");
  document.getElementById("nextActionList").innerHTML = researchNextActions(item)
    .map((action) => `<li>${escapeHtml(action)}</li>`)
    .join("");
  document.getElementById("metricGrid").innerHTML = renderResearchMetrics(item);
}

function renderFinancialConfirmationDetail(item) {
  document.getElementById("detailAssist").textContent = "財務確認";
  document.getElementById("detailAssist").className = "assist-label label-risk";
  document.getElementById("detailTitle").textContent = `${item.name} (${item.code})`;
  document.getElementById("detailBadges").innerHTML = [
    item.source || "確認元",
    item.status || "確認",
    item.buyGuard || "確認完了まで買わない",
    item.sector || "未分類",
  ].map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join("");
  document.getElementById("buyTimingAlert").innerHTML = renderFinancialConfirmationAlert(item);
  document.getElementById("timingPanel").innerHTML = "";
  document.getElementById("lifecycleAssist").innerHTML = "";
  document.getElementById("tradeMeter").innerHTML = "";
  document.getElementById("chart").innerHTML = renderFinancialConfirmationPlaceholder(item);
  const lynchChart = renderFinancialConfirmationPlaceholder(item);
  document.getElementById("lynchChart").innerHTML = lynchChart;
  renderMobileLynchPreview(lynchChart, `${item.name}の財務確認`);
  document.getElementById("reasonList").innerHTML = [
    item.buyGuard || "確認完了まで買わない",
    item.note || "財務確認が必要です",
    `注意: ${item.blockers || "なし"}`,
  ].map((reason) => `<li>${escapeHtml(reason)}</li>`).join("");
  document.getElementById("nextActionList").innerHTML = String(item.checklist || "BPS、EPS、現金、有利子負債、発行株数、直近決算")
    .split(/[、,]/)
    .map((action) => action.trim())
    .filter(Boolean)
    .map((action) => `<li>${escapeHtml(action)}</li>`)
    .join("");
  document.getElementById("metricGrid").innerHTML = renderFinancialConfirmationMetrics(item);
}

function renderAutoBuyCandidateAlert(item) {
  return `
    <section class="buy-timing-alert" aria-label="自動買い候補予備軍">
      <div>
        <p class="eyebrow">全体自動判定</p>
        <h3>${escapeHtml(item.reviewStatus || "正式今買い前の予備軍")}</h3>
        <p>${escapeHtml(item.action || "通常候補へ昇格する前に有報と決算短信を確認します。")}</p>
      </div>
      <div class="buy-timing-values">
        <span>点 ${Math.round((item.autoBuyScore ?? item.qualityRank ?? 0) * 10) / 10}</span>
        <span>買い比率 ${times(item.buyRatio ?? 0)}</span>
        <span>上昇余地 ${pct(item.upside ?? 0)}</span>
        <span>${escapeHtml(item.reviewStatus || item.normalCandidate || "通常候補前")}</span>
      </div>
    </section>
  `;
}

function renderFinancialConfirmationAlert(item) {
  return `
    <section class="buy-timing-alert" aria-label="財務確認アシスト">
      <div>
        <p class="eyebrow">財務確認アシスト</p>
        <h3>確認完了まで買わない</h3>
        <p>${escapeHtml(item.nextStep || "BPS、EPS、現金、有利子負債、発行株数、直近決算を確認します。")}</p>
      </div>
      <div class="buy-timing-values">
        <span>${escapeHtml(item.source || "確認元")}</span>
        <span>点 ${Math.round((item.confirmationScore ?? 0) * 10) / 10}</span>
        <span>株価 ${yen(item.price)}</span>
        <span>${escapeHtml(item.blockers || "注意なし")}</span>
      </div>
    </section>
  `;
}

function renderFinancialScreeningDetail(item) {
  const labelClass = item.status === "昇格確認優先" ? "label-near" : item.status === "見送り寄り" ? "label-risk" : "label-research";
  document.getElementById("detailAssist").textContent = "財務優先確認";
  document.getElementById("detailAssist").className = `assist-label ${labelClass}`;
  document.getElementById("detailTitle").textContent = `${item.name} (${item.code})`;
  document.getElementById("detailBadges").innerHTML = [
    item.status || "確認",
    `点 ${Math.round((item.screenScore ?? 0) * 10) / 10}`,
    item.sector || "未分類",
    item.sourceUrl ? "IRBANK確認元あり" : "確認元待ち",
  ].map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`).join("");
  document.getElementById("buyTimingAlert").innerHTML = renderFinancialScreeningAlert(item);
  document.getElementById("timingPanel").innerHTML = "";
  document.getElementById("lifecycleAssist").innerHTML = "";
  document.getElementById("tradeMeter").innerHTML = "";
  document.getElementById("chart").innerHTML = renderFinancialScreeningPlaceholder(item);
  const lynchChart = renderFinancialScreeningPlaceholder(item);
  document.getElementById("lynchChart").innerHTML = lynchChart;
  renderMobileLynchPreview(lynchChart, `${item.name}の財務スクリーニング`);
  document.getElementById("reasonList").innerHTML = [
    item.reasons || "確認材料が不足しています",
    item.cautions ? `注意: ${item.cautions}` : "大きな注意はありません",
  ].map((reason) => `<li>${escapeHtml(reason)}</li>`).join("");
  document.getElementById("nextActionList").innerHTML = [
    item.action || "決算短信と有報を確認",
    "BPS、EPS、現金、有利子負債、発行株数を原資料で確認",
    "問題なければワークシートのconfirmedとqualitativeDoneをtrue",
  ].map((action) => `<li>${escapeHtml(action)}</li>`).join("");
  document.getElementById("metricGrid").innerHTML = renderFinancialScreeningMetrics(item);
}

function renderFinancialScreeningAlert(item) {
  const headline = item.status === "昇格確認優先"
    ? "通常候補へ進める前の最優先確認"
    : item.status === "見送り寄り"
      ? "通常候補へ入れない方向で確認"
      : item.status === "入力待ち"
        ? "不足データを先に埋める"
        : "慎重に確認";
  return `
    <section class="buy-timing-alert" aria-label="財務スクリーニング">
      <div>
        <p class="eyebrow">財務スクリーニング</p>
        <h3>${headline}</h3>
        <p>${escapeHtml(item.action || "原資料確認が先です。")}</p>
      </div>
      <div class="buy-timing-values">
        <span>点 ${Math.round((item.screenScore ?? 0) * 10) / 10}</span>
        <span>PBR ${times(item.pbr ?? 0)}</span>
        <span>PER ${(item.per ?? 0) ? times(item.per) : "-"}</span>
      </div>
    </section>
  `;
}

function renderFinancialScreeningPlaceholder(item) {
  return `
    <div class="chart-empty">
      <p class="eyebrow">財務優先確認</p>
      <h3>${escapeHtml(item.status || "確認")} / 点${Math.round((item.screenScore ?? 0) * 10) / 10}</h3>
      <p>${escapeHtml(item.reasons || "確認材料を整理しています")}</p>
      <p>${escapeHtml(item.cautions || "大きな注意なし")}</p>
    </div>
  `;
}

function renderFinancialScreeningMetrics(item) {
  const metrics = [
    ["点数", `${Math.round((item.screenScore ?? 0) * 10) / 10}点`],
    ["判定", item.status || "確認"],
    ["PBR", times(item.pbr ?? 0)],
    ["PER", (item.per ?? 0) ? times(item.per) : "-"],
    ["ネット現金比率", percentPoint(item.netCashRatio ?? 0)],
    ["有利子負債比率", percentPoint(item.debtAssetRatio ?? 0)],
    ["時価総額", oku(item.marketCap ?? 0)],
    ["次", item.action || "原資料確認"],
  ];
  return metrics.map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
}

function percentPoint(value) {
  return `${Math.round(Number(value || 0) * 10) / 10}%`;
}

function renderFinancialConfirmationPlaceholder(item) {
  return `
    <div class="chart-empty">
      <p class="eyebrow">財務確認</p>
      <h3>${escapeHtml(item.name)}は確認完了まで買わない</h3>
      <p>${escapeHtml(item.nextStep || "有報と決算短信で仮置きを実数へ置き換えます。")}</p>
    </div>
  `;
}

function renderFinancialConfirmationMetrics(item) {
  const metrics = [
    ["確認元", item.source || "不明"],
    ["状態", item.status || "確認"],
    ["点数", `${Math.round((item.confirmationScore ?? 0) * 10) / 10}点`],
    ["株価", yen(item.price)],
    ["買いガード", item.buyGuard || "確認完了まで買わない"],
    ["注意", item.blockers || "なし"],
    ["次にやること", item.nextStep || "財務確認"],
    ["確認項目", item.checklist || "BPS、EPS、現金、有利子負債、発行株数、直近決算"],
  ];
  return metrics.map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
}

function renderHiddenGemAssistAlert(item) {
  const action = item.assistAction || item.timingAction || item.status || "監視";
  if (!["今すぐ財務確認", "高値なので待つ", "買わない寄り"].includes(action)) return "";
  const headline = action === "今すぐ財務確認"
    ? "価格上はすぐ確認する候補です"
    : action === "高値なので待つ"
      ? "今は飛びつかず押し目待ちです"
      : "今は買わない寄りです";
  const message = action === "今すぐ財務確認"
    ? "買い判断の前に、BPS・EPS・現金・有利子負債・直近決算を確認します。条件から外れたらこの表示は消えます。"
    : action === "高値なので待つ"
      ? "勢いはありますが、高値圏や急騰後の可能性があります。押し目と出来高継続を待ちます。"
      : "下落リスクや勝率に不安があります。候補入りより除外判断を優先します。";
  return `
    <section class="buy-timing-alert" aria-label="未発掘候補アシスト">
      <div>
        <p class="eyebrow">未発掘候補アシスト</p>
        <h3>${headline}</h3>
        <p>${message}</p>
      </div>
      <div class="buy-timing-values">
        <span>${escapeHtml(action)}</span>
        <span>点 ${Math.round((item.hiddenScore ?? item.score ?? 0) * 10) / 10}</span>
        <span>勝率 ${pct(item.winRate ?? 0)}</span>
        <span>最大下落 ${pct(item.maxDrawdown ?? 0)}</span>
      </div>
    </section>
  `;
}

function renderExpansionTimingPanel(item) {
  return `
    <section class="timing-card timing-warn" aria-label="追加候補確認">
      <div>
        <p class="eyebrow">追加候補確認</p>
        <h3>買う前に財務確認</h3>
      </div>
      <div class="timing-actions">
        <div><span>今の扱い</span><strong>通常候補前の確認リスト</strong></div>
        <div><span>次に確認</span><strong>BPS・EPS・現金・負債</strong></div>
      </div>
      <div class="timing-stats">
        <span>株価 ${yen(item.price)}</span>
        <span>推定BPS ${yen(item.bps)}</span>
        <span>推定EPS ${Math.round((item.eps ?? 0) * 10) / 10}</span>
        <span>確認前</span>
      </div>
    </section>
  `;
}

function renderResearchTimingPanel(item, label) {
  const tone = item.judgement === "良さそう" && (item.maxDrawdown ?? 0) > -15 ? "good" : "warn";
  const score = item.autoBuyScore ?? item.score ?? 0;
  const quality = item.autoBuyScore ?? item.qualityRank ?? item.timingRank ?? item.score ?? 0;
  return `
    <section class="timing-card timing-${tone}" aria-label="広域バックテスト確認">
      <div>
        <p class="eyebrow">${label}</p>
        <h3>${escapeHtml(item.timingAction || item.status || item.signal || "待ち")}</h3>
      </div>
      <div class="timing-actions">
        <div><span>今の扱い</span><strong>${escapeHtml(researchActionLabel(item))}</strong></div>
        <div><span>次に確認</span><strong>${escapeHtml(researchNextActions(item)[0])}</strong></div>
      </div>
      <div class="timing-stats">
        <span>点数 ${Math.round(score * 10) / 10}</span>
        <span>品質 ${Math.round(quality * 10) / 10}</span>
        ${item.buyRatio ? `<span>買い比率 ${times(item.buyRatio)}</span>` : ""}
        ${item.upside ? `<span>上昇余地 ${pct(item.upside)}</span>` : ""}
        <span>勝率 ${pct(item.winRate ?? 0)}</span>
        <span>平均 ${pct(item.averageReturn ?? 0)}</span>
        <span>最大下落 ${pct(item.maxDrawdown ?? 0)}</span>
        <span>検証 ${item.trades ?? 0}回</span>
      </div>
    </section>
  `;
}

function renderResearchMeter(item) {
  const score = item.autoBuyScore ?? item.score ?? 0;
  const scorePos = Math.max(0, Math.min(98, score / 1.5));
  return `
    <div class="card-top">
      <strong>${escapeHtml(researchActionLabel(item))}</strong>
      <span>点数 ${Math.round(score * 10) / 10}</span>
    </div>
    <div class="meter-track"><span class="meter-marker" style="left:${scorePos}%"></span></div>
    <div class="meter-labels">
      <span>見送り</span>
      <span>監視</span>
      <span>優先確認</span>
    </div>
  `;
}

function renderResearchChart(item) {
  const width = 880;
  const height = 260;
  const score = item.autoBuyScore ?? item.score ?? 0;
  const metrics = [
    ["点数", Math.min(100, score / 1.5), "#246a9f"],
    ["勝率", Math.max(0, Math.min(100, item.winRate ?? 0)), "#1f8a55"],
    ["平均", Math.max(0, Math.min(100, (item.averageReturn ?? 0) * 2)), "#1f8a55"],
    ["下落浅さ", Math.max(0, Math.min(100, 100 + (item.maxDrawdown ?? 0) * 4)), "#b98513"],
  ];
  const bars = metrics.map(([label, value, color], index) => {
    const x = 100 + index * 185;
    const barHeight = (value / 100) * 140;
    const y = 180 - barHeight;
    return `
      <rect x="${x}" y="${y}" width="88" height="${barHeight}" rx="8" fill="${color}" opacity="0.82" />
      <text x="${x + 44}" y="205" text-anchor="middle" font-size="13" fill="#65706b">${label}</text>
      <text x="${x + 44}" y="${Math.max(32, y - 10)}" text-anchor="middle" font-size="13" font-weight="700" fill="#1d2522">${Math.round(value)}%</text>
    `;
  }).join("");
  return `
    <svg viewBox="0 0 ${width} ${height}" aria-label="${escapeHtml(item.name)}の広域調査チャート">
      <rect x="32" y="24" width="${width - 64}" height="196" rx="10" fill="#ffffff" />
      <line x1="70" x2="${width - 70}" y1="180" y2="180" stroke="#dfe5df" />
      ${bars}
      <text x="52" y="42" font-size="13" fill="#65706b">価格バックテストの見え方</text>
      <text x="52" y="64" font-size="18" font-weight="700" fill="#1d2522">${escapeHtml(researchActionLabel(item))}</text>
    </svg>
  `;
}

function renderResearchMetrics(item) {
  const metrics = [
    ["市場", item.market || "市場不明"],
    ["業種", item.sector || "未分類"],
    ["判定", item.judgement || "未判定"],
    ["最新シグナル", item.signal || "待ち"],
    ["検証戦略", item.strategy || "価格検証"],
    ["通常候補扱い", item.normalCandidate || "通常候補前"],
    ["昇格判定", item.reviewStatus || "未判定"],
    ["昇格理由", item.reviewReasons || "-"],
    ["確認注意", item.reviewCautions || item.caution || "財務と開示を確認"],
    ["買いライン", item.buyLine ? yen(item.buyLine) : "確認後"],
    ["目標株価", item.targetPrice ? yen(item.targetPrice) : "確認後"],
    ["買い比率", item.buyRatio ? times(item.buyRatio) : "-"],
    ["上昇余地", item.upside ? pct(item.upside) : "-"],
    ["PBR", item.pbr ? times(item.pbr) : "-"],
    ["PER", item.per ? times(item.per) : "-"],
    ["ネット現金比率", item.netCashRatio || item.netCashRatio === 0 ? percentPoint(item.netCashRatio) : "-"],
    ["期間騰落", pct(item.periodReturn ?? 0)],
    ["点数", `${Math.round((item.autoBuyScore ?? item.score ?? 0) * 10) / 10}点`],
    ["品質ランク", `${Math.round((item.autoBuyScore ?? item.qualityRank ?? item.timingRank ?? item.score ?? 0) * 10) / 10}点`],
    ["負けにくさメモ", item.qualityNote || "利益と下落耐性を確認"],
    ["勝率", pct(item.winRate ?? 0)],
    ["平均リターン", pct(item.averageReturn ?? 0)],
    ["最大下落", pct(item.maxDrawdown ?? 0)],
    ["検証回数", `${item.trades ?? 0}回`],
    ["注意", item.caution || "財務と開示を確認"],
  ];
  return metrics.map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
}

function researchActionLabel(item) {
  if (item.reviewStatus === "通常候補へ昇格OK") return "通常候補へ昇格OK";
  if (item.reviewStatus === "今回は見送り") return "今回は見送り";
  if (item.reviewStatus === "追加確認") return "追加確認";
  if (item.status === "自動買い候補予備軍") return "正式今買い前の予備軍";
  if (item.status === "財務注意つき予備軍") return "財務注意つき予備軍";
  if (item.timingAction) return item.timingAction;
  if (item.signal === "上昇中押し目" && item.judgement === "良さそう") return "優先監視。押し目と出来高を確認";
  if (item.signal === "高値圏") return "飛びつき注意。押し目待ち";
  if ((item.maxDrawdown ?? 0) <= -15) return "下落リスク確認が先";
  if ((item.winRate ?? 0) >= 80 && (item.averageReturn ?? 0) >= 20) return "監視候補。材料確認";
  return "まず監視。財務確認が先";
}

function researchNextActions(item) {
  if (item.reviewNextAction) return [item.reviewNextAction, "有報でBPSと純資産を確認", "直近決算で利益継続性を確認", "出来高と急騰リスクを確認"];
  if (item.action) return [item.action, "有報でBPSと純資産を確認", "直近決算で利益継続性を確認", "出来高と急騰リスクを確認"];
  if (item.nextCheck) return String(item.nextCheck).split(/[、,]/).map((value) => value.trim()).filter(Boolean).slice(0, 4);
  return [
    "直近決算で売上と利益の伸びを確認",
    "出来高が増えているか確認",
    "高値掴みにならない価格位置か確認",
    "有報と開示で材料を確認",
  ];
}

function isBuyTiming(stock) {
  return stock.assist.label === "今買い候補";
}

function renderBuyTimingAlert(stock) {
  if (!isBuyTiming(stock)) return "";
  const backtest = stock.backtest ?? {};
  return `
    <section class="buy-timing-alert" aria-label="買いタイミング">
      <div>
        <p class="eyebrow">買いタイミング点灯中</p>
        <h3>今は買い候補です</h3>
        <p>${stock.assist.reasons[0] ?? "買いライン付近です"}。条件から外れたらこの表示は消えます。</p>
      </div>
      <div class="buy-timing-values">
        <span>現在 ${yen(stock.price)}</span>
        <span>買いライン ${yen(stock.buyLine)}</span>
        <span>上昇余地 ${pct(stock.upside)}</span>
        <span>検証 ${backtest.confidence ?? "未検証"}</span>
      </div>
    </section>
  `;
}

function renderAutoFinancialAlert(stock) {
  if (!isAutoFinancial(stock)) return "";
  const followup = autoFinancialFollowupFor(stock);
  const headline = isPriorityAutoFinancialFollowup(stock)
    ? "自動財務確認済みの買い場接近"
    : followup?.action === "買いは後回し"
      ? "検証が弱いので買いは後回し"
      : "自動財務確認済み";
  const body = followup?.checkItems
    || "財務データは自動取得で候補化しています。買いライン、上昇余地、バックテスト、リスク表示を合わせて判断します。";
  return `
    <section class="confirmation-alert" aria-label="自動財務確認の注意">
      <div>
        <p class="eyebrow">自動財務確認</p>
        <h3>${escapeHtml(headline)}</h3>
        <p>${escapeHtml(body)}</p>
      </div>
      <div class="buy-timing-values">
        <span>${escapeHtml(followup?.action || "自動財務確認")}</span>
        <span>買いライン ${yen(followup?.buyLine ?? stock.buyLine)}</span>
        <span>点 ${Math.round(Number(followup?.followupScore ?? stock.score ?? 0))}</span>
        <span>検証 ${stock.backtest?.confidence ?? "未検証"}</span>
      </div>
    </section>
  `;
}

function renderTimingPanel(stock) {
  const backtest = stock.backtest ?? {};
  const tone = backtest.confidence === "高め" ? "good" : backtest.confidence === "中" ? "warn" : "neutral";
  return `
    <section class="timing-card timing-${tone}" aria-label="バックテスト売買タイミング">
      <div>
        <p class="eyebrow">バックテスト売買タイミング</p>
        <h3>${backtest.timingLabel ?? "未検証"}</h3>
      </div>
      <div class="timing-actions">
        <div><span>買い</span><strong>${backtest.buyTiming ?? "データ待ち"}</strong></div>
        <div><span>売り</span><strong>${backtest.sellTiming ?? "データ待ち"}</strong></div>
      </div>
      <div class="timing-stats">
        <span>精度 ${backtest.confidence ?? "未検証"}</span>
        <span>勝率 ${pct(backtest.winRate ?? 0)}</span>
        <span>平均 ${pct(backtest.averageReturn ?? 0)}</span>
        <span>最大下落 ${pct(backtest.maxDrawdown ?? 0)}</span>
        <span>検証 ${backtest.trades ?? 0}回/${backtest.sampleCount ?? 0}点</span>
      </div>
    </section>
  `;
}

function renderLifecycleAssist(stock) {
  const stages = lifecycleStages(stock);
  return `
    <section class="lifecycle-assist" aria-label="買いから売りまでのアシスト">
      <div class="section-heading">
        <div>
          <p class="eyebrow">買いから売りまで</p>
          <h3>この銘柄の進め方</h3>
        </div>
        <span>${escapeHtml(lifecycleHeadline(stock))}</span>
      </div>
      <div class="lifecycle-grid">
        ${stages.map((stage, index) => `
          <article class="lifecycle-step ${stage.active ? "lifecycle-active" : ""} ${stage.tone}">
            <strong>${index + 1}. ${stage.title}</strong>
            <p>${stage.message}</p>
            <small>${stage.check}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function lifecycleHeadline(stock) {
  if (["今売り検討", "一部利益確定検討"].includes(stock.assist.label)) return "売り判断";
  if (stock.assist.label === "今買い候補") return "買い判断";
  if (stock.held) return "保有確認";
  if (isAvoidAssist(stock.assist.label)) return "見送り優先";
  return "監視継続";
}

function lifecycleStages(stock) {
  const buyActive = ["今買い候補", "買い場に近い", "財務確認待ち", "データ更新待ち"].includes(stock.assist.label);
  const holdActive = stock.held && !["今売り検討", "一部利益確定検討"].includes(stock.assist.label);
  const sellActive = ["今売り検討", "一部利益確定検討"].includes(stock.assist.label);
  const avoidActive = isAvoidAssist(stock.assist.label);
  return [
    {
      title: "買う前",
      active: buyActive,
      tone: buyActive ? "tone-buy" : "",
      message: buyActive
        ? `${stock.assist.label}です。買いライン、上昇余地、検証結果を確認します。`
        : `買いラインは${yen(stock.buyLine)}、現在は${yen(stock.price)}です。`,
      check: isAutoFinancial(stock) ? "決算短信と有報の後追い確認が先" : stock.qualitativeDone ? "有報確認済み" : "有報・決算確認が先",
    },
    {
      title: "買った後",
      active: holdActive,
      tone: holdActive ? "tone-hold" : "",
      message: stock.held
        ? "保有中です。目標株価までの距離と悪材料の有無を見ます。"
        : "買った後は、目標株価・決算悪化・買い増し条件を先に決めます。",
      check: `目標 ${yen(stock.targetPrice)} / 上昇余地 ${pct(stock.upside)}`,
    },
    {
      title: "売る時",
      active: sellActive,
      tone: sellActive ? "tone-sell" : "",
      message: sellActive
        ? "売り検討ゾーンです。一括売りか一部利益確定かを確認します。"
        : "目標到達、決算悪化、資産価値の低下で売り判断します。",
      check: stock.backtest?.sellTiming ?? `目標の90%付近 ${yen(stock.targetPrice * 0.9)}`,
    },
    {
      title: "見送る時",
      active: avoidActive,
      tone: avoidActive ? "tone-risk" : "",
      message: avoidActive
        ? "今は買わない判断を優先します。理由が消えるまで待ちます。"
        : "赤字拡大、検証悪化、データ未確認なら無理に買いません。",
      check: stock.risk || stock.assist.reasons[0] || "見送り条件を確認",
    },
  ];
}

function renderResearchLifecycleAssist(item) {
  return `
    <section class="lifecycle-assist" aria-label="広域候補の確認手順">
      <div class="section-heading">
        <div>
          <p class="eyebrow">通常候補に入れる前</p>
          <h3>確認の順番</h3>
        </div>
        <span>一次調査</span>
      </div>
      <div class="lifecycle-grid">
        ${[
          ["価格", `${item.signal || "待ち"}。価格の形は候補です。`, `平均 ${pct(item.averageReturn ?? 0)} / 勝率 ${pct(item.winRate ?? 0)}`],
          ["財務", "BPS、EPS、現金、有利子負債、発行株数を確認します。", "ここが埋まるまで通常買い候補にはしません"],
          ["材料", "決算成長、開示、出来高、過熱感を確認します。", item.nextCheck || "材料と流動性を確認"],
          ["昇格", "財務と材料が揃ったら通常候補に追加します。", item.caution || "価格だけでは判断しません"],
        ].map(([title, message, check], index) => `
          <article class="lifecycle-step ${index === 0 ? "lifecycle-active tone-hold" : ""}">
            <strong>${index + 1}. ${escapeHtml(title)}</strong>
            <p>${escapeHtml(message)}</p>
            <small>${escapeHtml(check)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderExpansionLifecycleAssist(item) {
  return `
    <section class="lifecycle-assist" aria-label="追加候補の確認手順">
      <div class="section-heading">
        <div>
          <p class="eyebrow">通常候補へ入れる前</p>
          <h3>昇格までの順番</h3>
        </div>
        <span>確認前</span>
      </div>
      <div class="lifecycle-grid">
        ${[
          ["価格", `株価は${yen(item.price)}です。まず高値掴みでないか見ます。`, "チャート位置と出来高を確認"],
          ["財務", "BPS、EPS、現金、有利子負債、発行株数を有報で確認します。", "ここが未確認なら買い候補にしません"],
          ["価値", "確認済みBPSとPER/PBRレンジで買いラインと売り目安を作ります。", "リンチ・チャートは確認後に本表示"],
          ["昇格", "財務と材料が揃ったら通常候補へ入れます。", "朝ランキングの対象に昇格"],
        ].map(([title, message, check], index) => `
          <article class="lifecycle-step ${index === 1 ? "lifecycle-active tone-risk" : ""}">
            <strong>${index + 1}. ${escapeHtml(title)}</strong>
            <p>${escapeHtml(message)}</p>
            <small>${escapeHtml(check)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
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

function renderExpansionMeter(item) {
  return `
    <div class="card-top">
      <strong>財務確認前</strong>
      <span>${yen(item.price)}</span>
    </div>
    <div class="meter-track"><span class="meter-marker" style="left:50%"></span></div>
    <div class="meter-labels">
      <span>確認前</span>
      <span>現在 ${yen(item.price)}</span>
      <span>昇格後に売買ライン作成</span>
    </div>
  `;
}

function renderExpansionChart(item) {
  const history = item.history?.length ? item.history : [item.price * 0.9, item.price * 0.95, item.price];
  const width = 880;
  const height = 260;
  const min = Math.min(...history) * 0.96;
  const max = Math.max(...history) * 1.06;
  const points = history.map((price, index) => {
    const x = 56 + (index / Math.max(1, history.length - 1)) * (width - 112);
    const y = height - 48 - ((price - min) / Math.max(1, max - min)) * 160;
    return `${x},${y}`;
  }).join(" ");
  return `
    <svg viewBox="0 0 ${width} ${height}" aria-label="${escapeHtml(item.name)}の追加候補チャート">
      <rect x="32" y="24" width="${width - 64}" height="196" rx="10" fill="#ffffff" />
      <line x1="56" x2="${width - 56}" y1="188" y2="188" stroke="#dfe5df" />
      <polyline points="${points}" fill="none" stroke="#246a9f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${56 + (width - 112)}" cy="${height - 48 - ((history.at(-1) - min) / Math.max(1, max - min)) * 160}" r="6" fill="#246a9f" />
      <text x="52" y="48" font-size="13" fill="#65706b">追加候補の価格推移</text>
      <text x="52" y="72" font-size="18" font-weight="700" fill="#1d2522">買い判断は財務確認後</text>
      <text x="${width - 52}" y="72" text-anchor="end" font-size="18" font-weight="700" fill="#246a9f">${yen(item.price)}</text>
    </svg>
  `;
}

function renderExpansionLynchPlaceholder(item) {
  return `
    <div class="chart-empty">
      <strong>リンチ・チャートは財務確認後</strong>
      <p>${escapeHtml(item.name)}は追加候補です。EPSとPERレンジを確認すると、買いラインと売り目安をチャート上に表示できます。</p>
    </div>
  `;
}

function renderExpansionMetrics(item) {
  const metrics = [
    ["状態", "通常候補へ入れる前"],
    ["データ信頼度", item.dataConfidence || "推定"],
    ["業種", item.sector || "未分類"],
    ["株価", yen(item.price)],
    ["推定BPS", yen(item.bps)],
    ["推定EPS", Math.round((item.eps ?? 0) * 10) / 10],
    ["推定PBR低め", times(item.pbrLow ?? 0)],
    ["推定PBR平均", times(item.pbrAvg ?? 0)],
    ["推定PBR高め", times(item.pbrHigh ?? 0)],
    ["推定PER平均", times(item.perAvg ?? 0)],
    ["注意", item.risk || "財務確認前"],
    ["メモ", item.catalyst || "通常候補への追加候補"],
  ];
  return metrics.map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
}

function renderMetrics(stock) {
  const providerWarnings = window.AUTO_STOCK_DATA?.dataQuality?.providerWarnings ?? [];
  const validationWarnings = window.AUTO_STOCK_DATA?.dataQuality?.validationWarnings ?? [];
  const referenceWarnings = window.AUTO_STOCK_DATA?.dataQuality?.externalReferenceWarnings ?? [];
  const metrics = [
    ["監視状態", stock.watchlist?.status || "未監視"],
    ["監視メモ", stock.watchlist?.note || "なし"],
    ["データ鮮度", stock.dataFreshness?.label || "未確認"],
    ["鮮度メモ", stock.dataFreshness?.warnings?.[0] || "確認済み"],
    ["取得状態", providerWarnings.length ? `${providerWarnings.length}件要確認` : "OK"],
    ["入力値注意", validationWarnings.length ? `${validationWarnings.length}件` : "なし"],
    ["参照注意", referenceWarnings.length ? `${referenceWarnings.length}件` : "なし"],
    ["株価日付", stock.priceAsOf || "未確認"],
    ["有報対象期", stock.edinet?.periodEnd || "未取得"],
    ["有報提出日", stock.edinet?.submittedAt || "未取得"],
    ["検証タイミング", stock.backtest?.bestStrategyLabel || "未検証"],
    ["検証信頼度", stock.backtest?.confidence || "未検証"],
    ["検証勝率", pct(stock.backtest?.winRate ?? 0)],
    ["検証平均リターン", pct(stock.backtest?.averageReturn ?? 0)],
    ["検証最大下落", pct(stock.backtest?.maxDrawdown ?? 0)],
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
  const calloutColor = stock.assist.className.includes("sell") || stock.assist.className.includes("risk")
    ? "#c44536"
    : stock.assist.className.includes("buy") ? "#1f8a55" : "#246a9f";
  const timingText = stock.backtest?.buyTiming ? `検証: ${stock.backtest.buyTiming}` : "";

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
      <text x="${pad.left}" y="${buyY - 8}" font-size="12" fill="#1f8a55">ここで買い候補 ${yen(stock.buyLine)}</text>
      <text x="${pad.left}" y="${targetY - 8}" font-size="12" fill="#c44536">目標株価 ${yen(stock.targetPrice)}</text>
      <text x="${currentX - 42}" y="${currentY + 24}" font-size="12" fill="#1d2522">現在 ${yen(stock.price)}</text>
      <text x="${pad.left}" y="${height - 12}" font-size="12" fill="#65706b">${timingText}</text>
    </svg>
  `;
}

function renderLynchChart(stock) {
  const eps = Number(stock.eps || 0);
  if (!Number.isFinite(eps) || eps <= 0) {
    return `
      <div class="chart-empty">
        <p class="eyebrow">リンチ・チャート</p>
        <h3>EPSが確認できるまで待ち</h3>
        <p>赤字またはEPS未確認のため、利益目安線は表示していません。先に直近決算とEPSを確認します。</p>
      </div>
    `;
  }

  const width = 880;
  const height = 360;
  const pad = { left: 62, right: 36, top: 38, bottom: 86 };
  const perLow = Number(stock.perLow || 0) > 0 ? Number(stock.perLow) : Math.max(1, Number(stock.pbrLow || 0) * 20);
  const perAvg = Number(stock.perAvg || 0) > 0 ? Number(stock.perAvg) : Math.max(perLow, (perLow + Number(stock.perHigh || perLow * 1.6)) / 2);
  const perHigh = Number(stock.perHigh || 0) > 0 ? Number(stock.perHigh) : Math.max(perAvg * 1.35, perAvg + 4);
  const epsSeries = estimatedEpsSeries(stock.history.length, eps);
  const lowSeries = epsSeries.map((value) => value * perLow);
  const fairSeries = epsSeries.map((value) => value * perAvg);
  const highSeries = epsSeries.map((value) => value * perHigh);
  const lowLine = lowSeries.at(-1);
  const fairLine = fairSeries.at(-1);
  const highLine = highSeries.at(-1);
  const values = [...stock.history, ...lowSeries, ...fairSeries, ...highSeries, stock.price];
  const min = Math.max(1, Math.min(...values) * 0.82);
  const max = Math.max(...values) * 1.12;
  const x = (index) => pad.left + (index / Math.max(1, stock.history.length - 1)) * (width - pad.left - pad.right);
  const y = (value) => pad.top + (1 - (value - min) / (max - min)) * (height - pad.top - pad.bottom);
  const pricePoints = stock.history.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const historyDates = estimatedHistoryDates(stock);
  const dateTicks = lynchDateTicks(historyDates).map((tick) => `
    <line x1="${x(tick.index)}" x2="${x(tick.index)}" y1="${height - pad.bottom}" y2="${height - pad.bottom + 6}" stroke="#b9c1bc" />
    <text x="${x(tick.index)}" y="${height - pad.bottom + 22}" text-anchor="${tick.anchor}" font-size="11" fill="#65706b">${tick.label}</text>
  `).join("");
  const seriesPoints = (series) => series.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const valueLine = (series, color, label, dash = "") => `
    <polyline points="${seriesPoints(series)}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" ${dash ? `stroke-dasharray="${dash}"` : ""} />
    <text x="${width - pad.right - 186}" y="${y(series.at(-1)) - 7}" font-size="12" fill="${color}">${label} ${yen(series.at(-1))}</text>
  `;
  const currentPer = stock.price / eps;
  const position = stock.price <= lowLine
    ? "利益目安では割安ゾーン"
    : stock.price <= fairLine
      ? "利益目安では中立ゾーン"
      : stock.price <= highLine
        ? "利益目安では高め"
        : "利益目安ではかなり高め";
  const calloutColor = stock.price <= fairLine ? "#1f8a55" : stock.price <= highLine ? "#b98513" : "#c44536";

  return `
    <svg viewBox="0 0 ${width} ${height}" aria-label="${stock.name}のリンチ・チャート">
      <rect x="${pad.left}" y="${pad.top}" width="${width - pad.left - pad.right}" height="${height - pad.top - pad.bottom}" fill="#ffffff" />
      <line x1="${pad.left}" x2="${width - pad.right}" y1="${y(min * 1.08)}" y2="${y(min * 1.08)}" stroke="#edf1ed" />
      <line x1="${pad.left}" x2="${width - pad.right}" y1="${y((min + max) / 2)}" y2="${y((min + max) / 2)}" stroke="#edf1ed" />
      <line x1="${pad.left}" x2="${width - pad.right}" y1="${y(max * 0.92)}" y2="${y(max * 0.92)}" stroke="#edf1ed" />
      <text x="${pad.left}" y="22" font-size="13" fill="#65706b">リンチ・チャート: 株価とEPS×PER推定ライン</text>
      ${valueLine(highSeries, "#c44536", `高値 PER${Math.round(perHigh * 10) / 10}`, "8 6")}
      ${valueLine(fairSeries, "#246a9f", `標準 PER${Math.round(perAvg * 10) / 10}`)}
      ${valueLine(lowSeries, "#1f8a55", `割安 PER${Math.round(perLow * 10) / 10}`, "5 5")}
      <polyline points="${pricePoints}" fill="none" stroke="#1d2522" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${x(stock.history.length - 1)}" cy="${y(stock.price)}" r="7" fill="${calloutColor}" />
      <line x1="${pad.left}" x2="${width - pad.right}" y1="${height - pad.bottom}" y2="${height - pad.bottom}" stroke="#d9dfdb" />
      ${dateTicks}
      <g transform="translate(${Math.min(x(stock.history.length - 1) + 18, width - 270)}, ${Math.max(48, y(stock.price) - 48)})">
        <rect width="244" height="54" rx="8" fill="#ffffff" stroke="${calloutColor}" />
        <text x="12" y="22" class="callout" fill="${calloutColor}">${position}</text>
        <text x="12" y="40" font-size="12" fill="#65706b">現在PER ${Math.round(currentPer * 10) / 10}倍 / EPS ${Math.round(eps * 10) / 10}</text>
      </g>
      <g transform="translate(${pad.left}, ${height - 34})">
        <line x1="0" x2="24" y1="0" y2="0" stroke="#1d2522" stroke-width="4" />
        <text x="32" y="4" font-size="12" fill="#65706b">株価</text>
        <line x1="88" x2="112" y1="0" y2="0" stroke="#246a9f" stroke-width="2.4" />
        <text x="120" y="4" font-size="12" fill="#65706b">標準価値</text>
        <line x1="202" x2="226" y1="0" y2="0" stroke="#1f8a55" stroke-width="2.4" stroke-dasharray="5 5" />
        <text x="234" y="4" font-size="12" fill="#65706b">割安目安</text>
        <line x1="326" x2="350" y1="0" y2="0" stroke="#c44536" stroke-width="2.4" stroke-dasharray="8 6" />
        <text x="358" y="4" font-size="12" fill="#65706b">高値目安</text>
      </g>
      <text x="${pad.left}" y="${height - 14}" font-size="12" fill="#65706b">価値ラインは現在EPSからの推定です。実際のEPS推移は決算確認後に更新します。</text>
    </svg>
  `;
}

function estimatedHistoryDates(stock) {
  const length = Math.max(1, stock.history?.length ?? 1);
  const endDate = parseDateOnly(stock.priceAsOf)
    ?? parseDateOnly(window.AUTO_STOCK_DATA?.priceFetchedAt)
    ?? parseDateOnly(window.AUTO_STOCK_DATA?.generatedAt)
    ?? new Date();
  return Array.from({ length }, (_, index) => addMonths(endDate, index - (length - 1)));
}

function lynchDateTicks(dates) {
  const lastIndex = Math.max(0, dates.length - 1);
  const indexes = [...new Set([0, Math.floor(lastIndex / 2), lastIndex])];
  return indexes.map((index) => ({
    index,
    label: formatChartDate(dates[index]),
    anchor: index === 0 ? "start" : index === lastIndex ? "end" : "middle",
  }));
}

function parseDateOnly(value) {
  if (!value) return null;
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function formatChartDate(date) {
  if (!date || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function estimatedEpsSeries(length, currentEps) {
  if (length <= 1) return [currentEps];
  const startRate = 0.88;
  return Array.from({ length }, (_, index) => {
    const progress = index / (length - 1);
    return currentEps * (startRate + (1 - startRate) * progress);
  });
}

function renderResearchLynch(item, type) {
  const registered = stocks.find((stock) => String(stock.code) === String(item.code));
  if (registered) return renderLynchChart(registered);
  return renderResearchLynchPlaceholder(item, type);
}

function renderResearchLynchPlaceholder(item) {
  return `
    <div class="chart-empty">
      <p class="eyebrow">リンチ・チャート</p>
      <h3>${escapeHtml(item.name)}は財務確認後に表示</h3>
      <p>広域候補はまだEPSやPER目安を通常候補データとして確認していません。昇格候補レポートで財務を埋めると、リンチ・チャートで見られます。</p>
    </div>
  `;
}

function renderMorningReport() {
  const visible = visibleStocks();
  const buyNow = byAssist("今買い候補", visible).slice(0, 5);
  const sellNow = byAssist("今売り検討", visible).concat(byAssist("一部利益確定検討", visible)).slice(0, 5);
  const near = visible.filter((stock) => isNearOrPending(stock.assist.label)).slice(0, 10);
  const risk = visible.filter((stock) => isAvoidAssist(stock.assist.label)).slice(0, 5);
  const backtestWeak = byAssist("検証弱く見送り", visible).slice(0, 5);
  const watched = visible.filter((stock) => stock.watchlist).slice(0, 10);
  const disclosures = visible.filter((stock) => stock.disclosures?.length).slice(0, 10);
  const stale = visible.filter((stock) => stock.dataFreshness?.level !== "ok").slice(0, 10);
  const autoFinancial = visible.filter(isAutoFinancial).slice(0, 10);
  const dataOverview = morningDataOverview(visible);
  const priorities = morningPriorities(visible);
  const hiddenGems = (window.AUTO_HIDDEN_GEMS?.top ?? [])
    .filter((item) => item.assistAction === "今すぐ財務確認")
    .slice(0, 5);
  const financialConfirmation = filteredFinancialConfirmationItems(window.AUTO_FINANCIAL_CONFIRMATION?.top ?? []).slice(0, 5);
  const autoBuyCandidates = (window.AUTO_RESEARCH_DATA?.autoBuyCandidates ?? []).slice(0, 10);
  const report = [
    "# 朝レポート",
    "",
    `今日は正式な今買い候補${buyNow.length}件、自動買い候補予備軍${autoBuyCandidates.length}件、今売り検討${sellNow.length}件、買い場候補${near.length}件、自動財務確認${autoFinancial.length}件、検証弱く見送り${backtestWeak.length}件です。`,
    "",
    dataOverview,
    priorityMarkdown("今日見る優先順位", priorities),
    financialConfirmationMarkdown("財務確認キュー", financialConfirmation),
    autoBuyCandidateMarkdown("全体自動判定・買い候補予備軍", autoBuyCandidates),
    hiddenGemMarkdown("未発掘・今すぐ財務確認", hiddenGems),
    sectionMarkdown("今買い候補", buyNow),
    sectionMarkdown("今売り検討", sellNow),
    watchlistMarkdown("監視リスト", watched),
    sectionMarkdown("買い場候補", near),
    autoFinancialMarkdown("自動財務確認・後追い確認", autoFinancial),
    disclosureMarkdown("カタリスト・開示", disclosures),
    freshnessMarkdown("データ要確認", stale),
    sectionMarkdown("リスク確認", risk),
    sectionMarkdown("検証弱く見送り", backtestWeak),
    "",
    "注意: このレポートは売買推奨ではありません。候補を確認するためのアシストです。",
  ].join("\n");
  document.getElementById("morningReport").value = report;
}

function morningPriorities(visible) {
  return todayRankingItems()
    .slice(0, 7)
    .map((entry) => ({
      entry,
      stock: entry.kind === "stock" ? entry.item : null,
      priority: entry.priority,
      reason: entry.kind === "stock" ? priorityReason(entry.item) : researchPriorityReason(entry),
    }));
}

function priorityScore(stock) {
  let priority = stock.score;
  if (stock.assist.label === "今買い候補") priority += 40;
  if (stock.assist.label === "今売り検討" || stock.assist.label === "一部利益確定検討") priority += 34;
  if (stock.assist.label === "買い場に近い") priority += 24;
  if (stock.assist.label === "財務確認待ち") priority += 18;
  if (stock.assist.label === "データ更新待ち") priority += 12;
  if (stock.assist.label === "財務慎重確認") priority -= 18;
  if (stock.assist.label === "検証弱く見送り") priority -= 40;
  if (stock.assist.label === "財務で見送り") priority -= 48;
  if (stock.watchlist) priority += 12;
  if (stock.dataFreshness?.level !== "ok") priority += 10;
  if (stock.disclosures?.length) priority += 8;
  if (stock.risk) priority += 6;
  return priority;
}

function priorityReason(stock) {
  if (stock.assist.label === "今買い候補") return `買いライン以下。${topReason(stock)}`;
  if (stock.assist.label === "検証弱く見送り") return `見送り優先。${stock.assist.reasons[0]}`;
  if (stock.assist.label === "財務で見送り") return `財務で見送り。${stock.assist.reasons[0]}`;
  if (stock.assist.label === "財務慎重確認") return `財務の追加確認。${stock.assist.reasons[0]}`;
  if (stock.assist.label === "今売り検討" || stock.assist.label === "一部利益確定検討") {
    return `売り判断の確認。${stock.assist.reasons[0]}`;
  }
  if (stock.watchlist) return `監視中。${stock.watchlist.note || topReason(stock)}`;
  if (stock.dataFreshness?.level !== "ok") return `データ確認。${stock.dataFreshness.warnings[0]}`;
  if (stock.disclosures?.length) return `開示あり。${stock.disclosures[0].title}`;
  return topReason(stock);
}

function researchPriorityReason(entry) {
  const item = entry.item;
  if (entry.sourceType === "hiddenGems") {
    return `${item.assistAction || "財務確認"}。勝率${pct(item.winRate ?? 0)}、平均${pct(item.averageReturn ?? 0)}です`;
  }
  if (entry.sourceType === "financialConfirmation") {
    return `${item.status || "財務確認"}。確認完了まで買わない`;
  }
  if (entry.sourceType === "autoBuyCandidates") {
    return `${item.status || "自動買い候補予備軍"}。通常候補へ昇格して原資料確認`;
  }
  if (entry.sourceType === "researchTiming") {
    return `${item.timingAction || "上昇タイミング"}。勝率${pct(item.winRate ?? 0)}、平均${pct(item.averageReturn ?? 0)}です`;
  }
  return `${entry.label}。買う前に財務と材料を確認`;
}

function researchNextAction(entry) {
  const item = entry.item;
  if (entry.sourceType === "hiddenGems") return item.nextCheck || "BPS、EPS、現金、有利子負債、直近決算";
  if (entry.sourceType === "financialConfirmation") return item.nextStep || "BPS、EPS、現金、負債、発行株数を確認";
  if (entry.sourceType === "autoBuyCandidates") return item.action || "有報・決算短信・負債・利益継続性を確認";
  if (entry.sourceType === "researchTiming") return "財務、材料、出来高を確認";
  return "財務、材料、出来高を確認";
}

function morningDataOverview(visible) {
  const data = window.AUTO_STOCK_DATA;
  const research = window.AUTO_RESEARCH_DATA;
  const expansion = window.AUTO_EXPANSION_PREVIEW;
  const hidden = window.AUTO_HIDDEN_GEMS;
  const financial = window.AUTO_FINANCIAL_CONFIRMATION;
  const financialScreening = window.AUTO_FINANCIAL_SCREENING;
  const autoFollowup = window.AUTO_FINANCIAL_FOLLOWUP;
  const quality = data?.dataQuality;
  const providerWarnings = quality?.providerWarnings ?? [];
  const validationWarnings = quality?.validationWarnings ?? [];
  const referenceWarnings = quality?.externalReferenceWarnings ?? [];
  const missingPrice = quality?.missingPrice ?? [];
  const missingEdinet = quality?.missingEdinet ?? [];
  const nextFixes = quality?.nextFixes ?? [];
  const manualInputs = quality?.manualInputs ?? [];
  const autoFinancialCount = visible.filter(isAutoFinancial).length;
  const readiness = quality?.readiness ?? { score: 0, label: "準備中", blockers: [] };
  const previewAddCount = expansion?.previewAddCount ?? expansion?.items?.length ?? 0;
  const expandedCount = expansion?.expandedCount ?? visible.length + previewAddCount;
  const hiddenPriorityCount = hidden?.top?.filter((item) => item.assistAction === "今すぐ財務確認").length ?? 0;
  const universeCount = research?.universe?.success ?? 0;
  const universeTotal = research?.universe?.total ?? 0;
  const warningCount =
    providerWarnings.length + validationWarnings.length + referenceWarnings.length + missingPrice.length + missingEdinet.length;
  const stockCountNote = visible.length < 20
    ? "候補銘柄が少なめです。stock-masterを増やすとランキングの精度が上がります。"
    : visible.length < 100
      ? "日本株全体は分析済みですが、通常候補への昇格は拡張中です。"
      : "候補銘柄数は十分あります。";
  return [
    "## データ確認",
    `- 通常候補: ${visible.length}件。${stockCountNote}`,
    `- 追加候補確認: ${previewAddCount}件。財務確認後の候補数イメージは${expandedCount}件`,
    `- 未発掘候補: ${hidden?.total ?? 0}件。今すぐ財務確認 ${hiddenPriorityCount}件`,
    `- 財務確認キュー: ${financial?.total ?? 0}件。最優先 ${financial?.priorityCount ?? 0}件 / スクリーニング済み ${financialScreening?.total ?? 0}件 / 昇格優先 ${financialScreening?.priorityCount ?? 0}件`,
    `- 自動財務確認: ${autoFinancialCount}件。買い場接近 ${autoFollowup?.priorityCount ?? 0}件 / 買いライン待ち ${autoFollowup?.buyLineWaitCount ?? 0}件 / 後回し ${autoFollowup?.avoidCount ?? 0}件`,
    `- 日本株全体の価格検証: ${universeCount || "準備中"}${universeTotal ? `/${universeTotal}件` : ""}`,
    `- 銘柄マスタ: ${data?.source ?? "サンプル"}`,
    `- データ状態: ${quality?.ok ? "OK" : "要確認"}。注意${warningCount}件`,
    `- 本番準備度: ${readiness.score}% ${readiness.label}`,
    `- 一部手入力: ${manualInputs.length}件${manualInputs.length ? `。${manualInputs.slice(0, 3).join(" / ")} から確認` : ""}`,
    ...(readiness.blockers?.length ? [`- 本番化の残り: ${readiness.blockers[0]}`] : []),
    ...(nextFixes.length ? [`- 次に直す: ${nextFixes[0]}`] : []),
    "",
  ].join("\n");
}

function autoFinancialMarkdown(title, list) {
  if (!list.length) return `## ${title}\n該当なし\n`;
  return [
    `## ${title}`,
    ...list.map((stock) => {
      const followup = autoFinancialFollowupFor(stock);
      return `- ${stock.code} ${stock.name}: ${followup?.action || stock.assist.label}。${stock.assist.reasons[1] || "後追い確認が必要です"} / 点 ${Math.round(Number(followup?.followupScore ?? stock.score ?? 0))} / 確認: 決算短信、有報、現金、有利子負債、BPS、EPS / 買い目安: ${stock.backtest?.buyTiming ?? "未検証"}`;
    }),
    "",
  ].join("\n");
}

function financialConfirmationMarkdown(title, list) {
  if (!list.length) return `## ${title}\n該当なし\n`;
  return [
    `## ${title}`,
    ...list.map((item, index) =>
      `- ${index + 1}. ${item.code} ${item.name}: ${item.source || "確認"} / ${item.status || "財務確認"}。${item.buyGuard || "確認完了まで買わない"} / 注意: ${item.blockers || "なし"} / 次: ${item.nextStep || "BPS、EPS、現金、負債、発行株数を確認"}`
    ),
    "",
  ].join("\n");
}

function hiddenGemMarkdown(title, list) {
  if (!list.length) return `## ${title}\n該当なし\n`;
  return [
    `## ${title}`,
    ...list.map((item, index) =>
      `- ${index + 1}. ${item.code} ${item.name}: ${item.assistAction}。${item.comment || item.reason || "財務確認が先です"} / 勝率 ${pct(item.winRate ?? 0)} / 平均 ${pct(item.averageReturn ?? 0)} / 最大下落 ${pct(item.maxDrawdown ?? 0)} / 次に確認: ${item.nextCheck || "財務、材料、出来高"}`
    ),
    "",
  ].join("\n");
}

function autoBuyCandidateMarkdown(title, list) {
  if (!list.length) return `## ${title}\n該当なし\n`;
  return [
    `## ${title}`,
    "正式な今買いではありません。通常候補へ昇格し、原資料確認が済んだものだけ買い表示にします。",
    ...list.map((item, index) =>
      `- ${index + 1}. ${item.code} ${item.name}: ${item.status || "予備軍"} / 点 ${Math.round((item.autoBuyScore ?? 0) * 10) / 10} / 買い比率 ${times(item.buyRatio ?? 0)} / 上昇余地 ${pct(item.upside ?? 0)} / PBR ${times(item.pbr ?? 0)} / PER ${times(item.per ?? 0)} / 次: ${item.action || "有報と決算短信を確認"}`
    ),
    "",
  ].join("\n");
}

function sectionMarkdown(title, list) {
  if (!list.length) return `## ${title}\n該当なし\n`;
  return [
    `## ${title}`,
    ...list.map((stock) =>
      `- ${stock.code} ${stock.name}: ${stock.assist.label}。${stock.assist.reasons[0]} / 買い目安: ${stock.backtest?.buyTiming ?? "未検証"} / 売り目安: ${stock.backtest?.sellTiming ?? "未検証"}`
    ),
    "",
  ].join("\n");
}

function priorityMarkdown(title, list) {
  if (!list.length) return `## ${title}\n該当なし\n`;
  return [
    `## ${title}`,
    ...list.map(({ entry, stock, reason }, index) => {
      if (stock) {
        return `- ${index + 1}. ${stock.code} ${stock.name}: ${stock.assist.label}。${reason} / 次に確認: ${stock.assist.nextActions[0]}`;
      }
      const item = entry.item;
      return `- ${index + 1}. ${item.code} ${item.name}: ${entry.label}。${reason} / 次に確認: ${researchNextAction(entry)}`;
    }),
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
    const researchCard = event.target.closest("[data-research-code]");
    if (researchCard) {
      selectedResearch = {
        type: researchCard.dataset.researchType,
        code: researchCard.dataset.researchCode,
      };
      render();
      return;
    }

    const card = event.target.closest("[data-code]");
    if (!card) return;
    selectedCode = card.dataset.code;
    selectedResearch = null;
    render();
  });
  document.getElementById("rankingSelect").addEventListener("change", () => {
    selectTopRankingItem();
    render();
  });
  document.getElementById("sampleButton")?.addEventListener("click", loadSample);
  document.getElementById("templateButton")?.addEventListener("click", downloadCsvTemplate);
  document.getElementById("searchInput").addEventListener("input", (event) => {
    searchQuery = event.target.value;
    if (searchQuery.trim()) {
      document.getElementById("rankingSelect").value = "today";
    }
    selectTopRankingItem();
    render();
  });
  document.getElementById("assistFilter").addEventListener("change", (event) => {
    assistFilter = event.target.value;
    selectTopRankingItem();
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
  document.getElementById("csvInput")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseCsv(text);
      stocks = enrichAll(parsed);
      selectTopRankingItem();
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
