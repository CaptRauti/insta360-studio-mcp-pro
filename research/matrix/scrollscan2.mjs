// Ad-hoc: every row of the export panel from the raw OCR words, at each scroll
// position. Discovers rows the fixed CONTROLS list cannot see.
import { optionRows, readDialog, stripIndicators } from "../../src/export-dialog.mjs";
import * as ui from "../../src/ui.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const seen = new Map();

for (let step = 0; step < 6; step++) {
  const { words } = readDialog({});
  const rows = stripIndicators(optionRows(words));
  console.log(`--- read ${step}: ${rows.length} rows`);
  for (const r of rows) {
    const t = r.text.replace(/\s+/g, " ").trim();
    console.log(`   y=${Math.round(r.y)} x=${Math.round(r.x)}  ${t}`);
    if (t && !seen.has(t)) seen.set(t, Math.round(r.y));
  }
  if (step < 5) {
    try { ui.scroll({ x: 657, y: 520, notches: -3 }); } catch (e) { console.log(`   scroll refused: ${e.message}`); break; }
    await sleep(900);
  }
}
console.log("=== distinct row texts ===");
for (const t of seen.keys()) console.log("  " + t);
