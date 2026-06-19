import fs from "node:fs";

export function parseWatchlistCsv(text) {
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
      status: record.status || "監視",
      note: record.note || "",
    };
  }).filter((record) => record.code);
}

export async function fetchWatchlist({ inputWatchlistCsv, watchlistCsvUrl } = {}) {
  if (watchlistCsvUrl) {
    const response = await fetch(watchlistCsvUrl);
    if (!response.ok) {
      throw new Error(`監視リストCSV URLの取得に失敗しました: ${response.status}`);
    }
    return {
      source: watchlistCsvUrl,
      fetchedAt: new Date().toISOString(),
      items: parseWatchlistCsv(await response.text()),
    };
  }

  if (inputWatchlistCsv && fs.existsSync(inputWatchlistCsv)) {
    return {
      source: inputWatchlistCsv,
      fetchedAt: new Date().toISOString(),
      items: parseWatchlistCsv(fs.readFileSync(inputWatchlistCsv, "utf8")),
    };
  }

  return {
    source: "none",
    fetchedAt: new Date().toISOString(),
    items: [],
  };
}

export function applyWatchlist(stocks, items) {
  const byCode = new Map(items.map((item) => [item.code, item]));
  return stocks.map((stock) => {
    const item = byCode.get(stock.code);
    if (!item) return { ...stock, watchlist: null };
    return {
      ...stock,
      watchlist: {
        status: item.status,
        note: item.note,
      },
    };
  });
}
