/** 星舰发射 32 项流程事件 */
const EVENTS = [
  { id: 1, name: "任务指挥确认推进剂加注", time: "0:50:00", note: "确认加注减少25分钟", phase: "pre" },
  { id: 2, name: "二级液氧加注", time: "0:38:53", note: "用时减少6分7秒", phase: "pre" },
  { id: 3, name: "一级液氧加注", time: "0:35:00", note: "提前，用时减少52秒", phase: "pre" },
  { id: 4, name: "一级甲烷加注", time: "0:34:43", note: "推后，用时减少6分32秒", phase: "pre" },
  { id: 5, name: "二级甲烷加注", time: "0:32:59", note: "推后，用时减少18分51秒", phase: "pre" },
  { id: 6, name: "一二级发动机预冷", time: "0:21:30", note: "用时增加1分50秒", phase: "pre" },
  { id: 7, name: "一级加注完毕", time: "0:02:50", note: "", phase: "pre" },
  { id: 8, name: "二级加注完毕", time: "0:02:10", note: "推后1分10秒", phase: "pre" },
  { id: 9, name: "任务指挥宣布放行", time: "0:00:30", note: "", phase: "pre" },
  { id: 10, name: "导流槽启动", time: "0:00:17", note: "用时增加7秒", phase: "pre" },
  { id: 11, name: "一级发动机执行点火程序", time: "0:00:03", note: "", phase: "pre" },
  { id: 12, name: "起飞", time: "0:00:00", note: "用时减少2秒", phase: "liftoff" },
  { id: 13, name: "最大动压 (MAX-Q)", time: "0:00:45", note: "从起飞到MAX-Q，用时减少15秒", phase: "post" },
  { id: 14, name: "一级发动机关机（除中间三台）", time: "0:02:22", note: "从起飞到关机，用时减少13秒", phase: "post" },
  { id: 15, name: "一二级分离", time: "0:02:24", note: "从起飞到分离，用时减少13秒", phase: "post" },
  { id: 16, name: "一级返回点火开始", time: "0:02:30", note: "从分离到点火，用时减少4秒", phase: "post" },
  { id: 17, name: "一级返回点火结束", time: "0:03:30", note: "从点火到结束，用时增加11秒", phase: "post" },
  { id: 18, name: "抛热分离环", time: null, note: "官方取消，本试飞跳过该步骤", phase: "canceled" },
  { id: 19, name: "一级着陆点火开始", time: "0:06:34", note: "", phase: "post" },
  { id: 20, name: "一级着陆点火结束", time: "0:06:59", note: "从点火到结束，用时增加9秒", phase: "post" },
  { id: 21, name: "二级发动机关机", time: "0:08:11", note: "从分离到关机，用时减少32秒", phase: "post" },
  { id: 22, name: "载荷部署开始", time: "0:17:37", note: "", phase: "post" },
  { id: 23, name: "载荷部署结束", time: "0:27:15", note: "", phase: "post" },
  { id: 24, name: "二级单发动机点火测试", time: "0:38:37", note: "", phase: "post" },
  { id: 25, name: "二级再入大气层", time: "0:47:47", note: "", phase: "post" },
  { id: 26, name: "二级跨音速", time: "1:02:29", note: "", phase: "post" },
  { id: 27, name: "二级亚音速", time: "1:03:08", note: "", phase: "post" },
  { id: 28, name: "二级溅落点火开始", time: "1:05:06", note: "", phase: "post" },
  { id: 29, name: "二级翻转机动", time: "1:05:08", note: "", phase: "post" },
  { id: 30, name: "二级由3台发动机切2台发动机点火", time: "1:05:17", note: "", phase: "post" },
  { id: 31, name: "二级由2台发动机切1台发动机点火", time: "1:05:24", note: "增加测试步骤", phase: "post" },
  { id: 32, name: "二级溅落", time: "1:05:26", note: "从点火到结束，用时减少7秒", phase: "post" },
];

const CFG = window.STARSHIP_CONFIG || {};
const SU = () => window.SiteUtils;

function resolveFlight() {
  if (SU()) return SU().getFlightPack();
  return {
    flightId: CFG.mission?.flight ?? 12,
    liftoffAt: CFG.liftoffAt ? new Date(CFG.liftoffAt) : new Date(2026, 4, 22, 6, 30, 0),
    prepMinutes: CFG.prepMinutes ?? 50,
    missionEndSeconds: CFG.missionEndSeconds ?? 3600 + 5 * 60 + 26,
    mission: { referenceUrl: CFG.mission?.nxsfUrl, ...CFG.mission },
  };
}

const FLIGHT = resolveFlight();
/** 任务信息 · 当前 activeFlight */
const MISSION = {
  referenceUrl: FLIGHT.nxsfLaunchUrl || CFG.mission?.nxsfUrl,
  ...CFG.mission,
  ...FLIGHT.mission,
};

const LIFTOFF_AT = FLIGHT.liftoffAt;
const PREP_MINUTES = FLIGHT.prepMinutes;
const START_AT = new Date(LIFTOFF_AT.getTime() + -PREP_MINUTES * 60 * 1000);
const END_AT = new Date(LIFTOFF_AT.getTime() + FLIGHT.missionEndSeconds * 1000);

const MIN_SECONDS = -PREP_MINUTES * 60;
const MAX_SECONDS = FLIGHT.missionEndSeconds;
const TOTAL_SPAN = MAX_SECONDS - MIN_SECONDS;
const LIFTOFF_POSITION = ((0 - MIN_SECONDS) / TOTAL_SPAN) * 100;

/** @param {string} hms */
function parseHmsToSeconds(hms) {
  const parts = hms.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0];
}

function eventToSeconds(event) {
  if (event.phase === "canceled" || event.time === null) return null;
  const sec = parseHmsToSeconds(event.time);
  if (event.phase === "pre") return -sec;
  return sec;
}

function secondsToHms(totalSec, signed = true) {
  const abs = Math.abs(Math.floor(totalSec));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const pad = (n) => String(n).padStart(2, "0");
  const str = `${h}:${pad(m)}:${pad(s)}`;
  if (!signed) return str;
  if (totalSec < 0) return `T- ${str}`;
  if (totalSec > 0) return `T+ ${str}`;
  return "T+ 0:00:00";
}

function formatDisplayTime(seconds) {
  if (seconds < 0) return `T- ${secondsToHms(-seconds, false)}`;
  if (seconds > 0) return `T+ ${secondsToHms(seconds, false)}`;
  return "T+ 0:00:00";
}

function formatTLabel(event) {
  if (event.phase === "canceled") return "—";
  if (event.phase === "pre") return `T- ${event.time}`;
  if (event.seconds === 0) return "T+ 0:00:00";
  return `T+ ${event.time}`;
}

function simSecondsToDate(simSeconds) {
  return new Date(LIFTOFF_AT.getTime() + simSeconds * 1000);
}

function formatWallClock(simSeconds, { short = false, triple = false } = {}) {
  const d = simSecondsToDate(simSeconds);
  if (triple && SU()) {
    const t = SU().formatTripleTime(d);
    return `${t.labels.beijing} ${t.beijing}`;
  }
  const pad = (n) => String(n).padStart(2, "0");
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  if (short) return time;
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return `${date} ${time}`;
}

function eventWallClock(event) {
  if (event.phase === "canceled" || event.seconds === null) return "—";
  return formatWallClock(event.seconds);
}

function positionPercent(seconds) {
  return ((seconds - MIN_SECONDS) / TOTAL_SPAN) * 100;
}

const enrichedEvents = EVENTS.map((e) => ({
  ...e,
  seconds: eventToSeconds(e),
}));

let currentSeconds = MIN_SECONDS;
let lastTick = 0;
let rafId = null;
let running = true;
let pausedAtSeconds = null;

const els = {
  simTime: document.getElementById("sim-time"),
  wallTime: document.getElementById("wall-time"),
  waitPanel: document.getElementById("wait-panel"),
  simPanel: document.getElementById("sim-panel"),
  countdownToStart: document.getElementById("countdown-to-start"),
  nxTLabel: document.getElementById("nx-t-label"),
  cdHours: document.getElementById("cd-hours"),
  cdMins: document.getElementById("cd-mins"),
  cdSecs: document.getElementById("cd-secs"),
  nxCountdownTarget: document.getElementById("nx-countdown-target"),
  goPct: document.getElementById("go-pct"),
  missionMeta: document.getElementById("mission-meta"),
  liftoffLabel: document.getElementById("liftoff-label"),
  scaleStart: document.getElementById("scale-start"),
  scaleLiftoff: document.getElementById("scale-liftoff"),
  scaleEnd: document.getElementById("scale-end"),
  currentPhase: document.getElementById("current-phase"),
  progressPercent: document.getElementById("progress-percent"),
  flightStatus: document.getElementById("flight-status"),
  axisProgress: document.getElementById("axis-progress"),
  axisNodes: document.getElementById("axis-nodes"),
  tableBody: document.getElementById("event-table-body"),
  btnPause: document.getElementById("btn-pause"),
  btnReset: document.getElementById("btn-reset"),
};

function getRunMode(now = Date.now()) {
  if (SU()) return SU().getRunMode(now);
  if (now < START_AT.getTime()) return "waiting";
  if (now < END_AT.getTime()) return "live";
  return "complete";
}

function formatDuration(ms) {
  const { days, h, m, s } = formatCountdownParts(ms);
  const hms = `${h}:${m}:${s}`;
  if (days > 0) return `${days} 天 ${hms}`;
  return hms;
}

function formatCountdownParts(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const rem = total % 86400;
  const h = Math.floor(rem / 3600);
  const m = Math.floor((rem % 3600) / 60);
  const s = rem % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return { days, h: pad(h), m: pad(m), s: pad(s) };
}

function updateNxCountdown(ms, { prefix = "T-", targetText = "距起飞" } = {}) {
  if (!els.cdHours) return;
  const { days, h, m, s } = formatCountdownParts(ms);
  els.nxTLabel.textContent = prefix;
  els.cdHours.textContent = h;
  els.cdMins.textContent = m;
  els.cdSecs.textContent = s;
  els.nxCountdownTarget.textContent =
    days > 0 ? `${targetText} · 还有 ${days} 天` : targetText;
}

/** 将监测快照同步到页面（起飞时间、准许率、窗口等） */
window.applyMonitorSnapshot = function applyMonitorSnapshot(snapshot) {
  if (!snapshot) return;

  if (snapshot.goPercent != null) {
    MISSION.goPercent = snapshot.goPercent;
    if (els.goPct) els.goPct.textContent = `${snapshot.goPercent}%`;
  }
  if (snapshot.liftoffGmt) {
    MISSION.liftoffGmt = snapshot.liftoffGmt.length === 5 ? `${snapshot.liftoffGmt}:00` : snapshot.liftoffGmt;
    const lg = document.getElementById("liftoff-gmt");
    if (lg) lg.textContent = MISSION.liftoffGmt;
  }
  if (snapshot.liftoffDate) {
    MISSION.liftoffGmtDate = snapshot.liftoffDate;
    const dg = document.getElementById("liftoff-date-gmt");
    if (dg) dg.textContent = snapshot.liftoffDate;
  }
  if (snapshot.windowOpen) {
    MISSION.windowOpenGmt = snapshot.windowOpen;
    const wo = document.getElementById("window-open");
    if (wo) wo.textContent = snapshot.windowOpen;
  }
  if (snapshot.windowClose) {
    MISSION.windowCloseGmt = snapshot.windowClose;
    const wc = document.getElementById("window-close");
    if (wc) wc.textContent = snapshot.windowClose;
  }

  alert("已同步监测数据（起飞时刻需手动确认时区换算后刷新页面）");
};

function updateTimezoneBanner() {
  const el = document.getElementById("mission-tz-banner");
  if (!el || !SU()) return;
  el.textContent = `起飞 ${SU().formatTripleTimeLine(LIFTOFF_AT)}`;
  const badge = document.getElementById("active-flight-badge");
  if (badge) badge.textContent = `Flight ${FLIGHT.flightId}`;
}

function initMissionUI() {
  updateTimezoneBanner();
  if (els.goPct) els.goPct.textContent = `${MISSION.goPercent}%`;
  const wo = document.getElementById("window-open");
  const wc = document.getElementById("window-close");
  if (wo) wo.textContent = MISSION.windowOpenGmt;
  if (wc) wc.textContent = MISSION.windowCloseGmt;
  const lg = document.getElementById("liftoff-gmt");
  const dg = document.getElementById("liftoff-date-gmt");
  const ll = document.getElementById("liftoff-local");
  const dl = document.getElementById("liftoff-date-local");
  if (lg) lg.textContent = MISSION.liftoffGmt;
  if (dg) dg.textContent = MISSION.liftoffGmtDate;
  if (ll) ll.textContent = formatWallClock(0, { short: true }) + ":00";
  if (dl) {
    const d = simSecondsToDate(0);
    const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
    dl.textContent = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`;
  }
}

function formatNowClock() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function simSecondsFromWall(now = Date.now()) {
  const elapsed = (now - START_AT.getTime()) / 1000;
  return Math.min(MAX_SECONDS, MIN_SECONDS + elapsed);
}

function syncFromWallClock() {
  const mode = getRunMode();
  if (mode === "waiting") {
    currentSeconds = MIN_SECONDS;
  } else if (mode === "live") {
    currentSeconds = simSecondsFromWall();
  } else {
    currentSeconds = MAX_SECONDS;
  }
}

const ACTIVE_WINDOW = 0.4;

/** 事件名称展示类型：即将进行(蓝) / 已执行(绿) / 未执行(灰) / 执行取消(红，官方跳过) */
const CANCELED_SKIP_HINT = "官方取消，本试飞跳过该测试步骤";

const EVENT_NAME_TYPES = {
  executed: { label: "已执行", rowClass: "evt-executed", nameClass: "evt-name--executed" },
  upcoming: { label: "即将进行", rowClass: "evt-upcoming", nameClass: "evt-name--upcoming" },
  "not-executed": { label: "未执行", rowClass: "evt-not-executed", nameClass: "evt-name--not-executed" },
  canceled: {
    label: "执行取消",
    hint: CANCELED_SKIP_HINT,
    rowClass: "evt-canceled",
    nameClass: "evt-name--canceled",
  },
};

function getUpcomingEvent(now) {
  if (getRunMode() === "waiting") {
    return enrichedEvents.find((e) => e.seconds !== null && e.phase !== "canceled");
  }
  const active = getActiveEvent(now);
  if (active) return active;
  return enrichedEvents.find(
    (e) => e.seconds !== null && getEventStatus(e, now) === "pending"
  );
}

function getEventNameType(event, now) {
  if (event.phase === "canceled" || event.seconds === null) return "canceled";
  if (getEventStatus(event, now) === "completed") return "executed";
  const upcoming = getUpcomingEvent(now);
  if (upcoming && upcoming.id === event.id) return "upcoming";
  return "not-executed";
}

function formatEventNameCell(event, nameType) {
  const meta = EVENT_NAME_TYPES[nameType] || EVENT_NAME_TYPES["not-executed"];
  const titleAttr = meta.hint ? ` title="${meta.hint}"` : "";
  return `<span class="evt-type-badge"${titleAttr}>${meta.label}</span><span class="evt-name ${meta.nameClass}">${event.name}</span>`;
}

function syncEventNameDisplay(now) {
  enrichedEvents.forEach((event) => {
    const nameType = getEventNameType(event, now);
    const meta = EVENT_NAME_TYPES[nameType];
    const status = getEventStatus(event, now);
    const nodeEl = document.querySelector(`.event-node[data-event-id="${event.id}"]`);
    const rowEl = document.querySelector(`tr[data-event-id="${event.id}"]`);

    if (nodeEl) {
      nodeEl.className = `event-node ${status} ${meta.rowClass}`;
      nodeEl.dataset.nameType = nameType;
    }
    if (rowEl) {
      rowEl.className = `${meta.rowClass}`;
      rowEl.dataset.nameType = nameType;
      const nameCell = rowEl.querySelector(".event-name-cell");
      if (nameCell) nameCell.innerHTML = formatEventNameCell(event, nameType);
    }
  });
}

function getEventStatus(event, now) {
  if (event.phase === "canceled") return "canceled";
  if (event.seconds === null) return "canceled";
  if (getRunMode() === "waiting") return "pending";
  if (now > event.seconds && now < event.seconds + ACTIVE_WINDOW) return "active";
  if (now > event.seconds) return "completed";
  if (now === event.seconds) return "active";
  return "pending";
}

function getActiveEvent(now) {
  return enrichedEvents.find(
    (e) =>
      e.seconds !== null &&
      now >= e.seconds &&
      now < e.seconds + ACTIVE_WINDOW
  );
}

function getNextEvent(now) {
  return enrichedEvents.find((e) => e.seconds !== null && e.seconds > now);
}

/** 轴线上唯一展示的事件：进行中优先，否则第一个未完成项 */
function getDisplayEvent(now) {
  if (getRunMode() === "waiting") {
    const first = enrichedEvents.find((e) => e.seconds !== null && e.phase !== "canceled");
    if (first) return { event: first, mode: "upcoming" };
    return null;
  }

  const active = getActiveEvent(now);
  if (active) return { event: active, mode: "active" };
  const pending = enrichedEvents.find(
    (e) => e.seconds !== null && getEventStatus(e, now) === "pending"
  );
  if (pending) return { event: pending, mode: "upcoming" };
  return null;
}

function getTimelineReveal() {
  return typeof window.getTimelineScrollProgress === "function"
    ? window.getTimelineScrollProgress()
    : 1;
}

function updateTimelineCallout(now) {
  const callout = document.getElementById("timeline-callout");
  if (!callout) return;

  if (getTimelineReveal() < 0.75) {
    callout.hidden = true;
    return;
  }

  const display = getDisplayEvent(now);

  enrichedEvents.forEach((event) => {
    const nodeEl = document.querySelector(`.event-node[data-event-id="${event.id}"]`);
    if (!nodeEl) return;
    nodeEl.classList.remove("node-highlight");
    if (display?.event.id === event.id) nodeEl.classList.add("node-highlight");
  });

  if (!display) {
    callout.hidden = true;
    return;
  }

  const { event } = display;
  const nameType = getEventNameType(event, now);
  const meta = EVENT_NAME_TYPES[nameType];
  const pct = Math.min(92, Math.max(8, positionPercent(event.seconds)));

  callout.hidden = false;
  callout.className = `timeline-callout timeline-callout-${nameType}`;
  callout.style.left = `${pct}%`;
  const noteHtml =
    nameType === "canceled"
      ? `<div class="callout-note callout-note--canceled">${CANCELED_SKIP_HINT}</div>`
      : event.note
        ? `<div class="callout-note">${event.note}</div>`
        : "";

  callout.innerHTML = `
    <span class="callout-badge" ${meta.hint ? `title="${meta.hint}"` : ""}>${meta.label}</span>
    <div class="callout-title ${meta.nameClass}">${event.name}</div>
    <div class="callout-time">${formatTLabel(event)} · ${eventWallClock(event)}</div>
    ${noteHtml}`;
}

function getCurrentPhaseName(now) {
  const active = enrichedEvents.find(
    (e) => e.seconds !== null && now >= e.seconds && now < e.seconds + 0.5
  );
  if (active) return active.name;

  const next = enrichedEvents.find((e) => e.seconds !== null && e.seconds > now);
  if (next) {
    if (now < 0) return "发射前准备";
    if (now === 0) return "起飞";
    return "等待: " + next.name;
  }
  return "任务完成";
}

function updateWaitingUI(now) {
  document.body.classList.add("mode-waiting");
  els.waitPanel?.classList.remove("hidden");

  const toStart = START_AT.getTime() - now;
  const toLiftoff = LIFTOFF_AT.getTime() - now;

  if (els.countdownToStart) els.countdownToStart.textContent = formatDuration(toStart);
  updateNxCountdown(toLiftoff, { prefix: "T-", targetText: "距起飞 (Liftoff)" });
  els.simTime.textContent = "待启动";
  els.wallTime.textContent = formatNowClock();
  els.progressPercent.textContent = "0%";
  els.currentPhase.textContent = "流程尚未开始";
  els.flightStatus.textContent = "Up Next";
  els.flightStatus.classList.remove("post-liftoff");
  els.flightStatus.classList.add("waiting-mode");
  updateAxisProgressWidth(0);
  els.btnPause.disabled = true;

  syncEventNameDisplay(MIN_SECONDS);
  enrichedEvents.forEach((event) => {
    const nodeEl = document.querySelector(`.event-node[data-event-id="${event.id}"]`);
    if (nodeEl) nodeEl.classList.remove("node-highlight");
  });
  updateTimelineCallout(MIN_SECONDS);
  if (window.updateLaunchFlowBar) window.updateLaunchFlowBar(MIN_SECONDS);
}

function updateUI() {
  const progress = ((currentSeconds - MIN_SECONDS) / TOTAL_SPAN) * 100;
  const clamped = Math.min(100, Math.max(0, progress));

  document.body.classList.remove("mode-waiting");
  els.waitPanel.classList.add("hidden");
  els.btnPause.disabled = false;
  els.flightStatus.classList.remove("waiting-mode");

  els.simTime.textContent = formatDisplayTime(currentSeconds);
  if (els.wallTime) {
    els.wallTime.textContent = formatWallClock(currentSeconds, { triple: true });
  }
  els.progressPercent.textContent = `${clamped.toFixed(1)}%`;
  els.currentPhase.textContent = getCurrentPhaseName(currentSeconds);
  updateAxisProgressWidth(clamped);

  const now = Date.now();
  if (currentSeconds < 0) {
    updateNxCountdown(LIFTOFF_AT.getTime() - now, {
      prefix: "T-",
      targetText: "距起飞",
    });
  } else if (currentSeconds >= MAX_SECONDS) {
    updateNxCountdown(0, { prefix: "T+", targetText: "任务已完成" });
    els.cdHours.textContent = "00";
    els.cdMins.textContent = "00";
    els.cdSecs.textContent = "00";
  } else {
    const elapsed = currentSeconds * 1000;
    updateNxCountdown(elapsed, {
      prefix: "T+",
      targetText: "起飞后经过时间",
    });
  }

  if (currentSeconds < 0) {
    els.flightStatus.textContent = "起飞前倒计时";
    els.flightStatus.classList.remove("post-liftoff");
  } else if (currentSeconds >= MAX_SECONDS) {
    els.flightStatus.textContent = "任务已结束";
    els.flightStatus.classList.add("post-liftoff");
  } else {
    els.flightStatus.textContent = "起飞后计时";
    els.flightStatus.classList.add("post-liftoff");
  }

  syncEventNameDisplay(currentSeconds);

  updateTimelineCallout(currentSeconds);
  if (window.updateLaunchFlowBar) window.updateLaunchFlowBar(currentSeconds);
}

function updateAxisProgressWidth(missionPercent) {
  if (!els.axisProgress) return;
  const reveal = getTimelineReveal();
  if (reveal < 0.98) {
    els.axisProgress.style.width = "0%";
    els.axisProgress.style.opacity = "0";
    return;
  }
  els.axisProgress.style.opacity = "1";
  els.axisProgress.style.width = `${missionPercent}%`;
}

function renderTimeline() {
  els.axisNodes.innerHTML = "";
  const liftoffEl = document.querySelector(".liftoff-marker");
  if (liftoffEl) liftoffEl.style.left = `${LIFTOFF_POSITION}%`;

  let scrollIndex = 0;
  enrichedEvents.forEach((event) => {
    const node = document.createElement("div");
    node.className = "event-node pending";
    node.dataset.eventId = String(event.id);
    node.dataset.scrollIndex = String(scrollIndex++);

    if (event.phase === "canceled") {
      const cancelPos = positionPercent(285);
      node.style.left = `${cancelPos}%`;
      node.innerHTML = `<div class="node-dot"></div>`;
      node.classList.add("canceled");
    } else {
      const pct = positionPercent(event.seconds);
      node.style.left = `${pct}%`;
      node.innerHTML = `<div class="node-dot"></div>`;
    }
    els.axisNodes.appendChild(node);
  });

  updateTimelineCallout(MIN_SECONDS);
  if (window.refreshTimelineScroll) window.refreshTimelineScroll();
  bindTimelineNodeEvents();
}

function highlightEventById(eventId) {
  const event = enrichedEvents.find((e) => e.id === Number(eventId));
  if (!event) return;
  const sim = event.seconds ?? MIN_SECONDS;
  updateTimelineCallout(sim);
  enrichedEvents.forEach((ev) => {
    const nodeEl = document.querySelector(`.event-node[data-event-id="${ev.id}"]`);
    if (!nodeEl) return;
    nodeEl.classList.toggle("node-highlight", ev.id === event.id);
  });
  const row = document.querySelector(`tr[data-event-id="${eventId}"]`);
  row?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function bindTimelineNodeEvents() {
  document.querySelectorAll(".event-node").forEach((node) => {
    const id = Number(node.dataset.eventId);
    const event = enrichedEvents.find((e) => e.id === id);
    if (!event) return;
    const tip = [event.name, formatTLabel(event), event.note].filter(Boolean).join(" · ");
    node.title = tip;
    node.style.pointerEvents = "auto";
    node.style.cursor = "pointer";
    node.addEventListener("mouseenter", () => highlightEventById(id));
    node.addEventListener("click", () => {
      location.hash = `missions&e=${id}`;
      highlightEventById(id);
      node.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    });
  });
}

window.scrollToEvent = function (eventId) {
  document.querySelector('[data-page="missions"]')?.click();
  requestAnimationFrame(() => highlightEventById(eventId));
};

window.applyMissionHash = function () {
  if (!SU()) return;
  const { params } = SU.parseLocationHash();
  if (params.e) window.scrollToEvent(Number(params.e));
};

function renderTable() {
  els.tableBody.innerHTML = "";
  enrichedEvents.forEach((event) => {
    const tr = document.createElement("tr");
    tr.dataset.eventId = String(event.id);
    tr.className = "pending";

    let timeCell = "—";
    if (event.phase === "canceled") {
      timeCell = "— · 官方跳过";
    } else {
      timeCell = formatTLabel(event);
    }

    const nameType = getEventNameType(event, MIN_SECONDS);
    tr.innerHTML = `
      <td>${event.id}</td>
      <td class="event-name-cell">${formatEventNameCell(event, nameType)}</td>
      <td>${timeCell}</td>
      <td>${eventWallClock(event)}</td>
      <td>${event.note || "—"}</td>
    `;
    els.tableBody.appendChild(tr);
  });
}

function tick() {
  const now = Date.now();
  const mode = getRunMode(now);

  if (mode === "waiting") {
    currentSeconds = MIN_SECONDS;
    pausedAtSeconds = null;
    running = true;
    els.btnPause.textContent = "暂停";
    els.btnPause.disabled = true;
    updateWaitingUI(now);
    rafId = requestAnimationFrame(tick);
    return;
  }

  if (mode === "live") {
    if (running) {
      currentSeconds = simSecondsFromWall(now);
      pausedAtSeconds = null;
    } else if (pausedAtSeconds !== null) {
      currentSeconds = pausedAtSeconds;
    }
    updateUI();
    rafId = requestAnimationFrame(tick);
    return;
  }

  currentSeconds = MAX_SECONDS;
  running = false;
  els.btnPause.textContent = "继续";
  els.btnPause.disabled = true;
  updateUI();
  rafId = requestAnimationFrame(tick);
}

function reset() {
  pausedAtSeconds = null;
  running = true;
  els.btnPause.disabled = false;
  els.btnPause.textContent = "暂停";
  syncFromWallClock();
  const mode = getRunMode();
  if (mode === "waiting") updateWaitingUI(Date.now());
  else updateUI();
}

function initScaleLabels() {
  const startClock = formatWallClock(MIN_SECONDS, { short: true });
  const liftoffClock = formatWallClock(0, { short: true });
  const endClock = formatWallClock(MAX_SECONDS, { short: true });

  els.scaleStart.textContent = `T- 0:50:00 · ${startClock}`;
  els.scaleLiftoff.textContent = `T+ 0:00:00 · ${liftoffClock}`;
  els.scaleEnd.textContent = `T+ 1:05:26 · ${endClock}`;
  els.liftoffLabel.textContent = `起飞 ${liftoffClock}`;

  const startFull = formatWallClock(MIN_SECONDS);
  if (els.missionMeta) {
    els.missionMeta.textContent =
      `流程自 T-50:00（${startFull}）启动 · 参考 ${MISSION.title}`;
  }
}

const TABLE_SIZE_KEY = "starship-table-height";
const TABLE_COLS_KEY = "starship-col-widths";
const DEFAULT_TABLE_HEIGHT = 280;
const DEFAULT_COL_WIDTHS = [56, 220, 120, 160, 280];
const MIN_COL_WIDTH = 48;
const MIN_TABLE_HEIGHT = 100;

function initTableResize() {
  const wrapper = document.getElementById("table-wrapper");
  const resizeBar = document.getElementById("table-resize-bar");
  const resetBtn = document.getElementById("btn-reset-table-size");
  const table = document.getElementById("event-table");
  if (!wrapper || !resizeBar || !table) return;

  const cols = DEFAULT_COL_WIDTHS.map((_, i) =>
    document.getElementById(`col-${i}`)
  );

  function maxTableHeight() {
    return Math.min(window.innerHeight * 0.75, 720);
  }

  function setTableHeight(px) {
    const h = Math.min(maxTableHeight(), Math.max(MIN_TABLE_HEIGHT, px));
    wrapper.style.setProperty("--table-height", `${h}px`);
    wrapper.style.height = `${h}px`;
    localStorage.setItem(TABLE_SIZE_KEY, String(Math.round(h)));
  }

  function applyColWidths(widths) {
    widths.forEach((w, i) => {
      if (!cols[i] || w == null) return;
      cols[i].style.width = `${w}px`;
    });
    localStorage.setItem(TABLE_COLS_KEY, JSON.stringify(widths));
  }

  function loadSavedSizes() {
    const savedH = localStorage.getItem(TABLE_SIZE_KEY);
    if (savedH) setTableHeight(Number(savedH));

    const savedCols = localStorage.getItem(TABLE_COLS_KEY);
    if (savedCols) {
      try {
        const widths = JSON.parse(savedCols);
        if (Array.isArray(widths) && widths.length === DEFAULT_COL_WIDTHS.length) {
          applyColWidths(widths);
          return;
        }
      } catch (_) {
        /* ignore */
      }
    }
    applyColWidths(DEFAULT_COL_WIDTHS);
  }

  function resetSizes() {
    localStorage.removeItem(TABLE_SIZE_KEY);
    localStorage.removeItem(TABLE_COLS_KEY);
    setTableHeight(DEFAULT_TABLE_HEIGHT);
    applyColWidths(DEFAULT_COL_WIDTHS);
  }

  loadSavedSizes();

  let dragMode = null;
  let startX = 0;
  let startY = 0;
  let startVal = 0;

  resizeBar.addEventListener("mousedown", (e) => {
    e.preventDefault();
    dragMode = "height";
    startY = e.clientY;
    startVal = wrapper.getBoundingClientRect().height;
    resizeBar.classList.add("dragging");
    document.body.classList.add("is-resizing-table");
  });

  table.querySelectorAll(".col-resizer").forEach((handle) => {
    handle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const colIndex = Number(handle.dataset.col);
      const colEl = cols[colIndex];
      if (!colEl) return;
      dragMode = "col";
      startX = e.clientX;
      startVal = colEl.getBoundingClientRect().width;
      handle.classList.add("dragging");
      document.body.classList.add("is-resizing-col");
      handle.dataset.colIndex = String(colIndex);
    });
  });

  document.addEventListener("mousemove", (e) => {
    if (dragMode === "height") {
      const delta = startY - e.clientY;
      setTableHeight(startVal + delta);
    } else if (dragMode === "col") {
      const handle = table.querySelector(".col-resizer.dragging");
      if (!handle) return;
      const colIndex = Number(handle.dataset.col);
      const colEl = cols[colIndex];
      const newW = Math.max(MIN_COL_WIDTH, startVal + (e.clientX - startX));
      colEl.style.width = `${newW}px`;
      const widths = cols.map((c) =>
        c ? Math.round(c.getBoundingClientRect().width) : null
      );
      localStorage.setItem(TABLE_COLS_KEY, JSON.stringify(widths));
    }
  });

  document.addEventListener("mouseup", () => {
    if (dragMode === "height") resizeBar.classList.remove("dragging");
    if (dragMode === "col") {
      table.querySelectorAll(".col-resizer.dragging").forEach((h) => {
        h.classList.remove("dragging");
      });
    }
    dragMode = null;
    document.body.classList.remove("is-resizing-table", "is-resizing-col");
  });

  resetBtn?.addEventListener("click", resetSizes);

  if (typeof ResizeObserver !== "undefined") {
    let resizeDebounce = 0;
    const ro = new ResizeObserver((entries) => {
      if (dragMode) return;
      const h = entries[0]?.contentRect.height;
      if (h && h >= MIN_TABLE_HEIGHT) {
        clearTimeout(resizeDebounce);
        resizeDebounce = setTimeout(() => {
          localStorage.setItem(TABLE_SIZE_KEY, String(Math.round(h)));
        }, 150);
      }
    });
    ro.observe(wrapper);
  }

  window.addEventListener("resize", () => {
    const h = wrapper.getBoundingClientRect().height;
    if (h > maxTableHeight()) setTableHeight(maxTableHeight());
  });
}

function init() {
  initMissionUI();
  initScaleLabels();
  initTableResize();
  renderTimeline();
  renderTable();
  rafId = requestAnimationFrame(tick);

  els.btnPause.addEventListener("click", () => {
    if (getRunMode() !== "live") return;
    running = !running;
    if (!running) pausedAtSeconds = currentSeconds;
    else pausedAtSeconds = null;
    els.btnPause.textContent = running ? "暂停" : "继续";
  });

  els.btnReset.addEventListener("click", () => {
    reset();
  });

  syncFromWallClock();
  const mode = getRunMode();
  if (mode === "waiting") updateWaitingUI(Date.now());
  if (window.applyMissionHash) window.applyMissionHash();
}

init();
