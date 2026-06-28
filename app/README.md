# 候補銘柄アシスト MVP

静的HTMLだけで動く初期版です。最終的には株価・開示・財務データを自動取得して毎朝更新する想定です。現時点では、外部取得の差し替え口としてローカルCSVまたはURL上のCSVを読み、画面と判定ロジックを確認できます。

## 開き方

`app/index.html` をブラウザで開きます。

ローカルサーバーで開く場合:

```powershell
npm run start
```

表示された `http://localhost:4173` を開きます。

## できること

- 今買い候補、買い場に近い、今売り検討、リスクありの分類
- 初心者向けの理由と次に確認することの表示
- 買いライン、現在株価、第一利確、理論上限の売買メーター
- チャート上の「ここで買い候補」「ここから売り検討」
- ランキング切替
- データ鮮度の確認表示
- 朝レポートのMarkdown出力
- 手動CSV取込

## データ更新の想定

本番ではCSVを主役にせず、次の流れで自動更新します。

1. 株価・財務・開示データを夜間に自動取得
2. 指標とランキングを再計算
3. 売買アシストを更新
4. 朝レポートを生成

CSV取込は、初期テスト、手動補正、外部データ取得に失敗した時の予備ルートです。

現時点では、更新ジョブの雛形として以下を用意しています。

```powershell
node scripts\update-data.mjs
```

このコマンドは `data/stock-master.csv` を銘柄マスタとして読み、株価、開示、EDINET相当の更新データを重ねて、画面が読む `app/generated-data.js` と更新レポート `app/latest-update-report.md` を生成します。将来はこの入力部分を株価API、EDINET、TDnetに差し替えます。

銘柄マスタは、候補銘柄の母集団です。銘柄数を増やす場合はここを増やします。標準では `data/stock-master.csv` を読みます。

URL上の銘柄マスタCSVを読む場合:

```powershell
$env:STOCK_MASTER_CSV_URL="https://example.com/stock-master.csv"
npm run pipeline
```

株価も差し替え口を用意しています。標準では `data/price-updates.csv` を読みます。

```csv
code,price,asOf
8841,842,2026-06-19
```

URL上のCSVを読む場合:

```powershell
$env:PRICE_CSV_URL="https://example.com/prices.csv"
npm run pipeline
```

適時開示も差し替え口を用意しています。標準では `data/disclosures.csv` を読みます。

```csv
code,publishedAt,title,url
8841,2026-06-18,自己株式取得に係る事項の決定に関するお知らせ,https://example.com/8841-buyback
```

URL上の開示CSVを読む場合:

```powershell
$env:DISCLOSURE_CSV_URL="https://example.com/disclosures.csv"
npm run pipeline
```

開示タイトルから、自社株買い、増配、中期経営計画、PBR改善、資産活用、リスクを検出します。

EDINET相当の財務・資産データも差し替え口を用意しています。標準では `data/edinet-facts.csv` を読みます。

```csv
code,documentType,periodEnd,submittedAt,cash,securities,investmentSecurities,interestDebt,netAssets,rentalBook,rentalMarket,bps,eps,sourceUrl
8841,annual,2026-03-31,2026-06-19,8500,4300,18200,7000,101000,58000,186000,1145,44,https://example.com/edinet/8841
```

URL上のEDINET相当CSVを読む場合:

```powershell
$env:EDINET_FACTS_CSV_URL="https://example.com/edinet-facts.csv"
npm run pipeline
```

株価日付、有報提出日、有報対象期からデータ鮮度を判定し、古いデータや未取得データは画面と朝レポートに `要確認` として表示します。日付が怪しい銘柄は、数値上よく見えても `今買い候補` ではなく `データ更新待ち` 側に倒します。

監視リストも差し替え口を用意しています。標準では `data/watchlist.csv` を読みます。

```csv
code,status,note
1897,重点監視,買いラインを下回ったら有報の資産欄を再確認
```

URL上の監視リストCSVを読む場合:

```powershell
$env:WATCHLIST_CSV_URL="https://example.com/watchlist.csv"
npm run pipeline
```

一気通貫で更新から検証まで流す場合:

```powershell
npm run pipeline
```

処理内容:

1. 画面用データ生成
2. JavaScript構文チェック
3. スモークテスト
4. 朝レポート生成確認

朝の実行だけをまとめて行う場合:

```powershell
npm run morning
```

このコマンドは、データ更新、画面チェック、朝レポート生成まで実行します。生成された朝レポートは以下に保存されます。

```text
reports/latest-morning-report.md
reports/morning-report-YYYY-MM-DD.md
```

Windowsで毎朝7時に自動実行したい場合は、必要なタイミングで以下を実行します。

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-morning-task.ps1
```

登録されるタスク名は `CandidateStockAssistMorningUpdate` です。

PCを常時起動しない場合は、GitHub Actions + GitHub Pagesで動かします。

仕組み:

1. GitHub Actionsが日本時間の毎朝7:05ごろに `npm run morning` を実行
2. 株価、開示、EDINET相当データを更新
3. 朝レポートを生成
4. `app` と `reports` をGitHub Pagesへ公開

必要なGitHub Secrets:

```text
PRICE_CSV_URL
STOCK_MASTER_CSV_URL
DISCLOSURE_CSV_URL
EDINET_FACTS_CSV_URL
WATCHLIST_CSV_URL
```

Secretsが未設定の場合は、リポジトリ内の `data/*.csv` を使って更新します。

GitHub Pages用の公開ファイルをローカルで作る場合:

```powershell
npm run pages:build
```

ワークフロー:

```text
.github/workflows/morning-pages.yml
```

GitHubリポジトリにアップロード後、Pagesの公開元を `GitHub Actions` に設定すると、PCを起動していなくても朝更新と画面公開が動きます。

## CSV列

銘柄マスタは `data/stock-master.csv` と同じ列名で取り込めます。金額項目は百万円、株数は株数、株価は円です。

画面上部の `予備CSVテンプレート` からテンプレートをダウンロードできます。

## 確認

JavaScriptの構文チェック:

```powershell
node --check app\app.js
```

簡易テスト:

```powershell
node app\smoke-test.mjs
```

## 注意

このアプリは売買推奨ではありません。候補を見つけるための確認アシストです。
