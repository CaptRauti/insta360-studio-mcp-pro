// Does the Rahmen row become readable at 3x zoom after an explicit rate is chosen?
// Saves a before/after screenshot of the row so crop-zoom.ps1 + ocr-region.mjs can
// compare them. Leaves the row clean again (preset reset with the full label).
//
//   node research/matrix/rahmen-zoom-check.mjs
import fs from "node:fs";

import { readDialog, selectOption } from "../../src/export-dialog.mjs";
import { capture } from "../../src/ui.mjs";

const dir = "C:/Users/stefa/AppData/Local/hermes/cache/scratch";
const snap = (name) => {
  const p = `${dir}/${name}.png`;
  fs.copyFileSync(capture({ title: "Insta360 Studio", mode: "print" }).path, p);
  return p;
};

const show = (tag) => {
  const { fields } = readDialog({});
  const r = fields.Rahmen;
  console.log(`${tag}: readback Rahmen = ${r ? JSON.stringify(r.value) + " click " + JSON.stringify(r.click) : "MISSING"}`);
};

show("before");
console.log("shot:", snap("rahmen_before"));

const pick = await selectOption({ label: "Rahmen", text: "30.00" });
console.log("PICK", JSON.stringify(pick));
console.log("shot:", snap("rahmen_after_30"));
show("after 30.00");

// Reset so the row is left in its readable state (full label on purpose).
const reset = await selectOption({ label: "Voreinstellung", text: "Quellauflösung übernehmen" });
console.log("RESET", JSON.stringify(reset));
show("after reset");
