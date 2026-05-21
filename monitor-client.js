/** 连接本地 monitor-server，展示 NXSF 页面变化（GitHub Pages 上仅静态数据） */
const MONITOR_API = "http://localhost:3847/api/status";
const POLL_UI_MS = 5000;
const IS_LOCAL_MONITOR =
  /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.protocol === "file:";

const FIELD_LABELS = {
  title: "任务名称",
  goPercent: "准许发射",
  liftoffGmt: "起飞 (GMT)",
  liftoffDate: "起飞日期",
  windowOpen: "窗口开启",
  windowClose: "窗口关闭",
  countdownT: "页面倒计时",
  hasLivestream: "直播链接",
};

const els = {
  dot: document.getElementById("monitor-dot"),
  status: document.getElementById("monitor-status"),
  lastSync: document.getElementById("monitor-last-sync"),
  fields: document.getElementById("monitor-fields"),
  changes: document.getElementById("monitor-changes"),
  btnRefresh: document.getElementById("btn-monitor-refresh"),
  btnApply: document.getElementById("btn-monitor-apply"),
};

let lastRemote = null;
let lastFieldSnapshot = null;

function formatField(key, val) {
  if (val == null) return "—";
  if (key === "goPercent") return `${val}%`;
  if (key === "hasLivestream") return val ? "已出现" : "无";
  return String(val);
}

function getChangedKeys(snapshot) {
  const changed = new Set();
  if (!snapshot || !lastFieldSnapshot) return changed;
  Object.keys(FIELD_LABELS).forEach((key) => {
    if (snapshot[key] !== lastFieldSnapshot[key]) changed.add(key);
  });
  return changed;
}

function renderFields(snapshot, changedKeys = new Set()) {
  if (!els.fields) return;
  if (!snapshot) {
    els.fields.innerHTML = '<p class="monitor-empty">等待首次同步…</p>';
    return;
  }

  const keys = Object.keys(FIELD_LABELS);
  els.fields.innerHTML = keys
    .map(
      (key) => `
    <div class="monitor-field">
      <span class="monitor-field-label">${FIELD_LABELS[key]}</span>
      <span class="monitor-field-val${changedKeys.has(key) ? " changed" : ""}" data-field="${key}">${formatField(key, snapshot[key])}</span>
    </div>`
    )
    .join("");
}

function renderChanges(changes) {
  if (!els.changes) return;
  if (!changes?.length) {
    els.changes.innerHTML = '<p class="monitor-empty">暂无变化记录</p>';
    return;
  }

  els.changes.innerHTML = changes
    .slice(0, 15)
    .map((entry) => {
      const items = entry.changes
        .map(
          (c) =>
            `<li><strong>${FIELD_LABELS[c.field] || c.field}</strong>：${formatField(c.field, c.from)} → ${formatField(c.field, c.to)}</li>`
        )
        .join("");
      const time = new Date(entry.at).toLocaleString("zh-CN");
      return `<div class="monitor-change-entry"><time>${time}</time><ul>${items}</ul></div>`;
    })
    .join("");
}

function setConnection(ok, message) {
  if (els.dot) {
    els.dot.classList.toggle("online", ok);
    els.dot.classList.toggle("offline", !ok);
  }
  if (els.status) els.status.textContent = message;
  const banner = document.getElementById("monitor-offline-banner");
  if (banner) {
    banner.classList.toggle("hidden", ok);
    if (!ok) {
      banner.textContent = IS_LOCAL_MONITOR
        ? "离线模式：监测服务未连接，GO% / 封路不会自动更新。请运行 npm run start 或 npm run dev 预览静态数据。"
        : "线上静态部署：展示内嵌 config / 封路 / 飞行器数据；实时监测请在本地运行 npm run start。";
    }
  }
}

async function fetchMonitor(manual = false) {
  try {
    const url = manual ? `${MONITOR_API.replace("/status", "/poll")}` : MONITOR_API;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    lastRemote = data.snapshot;
    setConnection(true, data.lastError ? `已连接（源站异常: ${data.lastError}）` : "监测中");
    if (els.lastSync) {
      els.lastSync.textContent = data.lastFetch
        ? `上次同步 ${new Date(data.lastFetch).toLocaleString("zh-CN")} · 每 ${(data.intervalMs || 30000) / 1000}s`
        : "尚未同步";
    }
    const changedKeys = getChangedKeys(data.snapshot);
    if (changedKeys.size && typeof document.hidden !== "undefined" && !document.hidden) {
      document.title = `● ${changedKeys.size}项更新 · Starship Flight 12`;
    }
    renderFields(data.snapshot, changedKeys);
    renderChanges(data.changes);
    lastFieldSnapshot = data.snapshot ? { ...data.snapshot } : null;
    return data;
  } catch (err) {
    setConnection(
      false,
      "未连接监测服务 — 请运行 node monitor-server.js"
    );
    if (els.lastSync) els.lastSync.textContent = err.message;
    return null;
  }
}

function applyToMission() {
  if (!lastRemote || typeof window.applyMonitorSnapshot !== "function") {
    alert("请先启动监测服务并等待同步完成");
    return;
  }
  window.applyMonitorSnapshot(lastRemote);
}

function initMonitor() {
  if (!els.status) return;

  if (!IS_LOCAL_MONITOR) {
    setConnection(false, "静态站点（GitHub Pages）— 使用已发布数据");
    const card = document.querySelector(".monitor-card");
    if (card) card.classList.add("monitor-card-static");
    els.btnRefresh?.setAttribute("disabled", "true");
    els.btnApply?.setAttribute("disabled", "true");
    document.getElementById("btn-monitor-preview")?.setAttribute("disabled", "true");
    if (els.changes) {
      els.changes.innerHTML =
        '<p class="monitor-empty">线上环境不连接本地监测服务。更新数据请本地运行 build:data 后推送到仓库。</p>';
    }
    return;
  }

  fetchMonitor();
  setInterval(() => fetchMonitor(), POLL_UI_MS);

  els.btnRefresh?.addEventListener("click", () => fetchMonitor(true));
  els.btnApply?.addEventListener("click", applyToMission);

  document.getElementById("btn-monitor-preview")?.addEventListener("click", async () => {
    try {
      const res = await fetch("http://localhost:3847/api/config-preview");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const preview = await res.json();
      const blob = new Blob([JSON.stringify(preview, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "config-preview.json";
      a.click();
      URL.revokeObjectURL(a.href);
      const hint = document.getElementById("monitor-preview-hint");
      if (hint) {
        hint.textContent = `已生成预览 ${new Date(preview.generatedAt).toLocaleString("zh-CN")} — 请人工合并到 config.js`;
      }
    } catch (e) {
      alert("无法获取配置预览：" + e.message);
    }
  });
}

initMonitor();
