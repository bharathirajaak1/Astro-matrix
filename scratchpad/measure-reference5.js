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
function isWhiteish([r,g,b]) { return r > 250 && g > 250 && b > 250; }

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

// --- Content fill bbox using the full centerline (handles rounded
// corners correctly since the centerline reaches the flat edge). ---
function findFillEdgeOnRow(y) {
  let left = -1, right = -1;
  for (let x = 0; x < W; x++) { const c = colorAt(ref, x, y); if (!isWhiteish(c) && distFromBg(c) < 15) { left = x; break; } }
  for (let x = W - 1; x >= 0; x--) { const c = colorAt(ref, x, y); if (!isWhiteish(c) && distFromBg(c) < 15) { right = x; break; } }
  return { left, right };
}
function findFillEdgeOnCol(x) {
  let top = -1, bottom = -1;
  for (let y = 0; y < H; y++) { const c = colorAt(ref, x, y); if (!isWhiteish(c) && distFromBg(c) < 15) { top = y; break; } }
  for (let y = H - 1; y >= 0; y--) { const c = colorAt(ref, x, y); if (!isWhiteish(c) && distFromBg(c) < 15) { bottom = y; break; } }
  return { top, bottom };
}
const rowEdge = findFillEdgeOnRow(627);
const colEdge = findFillEdgeOnCol(627);
console.log('content fill bbox: left/right (row y=627):', rowEdge, '  top/bottom (col x=627):', colEdge);
const contentCx = (rowEdge.left + rowEdge.right) / 2;
const contentCy = (colEdge.top + colEdge.bottom) / 2;
console.log('content center:', contentCx, contentCy, ' content half-width:', (rowEdge.right-rowEdge.left)/2, ' half-height:', (colEdge.bottom-colEdge.top)/2);

// --- Clean grid-line rows: only keep rows with EXACTLY 2 thin runs
// (no circle contamination) across a wide y sweep. ---
console.log('\n--- clean (2-entry) rows for vertical grid line x ---');
const cleanLeftX = [], cleanRightX = [], cleanColors = [], cleanWidths = [];
for (let y = 160; y < 1100; y += 5) {
  const thin = scanRow(y).filter(r => r.width >= 2 && r.width <= 12);
  if (thin.length === 2) {
    cleanLeftX.push(thin[0].cx); cleanRightX.push(thin[1].cx);
    cleanWidths.push(thin[0].width, thin[1].width);
    cleanColors.push(thin[0].color, thin[1].color);
  }
}
const avg = arr => arr.reduce((a,b)=>a+b,0)/arr.length;
console.log('clean row count:', cleanLeftX.length);
console.log('left grid-line x avg:', avg(cleanLeftX).toFixed(2), ' right grid-line x avg:', avg(cleanRightX).toFixed(2));
console.log('width avg:', avg(cleanWidths).toFixed(2));
console.log('color samples:', cleanColors.slice(0, 8));

console.log('\n--- clean (2-entry) columns for horizontal grid line y ---');
const cleanTopY = [], cleanBotY = [], cleanColColors = [], cleanColWidths = [];
for (let x = 160; x < 1100; x += 5) {
  const thin = scanCol(x).filter(r => r.width >= 2 && r.width <= 12);
  if (thin.length === 2) {
    cleanTopY.push(thin[0].cy); cleanBotY.push(thin[1].cy);
    cleanColWidths.push(thin[0].width, thin[1].width);
    cleanColColors.push(thin[0].color, thin[1].color);
  }
}
console.log('clean col count:', cleanTopY.length);
console.log('top grid-line y avg:', avg(cleanTopY).toFixed(2), ' bottom grid-line y avg:', avg(cleanBotY).toFixed(2));
console.log('width avg:', avg(cleanColWidths).toFixed(2));
console.log('color samples:', cleanColColors.slice(0, 8));

// --- Circle fit using Kasa method on points NOT near the clean grid x/y. ---
function kasaFit(points) {
  let Sxx=0,Sxy=0,Syy=0,Sx=0,Sy=0,S1=points.length,Sxz=0,Syz=0,Sz=0;
  for (const [x,y] of points) { const z=x*x+y*y; Sxx+=x*x; Sxy+=x*y; Syy+=y*y; Sx+=x; Sy+=y; Sxz+=x*z; Syz+=y*z; Sz+=z; }
  const A=[[Sxx,Sxy,Sx],[Sxy,Syy,Sy],[Sx,Sy,S1]], b=[-Sxz,-Syz,-Sz];
  function det3(m){return m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);}
  function replCol(m,col,vec){const r=m.map(row=>row.slice());for(let i=0;i<3;i++)r[i][col]=vec[i];return r;}
  const Ad=det3(A), D=det3(replCol(A,0,b))/Ad, E=det3(replCol(A,1,b))/Ad, F=det3(replCol(A,2,b))/Ad;
  const cx=-D/2, cy=-E/2, r=Math.sqrt(cx*cx+cy*cy-F);
  let se=0; for (const [x,y] of points) { const d=Math.sqrt((x-cx)**2+(y-cy)**2); se+=(d-r)**2; }
  return { cx, cy, r, rms: Math.sqrt(se/points.length) };
}
const gridXApprox = [avg(cleanLeftX), avg(cleanRightX)];
const gridYApprox = [avg(cleanTopY), avg(cleanBotY)];
const outerPts = [], innerPts = [];
for (let y = 50; y < H - 50; y += 3) {
  const thin = scanRow(y).filter(r => r.width >= 2 && r.width <= 10);
  for (const r of thin) {
    const nearGridX = gridXApprox.some(gx => Math.abs(r.cx - gx) < 12);
    if (nearGridX) continue;
    const distFromCenterGuess = Math.hypot(r.cx - contentCx, y - contentCy);
    if (distFromCenterGuess > 400) outerPts.push([r.cx, y]);
    else if (distFromCenterGuess > 220 && distFromCenterGuess < 400) innerPts.push([r.cx, y]);
  }
}
for (let x = 50; x < W - 50; x += 3) {
  const thin = scanCol(x).filter(r => r.width >= 2 && r.width <= 10);
  for (const r of thin) {
    const nearGridY = gridYApprox.some(gy => Math.abs(r.cy - gy) < 12);
    if (nearGridY) continue;
    const distFromCenterGuess = Math.hypot(x - contentCx, r.cy - contentCy);
    if (distFromCenterGuess > 400) outerPts.push([x, r.cy]);
    else if (distFromCenterGuess > 220 && distFromCenterGuess < 400) innerPts.push([x, r.cy]);
  }
}
console.log('\nouter circle fit points:', outerPts.length, ' inner circle fit points:', innerPts.length);
console.log('outer circle fit:', kasaFit(outerPts));
console.log('inner circle fit:', kasaFit(innerPts));
