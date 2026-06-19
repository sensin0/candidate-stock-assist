import assert from "node:assert/strict";
import { parseCsvRecords } from "./csv-utils.mjs";

const records = parseCsvRecords([
  "code,title,note",
  "1897,\"金下建設,重点監視\",\"買いラインを下回ったら確認\"",
  "8841,\"テーオーシー\",\"不動産含み益\n資本政策\"",
  "9672,\"東京都競馬\",\"引用符\"\"あり\"",
].join("\n"));

assert.equal(records.length, 3);
assert.equal(records[0].title, "金下建設,重点監視");
assert.equal(records[1].note, "不動産含み益\n資本政策");
assert.equal(records[2].note, "引用符\"あり");

console.log("csv-utils-test ok");
