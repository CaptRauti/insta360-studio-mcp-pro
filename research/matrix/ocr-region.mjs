// OCR a cropped+zoomed screenshot and print words in *original window* coordinates.
//
//   node research/matrix/ocr-region.mjs <zoomed.png> <scale> <offsetX> <offsetY>
import { ocrImage } from "../../src/ocr.mjs";

const [, , file, scaleArg, oxArg, oyArg] = process.argv;
const scale = Number(scaleArg ?? 3);
const ox = Number(oxArg ?? 0);
const oy = Number(oyArg ?? 0);

const r = ocrImage(file);
if (!r.ok) {
  console.log("OCR failed:", r.error);
  process.exit(1);
}
const words = (r.words ?? []).slice().sort((a, b) => a.y - b.y || a.x - b.x);
console.log(`${words.length} words in ${file}`);
for (const w of words) {
  const x = Math.round(ox + w.x / scale);
  const y = Math.round(oy + w.y / scale);
  console.log(`${String(y).padStart(4)} ${String(x).padStart(4)}  h${String(Math.round(w.h / scale)).padStart(3)}  ${JSON.stringify(w.text)}`);
}
