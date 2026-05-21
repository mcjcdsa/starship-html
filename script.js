/**
 * 全站路由、主页、飞行器、封路、发射流程条
 */
(function () {
  const CFG = window.STARSHIP_CONFIG || {};
  const SU = () => window.SiteUtils;
  const pages = ["home", "missions", "vehicles", "closures"];

  function initRouter() {
    const navLinks = document.querySelectorAll("[data-page]");
    const show = (id) => {
      pages.forEach((p) => {
        const el = document.getElementById(`page-${p}`);
        if (el) el.classList.toggle("active", p === id);
      });
      navLinks.forEach((a) => {
        a.classList.toggle("active", a.dataset.page === id);
      });
      document.body.dataset.page = id;
      if (id === "home") updateHomeStatus();
      if (id === "missions") {
        if (window.refreshLaunchSiteMap) {
          requestAnimationFrame(() => window.refreshLaunchSiteMap());
        }
        if (window.applyMissionHash) window.applyMissionHash();
      }
    };

    const navigate = (hashRaw) => {
      const parsed = SU() ? SU().parseLocationHash() : { page: hashRaw.replace("#", "") || "home", params: {} };
      const page = pages.includes(parsed.page) ? parsed.page : "home";
      show(page);
    };

    navLinks.forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const page = a.dataset.page;
        const { params } = SU() ? SU().parseLocationHash() : { params: {} };
        const extra = page === "missions" && params.e ? `&e=${params.e}` : "";
        history.replaceState(null, "", `#${page}${extra}`);
        show(page);
      });
    });

    navigate(location.hash || "#home");
    window.addEventListener("hashchange", () => navigate(location.hash));
  }

  function getRunMode() {
    if (SU()) return SU().getRunMode();
    const liftoff = CFG.liftoffAt ? new Date(CFG.liftoffAt) : new Date(2026, 4, 22, 6, 30, 0);
    const prep = CFG.prepMinutes || 50;
    const start = new Date(liftoff.getTime() - prep * 60 * 1000);
    const end = new Date(liftoff.getTime() + (3600 + 5 * 60 + 26) * 1000);
    const now = Date.now();
    if (now < start.getTime()) return "waiting";
    if (now < end.getTime()) return "live";
    return "complete";
  }

  function formatDuration(ms) {
    const t = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(t / 86400);
    const h = Math.floor((t % 86400) / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = t % 60;
    const pad = (n) => String(n).padStart(2, "0");
    if (d > 0) return `${d} 天 ${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  function updateHomeStatus() {
    const statusEl = document.getElementById("home-status");
    const cdEl = document.getElementById("home-countdown");
    if (!statusEl) return;

    const mode = getRunMode();
    const liftoff = CFG.liftoffAt ? new Date(CFG.liftoffAt) : new Date();
    const now = Date.now();

    if (mode === "waiting") {
      statusEl.textContent = "待飞";
      statusEl.className = "status-pill status-upcoming";
      if (cdEl) cdEl.textContent = `距起飞 ${formatDuration(liftoff - now)}`;
    } else if (mode === "live") {
      statusEl.textContent = "测试进行中";
      statusEl.className = "status-pill status-live";
      if (cdEl) cdEl.textContent = now < liftoff ? `T- ${formatDuration(liftoff - now)}` : "已起飞 · 飞行中";
    } else {
      statusEl.textContent = "已完成";
      statusEl.className = "status-pill status-done";
      if (cdEl) cdEl.textContent = "任务已结束";
    }
  }

  async function loadJson(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(path);
    return res.json();
  }

  function statusClass(s) {
    const map = {
      upcoming: "status-upcoming",
      live: "status-live",
      success: "status-ok",
      partial: "status-warn",
      scrub: "status-closed",
      test: "status-info",
      scheduled: "status-warn",
      info: "status-info",
      closed: "status-closed",
    };
    return map[s] || "status-info";
  }

  async function renderMissionList() {
    const el = document.getElementById("mission-list");
    if (!el) return;
    try {
      const list = await loadJson("data/missions.json");
      el.innerHTML = list
        .map(
          (m) => `
        <article class="mission-card ${m.flight === 12 ? "mission-card-featured" : ""}">
          <div class="mission-card-head">
            <span class="mission-flight">Flight ${m.flight}</span>
            <span class="status-pill ${statusClass(m.status)}">${m.result}</span>
          </div>
          <p class="mission-card-date">${m.date} · ${m.site}</p>
          <p class="mission-card-vehicle">${m.vehicle}</p>
          <p class="mission-card-ships">${m.ship} / ${m.booster}</p>
          ${m.url ? `<a class="mission-card-link" href="${m.url}" target="_blank" rel="noopener">详情 →</a>` : ""}
        </article>`
        )
        .join("");
    } catch (e) {
      el.innerHTML = `<p class="empty-hint">无法加载任务列表</p>`;
    }
  }

  async function renderVehicles() {
    if (window.refreshNxsfStarship) return;
  }

  function getClosuresPayload() {
    return (
      window.CLOSURES_DATA ||
      CFG.closures || {
        beachAccess: null,
        roadUpdates: null,
        items: [],
      }
    );
  }

  function renderBeachAccessHtml(beach) {
    if (!beach) return "";
    const windows = (beach.windows || [])
      .map(
        (w) => `
        <li class="beach-window-item">
          <span class="beach-window-label">${w.label}</span>
          <span class="beach-window-range">${w.range}</span>
        </li>`
      )
      .join("");
    return `
      <article class="beach-access-card">
        <div class="closure-head">
          <h3>${beach.title}</h3>
          <span class="status-pill status-warn">海滩关闭</span>
        </div>
        <p class="beach-access-sub">${beach.subtitle || ""}</p>
        <ul class="beach-windows">${windows}</ul>
        ${
          beach.source
            ? `<a href="${beach.source}" target="_blank" rel="noopener" class="closure-source">${beach.sourceLabel || "官方海滩通行公告 →"}</a>`
            : ""
        }
      </article>`;
  }

  function renderRoadUpdatesHtml(road) {
    if (!road) return "";
    const clear = road.status === "clear";
    return `
      <article class="road-updates-card${clear ? " road-updates--clear" : " road-updates--alert"}">
        <div class="closure-head">
          <h3>${road.title}</h3>
          <span class="status-pill ${clear ? "status-ok" : "status-warn"}">${clear ? "畅通" : "注意"}</span>
        </div>
        <p class="road-updates-message">${road.message}</p>
      </article>`;
  }

  function renderClosureItemHtml(c) {
    return `
      <article class="closure-card ${statusClass(c.status)}">
        <div class="closure-head">
          <h3>${c.title}</h3>
          <span class="status-pill ${statusClass(c.status)}">${c.beach || c.status}</span>
        </div>
        <p class="closure-reason"><strong>原因</strong> ${c.reason}</p>
        <p class="closure-time"><strong>时间</strong> ${formatClosureDate(c.start)} — ${formatClosureDate(c.end)}</p>
        <p class="closure-roads"><strong>路段</strong> ${c.roads}</p>
        <p class="closure-note">${c.note}</p>
        <a href="${c.source}" target="_blank" rel="noopener" class="closure-source">官方公告 →</a>
      </article>`;
  }

  function renderNxsfRoadHtml(roads) {
    return (roads || [])
      .map(
        (c) => `
      <article class="closure-card ${c.primary ? "status-warn" : "status-info"}">
        <div class="closure-head">
          <h3>${c.title}</h3>
          ${c.primary ? '<span class="status-pill status-warn">Primary</span>' : ""}
        </div>
        <p class="closure-time"><strong>日期</strong> ${c.date}</p>
        <p class="closure-time"><strong>时间</strong> ${c.time} <span class="tz-hint">(Starbase 本地)</span></p>
        <p class="closure-note">${c.note || "封路可能预示发射测试或运输车辆通行"}</p>
        <a href="https://www.nextspaceflight.com/starship/" target="_blank" rel="noopener" class="closure-source">NXSF 星舰页 →</a>
      </article>`
      )
      .join("");
  }

  function renderClosuresPage(payload, { nxsfRoads = null } = {}) {
    const el = document.getElementById("closures-list");
    if (!el) return;
    const data = payload || getClosuresPayload();
    const parts = [
      renderBeachAccessHtml(data.beachAccess),
      renderRoadUpdatesHtml(data.roadUpdates),
    ];
    if (nxsfRoads?.length) {
      parts.push('<h3 class="closures-subsection-title">NXSF Road Updates</h3>');
      parts.push(renderNxsfRoadHtml(nxsfRoads));
    }
    const items = data.items || (Array.isArray(data) ? data : []);
    if (items.length) {
      parts.push('<h3 class="closures-subsection-title">补充说明</h3>');
      parts.push(items.map(renderClosureItemHtml).join(""));
    }
    el.innerHTML = parts.filter(Boolean).join("") || `<p class="empty-hint">暂无封路信息</p>`;
  }

  window.renderClosuresFromNxsf = function (roads) {
    renderClosuresPage(getClosuresPayload(), { nxsfRoads: roads });
  };

  function formatClosureDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("zh-CN", { hour12: false });
    } catch {
      return iso;
    }
  }

  async function loadClosuresData() {
    if (window.CLOSURES_DATA) return window.CLOSURES_DATA;
    try {
      const res = await fetch("http://localhost:3847/api/closures");
      if (res.ok) {
        const data = await res.json();
        if (data.nxsfRoadClosures?.length) window.__nxsfRoadClosures = data.nxsfRoadClosures;
        if (data.beachAccess || data.roadUpdates) return data;
        return { ...getClosuresPayload(), items: data.items || [] };
      }
    } catch (_) {}
    try {
      const raw = await loadJson("data/closures.json");
      return Array.isArray(raw) ? { ...getClosuresPayload(), items: raw } : raw;
    } catch (_) {
      return getClosuresPayload();
    }
  }

  async function renderClosures() {
    const payload = await loadClosuresData();
    let nxsfRoads = payload.nxsfRoadClosures || window.__nxsfRoadClosures;
    if (!nxsfRoads?.length) {
      try {
        const nxsf = await loadJson("data/nxsf-starship.json");
        if (nxsf.roadClosures?.length) nxsfRoads = nxsf.roadClosures;
      } catch (_) {}
    }
    renderClosuresPage(payload, { nxsfRoads: nxsfRoads?.length ? nxsfRoads : null });
  }

  function renderLaunchFlowBar(simSeconds) {
    const bar = document.getElementById("launch-flow-bar");
    if (!bar || !CFG.launchFlow) return;
    const steps = CFG.launchFlow;
    let activeId = steps[0]?.id;
    for (const step of steps) {
      const min = step.tMin ?? -Infinity;
      const max = step.tMax ?? min;
      if (step.tMax != null) {
        if (simSeconds >= min && simSeconds <= max) activeId = step.id;
      } else if (simSeconds >= min) activeId = step.id;
    }
    bar.querySelectorAll(".flow-step").forEach((node) => {
      const id = node.dataset.step;
      const step = steps.find((s) => s.id === id);
      node.classList.remove("active", "done", "pending");
      if (!step) return;
      const min = step.tMin ?? 0;
      if (simSeconds >= min) {
        if (id === activeId) node.classList.add("active");
        else if (step.tMax != null ? simSeconds > step.tMax : simSeconds > min) node.classList.add("done");
        else node.classList.add("done");
      } else node.classList.add("pending");
    });
  }

  window.updateLaunchFlowBar = renderLaunchFlowBar;

  function initQuickLinks() {
    document.querySelectorAll("[data-goto]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = btn.dataset.goto;
        location.hash = page;
        document.querySelector(`[data-page="${page}"]`)?.click();
      });
    });
  }

  function renderWatchLinks(container) {
    if (!container || !SU()) return;
    const mode = getRunMode();
    container.innerHTML = `<div class="watch-links">${SU().renderWatchLinksHtml(mode)}</div>`;
  }

  function refreshWatchLinks() {
    renderWatchLinks(document.getElementById("watch-links-home"));
    renderWatchLinks(document.getElementById("watch-links-mission"));
  }

  function initWatchLinks() {
    refreshWatchLinks();
  }

  function init() {
    initRouter();
    initQuickLinks();
    initWatchLinks();
    renderMissionList();
    renderClosuresPage(getClosuresPayload());
    renderClosures();
    updateHomeStatus();
    setInterval(() => {
      updateHomeStatus();
      refreshWatchLinks();
    }, 1000);
    document.getElementById("btn-refresh-closures")?.addEventListener("click", renderClosures);
    document.getElementById("btn-sync-closures-hint")?.addEventListener("click", () => {
      alert("在终端运行：npm run sync:closures\n然后 npm run build:data 并刷新页面");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
