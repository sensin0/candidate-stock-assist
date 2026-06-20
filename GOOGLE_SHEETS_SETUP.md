# Googleスプレッドシート運用手順

外部CSVをGoogleスプレッドシートで管理するための手順です。

## 1. スプレッドシートを作る

Googleスプレッドシートで新規ファイルを作り、以下の6シートを用意します。

```text
listed-universe
stock-master
price-updates
disclosures
edinet-facts
watchlist
```

`sheet-templates/` のCSVをそれぞれ貼り付けます。
銘柄マスタの列の意味は [STOCK_MASTER_COLUMNS.md](./STOCK_MASTER_COLUMNS.md) にまとめています。

## 2. 各シートの役割

`listed-universe`

```text
code,name,market,sector
```

- 日本株全体に近づけるための母集団です。
- まず上場銘柄一覧をここに入れ、`stock-master` に候補化する銘柄を増やします。
- 件数と候補化率は `npm run universe:check` で確認します。

`stock-master`

```text
code,name,sector,price,shares,treasuryShares,cash,securities,investmentSecurities,interestDebt,netAssets,rentalBook,rentalMarket,bps,eps,pbrLow,pbrAvg,pbrHigh,perLow,perAvg,perHigh,dataConfidence,qualitativeDone,held,risk,catalyst,history
```

- 候補銘柄の母集団です。
- 銘柄数を増やす場合は、まずこのシートに行を追加します。
- 金額は百万円、株価・BPS・EPSは円です。
- `history` は `610|650|620` のように縦棒区切りで過去株価を入れます。

`price-updates`

```text
code,price,asOf
```

- `code`: 銘柄コード
- `price`: 株価
- `asOf`: 株価日付

`disclosures`

```text
code,publishedAt,title,url
```

- `title`: 開示タイトル
- 自社株買い、増配、資本コスト、PBR、固定資産、下方修正などを自動検出します。

`edinet-facts`

```text
code,documentType,periodEnd,submittedAt,cash,securities,investmentSecurities,interestDebt,netAssets,rentalBook,rentalMarket,bps,eps,sourceUrl
```

- 金額は百万円です。
- `bps` と `eps` は円です。

`watchlist`

```text
code,status,note
```

- `status`: 重点監視、監視、保有監視など
- `note`: 朝レポートと画面に出るメモ

## 3. CSVとして公開する

各シートで以下を実行します。

```text
File -> Share -> Publish to web
```

設定:

```text
Link
対象シートを選択
Comma-separated values (.csv)
Publish
```

出てきたURLをコピーします。

## 4. GitHub Secretsに登録する

GitHubのリポジトリで:

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

以下の名前で登録します。

```text
PRICE_CSV_URL
STOCK_MASTER_CSV_URL
DISCLOSURE_CSV_URL
EDINET_FACTS_CSV_URL
WATCHLIST_CSV_URL
```

## 5. 確認する

GitHub Actionsを手動実行するか、翌朝の自動実行を待ちます。

実行後に見る場所:

```text
https://sensin0.github.io/candidate-stock-assist/
https://sensin0.github.io/candidate-stock-assist/reports/latest-morning-report.md
```

Discord通知には、今買い候補、今売り検討、監視リスト、データ要確認、入力値や参照の注意件数が出ます。

## 注意

- 公開CSV URLを知っている人は中身を読めます。個人メモや非公開情報は書かないでください。
- 銘柄マスタが空の場合や、銘柄コードが銘柄マスタに存在しない場合、データ品質の注意に出ます。
- メモや開示タイトルにカンマや改行が入っても、GoogleスプレッドシートのCSV出力なら読み込めます。
