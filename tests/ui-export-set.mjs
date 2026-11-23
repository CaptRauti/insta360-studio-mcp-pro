// Opens one export-dialog control and reads back what it offers.
//
//   node tests/ui-export-set.mjs Kodierung
//
// Locates the label (left column, x~478), clicks the value cell on the same row
// (right column, x~575) and OCRs the popup that opens. Prints the options so a
// caller can pick one by text instead of by pixel.

import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

import { ocrImage } from "../src/ocr.mjs";
import { capture, click, runExport, uiState } from "../src/ui.mjs";

const TITLE = "Insta360 Studio";
const LABEL = process.argv[2] ?? "Kodierung";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FFMPEG = path.join(os.homedir(), "AppData", "Local", "hermes", "tools", "ffmpeg-9.0.1-win32-x64", "bin", "ffmpeg.exe");

/**
 * OCR a crop of a screenshot, upscaled. Windows' recogniser is much better on
 * large glyphs, and small dropdown rows are where it misreads most (an 'H' at
 * ~14px comes back as '4'). Coordinates are mapped back to screenshot space so
 * the result can still be clicked.
 */
function zoomOcr(png, { x, y, w, h, factor = 3 } = {}) {
  const out = png.replace(/\.png$/, "-zoom.png");
  execFileSync(FFMPEG, [
    "-y", "-v", "error", "-i", png,
    "-vf", `crop=${w}:${h}:${x}:${y},scale=iw*${factor}:ih*${factor}:flags=lanczos`,
    out,
  ], { timeout: 60000 });
  const ocr = ocrImage(out);
  const words = (ocr.words ?? []).map((word) => ({
    ...word,
    x: Math.round(x + word.x / factor),
    y: Math.round(y + word.y / factor),
    w: Math.round(word.w / factor),
    h: Math.round(word.h / factor),
  }));
  return { ...ocr, words, zoomFile: out };
}

/** The widgets in the dialog's right column, top to bottom. */
export const CONTROLS = [
  "Dateiname",
  "Pfad",
  "Voreinstellung",
  "Auflösung",
  "Rahmen",
  "Bitrate",
  "Kodierung",
  "Farbraum",
];

/** Find a label word and the value cells sitting on the same row, right of it. */
function row(ocr, label) {
  const lab = ocr.words.find((w) => w.text.toLowerCase().startsWith(label.toLowerCase().slice(0, 8)));
  if (!lab) return null;
  const cells = ocr.words.filter((w) => Math.abs(w.y - lab.y) <= 13 && w.x > lab.x + lab.w);
  if (!cells.length) return null;
  const x0 = Math.min(...cells.map((w) => w.x));
  const x1 = Math.max(...cells.map((w) => w.x + w.w));
  return {
    label,
    at: { x: Math.round(x0 + 24), y: lab.y + 8 },
    value: cells.sort((a, b) => a.x - b.x).map((w) => w.text).join(" "),
  };
}

if (!uiState({ title: TITLE }).dialogOpen) {
  await runExport({ title: TITLE, stage: "dialog" });
  await sleep(1200);
}

function look() {
  const shot = capture({ title: TITLE, mode: "print" });
  const ocr = ocrImage(shot.path);
  if (!ocr.ok) throw new Error(`OCR: ${ocr.error}`);
  return { shot, ocr };
}

const before = look();
console.log("--- Zustand vorher ---");
for (const name of CONTROLS) {
  const r = row(before.ocr, name);
  if (r) console.log(`  ${name.padEnd(15)} = ${JSON.stringify(r.value)}  @${r.at.x},${r.at.y}`);
}

const target = row(before.ocr, LABEL);
if (!target) {
  console.error(`\nLabel "${LABEL}" nicht gefunden.`);
  process.exit(1);
}

// Die Felder sind breiter als ihr Inhalt; auf die Mitte zielen, nicht auf den Text.
const cx = target.at.x + 58;

// Das Listenfeld ist ein Toggle: ein zweiter Klick schliesst es wieder. Also
// erst den Zustand lesen und nur bei geschlossenem Popup klicken.
const popupWords = (ocr) =>
  ocr.words.filter((w) => w.x >= 600 && w.x <= 800 && w.y >= 605 && w.y <= 725);

let state = look();
if (popupWords(state.ocr).length < 3) {
  console.log(`\nPopup geschlossen -> klicke "${LABEL}" @${cx},${target.at.y} (aktuell ${JSON.stringify(target.value)})`);
  click({ title: TITLE, x: cx, y: target.at.y });
  await sleep(1200);
  state = look();
} else {
  console.log(`\nPopup war schon offen -> lese nur`);
}

const found = popupWords(state.ocr).sort((a, b) => a.y - b.y || a.x - b.x);
console.log(`Popup: ${found.length} Woerter -> ${found.map((w) => `${w.text}@${w.x},${w.y}`).join(" | ")}`);

const z = zoomOcr(state.shot.path, { x: 555, y: 560, w: 300, h: 210, factor: 4 });
console.log(`\n--- 4x vergroessert (${z.zoomFile}) ---`);
for (const w of z.words) {
  console.log(`  y=${String(w.y).padStart(4)} x=${String(w.x).padStart(4)}  ${JSON.stringify(w.text)}`);
}
