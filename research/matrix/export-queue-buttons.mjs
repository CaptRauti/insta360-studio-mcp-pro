// Read the export dialog's bottom button row at 4x zoom and list every word,
// so "what is actually written on that row" is answered by OCR, not by a claim.
//
// Run: node research/matrix/export-queue-buttons.mjs

import { capture, uiState } from "../../src/ui.mjs";
import { ocrImage } from "../../src/ocr.mjs";
import { zoomOcr } from "../../src/export-dialog.mjs";

const TITLE = "Insta360 Studio";
const shot = capture({ title: TITLE });
const state = uiState({ title: TITLE });
console.log("shot:", shot.path, `${shot.width}x${shot.height}`);
console.log("dialogOpen:", state.dialogOpen, "accent:", state.dialogExport);

// 1. everything the plain OCR sees in the bottom 200 px
const plain = ocrImage(shot.path);
const bottom = (plain.words ?? [])
  .filter((w) => w.y + w.h > 700)
  .sort((a, b) => a.x - b.x)
  .map((w) => `${w.text}@${Math.round(w.x)},${Math.round(w.y)}`);
console.log("plain OCR, bottom 200px:", bottom);

// 2. the same rows at 4x, which is how the option lists are read
for (const [tag, box] of [
  ["dialog-buttons", { x: 640, y: 730, w: 700, h: 90 }],
  ["whole-bottom", { x: 0, y: 700, w: shot.width, h: 200 }],
]) {
  try {
    const zoomed = zoomOcr(shot.path, box); // returns {ok, file, words} — not a path
    const words = (zoomed.words ?? []).sort((a, b) => a.x - b.x).map((w) => `${w.text}@${w.x},${w.y}`);
    console.log(`zoom4 ${tag}:`, JSON.stringify(words));
  } catch (e) {
    console.log(`zoom4 ${tag} failed:`, e.message);
  }
}
