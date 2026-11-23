// Live probe for the OCR layer: screenshot the running Studio window, read the
// text off it, and look up a few controls by name.
//
//   node tests/ui-ocr-probe.mjs
//
// Needs Studio running with a visible window. Prints what it found; exits 1 if
// the window or the OCR engine is unavailable.

import { studioInfo } from "../src/studio-path.mjs";
import { findText, ocrImage } from "../src/ocr.mjs";
import { capture } from "../src/ui.mjs";

const TITLE = "Insta360 Studio";

function line(label, value) {
  console.log(`${label.padEnd(22)} ${value}`);
}

const install = studioInfo();
line("Studio install", install.found ? `${install.dir} (${install.version})` : "NOT FOUND");
if (!install.found) process.exit(1);

let shot;
try {
  shot = capture({ title: TITLE, mode: "print" });
} catch (err) {
  console.error(`window capture failed: ${err.message}`);
  process.exit(1);
}
line("screenshot", shot.path);
line("window", shot.width ? `${shot.width}x${shot.height}` : "no rect");

const result = ocrImage(shot.path);
if (!result.ok) {
  console.error(`OCR failed: ${result.error}`);
  process.exit(1);
}
line("OCR language", result.lang);
line("image", `${result.width}x${result.height}`);
line("text found", `${result.lines.length} lines / ${result.words.length} words`);

console.log("\n--- what is on screen ---");
for (const l of result.lines.slice(0, 40)) console.log(`  ${l.text}`);

// Controls a caller is likely to look for, in both UI languages.
const WANTED = [
  "Exportieren", "Export", "Abbrechen", "Cancel", "Teilen", "Share",
  "Bearbeiten", "Edit", "Einstellungen", "Settings", "Datei", "File",
];

console.log("\n--- lookup by name ---");
let found = 0;
for (const want of WANTED) {
  const hits = findText(result, want);
  if (hits.length) {
    found += 1;
    const h = hits[0];
    console.log(`  ${want.padEnd(14)} -> ${h.level} "${h.text}" click (${h.x}, ${h.y}) box ${h.width}x${h.height}`);
  }
}
if (!found) console.log("  (none of the probe words are on screen right now)");

console.log(`\nOK: OCR layer live against ${TITLE}.`);
