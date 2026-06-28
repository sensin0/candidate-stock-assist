# SQLiteストア

生成日時: 2026-06-28T12:43:38.228363+00:00

DB: `data/candidate-stock-assist.sqlite`
テーブル: 34件
総行数: 282,482行
DBサイズ: 44.44MB
整合性: ok

## 方針

- CSVを正本として残し、SQLiteは毎回自動再構築します。
- 検索、結合、履歴分析、バックテスト集計をSQLiteへ順次寄せられます。
- DBファイルは生成物なのでGit管理しません。監査結果だけ追跡します。

## 大きいテーブル

- monthly_price_history: 131,171行 / 4列 / 元CSV `monthly-price-history.csv`
- monthly_signal_backtest: 131,171行 / 21列 / 元CSV `monthly-signal-backtest.csv`
- universe_metrics: 3,730行 / 14列 / 元CSV `universe-metrics.csv`
- listed_universe: 3,728行 / 4列 / 元CSV `listed-universe.csv`
- universe_check_status: 3,728行 / 12列 / 元CSV `universe-check-status.csv`
- universe_financial_facts: 3,728行 / 21列 / 元CSV `universe-financial-facts.csv`
- universe_price_backtest: 3,728行 / 19列 / 元CSV `universe-price-backtest.csv`
- multibagger_candidates: 217行 / 17列 / 元CSV `multibagger-candidates.csv`
- hidden_gems: 200行 / 24列 / 元CSV `hidden-gems.csv`
- promotion_candidates: 150行 / 17列 / 元CSV `promotion-candidates.csv`
- universe_buy_candidate_review: 120行 / 21列 / 元CSV `universe-buy-candidate-review.csv`
- universe_buy_candidates: 120行 / 26列 / 元CSV `universe-buy-candidates.csv`

## 代表ビュー

- `runtime_candidates`: 通常候補と自動昇格候補を合わせた実運用候補
- `runtime_candidate_backtest`: 通常候補とバックテスト結果
- `auto_buy_candidate_review`: 自動買い候補と昇格判定
- `latest_monthly_buy_candidates`: 最新月の月次買い候補
