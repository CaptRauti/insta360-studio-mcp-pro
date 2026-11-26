// Where is a project card, really? Capture the window, OCR it with boxes and print
// the words around the project-library grid. Diagnoses openProject's card offsets
// on whatever window size this session happens to have.
//   node research/where_is_card.mjs [needle]
import { capture, redraw } from "../src/ui.mjs";
import { ocrImage } from "../src/ocr.mjs";

const needle = (process.argv[2] ?? "mcpKey").toLowerCase();
try { redraw(); } catch { /* best effort */ }
const shot = await capture();
const file = shot.path ?? shot.file ?? shot;
console.log(`shot: ${JSON.stringify(file)}`);
const ocr = ocrImage(typeof file === "string" ? file : file.path);
if (!ocr.ok) {
  console.log(`ocr failed: ${JSON.stringify(ocr)}`);
  process.exit(1);
}
console.log(`size ${ocr.width}x${ocr.height} lang=${ocr.lang} words=${ocr.words.length}`);
const words = (ocr.words ?? []).filter((w) => w.y > (ocr.height ?? 0) * 0.5);
for (const w of words) console.log(`  ${String(Math.round(w.x)).padStart(5)},${String(Math.round(w.y)).padStart(4)}  ${w.text}`);
const hit = (ocr.words ?? []).find((w) => w.text.toLowerCase().includes(needle));
console.log(hit ? `MATCH ${needle}: x=${Math.round(hit.x)} y=${Math.round(hit.y)} h=${Math.round(hit.height ?? 0)} w=${Math.round(hit.width ?? 0)}` : `no word contains ${needle}`);
