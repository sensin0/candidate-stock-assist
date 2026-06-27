import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRecords } from "./csv-utils.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(rootDir, "data");
const reportsDir = path.join(rootDir, "reports");
const outputPath = path.join(reportsDir, "latest-universe-analysis-summary.md");

const listed = readCsv("listed-universe.csv");
const priceBacktest = readCsv("universe-price-backtest.csv");
const hiddenGems = readCsv("hidden-gems.csv");
const promotionCandidates = readCsv("promotion-candidates.csv");
const universeMetrics = readCsv("universe-metrics.csv");
const stockMaster = readCsv("stock-master.csv");

const success = priceBacktest.filter((row) => !row.error);
const failed = priceBacktest.filter((row) => row.error);
const good = success.filter((row) => row.judgement === "良さそう");
const weak = success.filter((row) => row.judgement === "見送り寄り");
const neutral = success.filter((row) => row.judgement === "中立");
const noEntry = success.filter((row) => row.judgement === "未約定");
const timingNow = success.filter((row) => row.latestSignal === "上昇中押し目");
const reboundWatch = success.filter((row) => row.latestSignal === "安値反転候補");
const highZone = success.filter((row) => row.latestSignal === "高値圏");
const confirmedMetrics = universeMetrics.filter((row) => row.asOf === "confirmed");
const estimatedMetrics = universeMetrics.filter((row) => row.asOf !== "confirmed");

const lines = [
  "# 日本株全体分析サマリー",
  "",
  `生成日時: ${new Date().toISOString()}`,
  "",
  "このレポートは、日本株全体を一度見渡して、どこまで絞れているかを確認するためのものです。",
  "価格だけで良く見える銘柄は買い候補ではありません。財務、決算、材料、流動性を確認してから通常候補へ進めます。",
  "",
  "## 全体像",
  "",
  `- 日本株母集団: ${listed.length}件`,
  `- 価格バックテスト対象: ${priceBacktest.length}件`,
  `- 価格取得成功: ${success.length}件`,
  `- 価格取得失敗: ${failed.length}件`,
  `- 価格検証で良さそう: ${good.length}件`,
  `- 見送り寄り: ${weak.length}件`,
  `- 中立: ${neutral.length}件`,
  `- 未約定: ${noEntry.length}件`,
  `- 通常候補登録済み: ${stockMaster.length}件`,
  "",
  "## いまの絞り込み",
  "",
  `- 通常候補への昇格候補: ${promotionCandidates.length}件`,
  `- 優先して財務確認: ${promotionCandidates.filter((row) => row.action === "優先して財務確認").length}件`,
  `- 監視しながら財務確認: ${promotionCandidates.filter((row) => row.action === "監視しながら財務確認").length}件`,
  `- 未発掘候補: ${hiddenGems.length}件`,
  `- 未発掘の今すぐ財務確認: ${hiddenGems.filter((row) => row.assistAction === "今すぐ財務確認").length}件`,
  `- 未発掘の監視候補: ${hiddenGems.filter((row) => row.assistAction === "監視候補").length}件`,
  `- 高値なので待つ: ${hiddenGems.filter((row) => row.assistAction === "高値なので待つ").length}件`,
  "",
  "## タイミング別",
  "",
  `- 上昇中押し目: ${timingNow.length}件`,
  `- 安値反転候補: ${reboundWatch.length}件`,
  `- 高値圏: ${highZone.length}件`,
  `- 待ち: ${success.filter((row) => row.latestSignal === "待ち").length}件`,
  "",
  "## 戦略別",
  "",
  ...countBy(success, "bestStrategy").map(([label, count]) => `- ${label}: ${count}件`),
  "",
  "## 財務データの状態",
  "",
  `- 財務メトリクス対象: ${universeMetrics.length}/${listed.length}件`,
  `- 確認済み財務メトリクス: ${confirmedMetrics.length}件`,
  `- 確認前推定: ${estimatedMetrics.length}件`,
  "",
  "## 価格検証で良さそう上位",
  "",
  ...top(good, "priceScore", 30).map((row, index) =>
    `- ${index + 1}. ${row.code} ${row.name}: ${row.priceScore}点 / ${row.bestStrategy} / ${row.latestSignal} / 平均${row.averageReturn}% / 勝率${row.winRate}% / 最大下落${row.maxDrawdown}%`
  ),
  "",
  "## 価格バックテスト上位",
  "",
  ...top(priceBacktest, "priceScore", 30).map((row, index) =>
    `- ${index + 1}. ${row.code} ${row.name}: ${row.priceScore}点 / ${row.bestStrategy} / ${row.judgement} / ${row.latestSignal} / 平均${row.averageReturn}% / 勝率${row.winRate}% / 最大下落${row.maxDrawdown}%`
  ),
  "",
  "## 財務確認へ回す上位",
  "",
  ...top(promotionCandidates, "priority", 30).map((row, index) =>
    `- ${index + 1}. ${row.code} ${row.name}: 優先度${row.priority} / ${row.action} / 次: ${row.nextCheck}`
  ),
  "",
  "## 未発掘の今すぐ財務確認",
  "",
  ...hiddenGems
    .filter((row) => row.assistAction === "今すぐ財務確認")
    .slice(0, 30)
    .map((row, index) =>
      `- ${index + 1}. ${row.code} ${row.name}: ${row.hiddenScore ?? row.score}点 / ${row.signal || row.latestSignal} / 勝率${row.winRate}% / 平均${row.averageReturn}% / 最大下落${row.maxDrawdown}%`
    ),
  "",
  "## 使い方",
  "",
  "- 価格バックテスト上位は、値動きだけの一次候補です。",
  "- 財務確認へ回す上位は、通常候補に昇格する前の作業リストです。",
  "- 未発掘の今すぐ財務確認は、まだ通常候補に入っていないものから先に見る候補です。",
  "- 財務が確認できないもの、急騰後、高値圏、検証回数が少ないものは買い候補へ上げません。",
];

fs.mkdirSync(reportsDir, { recursive: true });
fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`日本株全体分析サマリーを生成しました: ${path.relative(rootDir, outputPath)}`);

function readCsv(fileName) {
  const filePath = path.join(dataDir, fileName);
  if (!fs.existsSync(filePath)) return [];
  return parseCsvRecords(fs.readFileSync(filePath, "utf8"));
}

function countBy(rows, key) {
  const counts = new Map();
  for (const row of rows) {
    const label = row[key] || "不明";
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function top(rows, key, limit) {
  return rows
    .filter((row) => !row.error)
    .sort((a, b) => Number(b[key] || 0) - Number(a[key] || 0))
    .slice(0, limit);
}
