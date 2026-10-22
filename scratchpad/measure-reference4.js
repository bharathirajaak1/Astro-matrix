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
      if (inRun) { runs.push({ cy: (runStart + y - 1) / 2, start: runStart, end: y - 1, width: y - runStart, color: best }); inRun = false; }
    }
  }
  if (inRun) runs.push({ cy: (runStart + H - 1) / 2, start: runStart, end: H - 1, width: H - runStart, color: best });
  return runs;
}

// --- 1. Content square bbox: scan along a column clear of the A (x=200,
// far left) for where background fill begins/ends (top/bottom rounded
// edge), and a row clear of the A (y=150) for left/right.
function isCloseToBg(c, tol) { return distFromBg(c) < tol; }
function isWhiteish([r,g,b]) { return r > 250 && g > 250 && b > 250; }

function findFillEdgeOnColumn(x) {
  let top = -1, bottom = -1;
  for (let y = 0; y < H; y++) {
    const c = colorAt(ref, x, y);
    if (!isWhiteish(c) && isCloseToBg(c, 15)) { top = y; break; }
  }
  for (let y = H - 1; y >= 0; y--) {
    const c = colorAt(ref, x, y);
    if (!isWhiteish(c) && isCloseToBg(c, 15)) { bottom = y; break; }
  }
  return { top, bottom };
}
function findFillEdgeOnRow(y) {
  let left = -1, right = -1;
  for (let x = 0; x < W; x++) {
    const c = colorAt(ref, x, y);
    if (!isWhiteish(c) && isCloseToBg(c, 15)) { left = x; break; }
  }
  for (let x = W - 1; x >= 0; x--) {
    const c = colorAt(ref, x, y);
    if (!isWhiteish(c) && isCloseToBg(c, 15)) { right = x; break; }
  }
  return { left, right };
}
console.log('content fill edges (column x=200):', findFillEdgeOnColumn(200));
console.log('content fill edges (column x=1050):', findFillEdgeOnColumn(1050));
console.log('content fill edges (row y=150):', findFillEdgeOnRow(150));
console.log('content fill edges (row y=1100):', findFillEdgeOnRow(1100));

// --- 2. Grid line x-positions (already found: ~450, ~802). Confirm with
// more rows and get a precise average + stroke width + color. ---
const gridRows = [180, 210, 270, 300, 950, 1000, 1040, 1060, 1080];
const leftLine = [], rightLine = [], leftW = [], rightW = [], colors = [];
for (const y of gridRows) {
  const thin = scanRow(y).filter(r => r.width >= 2 && r.width <= 10);
  if (thin.length >= 2) {
    leftLine.push(thin[0].cx); leftW.push(thin[0].width); colors.push(thin[0].color);
    rightLine.push(thin[thin.length-1].cx); rightW.push(thin[thin.length-1].width); colors.push(thin[thin.length-1].color);
  }
}
const avg = arr => arr.reduce((a,b)=>a+b,0)/arr.length;
console.log('\ngrid VERTICAL line x positions: left avg=', avg(leftLine).toFixed(1), 'right avg=', avg(rightLine).toFixed(1));
console.log('grid line stroke width samples:', leftW, rightW, 'avg=', avg([...leftW,...rightW]).toFixed(2));
console.log('grid line color samples:', colors.slice(0,6));

// --- 3. Grid HORIZONTAL line y-positions via column scans clear of the A
// (x=200 is clear; also try x=1050). ---
const gridCols = [200, 230, 260, 1000, 1020, 1050];
const topLine = [], botLine = [];
for (const x of gridCols) {
  const thin = scanCol(x).filter(r => r.width >= 2 && r.width <= 10);
  if (thin.length >= 2) {
    topLine.push(thin[0].cy);
    botLine.push(thin[thin.length-1].cy);
  }
}
console.log('\ngrid HORIZONTAL line y positions: top avg=', avg(topLine).toFixed(1), 'bottom avg=', avg(botLine).toFixed(1));

// --- 4. Circle edge points for a Kasa fit: gather (x,y) edge midpoints
// from rows/cols clear of the A and clear of the grid-line x/y (within
// ~15px), for BOTH outer and inner circle arcs. ---
function kasaFit(points) {
  // Fit x^2+y^2+D x+E y+F=0 via least squares, then center=(-D/2,-E/2), r=sqrt((D^2+E^2)/4-F)
  let Sxx=0,Sxy=0,Syy=0,Sx=0,Sy=0,S1=points.length,Sxz=0,Syz=0,Sz=0;
  for (const [x,y] of points) {
    const z = x*x+y*y;
    Sxx+=x*x; Sxy+=x*y; Syy+=y*y; Sx+=x; Sy+=y; Sxz+=x*z; Syz+=y*z; Sz+=z;
  }
  // Solve normal equations for [D,E,F] minimizing sum(x^2+y^2+Dx+Ey+F)^2
  // via matrix form A^T A p = A^T b where rows are [x,y,1], b=-(x^2+y^2)
  const A = [[Sxx,Sxy,Sx],[Sxy,Syy,Sy],[Sx,Sy,S1]];
  const b = [-Sxz,-Syz,-Sz];
  // Solve 3x3 linear system via Cramer's rule
  function det3(m){return m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);}
  const Ad = det3(A);
  function replCol(m,col,vec){const r=m.map(row=>row.slice());for(let i=0;i<3;i++)r[i][col]=vec[i];return r;}
  const D = det3(replCol(A,0,b))/Ad;
  const E = det3(replCol(A,1,b))/Ad;
  const F = det3(replCol(A,2,b))/Ad;
  const cx=-D/2, cy=-E/2, r=Math.sqrt(cx*cx+cy*cy-F);
  // RMS error
  let se=0;
  for (const [x,y] of points) { const d=Math.sqrt((x-cx)**2+(y-cy)**2); se+=(d-r)**2; }
  return { cx, cy, r, rms: Math.sqrt(se/points.length) };
}

const outerPts = [], innerPts = [];
for (let y = 60; y < H; y += 4) {
  // skip rows inside the A's vertical range roughly (we'll just filter by checking thin runs only, A produces wide runs so it's naturally excluded by width<=10 filter)
  const thin = scanRow(y).filter(r => r.width >= 2 && r.width <= 10);
  if (thin.length === 0) continue;
  // leftmost thin run = outer circle (if not near a grid line x) ; classify by distance to known grid x (450/802)
  for (const r of thin) {
    const nearGridX = Math.abs(r.cx-450)<10 || Math.abs(r.cx-802)<10;
    if (nearGridX) continue;
    outerPts.push([r.cx, y, r]); // temporarily all non-grid thin points; classify outer/inner after
  }
}
// Separate by which "side" and typical radius clusters: do a rough pass
// using the known approx center (from grid line midpoint) and bucket by
// resulting radius into two clusters (outer ~446, inner ~291 per earlier estimate).
const approxCx = (450+802)/2, approxCy = approxCx; // assume square/symmetric
const radii = outerPts.map(([x,y]) => Math.hypot(x-approxCx, y-approxCy));
const sorted = radii.slice().sort((a,b)=>a-b);
console.log('\nradius samples (sorted, first 10 / last 10):', sorted.slice(0,10).map(v=>v.toFixed(1)), sorted.slice(-10).map(v=>v.toFixed(1)));
// histogram to find the two clusters
const hist = {};
for (const r of radii) { const bucket = Math.round(r/10)*10; hist[bucket]=(hist[bucket]||0)+1; }
console.log('radius histogram (bucket:count):', hist);
