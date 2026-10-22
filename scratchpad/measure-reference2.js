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

// Background fill color (sampled away from any line/mark), from round 1:
const BG = [229, 245, 254];
function distFromBg([r,g,b]) {
  return Math.sqrt((r-BG[0])**2 + (g-BG[1])**2 + (b-BG[2])**2);
}

// Scan one row, find contiguous runs of pixels that differ meaningfully
// from the background (i.e. "ink" - could be grid line, circle stroke,
// or the A mark/shadow). Reports each run's [start,end], width, and the
// color at its darkest/most-saturated point.
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
      if (inRun) { runs.push({ start: runStart, end: x - 1, width: x - runStart, color: best, dist: bestDist }); inRun = false; }
    }
  }
  if (inRun) runs.push({ start: runStart, end: W - 1, width: W - runStart, color: best, dist: bestDist });
  return runs;
}
function scanCol(x) {
  const runs = [];
  let inRun = false, runStart = 0, best = null, bestDist = 0;
  for (let y = 0; y < H; y++) {
    const c = colorAt(ref, x, y);
    const d = distFromBg(c);
    if (d > 12) {
      if (!inRun) { inRun = true; runStart = y; bestDist = 0; }
      if (d > bestDist) { bestDist = d; best = c; }
    } else {
      if (inRun) { runs.push({ start: runStart, end: y - 1, width: y - runStart, color: best, dist: bestDist }); inRun = false; }
    }
  }
  if (inRun) runs.push({ start: runStart, end: H - 1, width: H - runStart, color: best, dist: bestDist });
  return runs;
}

// Pick a row well above the A mark (so runs are only: left shadow margin,
// content-square left edge, circle(s), grid line(s), circle(s), content
// square right edge, right shadow margin) - from the visual, the A's top
// is roughly 28% down the content square. Try a row at ~18% down.
const cy = Math.round(H/2);
const topRowY = Math.round(H * 0.30); // just above/at the top of the A, inside both circles' upper arcs
console.log('--- row scan at y=' + topRowY + ' (should cross: content edges, outer circle, grid, inner circle) ---');
for (const r of scanRow(topRowY)) console.log(r);

console.log('\n--- row scan at y=' + cy + ' (horizontal centerline - crosses content edges, outer circle, grid vertical lines, inner circle, possibly A) ---');
for (const r of scanRow(cy)) console.log(r);

const cx = Math.round(W/2);
console.log('\n--- col scan at x=' + cx + ' (vertical centerline) ---');
for (const r of scanCol(cx)) console.log(r);
