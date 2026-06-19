import fs from "node:fs";

const numberFields = new Set([
  "cash",
  "securities",
  "investmentSecurities",
  "interestDebt",
  "netAssets",
  "rentalBook",
  "rentalMarket",
  "bps",
  "eps",
]);

export function parseEdinetFactsCsv(text) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean);
  if (!rows.length) return [];
  const headers = rows.shift().split(",").map((value) => value.trim());
  return rows.map((row) => {
    const values = row.split(",").map((value) => value.trim());
    const record = {};
    headers.forEach((header, index) => {
      const value = values[index] ?? "";
      record[header] = numberFields.has(header) ? Number(value || 0) : value;
    });
    return record;
  }).filter((record) => record.code);
}

export async function fetchEdinetFacts({ inputEdinetCsv, edinetCsvUrl } = {}) {
  if (edinetCsvUrl) {
    const response = await fetch(edinetCsvUrl);
    if (!response.ok) {
      throw new Error(`EDINET CSV URLの取得に失敗しました: ${response.status}`);
    }
    return {
      source: edinetCsvUrl,
      fetchedAt: new Date().toISOString(),
      facts: parseEdinetFactsCsv(await response.text()),
    };
  }

  if (inputEdinetCsv && fs.existsSync(inputEdinetCsv)) {
    return {
      source: inputEdinetCsv,
      fetchedAt: new Date().toISOString(),
      facts: parseEdinetFactsCsv(fs.readFileSync(inputEdinetCsv, "utf8")),
    };
  }

  return {
    source: "none",
    fetchedAt: new Date().toISOString(),
    facts: [],
  };
}

export function applyEdinetFacts(stocks, facts) {
  const byCode = new Map(facts.map((fact) => [fact.code, fact]));
  return stocks.map((stock) => {
    const fact = byCode.get(stock.code);
    if (!fact) return stock;

    return {
      ...stock,
      cash: fact.cash,
      securities: fact.securities,
      investmentSecurities: fact.investmentSecurities,
      interestDebt: fact.interestDebt,
      netAssets: fact.netAssets,
      rentalBook: fact.rentalBook,
      rentalMarket: fact.rentalMarket,
      bps: fact.bps,
      eps: fact.eps,
      edinet: {
        documentType: fact.documentType,
        periodEnd: fact.periodEnd,
        submittedAt: fact.submittedAt,
        sourceUrl: fact.sourceUrl,
      },
      dataConfidence: stock.dataConfidence === "未確認" ? "自動取得" : stock.dataConfidence,
    };
  });
}
