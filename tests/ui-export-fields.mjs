// Reads Studio's open export dialog by OCR and prints the fields with their
// coordinates, so a caller can see the output path and target the primary
// button without a vision model.
//
//   node tests/ui-export-fields.mjs

import { ocrImage } from "../src/ocr.mjs";
import { capture, uiState } from "../src/ui.mjs";

const TITLE = "Insta360 Studio";

const state = uiState({ title: TITLE });
console.log(`Dialog offen: ${state.dialogOpen}`);
console.log(`Primaerbutton (Akzentfarbe): ${JSON.stringify(state.dialogExport)}`);

const shot = capture({ title: TITLE, mode: "print" });
const ocr = ocrImage(shot.path);
if (!ocr.ok) {
  console.error(`OCR: ${ocr.error}`);
  process.exit(1);
}
console.log(`screenshot: ${shot.path}  (${ocr.width}x${ocr.height})`);

// Der Dialog sitzt in der rechten Haelfte; links liegt die Medienliste.
console.log("\n--- Woerter x > 640, nach y sortiert ---");
const words = ocr.words
  .filter((w) => w.x > 640)
  .sort((a, b) => a.y - b.y || a.x - b.x);
for (const w of words) {
  console.log(`  y=${String(w.y).padStart(4)} x=${String(w.x).padStart(4)}  "${w.text}"`);
}

console.log("\n--- Labels und ihre Nachbarwerte ---");
for (const label of ["Dateiname", "Pfad", "Auflösung", "Bitrate", "Kodierung", "Farbraum", "Exportieren"]) {
  const hits = ocr.words.filter((w) => w.text.toLowerCase().startsWith(label.toLowerCase().slice(0, 5)));
  for (const h of hits) {
    const right = ocr.words
      .filter((w) => Math.abs(w.y - h.y) <= 12 && w.x > h.x + h.w)
      .sort((a, b) => a.x - b.x)
      .slice(0, 4)
      .map((w) => w.text)
      .join(" ");
    console.log(`  ${label.padEnd(12)} @(${h.x},${h.y})  ->  ${right || "(leer)"}`);
  }
}
