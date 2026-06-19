# GitHub公開手順

## 1. GitHubでリポジトリを作る

例:

```text
candidate-stock-assist
```

公開リポジトリにするとGitHub FreeでGitHub Pagesを使いやすいです。非公開リポジトリでPagesを使う場合は、GitHubのプラン条件を確認してください。

## 2. このフォルダをGit管理にする

```powershell
git init
git add .
git commit -m "Initial candidate stock assist app"
git branch -M main
git remote add origin https://github.com/USER/candidate-stock-assist.git
git push -u origin main
```

`USER` は自分のGitHubユーザー名に置き換えます。

## 3. Pagesを有効化する

GitHubのリポジトリ画面で:

```text
Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

## 4. 外部データURLを登録する

必要なら:

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

登録する名前:

```text
PRICE_CSV_URL
DISCLOSURE_CSV_URL
EDINET_FACTS_CSV_URL
```

未登録でも `data/*.csv` を使って動きます。

## 5. 手動で初回実行する

```text
Actions -> Morning update and Pages deploy -> Run workflow
```

成功するとPagesのURLが表示されます。

## 6. 毎朝更新

ワークフローは日本時間の毎朝7:05ごろに動きます。

```yaml
cron: "5 22 * * *"
```

GitHub Actionsの時刻はUTCなので、日本時間7:05はUTC 22:05です。

## 7. 公開前チェック

ローカルで:

```powershell
npm run cloud:check
```

これが通れば、GitHub Pages公開用の最低限は揃っています。
