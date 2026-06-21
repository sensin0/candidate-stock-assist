import { spawnSync } from "node:child_process";

const publicMarkdown = gitLines(["ls-files"])
  .filter((file) => file.endsWith(".md"))
  .sort();
const ignoredFiles = gitStatusIgnoredFiles()
  .sort();
const ignoredMarkdown = ignoredFiles.filter((file) => file.endsWith(".md"));
const privateLookingIgnored = ignoredFiles.filter((file) =>
  /source|private|book-notes|raw|ocr|仕様|_\d{8}\.md/i.test(file)
);

console.log("公開ファイル確認");
console.log("");
console.log("GitHubに上がるMarkdown");
publicMarkdown.forEach((file) => console.log(`- ${file}`));
console.log("");
console.log(`ローカルだけの無視ファイル: ${ignoredFiles.length}件`);
if (ignoredMarkdown.length) {
  console.log("");
  console.log("ローカルだけのMarkdown");
  ignoredMarkdown.forEach((file) => console.log(`- ${file}`));
}
if (privateLookingIgnored.length) {
  console.log("");
  console.log("非公開メモ候補");
  privateLookingIgnored.forEach((file) => console.log(`- ${file}`));
}
console.log("");
console.log("判定: 上のMarkdown以外はGitHub上の本文MDとして公開されません");

function gitLines(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout);
  }
  return result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function gitStatusIgnoredFiles() {
  const result = spawnSync("git", ["status", "--short", "--ignored", "-z"], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout);
  }
  return result.stdout
    .split("\0")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => entry.startsWith("!! "))
    .map((entry) => entry.slice(3));
}
