import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseStockCsv } from "./providers/csv-provider.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stockMaster = fs.readFileSync(path.join(rootDir, "data", "stock-master.csv"), "utf8");

const rows = parseStockCsv(stockMaster);
assert.ok(rows.length > 0, "銘柄マスタに行がありません");
assert.equal(rows[0].code, "8841");
assert.equal(typeof rows[0].price, "number");

assert.throws(
  () => parseStockCsv("code,name,price\n8841,テスト,100\n"),
  /銘柄マスタCSVの必須列が足りません/,
);

console.log("stock-master-test ok");
