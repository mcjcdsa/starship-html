/**
 * 发射场 · Starbase 地图（MapLibre + NXSF 风格叠层）
 */
(function () {
  const CFG = window.STARSHIP_CONFIG?.launchSite || {};
  const defaults = {
    lat: 25.9971,
    lng: -97.1554,
    zoom: 14,
    bearing: 0,
    padName: "发射台 2",
    padNameEn: "Pad 2",
    locationZh: "美国德克萨斯州星基",
    locationEn: "Starbase, Texas, USA",
    nxsfPadUrl: "https://www.nextspaceflight.com/locations/?pad=244",
    trajectoryLabel: "总体轨迹",
    launchAzimuth: 90,
    windFrom: "下水",
    windTo: "东部",
  };
  const site = { ...defaults, ...CFG };

  let map = null;

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setHref(id, href) {
    const el = document.getElementById(id);
    if (el) el.href = href;
  }

  function bindLabels() {
    setText("launch-site-trajectory-label", site.trajectoryLabel);
    setText("launch-site-pad-name", site.padName);
    setText("launch-site-pad-name-m", site.padNameEn);
    setText("launch-site-pad-loc", site.locationZh);
    setText("launch-site-pad-loc-m", site.locationEn);
    setText("launch-site-wind-from", site.windFrom);
    setText("launch-site-wind-to", site.windTo);
    setHref("launch-site-pad-link", site.nxsfPadUrl);
    setHref("launch-site-pad-link-m", site.nxsfPadUrl);

    const wedge = document.getElementById("launch-site-wedge");
    if (wedge) wedge.style.setProperty("--launch-azimuth", `${site.launchAzimuth}deg`);

    const needle = document.getElementById("launch-site-compass-needle");
    if (needle) needle.style.transform = `rotate(${site.launchAzimuth + 45}deg)`;
  }

  /** Esri World Imagery 卫星瓦片（与 NXSF 类页面同源之一） */
  function getSatelliteStyle() {
    return {
      version: 8,
      sources: {
        satellite: {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          maxzoom: 19,
          attribution:
            "© Esri, Maxar, Earthstar Geographics, NASA | MapLibre",
        },
        labels: {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          maxzoom: 19,
        },
      },
      layers: [
        { id: "satellite", type: "raster", source: "satellite" },
        {
          id: "labels",
          type: "raster",
          source: "labels",
          paint: { "raster-opacity": 0.55 },
        },
      ],
    };
  }

  function initMap() {
    const container = document.getElementById("launch-site-map");
    if (!container || typeof maplibregl === "undefined") {
      container?.classList.add("launch-site-map--fallback");
      return;
    }

    map = new maplibregl.Map({
      container,
      style: getSatelliteStyle(),
      center: [site.lng, site.lat],
      zoom: site.zoom,
      bearing: site.bearing,
      pitch: 0,
      interactive: false,
      attributionControl: { compact: true },
      fadeDuration: 0,
    });

    map.on("load", () => {
      map.resize();
    });

    window.addEventListener(
      "resize",
      () => {
        if (map) map.resize();
      },
      { passive: true }
    );
  }

  function init() {
    bindLabels();
    initMap();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.refreshLaunchSiteMap = () => {
    if (map) map.resize();
  };
})();
