// Where does the export dialog persist what it shows?
//
// `nle/video_export_preset_model.json` turned out to hold the dialog's settings as
// enums (`encodeFormat`, `fpsType`, `resolutionType`, `resolutionShortSide`, `bitrate`,
// `bitrateType`, `colorSetting`, per slot in `custom_presets`, with `current_presets`
// naming which slot each export mode uses), and it is written when the dialog
// **closes** — not while it is open (measured: a pick changes the panel but not the
// file; ESC changes the file). So the method is:
//
//   open dialog -> pick one option -> ESC (close: writes the file) -> reopen -> diff
//
// which turns "did that click land?" into a file read instead of an OCR guess — the
// question the C1 residual could not answer — and settles whether the ProRes pair
// (which the panel renders identically) is distinguishable at all.
//
// Harness rules carried over from option-effects2.mjs (both measured there):
//   - `Auflösung` is the control that wedges the panel: list it LAST.
//   - when the panel stops opening list boxes, close and reopen the export dialog.
//   - a cheap `Farbraum` open/close is the liveness probe before every control.
//
//   node research/matrix/dialog-persistence.mjs "Kodierung,Farbraum"
//   node research/matrix/dialog-persistence.mjs            # all five, Auflösung last
//
// Every pick is appended to research/matrix/dialog-persistence.json, so a crash or a
// timeout keeps what was already measured. The values the dialog had when it was opened
// are picked back at the end, so what this leaves behind is what it found.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { closeControl, openControl, readDialog, selectOption } from "../../src/export-dialog.mjs";
import { click, sendKeys, sleep, uiState } from "../../src/ui.mjs";

const FILE = path.join(
  os.homedir(),
  "AppData",
  "Local",
  "Insta360",
  "Insta360 Studio",
  "nle",
  "video_export_preset_model.json",
);
const OUT = path.join(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")),
  "dialog-persistence.json",
);

const snap = () => {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return null;
  }
};

/** "custom_presets.1.encodeFormat: 0 -> 2" per differing leaf; arrays compared by value. */
function deepDiff(a, b, prefix = "") {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);
  if (!isObj(a) || !isObj(b)) return [`${prefix}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`];
  const out = [];
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    out.push(...deepDiff(a[k], b[k], prefix ? `${prefix}.${k}` : k));
  }
  return out;
}

const values = () => {
  const { fields } = readDialog({});
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.value]));
};

function ensureDialog() {
  const s = uiState({});
  if (s.dialogOpen) return false;
  const btn = s.toolbarExport;
  if (!btn) throw new Error("no export button in the toolbar — is a project open?");
  click({ x: btn.cx, y: btn.cy });
  return true;
}

/** Closing is what writes the file. */
async function closeDialog() {
  sendKeys({ keys: "{ESC}" });
  await sleep(2000);
}

/** The one recovery measured to restore input handling after the panel wedges. */
async function recover(reason) {
  const wasOpen = uiState({}).dialogOpen;
  if (wasOpen) await closeDialog();
  const reopened = ensureDialog();
  await sleep(1600);
  const alive = await probe();
  run.recoveries.push({ reason, esc: wasOpen, reopened, alive });
  console.error(`recover(${reason}): esc=${wasOpen} reopened=${reopened} alive=${alive}`);
  save();
  return alive;
}

/** Cheap liveness probe: open a short list and close it without selecting. */
async function probe() {
  const r = await openControl({ label: "Farbraum" });
  if (r.ok) await closeControl({ label: "Farbraum" });
  return !!r.ok;
}

const rows = (process.argv[2] ?? "Kodierung,Farbraum,Bitrate,Rahmen,Auflösung").split(",");
const run = {
  started: new Date().toISOString(),
  file: FILE,
  opening: null,
  results: [],
  recoveries: [],
  restore: null,
};
const save = () => fs.writeFileSync(OUT, JSON.stringify(run, null, 2));
save();

ensureDialog();
await sleep(1600);
if (!(await probe())) await recover("at start");
run.opening = values();
save();
console.error(`start: ${JSON.stringify(run.opening)}`);

for (const control of rows) {
  if (!(await probe())) await recover(`before ${control}`);

  const opened = await openControl({ label: control });
  if (!opened.ok) {
    run.results.push({ control, ok: false, error: opened.error });
    console.error(`FAIL open ${control}: ${opened.error}`);
    save();
    continue;
  }
  const options = opened.options.slice();
  await closeControl({ label: control });
  await sleep(400);

  const baseline = snap(); // what the file says before this control's picks
  console.error(
    `\n--- ${control}: before=${JSON.stringify(run.opening?.[control])} options=${JSON.stringify(options)}`,
  );
  run.results.push({ control, options, baseline });

  for (const option of options) {
    if (!(await probe())) await recover(`before ${control}=${option}`);
    const res = await selectOption({ label: control, text: option });
    await sleep(900);
    const readback = res.ok ? values()[control] : null;
    await closeDialog(); // writes the file
    const rec = {
      control,
      option,
      pickOk: !!res.ok,
      pickError: res.error ?? null,
      pickChanged: res.changed ?? null,
      readback,
      persisted: deepDiff(baseline, snap()),
    };
    run.results.push(rec);
    save();
    console.error(
      `  ${String(option).padEnd(26)} ok=${rec.pickOk} readback=${JSON.stringify(readback)}  file: ${
        rec.persisted.length ? rec.persisted.join(" | ") : "(unchanged)"
      }`,
    );
    ensureDialog();
    await sleep(1200);
  }
}

// Put the dialog back the way it was found, by picking every row's opening value back.
const restore = { want: {}, got: null, picks: [] };
for (const [control, value] of Object.entries(run.opening ?? {})) {
  if (!value) continue;
  if (!(await probe())) await recover(`before restore ${control}`);
  const r = await selectOption({ label: control, text: value });
  restore.picks.push({ control, value, ok: !!r.ok, error: r.error ?? null });
  await sleep(700);
  ensureDialog();
}
await sleep(1200);
restore.got = values();
await closeDialog();
run.restore = restore;
run.finished = new Date().toISOString();
save();
console.error(`\nrestore: ${JSON.stringify(restore.got)}`);
console.error(`wrote ${OUT}`);
