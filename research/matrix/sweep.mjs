// Read the export panel's full matrix off the running Studio window.
//
// Writes research/matrix/sweep.json: for every preset, the settings it leaves
// behind, and for every list control, the options it offers. Run with the export
// panel already open and a 360 project loaded:
//
//   node research/matrix/sweep.mjs
//
// Importing the library directly (rather than the MCP tool) keeps the two
// measurements that matter honest: `selectOption` is the same code path a caller
// uses, and `readDialog` is the same reader whose output the tools report.
import fs from "node:fs";

import { closeControl, openControl, readDialog, selectOption } from "../../src/export-dialog.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = new URL("./", import.meta.url).pathname.replace(/^\//, "");

// Measured off the Voreinstellung list box on 6.0.9 with a 2:1 360 project. The
// order is the order the box draws them in.
const PRESETS = [
  "Quellauflösung übernehmen",
  "Youtube-Pano",
  "TikTok-Pano",
  "Apple VisionPro-Pano",
  "Meta Quest-Pano",
  "Pico-Pano",
  "Benutzerdefiniert",
];

// Every control that opens a list box; the text fields are set with setText and
// are not enumerated here.
const LIST_CONTROLS = [
  "Exportmodus",
  "Voreinstellung",
  "Auflösung",
  "Rahmen",
  "Bitrate",
  "Kodierung",
  "Farbraum",
];

const values = () => {
  const { fields } = readDialog({});
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.value]));
};

const out = { presetMatrix: [], options: {}, order: LIST_CONTROLS };

for (const control of LIST_CONTROLS) {
  const opened = await openControl({ label: control });
  out.options[control] = opened.ok
    ? { ok: true, current: opened.current, options: opened.options, rows: opened.rows.map((r) => r.text) }
    : { ok: false, error: opened.error };
  if (opened.ok) await closeControl({ label: control });
  console.error(`options ${control}: ${opened.ok ? opened.options.length : "FAIL"}`);
}

for (const preset of PRESETS) {
  const res = await selectOption({ label: "Voreinstellung", text: preset });
  await sleep(1200);
  const after = values();
  out.presetMatrix.push({
    preset,
    ok: !!res.ok,
    error: res.error,
    changed: !!res.changed,
    after,
  });
  console.error(`preset ${preset}: ok=${res.ok} -> ${JSON.stringify(after)}`);
}

fs.mkdirSync(OUT + "matrix", { recursive: true });
fs.writeFileSync(OUT + "matrix/sweep.json", JSON.stringify(out, null, 1));

// Leave the panel as we found it.
await selectOption({ label: "Voreinstellung", text: "Quellauflösung übernehmen" });
console.error("wrote matrix/sweep.json");
