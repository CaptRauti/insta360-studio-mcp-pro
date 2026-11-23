// Opens Studio's export dialog and reads it back by OCR, so the output
// directory and format are known before a real export is started.
//
//   node tests/ui-export-dialog.mjs
//
// Needs Studio running with media loaded. Leaves the dialog OPEN on purpose.

import { findText, ocrImage } from "../src/ocr.mjs";
import { capture, runExport, uiState } from "../src/ui.mjs";

const TITLE = "Insta360 Studio";

const before = uiState({ title: TITLE });
console.log(`vorher:      dialogOpen=${before.dialogOpen} player=${before.player} toolbarExport=${before.toolbarExport}`);

const res = await runExport({ title: TITLE, stage: "dialog" });
console.log(`Dialog:      ${JSON.stringify(res.log)}`);

const shot = capture({ title: TITLE, mode: "print" });
console.log(`screenshot:  ${shot.path}`);

const ocr = ocrImage(shot.path);
if (!ocr.ok) {
  console.error(`OCR: ${ocr.error}`);
  process.exit(1);
}
console.log(`OCR ${ocr.lang} ${ocr.width}x${ocr.height}: ${ocr.lines.length} Zeilen\n`);
for (const l of ocr.lines.slice(0, 60)) console.log(`  ${l.text}`);

// Wo landet die Datei, und welches Format ist gewaehlt?
console.log("\n--- Kontrollen ---");
for (const want of ["Speichern", "Ordner", "Pfad", "Ziel", "Format", "Auflösung", "Exportieren", "Abbrechen", "Desktop", "Videos", "mp4"]) {
  const hits = findText(ocr, want);
  if (hits.length) {
    const h = hits[0];
    console.log(`  ${want.padEnd(12)} -> "${h.text}" click (${h.x}, ${h.y})`);
  }
}
