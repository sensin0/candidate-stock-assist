# 銘柄マスタ列ガイド

`stock-master` は候補銘柄の母集団です。Google Sheetsで銘柄を増やす時は、まずこのシートに行を追加します。

## 必須列

```text
code,name,price,shares,cash,interestDebt,netAssets,bps,eps,pbrLow,pbrHigh,dataConfidence,qualitativeDone,held
```

- `code`: 銘柄コード
- `name`: 銘柄名
- `price`: 現在株価。あとで `price-updates` によって上書きされます。
- `shares`: 発行株数
- `cash`: 現金及び預金。百万円
- `interestDebt`: 有利子負債。百万円
- `netAssets`: 純資産。百万円
- `bps`: 1株純資産。円
- `eps`: 1株利益。円。赤字ならマイナスで入力できます。
- `pbrLow`: 買いラインに使う低めPBR
- `pbrHigh`: 目標株価に使う高めPBR
- `dataConfidence`: `確認済み`、`一部手入力`、`未確認` のいずれか
- `qualitativeDone`: 有報や事業内容を確認済みなら `true`
- `held`: 保有中なら `true`

## 任意列

- `sector`: 業種
- `treasuryShares`: 自己株式数
- `securities`: 有価証券。百万円
- `investmentSecurities`: 投資有価証券。百万円
- `rentalBook`: 賃貸等不動産の簿価。百万円
- `rentalMarket`: 賃貸等不動産の時価。百万円
- `pbrAvg`: 通常時のPBR目安
- `perLow`, `perAvg`, `perHigh`: PER目安
- `risk`: 見送り理由
- `catalyst`: 注目材料
- `history`: `610|650|620` のような過去株価

## 入力の目安

- 金額は百万円、株価・BPS・EPSは円です。
- 迷う列は空欄より `0` にした方がチェックしやすいです。
- 自信がない銘柄は `dataConfidence` を `未確認` にします。

## 最小入力から作る

列が多くて入力しづらい時は、`data/stock-master-input.csv` に最低限の列だけ入れてから、以下を実行します。

```powershell
npm run stock-master:build
```

`data/stock-master.generated.csv` が作られます。内容を確認してから `stock-master` に貼り付けます。

入力テンプレートは `sheet-templates/stock-master-input.csv` です。
