/**
 * 从 data/vehicles-source-3.txt（或项目根目录 3）解析 NXSF 飞行器列表
 * 用法: node scripts/parse-vehicles-3.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const sources = [
  path.join(root, "3"),
  path.join(root, "data", "vehicles-source-3.txt"),
];

const raw = sources.map((p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "")).find((s) => s.trim().length) || "";
if (!raw.trim()) {
  console.error("No source: save 3 or use data/vehicles-source-3.txt");
  process.exit(1);
}

const lines = raw.split(/\r?\n/).map((l) => l.trim());
const statusMap = {
  活跃: "Active",
  被毁: "Destroyed",
  耗尽: "Expended",
  退役: "Retired",
  Active: "Active",
  Destroyed: "Destroyed",
  Expended: "Expended",
  Retired: "Retired",
};
const cats = new Set(["测试车辆", "全栈", "Structural Test Article", "Test Vehicle"]);

function isStatus(l) {
  return !!statusMap[l];
}

function inferType(id, title, cat, note) {
  if (cat === "全栈") return "Full Stack";
  const blob = `${title} ${id} ${note}`.toLowerCase();
  if (/booster|助推|^bn|^b2\.1/i.test(blob) && !/ship\s*\d|船\d|舰船/.test(id)) return "Booster";
  return "Ship";
}

function inferCategory(cat) {
  if (cat === "全栈") return "Full Stack";
  if (cat === "测试车辆" || cat === "Test Vehicle") return "Test Vehicle";
  return cat;
}

const statusZh = {
  Active: "活跃",
  Destroyed: "被毁",
  Expended: "耗尽",
  Retired: "退役",
};

const hardware = [];
let pendingTitle = "";

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line) {
    pendingTitle = "";
    continue;
  }
  if (isStatus(line)) {
    const status = statusMap[line];
    const id = lines[i + 1];
    const cat = lines[i + 2];
    const note = lines[i + 3];
    if (!id || !cats.has(cat)) continue;
    hardware.push({
      id,
      title: pendingTitle || id,
      type: inferType(id, pendingTitle, cat, note),
      category: inferCategory(cat),
      status,
      statusZh: statusZh[status],
      note,
    });
    pendingTitle = "";
    i += 3;
    continue;
  }
  if (i + 1 < lines.length && isStatus(lines[i + 1])) {
    pendingTitle = line;
  }
}

const out = {
  source: "NXSF Starship hardware (file 3)",
  updated: new Date().toISOString().slice(0, 10),
  count: hardware.length,
  hardware,
};

const jsonPath = path.join(root, "data", "nxsf-vehicles.json");
const jsPath = path.join(root, "data", "nxsf-vehicles.js");
fs.writeFileSync(jsonPath, JSON.stringify(out, null, 2));
fs.writeFileSync(
  jsPath,
  `/** Auto-generated — 支持 file:// 直接打开 */\nwindow.NXSF_VEHICLES_CATALOG=${JSON.stringify(out)};\n`
);
console.log(`Wrote ${hardware.length} vehicles to data/nxsf-vehicles.json + .js`);
