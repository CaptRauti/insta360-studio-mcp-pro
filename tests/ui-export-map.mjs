// Dumps the export dialog as a coordinate map: window rect plus every
// recognised word, so controls can be located and clicked without vision.
//
//   node tests/ui-export-map.mjs
//
// Writes the full OCR result to <scratch>/ui-export-map.json and prints a
// compact listing. Opens the dialog if it is not already open.

import { writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { ocrImage } from "../src/ocr.mjs";
import { capture, runExport, uiState, windowInfo } from "../src/ui.mjs";

const TITLE = "Insta360 Studio";
const SCRATCH = path.join(os.homedir(), "AppData", "Local", "hermes", "cache", "scratch");

let state = uiState({ title: TITLE });
if (!state.dialogOpen) {
  const res = await runExport({ title: TITLE, stage: "dialog" });
  console.log(`Dialog geoeffnet: ${JSON.stringify(res.log.at(-1))}`);
  state = uiState({ title: TITLE });
}

const win = windowInfo(TITLE);
console.log(`Fenster: ${JSON.stringify(win)}`);

const shot = capture({ title: TITLE, mode: "print" });
const ocr = ocrImage(shot.path);
if (!ocr.ok) {
  console.error(`OCR: ${ocr.error}`);
  process.exit(1);
}

console.log(`Screenshot: ${ocr.width}x${ocr.height}  (${shot.path})`);
console.log(`OCR: ${ocr.lines.length} Zeilen / ${ocr.words.length} Woerter, lang ${ocr.lang}`);

const dump = { window: win, screenshot: shot.path, ocr };
writeFileSync(path.join(SCRATCH, "ui-export-map.json"), JSON.stringify(dump, null, 1));
console.log(`Karte: ${path.join(SCRATCH, "ui-export-map.json")}\n`);

// Zeilenweise, damit Labels und ihre Werte zusammen sichtbar bleiben.
console.log("--- Zeilen mit Koordinaten ---");
for (const line of ocr.lines) {
  const ws = line.words ?? [];
  if (!ws.length) continue;
  const x = Math.min(...ws.map((w) => w.x));
  const y = Math.min(...ws.map((w) => w.y));
  const spans = ws.map((w) => `${w.text}@${w.x}`).join(" ");
  console.log(`  y=${String(y).padStart(4)} x=${String(x).padStart(4)}  ${spans}`);
}
