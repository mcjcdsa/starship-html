/**
 * 从 starbase.texas.gov 拉取海滩/道路信息，更新 closures.json
 */
const fs = require("fs");
const path = require("path");
const { parseStarbaseHtml, STARBASE_URL } = require("./closure-parse");

const CLOSURES_FILE = path.join(__dirname, "..", "data", "closures.json");

function readBase() {
  const raw = JSON.parse(fs.readFileSync(CLOSURES_FILE, "utf8"));
  if (Array.isArray(raw)) return { beachAccess: null, roadUpdates: null, items: raw };
  return raw;
}

async function main() {
  const base = readBase();
  let payload = base;

  try {
    const res = await fetch(STARBASE_URL, {
      headers: { "User-Agent": "StarshipSiteBuild/1.0", Accept: "text/html" },
    });
    if (res.ok) {
      const html = await res.text();
      payload = parseStarbaseHtml(html, base);
      console.log(
        `[sync-closures] 已解析: ${payload.beachAccess?.windows?.length || 0} 海滩窗口, road=${payload.roadUpdates?.message || "—"}`
      );
    } else {
      console.warn(`[sync-closures] HTTP ${res.status}，保留本地数据`);
    }
  } catch (err) {
    console.warn("[sync-closures] 拉取失败，保留本地数据:", err.message);
  }

  fs.writeFileSync(CLOSURES_FILE, JSON.stringify(payload, null, 2));
  const jsPath = path.join(__dirname, "..", "data", "closures.js");
  fs.writeFileSync(
    jsPath,
    `/** Auto-generated */\nwindow.CLOSURES_DATA=${JSON.stringify(payload)};\n`
  );
  console.log("[sync-closures] 已写入 data/closures.json + closures.js");
}

main();
