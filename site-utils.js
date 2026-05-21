/**
 * 全站配置解析、时区、观看链接、路由参数
 */
(function () {
  const CFG = () => window.STARSHIP_CONFIG || {};

  function getActiveFlightId() {
    const c = CFG();
    return c.activeFlight ?? c.mission?.flight ?? 12;
  }

  function getFlightPack(flightId = getActiveFlightId()) {
    const c = CFG();
    const pack = c.flights?.[flightId] || {};
    const liftoffRaw = pack.liftoffAt ?? c.liftoffAt;
    const liftoffAt = liftoffRaw instanceof Date ? liftoffRaw : new Date(liftoffRaw);
    const prepMinutes = pack.prepMinutes ?? c.prepMinutes ?? 50;
    const missionEndSeconds =
      pack.missionEndSeconds ?? c.missionEndSeconds ?? 3600 + 5 * 60 + 26;
    return {
      flightId,
      liftoffAt,
      prepMinutes,
      missionEndSeconds,
      mission: {
        flight: flightId,
        title: `Starship Flight ${flightId}`,
        ...c.mission,
        ...pack.mission,
        title: pack.mission?.title || c.mission?.title || `Starship Flight ${flightId}`,
      },
      nxsfLaunchUrl:
        pack.nxsfLaunchUrl ||
        (pack.nxsfLaunchId
          ? `https://www.nextspaceflight.com/launches/details/${pack.nxsfLaunchId}/`
          : c.mission?.nxsfUrl),
    };
  }

  function getRunMode(now = Date.now()) {
    const { liftoffAt, prepMinutes, missionEndSeconds } = getFlightPack();
    const start = liftoffAt.getTime() - prepMinutes * 60 * 1000;
    const end = liftoffAt.getTime() + missionEndSeconds * 1000;
    if (now < start) return "waiting";
    if (now < end) return "live";
    return "complete";
  }

  function getTimezoneLabels() {
    const tz = CFG().timezones || {};
    return {
      beijing: tz.beijingLabel || "北京时间",
      starbase: tz.starbaseLabel || "Starbase (CDT)",
      gmt: tz.gmtLabel || "GMT / UTC",
    };
  }

  /** 将 Date 格式化为 北京 + Starbase(CDT) + GMT 对照 */
  function formatTripleTime(date) {
    const d = date instanceof Date ? date : new Date(date);
    const labels = getTimezoneLabels();
    const beijing = d.toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
      hour12: false,
    });
    const starbase = d.toLocaleString("en-US", {
      timeZone: "America/Chicago",
      hour12: false,
    });
    const gmt = d.toLocaleString("en-GB", {
      timeZone: "UTC",
      hour12: false,
    });
    return { beijing, starbase, gmt, labels };
  }

  function formatTripleTimeLine(date) {
    const t = formatTripleTime(date);
    return `${t.labels.beijing} ${t.beijing} · ${t.labels.starbase} ${t.starbase} · ${t.labels.gmt} ${t.gmt}`;
  }

  function getWatchLinksForMode(mode) {
    const links = CFG().watchLinks || [];
    return links.filter((l) => {
      const when = l.when || "always";
      if (when === "always") return true;
      return when === mode;
    });
  }

  function renderWatchLinksHtml(mode) {
    const links = getWatchLinksForMode(mode);
    if (!links.length) return "";
    const modeHint =
      mode === "waiting"
        ? "发射前"
        : mode === "live"
          ? "进行中"
          : mode === "complete"
            ? "已结束"
            : "";
    return `
      <span class="watch-links-label">观看链接${modeHint ? ` · ${modeHint}` : ""}</span>
      <div class="watch-links-row">
        ${links
          .map(
            (l) => `
          <a class="watch-link watch-link--${l.when || "always"}" href="${l.url}" target="_blank" rel="noopener noreferrer">
            <span class="watch-link-tag">${l.tag}</span>
            <span class="watch-link-site">${l.site}</span>
          </a>`
          )
          .join("")}
      </div>`;
  }

  function parseLocationHash() {
    const raw = (location.hash || "#home").replace(/^#/, "");
    const pagePart = raw.split("&")[0] || "home";
    const pairs = raw.includes("&") ? raw.split("&").slice(1) : [];
    const params = {};
    pairs.forEach((p) => {
      const eq = p.indexOf("=");
      if (eq > 0) params[p.slice(0, eq)] = decodeURIComponent(p.slice(eq + 1));
    });
    const pages = ["home", "missions", "vehicles", "closures"];
    const page = pages.includes(pagePart) ? pagePart : "home";
    return { page, params };
  }

  window.SiteUtils = {
    getActiveFlightId,
    getFlightPack,
    getRunMode,
    getTimezoneLabels,
    formatTripleTime,
    formatTripleTimeLine,
    getWatchLinksForMode,
    renderWatchLinksHtml,
    parseLocationHash,
  };
})();
