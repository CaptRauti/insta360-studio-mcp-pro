// C1: what each option of Auflösung / Rahmen / Bitrate / Kodierung / Farbraum /
// Exportmodus actually does. Selecting an option and reading the whole panel back
// is the only honest measure: the option label is what the box says, not what it
// leaves behind.
//
//   node research/matrix/option-effects.mjs
//
// Restores the panel with "Quellauflösung übernehmen" at the end, which the
// preset matrix measured as the full reset (Auflösung Benutzerdefiniert,
// Rahmen Projekt-Bildrate, Bitrate Benutzerdefiniert, Kodierung h264, Farbraum
// Rec.709 8bit).
import fs from "node:fs";

import { closeControl, openControl, readDialog, selectOption } from "../../src/export-dialog.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = new URL(".", import.meta.url).pathname.replace(/^\//, "");

const save = () => fs.writeFileSync(OUT + "option-effects.json", JSON.stringify(out, null, 1));

const TARGETS = ["Exportmodus", "Auflösung", "Rahmen", "Bitrate", "Kodierung", "Farbraum"];

const values = () => {
  const { fields } = readDialog({});
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.value]));
};

const out = { effects: [], restored: null, started: values() };
console.error(`start: ${JSON.stringify(out.started)}`);

for (const control of TARGETS) {
  const opened = await openControl({ label: control });
  if (!opened.ok) {
    out.effects.push({ control, options: [], ok: false, error: opened.error });
    console.error(`FAIL open ${control}: ${opened.error}`);
    continue;
  }
  const options = opened.options.slice();
  await closeControl({ label: control });
  await sleep(400);
  const before = values();
  const entry = { control, ok: true, before: before[control], options: [] };
  for (const option of options) {
    const res = await selectOption({ label: control, text: option });
    await sleep(900);
    let after = null;
    let readError = null;
    try { after = values(); } catch (e) { readError = e.message; }
    entry.options.push({ option, ok: !!res.ok, err: res.error ?? null, after, readError });
    console.error(`${control} = ${option}: ok=${res.ok} -> ${JSON.stringify(after)}`);
    // A modal blocker makes every following selection a lie; stop this control.
    if (readError && /disabled/.test(readError)) { entry.blocked = readError; break; }
  }
  out.effects.push(entry);
  save();
}

// Reset. "Quellauflösung übernehmen" is the measured full reset of the settings
// rows; the export mode is a separate control and needs its own restore, or the
// project is left exporting in segments.
const mode = await selectOption({ label: "Exportmodus", text: "Einzelnes Segment" });
await sleep(900);
const reset = await selectOption({ label: "Voreinstellung", text: "Quellauflösung übernehmen" });
await sleep(1500);
out.restored = values();
out.restoreOk = { mode: !!mode.ok, preset: !!reset.ok };
console.error(`reset mode=${mode.ok} preset=${reset.ok} -> ${JSON.stringify(out.restored)}`);

save();
console.error(`wrote ${OUT}option-effects.json`);
