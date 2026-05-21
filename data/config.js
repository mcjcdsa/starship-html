/** 全站共享配置 */
window.STARSHIP_CONFIG = {
  /** 当前展示任务，切换下一发时只改此数字及 flights 条目 */
  activeFlight: 12,

  timezones: {
    beijingLabel: "北京时间",
    starbaseLabel: "Starbase (CDT)",
    gmtLabel: "GMT / UTC",
  },

  liftoffAt: new Date(2026, 4, 22, 6, 30, 0),
  prepMinutes: 50,
  missionEndSeconds: 3600 + 5 * 60 + 26,

  flights: {
    12: {
      liftoffAt: new Date(2026, 4, 22, 6, 30, 0),
      prepMinutes: 50,
      missionEndSeconds: 3600 + 5 * 60 + 26,
      nxsfLaunchId: 8002,
      mission: {
        flight: 12,
        title: "Starship Flight 12",
        subtitle: "Starship-Super Heavy v3 · 星舰第 12 次试飞",
        goPercent: 55,
        windowOpenGmt: "22:30",
        windowCloseGmt: "00:00",
        liftoffGmt: "22:30:00",
        liftoffGmtDate: "Thursday May 21, 2026",
        pad: "Pad 2",
        site: "Starbase, Texas",
        ship: "Ship 39",
        booster: "Booster 19",
        nxsfUrl: "https://www.nextspaceflight.com/launches/details/8002/",
        watchUrl: "https://www.youtube.com/watch?v=TBu6JFjt0tk",
      },
    },
  },

  watchLinks: [
    { tag: "官方", site: "spacex.com", url: "https://www.spacex.com/", when: "always" },
    { tag: "NSF", site: "NASASpaceflight.com", url: "https://www.nasaspaceflight.com/", when: "always" },
    {
      tag: "直播",
      site: "YouTube · NSF",
      url: "https://www.youtube.com/watch?v=TBu6JFjt0tk",
      when: "live",
    },
    {
      tag: "回放",
      site: "YouTube",
      url: "https://www.youtube.com/watch?v=TBu6JFjt0tk",
      when: "complete",
    },
    {
      tag: "预告",
      site: "NXSF 详情",
      url: "https://www.nextspaceflight.com/launches/details/8002/",
      when: "waiting",
    },
  ],

  closures: {
    beachAccess: {
      title: "BEACH Access Status",
      subtitle: "Boca Chica Beach closures.",
      source: "https://www.starbase.texas.gov/beach-road-access",
      sourceLabel: "starbase.texas.gov · Beach Road Access",
      windows: [
        { label: "Primary", range: "May. 21 6:00 AM to May. 21 11:00 PM" },
        { label: "Primary", range: "May. 22 10:00 AM to May. 22 9:00 PM" },
      ],
    },
    roadUpdates: {
      title: "Road Updates",
      message: "No road delays.",
      status: "clear",
    },
  },

  launchSite: {
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
  },

  mission: {
    flight: 12,
    title: "Starship Flight 12",
    subtitle: "Starship-Super Heavy v3 · 星舰第 12 次试飞",
    goPercent: 55,
    windowOpenGmt: "22:30",
    windowCloseGmt: "00:00",
    liftoffGmt: "22:30:00",
    liftoffGmtDate: "Thursday May 21, 2026",
    pad: "Pad 2",
    site: "Starbase, Texas",
    ship: "Ship 39",
    booster: "Booster 19",
    nxsfUrl: "https://www.nextspaceflight.com/launches/details/8002/",
    watchUrl: "https://www.youtube.com/watch?v=TBu6JFjt0tk",
  },

  launchFlow: [
    { id: "range", name: "靶场准备", tMin: -3000, phase: "pre" },
    { id: "load", name: "推进剂加注", tMin: -3000, tMax: -170, phase: "pre" },
    { id: "chill", name: "引擎预冷", tMin: -1290, tMax: -170, phase: "pre" },
    { id: "liftoff", name: "起飞", tMin: 0, phase: "liftoff" },
    { id: "maxq", name: "最大动压", tMin: 45, phase: "post" },
    { id: "sep", name: "级间分离", tMin: 144, phase: "post" },
    { id: "booster", name: "助推回收", tMin: 150, tMax: 420, phase: "post" },
    { id: "ship", name: "星舰再入", tMin: 2867, tMax: 3788, phase: "post" },
    { id: "splash", name: "溅落", tMin: 3926, phase: "post" },
  ],
};
