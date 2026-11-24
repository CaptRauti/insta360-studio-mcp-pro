// Find the click that actually opens a project card.
//
// openProject guesses cardY = label.y - 45 and that click does not open anything
// (measured: double-click at (219,361) leaves the library on screen). This walks
// a few candidate offsets on the same card and reports which one lands.
import { readScreen, looksLikeEditor } from "../src/editor.mjs";
import { focusWindow, click, sleep } from "../src/ui.mjs";

focusWindow({});
const s = readScreen();
if (!s.ok) {
  console.log("no screen");
  process.exit(1);
}

// The first mcpE2E label sits at x=179 y=406 (measured). Cards are ~108 px apart.
const label = s.words.filter((w) => w.text.includes("mcpE2E")).sort((a, b) => a.x - b.x)[0];
if (!label) {
  console.log("no mcpE2E card found");
  process.exit(1);
}
console.log("label:", JSON.stringify({ x: Math.round(label.x), y: Math.round(label.y), w: label.w, h: label.h }));

const cardX = Math.round(label.x + (label.w ?? 44) / 2);
const candidates = [400, 385, 370, 355, 340, 325, 310];

for (const y of candidates) {
  click({ x: cardX, y, double: true });
  await sleep(9000);
  const after = readScreen();
  const editor = after.ok && looksLikeEditor(after.words);
  console.log(`  dblclick (${cardX},${y}) -> editor=${editor} | ${after.ok ? after.text.slice(0, 120).replace(/\s+/g, " ") : "no screen"}`);
  if (editor) {
    console.log(`\nOPENED with y=${y} (x=${cardX})`);
    process.exit(0);
  }
}
console.log("\nnone of the offsets opened the project");
process.exit(1);
