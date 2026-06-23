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
日本株全体に近づける場合は、まず `data/listed-universe.csv` に上場銘柄一覧を入れます。

母集団の件数と候補化率を見る:

```powershell
npm run universe:check
```

`市場別` と `候補化が薄い主な業種` を見て、次にどの市場・業種から `stock-master` へ追加するか決めます。

JPXの上場銘柄一覧から母集団を更新する:

```powershell
npm run universe:update
```

全体母集団から買い候補を出すには、母集団に加えて株価、BPS/EPS、現金、有利子負債、投資有価証券、不動産時価などの更新データが必要です。

いま判定できる銘柄だけで一次スクリーニングを見る:

```powershell
npm run universe:screen
```

既存の `stock-master` から一次スクリーニング用メトリクスを作る:

```powershell
npm run universe:metrics
```

売買タイミングをバックテストする:

```powershell
npm run backtest
```

バックテストは `history` の価格推移から、買いライン到達、5%以内で早めに買い、下げ止まり反転の3パターンを比較します。履歴が短い銘柄は画面で `参考` と表示します。

実価格で半年・1年・2年をまとめて調べる:

```powershell
npm run backtest:research
```

結果は `reports/latest-price-backtest.md` と `data/price-backtest-results.csv` に出ます。

日本株母集団から価格だけで広く一次候補を探す:

```powershell
npm run backtest:universe
```

初期設定では母集団の先頭1000件を調べます。対象件数を変える場合は `UNIVERSE_BACKTEST_LIMIT=3000` のように指定します。結果は `reports/latest-universe-price-backtest.md` と `data/universe-price-backtest.csv` に出ます。

2倍以上になった銘柄と次の2倍監視候補を見る:

```powershell
npm run multibagger:research
```

結果は `reports/latest-multibagger-candidates.md` と `data/multibagger-candidates.csv` に出ます。価格だけで選んだ候補なので、買う前に財務と開示の確認が必要です。

朝の公開前に広い調査レポートをまとめて更新する:

```powershell
npm run research:morning
```

GitHub Actionsの朝実行でも同じ処理が走ります。外部の株価取得に失敗した場合は、公開と通知を止めずに既存レポートを使います。

画面に出す広域候補だけを作り直す:

```powershell
npm run research:data
```

通常候補に入れる前の財務確認リストを作る:

```powershell
npm run promotion:research
```

結果は `reports/latest-promotion-candidates.md` と `data/promotion-candidates.csv` に出ます。ここで上位の銘柄からBPS、EPS、現金、有利子負債、発行株数を確認して、通常候補へ入れます。

昇格候補の中で、どれから財務確認するかを見る:

```powershell
npm run promotion:readiness
```

結果は `reports/latest-promotion-readiness.md` と `data/promotion-readiness.csv` に出ます。`最優先で財務確認` の上位から確認します。

既存候補に入っていない未発掘候補を見る:

```powershell
npm run hidden:gems
```

結果は `reports/latest-hidden-gems.md` と `data/hidden-gems.csv` に出ます。通常候補と既存の昇格候補を除外した、日本株全体からの次の候補です。

未発掘候補から通常候補入力の下書きを作る:

```powershell
npm run hidden:gems:draft
```

結果は `data/stock-master-hidden-gems-draft.csv` と `reports/latest-hidden-gems-stock-master-draft.md` に出ます。`今すぐ財務確認` だけを対象にし、通常候補へ入れる前の確認リストとして使います。

昇格候補から通常候補入力の下書きを作る:

```powershell
npm run stock-master:draft
```

結果は `data/stock-master-input-draft.csv` と `reports/latest-stock-master-draft.md` に出ます。株価は取得値、財務は確認前の仮置きなので、通常候補に反映する前に有報と決算で確認します。

既存の通常候補に下書きを足した確認用プレビューを見る:

```powershell
npm run stock-master:preview-expanded
```

結果は `data/stock-master-expanded-preview.csv` と `reports/latest-stock-master-expanded-preview.md` に出ます。これは通常候補を増やした場合の見え方を確認するためのもので、財務確認前の銘柄は `推定` として扱います。

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

公開してよいファイルだけか確認:

```powershell
npm run privacy:check
```

GitHubに上がるMarkdownとローカルだけの無視ファイルを見る:

```powershell
npm run privacy:report
```

本番準備度だけ見る:

```powershell
npm run production:check
```

一部手入力だけ見る:

```powershell
npm run manual:check
```

確認済みに変える前のプレビュー:

```powershell
npm run manual:confirm -- 6505
```

確認済みに変える:

```powershell
npm run manual:confirm -- 6505 --write
```

`--write` を付けると、`data/stock-master.csv` を更新し、画面用データと朝レポートも再生成します。

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
- `stock-master:preview-expanded` で追加候補を確認する
- Google Sheets運用の場合は `STOCK_MASTER_CSV_URL` が設定済みか見る
- Discord通知の `対象銘柄数` を確認する

データ要確認が多い:

- `production:check` の「次に直すデータ」を上から埋める
- まず株価、次にEDINET相当、最後に開示と監視リストを整える

一部手入力が多い:

- `npm run manual:check` で確認する順番を見る
- 画面の表示を `一部手入力` に切り替えて対象銘柄だけ見る
- EDINETや株価元データで確認できた銘柄は `npm run manual:confirm -- 銘柄コード --write` で `確認済み` に変える
- 本番準備度100%でも、一部手入力は「あとで正式確認するリスト」として見る
