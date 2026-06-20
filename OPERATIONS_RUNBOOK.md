# 運用手順

このアプリは、毎朝の候補確認を自動化するためのものです。売買推奨ではなく、調査の優先順位を出すために使います。

## 毎朝見るもの

1. Discord通知
2. GitHub Pagesの画面
3. `reports/latest-morning-report.md`

Discord通知で見る順番:

- 本番準備度
- 一部手入力
- 今日見る優先順位
- 次に直すデータ
- 今買い候補
- 銘柄数の注意

## 銘柄を増やす

本番開始ラインは `stock-master` 20件以上です。さらに安定させる場合は50件以上を目安にします。

少ない列から作る場合:

```powershell
npm run stock-master:build
```

流れ:

1. `data/stock-master-input.csv` またはGoogle Sheetsの下書きに候補を書く
2. `npm run stock-master:build` で `data/stock-master.generated.csv` を作る
3. 内容を確認する
4. `data/stock-master.csv` に反映する
5. Google Sheetsで運用する場合は、公開CSV URLを `STOCK_MASTER_CSV_URL` に設定する
6. `npm run production:check` で件数と準備度を見る

## 足りないデータを埋める

`npm run production:check` を実行すると、次に直すデータが出ます。

よく出るもの:

- `株価CSVに追加`
- `EDINET相当CSVに追加`
- `銘柄マスタを修正`
- `外部CSVのコードを確認`

## 手動確認

通知を送らずに文面を見る:

```powershell
npm run notify:preview
```

全体確認:

```powershell
npm run cloud:check
```

本番準備度だけ見る:

```powershell
npm run production:check
```

## GitHub Actions

push時:

- build 成功
- Production readiness check に本番準備度が表示される
- deploy 成功
- notify skipped

手動実行または朝の定期実行:

- build 成功
- Production readiness check に本番準備度が表示される
- deploy 成功
- notify 成功
- Discord通知が届く

## 異常時

Discord通知が来ない:

- GitHub Actionsの `notify` が skipped か failed かを見る
- push時の skipped は正常
- 手動実行や朝実行で skipped ならワークフロー条件を確認
- failed なら `DISCORD_WEBHOOK_URL` を確認

画面が古い:

- GitHub Actionsの `deploy` が成功しているか見る
- `Production readiness check` のログで入力元と本番準備度を見る
- Pages URLを再読み込みする
- `app/latest-update-report.md` の更新日時を見る

候補が少ない:

- `stock-master` を増やす
- Google Sheets運用の場合は `STOCK_MASTER_CSV_URL` が設定済みか見る
- Discord通知の `対象銘柄数` を確認する

データ要確認が多い:

- `production:check` の「次に直すデータ」を上から埋める
- まず株価、次にEDINET相当、最後に開示と監視リストを整える

一部手入力が多い:

- 実運用しながら、EDINETや株価元データで確認できた銘柄から `dataConfidence` を `確認済み` に変える
- 本番準備度100%でも、一部手入力は「あとで正式確認するリスト」として見る
