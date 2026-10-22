const path = require('path');
const fs = require('fs');
const ROOT = process.cwd();
const { PNG } = require(path.join(ROOT, 'node_modules', 'pngjs'));
function readPng(p) { return PNG.sync.read(fs.readFileSync(p)); }
function colorAt(png, x, y) {
  const i = (y * png.width + x) * 4;
  return [png.data[i], png.data[i+1], png.data[i+2], png.data[i+3]];
}
const ref = readPng(path.join(ROOT, 'scratchpad/astromatrix-logo-reference.png.png'));
const W = ref.width, H = ref.height;
const BG = [229, 245, 254];
function distFromBg([r,g,b]) { return Math.sqrt((r-BG[0])**2 + (g-BG[1])**2 + (b-BG[2])**2); }

function scanRow(y) {
  const runs = [];
  let inRun = false, runStart = 0, best = null, bestDist = 0;
  for (let x = 0; x < W; x++) {
    const c = colorAt(ref, x, y);
    const d = distFromBg(c);
    if (d > 12) {
      if (!inRun) { inRun = true; runStart = x; bestDist = 0; }
      if (d > bestDist) { bestDist = d; best = c; }
    } else {
      if (inRun) { runs.push({ cx: (runStart + x - 1) / 2, start: runStart, end: x - 1, width: x - runStart, color: best }); inRun = false; }
    }
  }
  if (inRun) runs.push({ cx: (runStart + W - 1) / 2, start: runStart, end: W - 1, width: W - runStart, color: best });
  return runs;
}

// Scan many rows well clear of the A mark (above it and below it,
// judging from the visual the A spans roughly y=350..900 of 1254) and
// only keep "thin" runs (width <= 15px) - excludes the thick A-mark body
// and its shadow. Print each row's thin-run x-centers so we can see
// which x-values recur at a FIXED position (= grid line) vs move
// smoothly with y (= circle arc).
const rows = [150, 180, 210, 240, 270, 300, 950, 1000, 1020, 1040, 1060, 1080];
for (const y of rows) {
  const thin = scanRow(y).filter(r => r.width <= 15);
  console.log('y=' + y, thin.map(r => `x=${r.cx.toFixed(1)}(w${r.width})`).join('  '));
}
