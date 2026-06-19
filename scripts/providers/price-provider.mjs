import fs from "node:fs";
import { parseCsvRecords } from "../csv-utils.mjs";

export function parsePriceCsv(text) {
  return parseCsvRecords(text).map((record) => {
    return {
      code: record.code,
      price: Number(record.price || 0),
      asOf: record.asOf || new Date().toISOString().slice(0, 10),
    };
  }).filter((record) => record.code && Number.isFinite(record.price) && record.price > 0);
}

export async function fetchPriceUpdates({ inputPriceCsv, priceCsvUrl } = {}) {
  if (priceCsvUrl) {
    const response = await fetch(priceCsvUrl);
    if (!response.ok) {
      throw new Error(`株価CSV URLの取得に失敗しました: ${response.status}`);
    }
    return {
      source: priceCsvUrl,
      fetchedAt: new Date().toISOString(),
      prices: parsePriceCsv(await response.text()),
    };
  }

  if (inputPriceCsv && fs.existsSync(inputPriceCsv)) {
    return {
      source: inputPriceCsv,
      fetchedAt: new Date().toISOString(),
      prices: parsePriceCsv(fs.readFileSync(inputPriceCsv, "utf8")),
    };
  }

  return {
    source: "none",
    fetchedAt: new Date().toISOString(),
    prices: [],
  };
}

export function applyPriceUpdates(stocks, priceUpdates) {
  const byCode = new Map(priceUpdates.map((price) => [price.code, price]));
  return stocks.map((stock) => {
    const update = byCode.get(stock.code);
    if (!update) return stock;

    const history = Array.isArray(stock.history) ? [...stock.history] : [];
    if (history[history.length - 1] !== update.price) {
      history.push(update.price);
    }

    return {
      ...stock,
      price: update.price,
      priceAsOf: update.asOf,
      history: history.slice(-24),
    };
  });
}
