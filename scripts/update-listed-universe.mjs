import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(rootDir, "data", "listed-universe.csv");
const tmpDir = path.join(rootDir, "tmp");
const downloadPath = path.join(tmpDir, "jpx-listed-issues.xls");
const sourceUrl = process.env.JPX_LISTED_ISSUES_URL
  || "https://www.jpx.co.jp/markets/statistics-equities/misc/tvdivq0000001vg2-att/data_j.xls";
const pythonConverter = String.raw`
import csv
import re
import sys
import pandas as pd

input_path, output_path = sys.argv[1], sys.argv[2]
df = pd.read_excel(input_path, dtype=str).fillna("")

items = []
for _, row in df.iterrows():
    code = str(row.get("コード", row.get("Local Code", ""))).strip()
    name = str(row.get("銘柄名", row.get("Name (English)", ""))).strip()
    market = str(row.get("市場・商品区分", row.get("Section/Products", ""))).strip()
    sector = str(row.get("33業種区分", row.get("33 Sector(name)", ""))).strip()
    if not re.fullmatch(r"[0-9A-Z]{4}", code, re.I):
        continue
    if "内国株式" not in market and "Domestic" not in market:
        continue
    if re.search(r"ETF|ETN|REIT|Infrastructure|Venture Fund|インフラ|ベンチャー", market, re.I):
        continue
    items.append({"code": code, "name": name, "market": market, "sector": sector})

items.sort(key=lambda item: item["code"])
with open(output_path, "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["code", "name", "market", "sector"])
    writer.writeheader()
    writer.writerows(items)

print(len(items))
`;

fs.mkdirSync(tmpDir, { recursive: true });
const response = await fetch(sourceUrl);
if (!response.ok) {
  throw new Error(`JPX上場銘柄一覧を取得できませんでした: ${response.status}`);
}
fs.writeFileSync(downloadPath, Buffer.from(await response.arrayBuffer()));

const result = spawnSync("python", ["-c", pythonConverter, downloadPath, outputPath], {
  cwd: rootDir,
  encoding: "utf8",
});
if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  throw new Error("Excel変換に失敗しました。python, pandas, xlrd が使える環境で実行してください。");
}

console.log("JPX上場銘柄一覧を更新しました");
console.log(`入力: ${sourceUrl}`);
console.log(`出力: data/listed-universe.csv`);
console.log(`母集団: ${result.stdout.trim()}件`);
