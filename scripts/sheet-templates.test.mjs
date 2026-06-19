import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const templates = [
  ["sheet-templates/price-updates.csv", ["code", "price", "asOf"]],
  ["sheet-templates/disclosures.csv", ["code", "publishedAt", "title", "url"]],
  ["sheet-templates/edinet-facts.csv", ["code", "documentType", "periodEnd", "submittedAt", "cash", "bps", "eps"]],
  ["sheet-templates/watchlist.csv", ["code", "status", "note"]],
];

for (const [file, requiredHeaders] of templates) {
  const text = fs.readFileSync(path.join(rootDir, file), "utf8");
  const records = parseCsvRecords(text);
  assert.ok(records.length > 0, `${file} にサンプル行がありません`);
  for (const header of requiredHeaders) {
    assert.ok(Object.hasOwn(records[0], header), `${file} に ${header} 列がありません`);
  }
}

console.log("sheet-templates-test ok");
