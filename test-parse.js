const fs = require("fs");
const html = fs.readFileSync("_probe.html", "utf8");

function parseTimeNearLabel(html, label) {
  const idx = html.indexOf(label);
  if (idx < 0) return null;
  const m = html.slice(idx, idx + 280).match(/>(\d{2}:\d{2})</);
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
  const tIdx = html.indexOf(">T-<");
  const digits =
    tIdx >= 0
      ? [...html.slice(tIdx, tIdx + 4000).matchAll(
          /<p class="z-1 relative text-center text-label-primary">(\d)<\/p>/g
        )].map((m) => m[1])
      : [];
  const liftoffGmt = liftoffM ? `${liftoffM[1]}:${liftoffM[2]}` : null;
  return {
    goPercent: goM ? Number(goM[1]) : null,
    liftoffGmt,
    liftoffDate: dateM ? dateM[0] : null,
    windowOpen: parseTimeNearLabel(html, "Window Open") || liftoffGmt?.slice(0, 5),
    windowClose: parseTimeNearLabel(html, "Window Close"),
    countdownT:
      digits.length >= 6 ? `T- ${digits[0]}${digits[1]}:${digits[2]}${digits[3]}:${digits[4]}${digits[5]}` : null,
  };
}

console.log(parsePage(html));
