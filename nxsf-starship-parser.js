/** 解析 Next Spaceflight /starship/ 页面 HTML */
function parseNxsfStarshipPage(html) {
  const base = loadBaseData();

  const checklistM = html.match(/(\d+)\/(\d+)\s*Checklist Items Complete/i);
  if (checklistM) {
    base.flight12.checklistDone = Number(checklistM[1]);
    base.flight12.checklistTotal = Number(checklistM[2]);
  }

  const tempM = html.match(/(\d+)\s*°F/);
  const windM = html.match(/(\d+)\s*knots/i);
  const rainM = html.match(/moderate rain|light rain|heavy rain|clear/i);
  if (tempM) base.weather.tempF = Number(tempM[1]);
  if (windM) base.weather.windKnots = Number(windM[1]);
  if (rainM) base.weather.condition = rainM[0];

  const roads = parseRoadClosures(html);
  if (roads?.length) base.roadClosures = roads;

  base.fetchedAt = new Date().toISOString();
  return base;
}

function loadBaseData() {
  const fs = require("fs");
  const path = require("path");
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "data", "nxsf-starship.json"), "utf8")
  );
}

function parseRoadClosures(html) {
  const items = [];
  const seen = new Set();
  const re =
    /Beach and Road Closure[\s\S]*?(\d{1,2} May \d{4})[\s\S]*?(\d{1,2}:\d{2} [AP]M to \d{1,2}:\d{2} [AP]M)/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const key = `${m[1]}|${m[2]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      title: "Beach and Road Closure",
      date: m[1],
      time: m[2],
      primary: /Primary/i.test(m[0]),
      note: "Local to Starbase, Texas · via Next Spaceflight",
    });
  }
  return items.length ? items : null;
}

module.exports = { parseNxsfStarshipPage, loadBaseData };
