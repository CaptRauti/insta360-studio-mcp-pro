// Coarse ASCII map of a Studio screenshot: prints a luma-grid so the layout (where
// the library grid, the cards and their thumbnails actually are) can be read without
// a vision model.   node research/ascii_map.mjs <png> [cols] [rows]
import { readPng } from "../src/png.mjs";

const file = process.argv[2];
const cols = Number(process.argv[3] ?? 96);
const rows = Number(process.argv[4] ?? 40);
const img = readPng(file);
console.log(`image ${img.width}x${img.height}`);
const ramp = " .:-=+*#%@";
for (let r = 0; r < rows; r++) {
  let line = "";
  const y0 = Math.floor((r * img.height) / rows);
  const y1 = Math.max(y0 + 1, Math.floor(((r + 1) * img.height) / rows));
  for (let c = 0; c < cols; c++) {
    const x0 = Math.floor((c * img.width) / cols);
    const x1 = Math.max(x0 + 1, Math.floor(((c + 1) * img.width) / cols));
    let sum = 0;
    let n = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * img.width + x) * 3;
        sum += 0.299 * img.data[i] + 0.587 * img.data[i + 1] + 0.114 * img.data[i + 2];
        n++;
      }
    }
    const luma = sum / Math.max(1, n) / 255;
    line += ramp[Math.min(ramp.length - 1, Math.round(luma * (ramp.length - 1)))];
  }
  console.log(`${String(y0).padStart(4)} ${line}`);
}
