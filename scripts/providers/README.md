# データ取得プロバイダー

ここに外部データ取得を追加します。

現在:

- `csv-provider.mjs`: サンプルCSVを読み込む予備プロバイダー
- `price-provider.mjs`: 株価更新CSVまたはURLから価格を取り込むプロバイダー
- `disclosure-provider.mjs`: 適時開示CSVまたはURLからカタリストを検出するプロバイダー
- `edinet-provider.mjs`: EDINET相当CSVまたはURLから財務・資産データを取り込むプロバイダー

追加予定:

- EDINET API / XBRL抽出本体
- TDnetプロバイダー本体

各プロバイダーは、最終的に画面用の共通銘柄形式へ変換します。
