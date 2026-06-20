# 本番化チェックリスト

現在の完成度は、MVPとしては約8割です。画面、朝レポート、Discord通知、GitHub Actions、Pages公開、CSV差し替え口は動いています。

## 完了済み

- GitHub Pages公開
- 毎朝更新ワークフロー
- Discord通知
- Discord通知プレビュー
- 銘柄マスタCSVの外部差し替え
- Google Sheets運用手順
- 銘柄マスタ列ガイド
- 銘柄マスタ必須列チェック
- 株価、開示、EDINET相当、監視リストのCSV差し替え
- データ品質チェック
- 次に直すデータの表示
- 朝に見る優先順位
- 売買ラインをチャート表示
- ランキング表示

## 残りの主工程

### 1. 銘柄マスタを増やす

目標:

- 最低20件
- 実用目安50件以上

作業:

- Google Sheetsの `stock-master` に候補銘柄を追加
- `STOCK_MASTER_CSV_URL` をGitHub Secretsに登録
- `npm run production:check` または `npm run notify:preview` で件数を確認

### 2. 足りない更新データを埋める

目標:

- 株価カバレッジ 100%
- EDINET相当カバレッジ できれば80%以上

作業:

- `price-updates` を更新
- `edinet-facts` を更新
- `latest-update-report.md` の「次に直すデータ」を消していく

### 3. 判定ロジックを実データで調整する

目標:

- 「今買い候補」が多すぎない
- 「調査が先」が機能する
- 保有銘柄の売り検討が自然

作業:

- 実データ50件前後で朝レポートを見る
- 買いライン、目標株価、スコアの違和感を確認
- 必要なら `scoreStock` と `assistFor` の閾値を調整

### 4. 本番運用テスト

目標:

- 朝の自動実行でPagesが更新される
- Discord通知が届く
- 通知内の優先順位と次に直すデータが読める

作業:

- GitHub Actionsを手動実行
- 翌朝の自動実行を確認
- PagesとDiscordを見比べる

## 完成判定

以下を満たしたら、本番運用開始でよい状態です。

- `stock-master` が20件以上
- `latest-update-report.md` の「次に直すデータ」が0件または内容を把握済み
- Discord通知に違和感がない
- GitHub Actionsの朝実行が成功
- 画面で買いライン、現在株価、目標株価が自然に読める

## 今の次アクション

最優先は、Google Sheetsの `stock-master` を20件以上に増やすことです。ここが増えると、ランキングと朝の優先順位が本番に近づきます。

進捗は以下で確認できます。

```powershell
npm run production:check
```

日々の運用は [OPERATIONS_RUNBOOK.md](./OPERATIONS_RUNBOOK.md) にまとめています。
