// On the X6 (.insv, 50 fps source) project: choose an offered rate, then check
// whether the row's value survives as readable text at 3x zoom, and whether a
// second pick still works in the same dialog session.
//
//   node research/matrix/rahmen-zoom-25.mjs
import fs from "node:fs";

import { readDialog, selectOption } from "../../src/export-dialog.mjs";
import { capture } from "../../src/ui.mjs";

const dir = "C:/Users/stefa/AppData/Local/hermes/cache/scratch";
const snap = (name) => {
  const p = `${dir}/${name}.png`;
  fs.copyFileSync(capture({ title: "Insta360 Studio", mode: "print" }).path, p);
  console.log("shot:", p);
  return p;
};
const show = (tag) => {
  const { fields } = readDialog({});
  const r = fields.Rahmen;
  console.log(`${tag}: readback Rahman = ${r ? JSON.stringify(r.value) + " click " + JSON.stringify(r.click) : "MISSING"}`);
};

show("before");
snap("zoom_before");

console.log("PICK 25.00", JSON.stringify(await selectOption({ label: "Rahmen", text: "25.00" })));
snap("zoom_after_25");
show("after 25.00");

// Second pick in the same session — this is what failed on the Lamspringe project.
console.log("PICK source", JSON.stringify(await selectOption({ label: "Rahmen", text: "Quellbild-Framerate übernehmen" })));
snap("zoom_after_reset");
show("after reset");
