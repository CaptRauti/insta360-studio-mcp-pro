// Regenerate the fixtures for the `Medienverarbeitung:` group's checkbox rows from real captures.
//
//   node tests/mk-medienverarbeitung-fixture.mjs <capture.png> <checked|unchecked> [out.json]
//
// Merge one entry per state — the two look different to the OCR: with the box empty it reads the
// box as a glyph *left* of the caption ("O Optimierung der unteren Naht"), with the box filled the
// caption is unadorned. Both are worth a fixture, because the parser anchors on the caption and
// must not be thrown by the box's own glyph.
//
// The fixtures are the app's own OCR output (word boxes included), not hand-written word lists: a
// parser test against invented words passes while the real strip drifts. The captures must come
// from a dialog on media whose sources are raw dual-lens `.insv` — on already-stitched `.mp4`
// sources the group does not render at all.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { ocrImage } from "../src/ocr.mjs";

const [, , png, state, out = "tests/fixtures/medienverarbeitung-words.json"] = process.argv;
if (!png || !["checked", "unchecked"].includes(state ?? "")) {
  console.error("usage: node tests/mk-medienverarbeitung-fixture.mjs <capture.png> <checked|unchecked> [out.json]");
  process.exit(2);
}

const ocr = ocrImage(png);
if (!ocr.ok) {
  console.error(`OCR failed: ${ocr.error}`);
  process.exit(1);
}

const words = ocr.words.map((w) => ({
  text: w.text,
  x: Math.round(w.x),
  y: Math.round(w.y),
  w: Math.round(w.w),
  h: Math.round(w.h),
}));
const fixture = existsSync(out) ? JSON.parse(readFileSync(out, "utf8")) : {};
fixture[state] = { source: png.split(/[\\/]/).pop(), words };
writeFileSync(out, `${JSON.stringify(fixture, null, 1)}\n`);
console.log(`${out}: ${state} <- ${words.length} words from ${png}`);
for (const w of words.filter((x) => x.y >= 600 && x.y <= 660)) console.log(`  y${w.y} x${w.x} ${JSON.stringify(w.text)}`);
