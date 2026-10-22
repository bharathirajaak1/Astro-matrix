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
console.log('reference size:', ref.width + 'x' + ref.height);

// --- 1. Find the content square's bbox (pale-blue fill vs white canvas
// margin/shadow) by scanning inward along the horizontal and vertical
// centerlines for a stable, saturated-enough color transition. ---
const cyGuess = Math.floor(ref.height / 2);
const cxGuess = Math.floor(ref.width / 2);

function isWhiteish([r, g, b]) { return r > 248 && g > 248 && b > 248; }

let left = -1, right = -1, top = -1, bottom = -1;
for (let x = 0; x < ref.width; x++) {
  const c = colorAt(ref, x, cyGuess);
  if (!isWhiteish(c)) { left = x; break; }
}
for (let x = ref.width - 1; x >= 0; x--) {
  const c = colorAt(ref, x, cyGuess);
  if (!isWhiteish(c)) { right = x; break; }
}
for (let y = 0; y < ref.height; y++) {
  const c = colorAt(ref, cxGuess, y);
  if (!isWhiteish(c)) { top = y; break; }
}
for (let y = ref.height - 1; y >= 0; y--) {
  const c = colorAt(ref, cxGuess, y);
  if (!isWhiteish(c)) { bottom = y; break; }
}
console.log('non-white bbox (includes shadow blur):', { left, right, top, bottom, w: right - left, h: bottom - top });

// Print a horizontal scanline's colors near the left edge to see the
// shadow->fill transition in detail.
console.log('\nhorizontal scanline at cy, x=100..260 (step 4):');
for (let x = 100; x <= 260; x += 4) {
  console.log(' x=' + x, colorAt(ref, x, cyGuess));
}
