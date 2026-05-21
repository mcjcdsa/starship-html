/** 解析 starbase.texas.gov 海滩/道路文案 */
const STARBASE_URL = "https://www.starbase.texas.gov/beach-road-access";

function parseBeachWindows(text) {
  const windows = [];
  const primaryRe =
    /Primary[:\s]*([A-Za-z]+\.\s*\d{1,2}\s+\d{1,2}:\d{2}\s*(?:AM|PM)\s+to\s+[A-Za-z]+\.\s*\d{1,2}\s+\d{1,2}:\d{2}\s*(?:AM|PM))/gi;
  let m;
  while ((m = primaryRe.exec(text)) !== null) {
    windows.push({ label: "Primary", range: m[1].replace(/\s+/g, " ").trim() });
  }
  if (!windows.length) {
    const loose = text.match(
      /May\.\s*\d{1,2}\s+\d{1,2}:\d{2}\s*(?:AM|PM)\s+to\s+May\.\s*\d{1,2}\s+\d{1,2}:\d{2}\s*(?:AM|PM)/gi
    );
    if (loose) loose.forEach((range) => windows.push({ label: "Primary", range }));
  }
  return windows;
}

function parseRoadMessage(text) {
  if (/no road delays/i.test(text)) {
    return { title: "Road Updates", message: "No road delays.", status: "clear" };
  }
  if (/road delay|closure|closed/i.test(text)) {
    return {
      title: "Road Updates",
      message: "Road delays reported — check starbase.texas.gov",
      status: "alert",
    };
  }
  return null;
}

function parseStarbaseHtml(html, base) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const payload = { ...base };

  if (/BEACH Access|Beach closures|Boca Chica Beach/i.test(text)) {
    const windows = parseBeachWindows(text);
    if (windows.length) {
      payload.beachAccess = {
        ...(base.beachAccess || {}),
        title: "BEACH Access Status",
        subtitle: "Boca Chica Beach closures.",
        source: STARBASE_URL,
        sourceLabel: "starbase.texas.gov · Beach Road Access",
        windows,
        fetchedAt: new Date().toISOString(),
      };
    }
  }

  const road = parseRoadMessage(text);
  if (road) payload.roadUpdates = { ...road, fetchedAt: new Date().toISOString() };

  return payload;
}

module.exports = { parseStarbaseHtml, STARBASE_URL };
