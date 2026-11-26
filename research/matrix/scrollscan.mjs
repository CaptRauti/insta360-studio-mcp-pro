// Ad-hoc: find every row of the export panel, including the ones that only
// exist after scrolling. Prints "y<tab>text" per read position.
import { readDialog } from "../../src/export-dialog.mjs";
import * as ui from "../../src/ui.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shown = new Map();

for (let step = 0; step < 8; step++) {
  const { fields, rows } = readDialog({});
  const list = rows ?? [];
  for (const r of list) {
    const key = r.text.replace(/\s+/g, " ").trim();
    if (key && !shown.has(key)) shown.set(key, r.y);
  }
  console.log(`--- read ${step}: ${list.length} rows, ${shown.size} distinct so far`);
  for (const r of list) console.log(`   y=${Math.round(r.y)}  ${r.text}`);
  const labels = Object.keys(fields ?? {});
  console.log(`   fields: ${labels.join(", ")}`);
  // scroll the panel down a notch
  try {
    ui.scroll({ x: 657, y: 500, notches: -2 });
  } catch (e) {
    console.log(`   scroll refused: ${e.message}`);
    break;
  }
  await sleep(900);
}
console.log("=== distinct rows seen ===");
for (const [k, y] of shown) console.log(`  ${k}`);
