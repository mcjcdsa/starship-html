/**
 * 本地监测服务：轮询 Next Spaceflight Flight 12 页面并检测变化
 * https://www.nextspaceflight.com/launches/details/8002/
 *
 * 启动: node monitor-server.js
 * API:  http://localhost:3847/api/status
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const { parseNxsfStarshipPage, loadBaseData } = require("./nxsf-starship-parser");

const SOURCE_URL = "https://www.nextspaceflight.com/launches/details/8002/";
const STARSHIP_URL = "https://www.nextspaceflight.com/starship/";
const PORT = 3847;
const POLL_MS = 30_000;
const STATE_FILE = path.join(__dirname, "monitor-state.json");
const MAX_CHANGES = 100;

const state = {
  sourceUrl: SOURCE_URL,
  polling: true,
  intervalMs: POLL_MS,
  lastFetch: null,
  lastError: null,
  snapshot: null,
  changes: [],
};

const starshipState = {
  sourceUrl: STARSHIP_URL,
  lastFetch: null,
  lastError: null,
  data: loadBaseData(),
};

function parseTimeNearLabel(html, label) {
  const idx = html.indexOf(label);
  if (idx < 0) return null;
  const slice = html.slice(idx, idx + 280);
  const m = slice.match(/>(\d{2}:\d{2})</);
  return m ? m[1] : null;
}

function parseWindowClose(html) {
  const idx = html.indexOf("Window Open");
  if (idx < 0) return null;
  const m = html.slice(idx, idx + 160).match(/<p>(\d{2}:\d{2})<\/p><p[^>]*>Window Close/);
  return m ? m[1] : null;
}

function parsePage(html) {
  const goM = html.match(/(\d+)<!--\s*-->%\s*Go For Launch/);
  const liftoffM = html.match(
    /Liftoff Time<!--\s*-->\s*\(GMT\)<\/p><p class="text-label-primary text-3xl font-bold flex items-baseline gap-1">(\d{2}:\d{2})<span class="text-label-secondary text-lg">:(\d{2})<\/span>/
  );
  const dateM = html.match(
    /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/
  );

  const countdown = parseCountdown(html);
  const liftoffGmt = liftoffM ? `${liftoffM[1]}:${liftoffM[2]}` : null;

  return {
    title: html.includes("Starship Flight 12") ? "Starship Flight 12" : null,
    goPercent: goM ? Number(goM[1]) : null,
    liftoffGmt,
    liftoffDate: dateM ? dateM[0] : null,
    windowOpen: liftoffGmt ? liftoffGmt.slice(0, 5) : parseTimeNearLabel(html, "Window Open"),
    windowClose: parseWindowClose(html),
    countdownT: countdown ? `T- ${countdown.h}:${countdown.m}:${countdown.s}` : null,
    hasLivestream: /Watch Livestream|NASASpaceflight/i.test(html),
  };
}

function parseCountdown(html) {
  const tIdx = html.indexOf(">T-<");
  if (tIdx < 0) return null;
  const block = html.slice(tIdx, tIdx + 4000);
  const digits = [...block.matchAll(
    /<p class="z-1 relative text-center text-label-primary">(\d)<\/p>/g
  )].map((m) => m[1]);

  if (digits.length < 6) return null;

  return {
    h: `${digits[0]}${digits[1]}`,
    m: `${digits[2]}${digits[3]}`,
    s: `${digits[4]}${digits[5]}`,
  };
}

function compareSnapshots(prev, next) {
  const keys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);
  const diffs = [];
  for (const key of keys) {
    if (key === "fetchedAt") continue;
    const a = prev?.[key];
    const b = next?.[key];
    if (a !== b) {
      diffs.push({ field: key, from: a ?? null, to: b ?? null });
    }
  }
  return diffs;
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const saved = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
      if (saved.changes) state.changes = saved.changes;
      if (saved.snapshot) state.snapshot = saved.snapshot;
    }
  } catch (_) {
    /* ignore */
  }
}

function saveState() {
  try {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify(
        { snapshot: state.snapshot, changes: state.changes.slice(0, MAX_CHANGES) },
        null,
        2
      )
    );
  } catch (_) {
    /* ignore */
  }
}

async function poll() {
  try {
    const res = await fetch(SOURCE_URL, {
      headers: {
        "User-Agent": "StarshipTimelineMonitor/1.0",
        Accept: "text/html",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const data = parsePage(html);
    data.fetchedAt = new Date().toISOString();

    const diffs = state.snapshot ? compareSnapshots(state.snapshot, data) : [];
    if (diffs.length) {
      const entry = {
        at: data.fetchedAt,
        changes: diffs,
      };
      state.changes.unshift(entry);
      state.changes = state.changes.slice(0, MAX_CHANGES);
      console.log(`[monitor] 检测到 ${diffs.length} 项变化 @ ${entry.at}`);
      diffs.forEach((d) =>
        console.log(`  · ${d.field}: ${JSON.stringify(d.from)} → ${JSON.stringify(d.to)}`)
      );
      saveState();
    }

    state.snapshot = data;
    state.lastFetch = data.fetchedAt;
    state.lastError = null;
    buildConfigPreview();
  } catch (err) {
    state.lastError = err.message;
    console.error("[monitor] 拉取失败:", err.message);
  }
}

function sendJson(res, code, obj) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    });
    res.end();
    return;
  }

  if (req.url === "/api/status" && req.method === "GET") {
    sendJson(res, 200, state);
    return;
  }

  if (req.url === "/api/poll" && req.method === "GET") {
    poll().then(() => sendJson(res, 200, state));
    return;
  }

  if (req.url === "/api/closures" && req.method === "GET") {
    loadClosures()
      .then((payload) => sendJson(res, 200, { ...payload, fetchedAt: new Date().toISOString() }))
      .catch((err) => sendJson(res, 500, { error: err.message, items: [] }));
    return;
  }

  if (req.url === "/api/config-preview" && req.method === "GET") {
    sendJson(res, 200, buildConfigPreview());
    return;
  }

  if (req.url === "/api/starship" && req.method === "GET") {
    sendJson(res, 200, starshipState);
    return;
  }

  if (req.url === "/api/starship/poll" && req.method === "GET") {
    pollStarship().then(() => sendJson(res, 200, starshipState));
    return;
  }

  sendJson(res, 404, { error: "not found" });
});

async function pollStarship() {
  try {
    const res = await fetch(STARSHIP_URL, {
      headers: { "User-Agent": "StarshipTimelineMonitor/1.0", Accept: "text/html" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    starshipState.data = parseNxsfStarshipPage(html);
    starshipState.lastFetch = starshipState.data.fetchedAt;
    starshipState.lastError = null;
    buildConfigPreview();
  } catch (err) {
    starshipState.lastError = err.message;
    console.warn("[monitor] starship 拉取失败:", err.message);
  }
}

const CLOSURES_FILE = path.join(__dirname, "data", "closures.json");
const CONFIG_PREVIEW_FILE = path.join(__dirname, "data", "config-preview.json");
const { parseStarbaseHtml, STARBASE_URL } = require("./scripts/closure-parse");

function buildConfigPreview() {
  const snap = state.snapshot || {};
  const preview = {
    generatedAt: new Date().toISOString(),
    note: "仅供人工核对后合并到 data/config.js，不会自动写入",
    activeFlight: 12,
    mission: {
      goPercent: snap.goPercent,
      windowOpenGmt: snap.windowOpen,
      windowCloseGmt: snap.windowClose,
      liftoffGmt: snap.liftoffGmt,
      liftoffGmtDate: snap.liftoffDate,
      title: snap.title,
    },
    closures: starshipState.data?.roadClosures || null,
  };
  try {
    fs.writeFileSync(CONFIG_PREVIEW_FILE, JSON.stringify(preview, null, 2));
  } catch (_) {}
  return preview;
}

function readClosuresFile() {
  const raw = JSON.parse(fs.readFileSync(CLOSURES_FILE, "utf8"));
  if (Array.isArray(raw)) return { beachAccess: null, roadUpdates: null, items: raw };
  return raw;
}

async function loadClosures() {
  const base = readClosuresFile();

  if (starshipState.data?.roadClosures?.length) {
    return { ...base, nxsfRoadClosures: starshipState.data.roadClosures };
  }
  try {
    const res = await fetch(STARBASE_URL, {
      headers: { "User-Agent": "StarshipTimelineMonitor/1.0", Accept: "text/html" },
    });
    if (res.ok) {
      const html = await res.text();
      const parsed = parseStarbaseClosures(html, base);
      if (parsed.items?.length) return parsed;
    }
  } catch (err) {
    console.warn("[monitor] starbase 拉取失败:", err.message);
  }
  return base;
}

function parseStarbaseClosures(html, base) {
  return parseStarbaseHtml(html, base || readClosuresFile());
}

loadState();

server.listen(PORT, () => {
  console.log(`[monitor] 监测服务已启动 http://localhost:${PORT}`);
  console.log(`[monitor] 目标: ${SOURCE_URL}`);
  console.log(`[monitor] 轮询间隔 ${POLL_MS / 1000}s`);
  poll();
  pollStarship();
  setInterval(poll, POLL_MS);
  setInterval(pollStarship, POLL_MS);
});
