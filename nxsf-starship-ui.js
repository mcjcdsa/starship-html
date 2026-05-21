/**
 * 渲染 Next Spaceflight /starship/ 专页内容
 * https://www.nextspaceflight.com/starship/
 */
(function () {
  const API = "http://localhost:3847/api/starship";
  const FALLBACK = "data/nxsf-starship.json";
  const VEHICLES_JSON = "data/nxsf-vehicles.json";
  let nxsfData = null;
  let vehiclesData = null;
  let hardwareFilter = "all";
  let hardwareStatusFilter = "all";
  let hardwareSearch = "";

  const statusMap = {
    Active: "status-live",
    Destroyed: "status-closed",
    Expended: "status-warn",
    Retired: "status-info",
  };

  const typeLabel = {
    Ship: "舰体",
    Booster: "助推器",
    "Full Stack": "全栈",
    Other: "其他",
  };

  const categoryLabel = {
    "Test Vehicle": "测试车辆",
    "Full Stack": "全栈",
    "Structural Test Article": "结构试验件",
  };

  async function fetchNxsf() {
    try {
      const res = await fetch(API, { cache: "no-store" });
      if (res.ok) {
        const j = await res.json();
        return j.data || j;
      }
    } catch (_) {}
    try {
      const res = await fetch(FALLBACK);
      if (res.ok) return res.json();
    } catch (_) {}
    return null;
  }

  function renderWeather(d) {
    const el = document.getElementById("nxsf-weather");
    if (!el || !d?.weather) return;
    const w = d.weather;
    el.innerHTML = `
      <h3 class="nxsf-card-title">Starbase 天气</h3>
      <p class="weather-time">${w.time || "—"} · ${w.date || ""}</p>
      <p class="weather-main">${w.condition || "—"} · <strong>${w.tempF ?? "—"}°F</strong></p>
      <p class="weather-wind">风速 ${w.windKnots ?? "—"} knots</p>
      <p class="weather-loc">${w.location}</p>`;
  }

  function renderChecklist(d) {
    const bar = document.getElementById("checklist-bar");
    const grid = document.getElementById("checklist-grid");
    const homePct = document.getElementById("home-checklist-pct");
    if (!d?.flight12) return;
    const { checklistDone, checklistTotal } = d.flight12;
    const pct = checklistTotal ? Math.round((checklistDone / checklistTotal) * 100) : 0;
    if (bar) {
      bar.innerHTML = `
        <div class="checklist-head">
          <span>发射清单</span>
          <strong>${checklistDone}/${checklistTotal} 完成</strong>
        </div>
        <div class="checklist-track"><div class="checklist-fill" style="width:${pct}%"></div></div>`;
    }
    if (homePct) homePct.textContent = `${checklistDone}/${checklistTotal}`;
    if (grid && d.checklistItems) {
      grid.innerHTML = d.checklistItems
        .map((item) => `<div class="checklist-item done">✓ ${item}</div>`)
        .join("");
    }
  }

  function renderRecentTests(d) {
    const el = document.getElementById("nxsf-recent-tests");
    if (!el || !d?.recentTests) return;
    el.innerHTML = d.recentTests
      .map(
        (t) => `
      <article class="test-card${t.flight === 12 ? " test-card-flight12" : ""}">
        ${t.flight === 12 ? '<span class="test-flight-badge">Flight 12</span>' : ""}
        <h4>${t.title || t.vehicle}</h4>
        <p>${t.date}</p>
        <p class="test-loc">${t.location}</p>
      </article>`
      )
      .join("");
  }

  function renderVideos(d) {
    const el = document.getElementById("nxsf-videos");
    if (!el || !d?.videos) return;
    el.innerHTML = `<ul class="video-list">${d.videos
      .map((v) => `<li><span class="video-title">${v.title}</span><span class="video-ago">${v.ago}</span></li>`)
      .join("")}</ul>`;
  }

  function getEmbeddedVehicles() {
    const embedded = window.NXSF_VEHICLES_CATALOG;
    if (embedded?.hardware?.length) return embedded;
    return null;
  }

  async function fetchVehiclesCatalog() {
    const embedded = getEmbeddedVehicles();
    if (embedded) return embedded;
    try {
      const res = await fetch(VEHICLES_JSON, { cache: "no-store" });
      if (res.ok) return res.json();
    } catch (_) {}
    return null;
  }

  function getHardwareList() {
    if (vehiclesData?.hardware?.length) return vehiclesData;
    if (nxsfData?.hardware?.length) return nxsfData;
    return null;
  }

  function renderHardware(filter = hardwareFilter) {
    const el = document.getElementById("vehicles-grid");
    const meta = document.getElementById("vehicles-meta");
    const catalog = getHardwareList();
    if (!el || !catalog?.hardware) {
      if (el) el.innerHTML = `<p class="empty-hint">暂无飞行器数据</p>`;
      return;
    }

    let list = catalog.hardware;
    if (filter === "stack") list = list.filter((h) => h.type === "Full Stack");
    else if (filter === "booster") list = list.filter((h) => h.type === "Booster");
    else if (filter === "ship") list = list.filter((h) => h.type === "Ship");

    if (hardwareStatusFilter !== "all") {
      list = list.filter((h) => h.status === hardwareStatusFilter);
    }
    const q = hardwareSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (h) =>
          (h.id && h.id.toLowerCase().includes(q)) ||
          (h.title && h.title.toLowerCase().includes(q)) ||
          (h.note && h.note.toLowerCase().includes(q))
      );
    }

    if (meta) {
      const active = catalog.hardware.filter((h) => h.status === "Active").length;
      meta.textContent = `显示 ${list.length} / ${catalog.hardware.length} 项 · 活跃 ${active} · 更新 ${catalog.updated || "—"}`;
    }

    if (!list.length) {
      el.innerHTML = `<p class="empty-hint">无匹配飞行器，请调整搜索或筛选</p>`;
      return;
    }

    el.innerHTML = list
      .map((v) => {
        const statusZh = v.statusZh || v.status;
        const typeZh = typeLabel[v.type] || v.type;
        const catZh = categoryLabel[v.category] || v.category;
        const showTitle = v.title && v.title !== v.id;
        return `
      <article class="vehicle-card${v.status === "Active" ? " vehicle-card--active" : ""}">
        <div class="vehicle-card-head">
          <span class="vehicle-type">${typeZh} · ${catZh}</span>
          <span class="status-pill ${statusMap[v.status] || "status-info"}">${statusZh}</span>
        </div>
        <h3>${v.id}</h3>
        ${showTitle ? `<p class="vehicle-title-alt">${v.title}</p>` : ""}
        ${v.note ? `<p class="vehicle-note">${v.note}</p>` : ""}
      </article>`;
      })
      .join("");
  }

  function renderRoadForClosures(d) {
    if (!d?.roadClosures?.length) return;
    window.__nxsfRoadClosures = d.roadClosures;
    if (typeof window.renderClosuresFromNxsf === "function") {
      window.renderClosuresFromNxsf(d.roadClosures);
    }
  }

  function renderFlight12Card(d) {
    const el = document.getElementById("home-flight12-extra");
    if (!el || !d?.flight12) return;
    const f = d.flight12;
    el.innerHTML = `
      <p class="flight12-summary">${f.summary}</p>
      <p class="flight12-meta">${f.vehicle} · ${f.site}</p>
      <a href="${f.watchUrl}" target="_blank" rel="noopener" class="btn-ghost">观看直播 →</a>`;
  }

  function initHardwareFilters() {
    document.querySelectorAll("[data-hw-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        hardwareFilter = btn.dataset.hwFilter;
        document.querySelectorAll("[data-hw-filter]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderHardware(hardwareFilter);
      });
    });
    document.querySelectorAll("[data-status-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        hardwareStatusFilter = btn.dataset.statusFilter;
        document.querySelectorAll("[data-status-filter]").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderHardware();
      });
    });
    const search = document.getElementById("vehicles-search");
    if (search) {
      search.addEventListener("input", () => {
        hardwareSearch = search.value;
        renderHardware();
      });
    }
  }

  async function refresh(manual = false) {
    if (manual) {
      try {
        await fetch("http://localhost:3847/api/starship/poll");
      } catch (_) {}
    }
    const [nxsf, vehicles] = await Promise.all([fetchNxsf(), fetchVehiclesCatalog()]);
    nxsfData = nxsf;
    vehiclesData = vehicles || getEmbeddedVehicles();
    renderWeather(nxsfData);
    renderChecklist(nxsfData);
    renderRecentTests(nxsfData);
    renderVideos(nxsfData);
    renderHardware();
    renderRoadForClosures(nxsfData);
    renderFlight12Card(nxsfData);
  }

  window.reloadVehiclesFromFile3 = async () => {
    vehiclesData = await fetchVehiclesCatalog();
    renderHardware();
  };

  window.refreshNxsfStarship = refresh;

  function init() {
    initHardwareFilters();
    vehiclesData = getEmbeddedVehicles();
    renderHardware();
    refresh();
    setInterval(() => refresh(), 60000);
    document.getElementById("btn-refresh-nxsf")?.addEventListener("click", () => refresh(true));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
