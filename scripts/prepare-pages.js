/**
 * 生成 GitHub Pages 静态目录 _site/（仅站点运行所需文件）
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "_site");

const FILES = [
  "index.html",
  "styles.css",
  "app.js",
  "script.js",
  "site-utils.js",
  "launch-site.js",
  "timeline-scroll.js",
  "nxsf-starship-ui.js",
  "monitor-client.js",
];

const DIRS = ["data"];

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyDir(s, d);
    else copyFile(s, d);
  }
}

function main() {
  rmrf(OUT);
  fs.mkdirSync(OUT, { recursive: true });

  for (const name of FILES) {
    const src = path.join(ROOT, name);
    if (!fs.existsSync(src)) {
      console.warn(`[build:pages] 跳过缺失: ${name}`);
      continue;
    }
    copyFile(src, path.join(OUT, name));
  }

  for (const name of DIRS) {
    const src = path.join(ROOT, name);
    if (!fs.existsSync(src)) throw new Error(`缺少目录: ${name}`);
    copyDir(src, path.join(OUT, name));
  }

  const indexPath = path.join(OUT, "index.html");
  copyFile(indexPath, path.join(OUT, "404.html"));
  fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

  console.log(`[build:pages] 已写入 ${OUT}`);
}

main();
