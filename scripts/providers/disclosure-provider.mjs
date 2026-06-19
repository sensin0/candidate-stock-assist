import fs from "node:fs";

const catalystRules = [
  { type: "自社株買い", score: 8, pattern: /自己株式|自社株/ },
  { type: "増配", score: 8, pattern: /増配|配当予想の修正|累進配当/ },
  { type: "中期経営計画", score: 5, pattern: /中期経営計画|中計/ },
  { type: "PBR改善", score: 6, pattern: /資本コスト|株価を意識|PBR|企業価値向上/ },
  { type: "資産活用", score: 6, pattern: /固定資産|不動産|政策保有株|有効活用/ },
  { type: "リスク", score: -10, pattern: /下方修正|減損|無配|減配|不適切|特別損失/ },
];

export function parseDisclosureCsv(text) {
  const rows = text.trim().split(/\r?\n/).filter(Boolean);
  if (!rows.length) return [];
  const headers = rows.shift().split(",").map((value) => value.trim());
  return rows.map((row) => {
    const values = row.split(",").map((value) => value.trim());
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });
    return {
      code: record.code,
      publishedAt: record.publishedAt,
      title: record.title,
      url: record.url,
      catalysts: detectCatalysts(record.title),
    };
  }).filter((record) => record.code && record.title);
}

export function detectCatalysts(title) {
  return catalystRules
    .filter((rule) => rule.pattern.test(title))
    .map((rule) => ({ type: rule.type, score: rule.score }));
}

export async function fetchDisclosures({ inputDisclosureCsv, disclosureCsvUrl } = {}) {
  if (disclosureCsvUrl) {
    const response = await fetch(disclosureCsvUrl);
    if (!response.ok) {
      throw new Error(`開示CSV URLの取得に失敗しました: ${response.status}`);
    }
    return {
      source: disclosureCsvUrl,
      fetchedAt: new Date().toISOString(),
      disclosures: parseDisclosureCsv(await response.text()),
    };
  }

  if (inputDisclosureCsv && fs.existsSync(inputDisclosureCsv)) {
    return {
      source: inputDisclosureCsv,
      fetchedAt: new Date().toISOString(),
      disclosures: parseDisclosureCsv(fs.readFileSync(inputDisclosureCsv, "utf8")),
    };
  }

  return {
    source: "none",
    fetchedAt: new Date().toISOString(),
    disclosures: [],
  };
}

export function applyDisclosures(stocks, disclosures) {
  const byCode = new Map();
  for (const disclosure of disclosures) {
    if (!byCode.has(disclosure.code)) byCode.set(disclosure.code, []);
    byCode.get(disclosure.code).push(disclosure);
  }

  return stocks.map((stock) => {
    const stockDisclosures = byCode.get(stock.code) ?? [];
    if (!stockDisclosures.length) return stock;

    const catalystTypes = [...new Set(stockDisclosures.flatMap((item) => item.catalysts.map((c) => c.type)))];
    const hasRisk = catalystTypes.includes("リスク");
    const catalyst = catalystTypes.filter((type) => type !== "リスク").join(" / ");

    return {
      ...stock,
      catalyst: catalyst || stock.catalyst,
      risk: hasRisk ? stock.risk || "悪材料開示あり" : stock.risk,
      disclosures: stockDisclosures,
    };
  });
}
