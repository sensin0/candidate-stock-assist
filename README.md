# 候補銘柄アシスト

資産バリュー株の候補を毎朝更新し、初心者でも「どこで買い候補か」「どこから売り検討か」を見やすく確認するためのローカル兼GitHub Pagesアプリです。

この画面は売買推奨ではありません。候補を見つけるための確認アシストです。

## できること

- 今買い候補、買い場に近い、今売り検討、リスクありの分類
- チャート上の買いライン、現在株価、目標株価の表示
- ランキング表示
- 株価、開示、EDINET相当データの自動更新口
- 銘柄マスタの外部CSV差し替え
- データ鮮度チェック
- 朝レポート生成
- GitHub Actionsによる毎朝更新
- GitHub Pagesによる画面公開
- 外部データ取得失敗時の予備データ継続と注意表示
- 監視銘柄リストの表示と朝レポート反映
- 存在しない銘柄コード、重複コード、株価や株数の異常値チェック

## ローカルで動かす

```powershell
npm run morning
npm run start
```

表示された `http://localhost:4173` を開きます。

ファイルを直接開く場合は [app/index.html](./app/index.html) を開きます。

## GitHubで毎朝動かす

GitHubにこのフォルダをアップロードし、Pagesの公開元を `GitHub Actions` にします。

ワークフロー:

```text
.github/workflows/morning-pages.yml
```

実行タイミング:

- 毎朝 7:05 ごろ
- GitHub Actionsの手動実行

公開対象:

```text
dist/
```

`dist` はGitHub Actionsが自動生成するため、リポジトリには入れません。

## 外部データURL

GitHub Secretsに以下を入れると、外部CSVから更新できます。

```text
PRICE_CSV_URL
STOCK_MASTER_CSV_URL
DISCLOSURE_CSV_URL
EDINET_FACTS_CSV_URL
WATCHLIST_CSV_URL
```

未設定の場合は `data/*.csv` を使います。
銘柄数を増やす場合は、まず `data/stock-master.csv` を20件以上にします。
Google Sheetsで運用したい場合は、`STOCK_MASTER_CSV_URL` に候補銘柄の母集団CSVを登録します。

Googleスプレッドシートを使う場合は、シートをCSVとして公開し、そのURLをSecretsに入れます。

```text
File -> Share -> Publish to web -> CSV
```

メモや開示タイトルにカンマが入っても読み込めるよう、引用符付きCSVに対応しています。

詳しい手順は [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md) を見てください。
テンプレートCSVは `sheet-templates/` にあります。
銘柄マスタの列の意味は [STOCK_MASTER_COLUMNS.md](./STOCK_MASTER_COLUMNS.md) を見てください。
本番化までの残り工程は [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) を見てください。
日々の運用手順は [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md) を見てください。

## Discord通知

GitHub Secretsに以下を入れると、Pages公開後にDiscordへ朝レポート通知を送ります。

```text
DISCORD_WEBHOOK_URL
```

通知内容:

- 今買い候補の件数
- 今売り検討の件数
- データ要確認の件数
- リスク確認の件数
- 取得元の注意件数
- 監視リスト件数
- 今買い候補の先頭数件
- アプリURL
- 朝レポートURL

外部データURLの取得に失敗した場合は、ローカルの予備CSVで更新を継続し、画面、更新レポート、Discord通知に注意を出します。
銘柄マスタが空の場合や、監視リスト・外部データに銘柄マスタへ存在しないコードが入った場合も、データ品質の注意として表示します。

## 主なコマンド

```powershell
npm run update
npm run report
npm run morning
npm run notify:discord
npm run notify:preview
npm run manual:check
npm run manual:confirm -- 6505
npm run privacy:check
npm run privacy:report
npm run universe:check
npm run universe:update
npm run stock-master:build
npm run production:check
npm run pages:build
npm run pipeline
npm run start
```

## 注意

- 自動売買はしません。
- データが古い銘柄は `要確認` として表示します。
- 数値条件が良くても、データ未確認なら `今買い候補` ではなく `調査が先` に倒します。
- 元の読書メモMDを公開リポジトリに入れるかは、内容を確認してから判断してください。
