// C1 residual: finish the option matrix that option-effects.mjs could not walk.
//
// What went wrong there: after the FIRST successful `Auflösung` selection the panel
// stops opening any list box ("list box for ... did not open in time"), so Rahmen,
// Bitrate, Kodierung and Farbraum came back with zero options, and the final reset
// failed too. The strip is not broken — it is stuck for that dialog *state*: closing
// the export dialog and reopening it makes it accept input again (measured).
//
// So this runner recovers instead of giving up: it proves the panel is alive with a
// cheap probe before each control, and closes/reopens the export dialog when it is
// not. Rows keep the incremental save, so a hang on the heavy resolutions still
// leaves every earlier result on disk.
//
//   node research/matrix/option-effects2.mjs
//
// Order matters: the cheap controls first, `Auflösung` last, because `Auflösung` is
// the one that wedges the panel (and 7.6K/8K are heavy to recompute).
import fs from "node:fs";

import { closeControl, openControl, readDialog, selectOption } from "../../src/export-dialog.mjs";
import { click, sleep, uiState } from "../../src/ui.mjs";

const OUT = new URL(".", import.meta.url).pathname.replace(/^\//, "");
const out = { started: null, effects: [], recoveries: [], restored: null, restoreOk: null };
const save = () => fs.writeFileSync(OUT + "option-effects2.json", JSON.stringify(out, null, 1));

const values = () => {
  const { fields } = readDialog({});
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.value]));
};

// Close the export dialog and open it again: the one recovery that is measured to
// restore input handling. `uiState` is the authority on whether it is open -- the
// toolbar button only exists while the dialog is closed.
function ensureDialog() {
  const s = uiState({});
  if (s.dialogOpen) return false;
  const btn = s.toolbarExport;
  if (!btn) throw new Error("no export button in the toolbar — is a project open?");
  click({ x: btn.cx, y: btn.cy });
  return true;
}

async function recover(reason) {
  const before = values();
  const wasOpen = uiState({}).dialogOpen;
  if (wasOpen) {
    const { sendKeys } = await import("../../src/ui.mjs");
    sendKeys({ keys: "{ESC}" });
    await sleep(1400);
  }
  const reopened = ensureDialog();
  await sleep(1600);
  const alive = await probe();
  out.recoveries.push({ reason, esc: wasOpen, reopened, alive, before });
  console.error(`recover(${reason}): esc=${wasOpen} reopened=${reopened} alive=${alive}`);
  save();
  return alive;
}

// Cheap liveness probe: open a short list and close it again without selecting.
async function probe() {
  const r = await openControl({ label: "Farbraum" });
  if (r.ok) await closeControl({ label: "Farbraum" });
  return !!r.ok;
}

ensureDialog();
await sleep(1600);
out.started = values();
console.error(`start: ${JSON.stringify(out.started)}`);
save();

// Cheap first, `Auflösung` last (it is the control that wedges the panel).
const ORDER = ["Kodierung", "Farbraum", "Bitrate", "Rahmen", "Auflösung"];

for (const control of ORDER) {
  if (!(await probe())) await recover(`before ${control}`);

  const opened = await openControl({ label: control });
  if (!opened.ok) {
    const alive = await recover(`open ${control}`);
    out.effects.push({ control, ok: false, error: opened.error, recovered: alive });
    console.error(`FAIL open ${control}: ${opened.error} (recovered=${alive})`);
    save();
    continue;
  }
  const options = opened.options.slice();
  await closeControl({ label: control });
  await sleep(500);

  const entry = { control, ok: true, before: values()[control], options: [] };
  console.error(`--- ${control}: before=${entry.before} options=${JSON.stringify(options)}`);

  for (const option of options) {
    const res = await selectOption({ label: control, text: option });
    await sleep(1000);
    let after = null;
    let readError = null;
    try { after = values(); } catch (e) { readError = e.message; }
    entry.options.push({ option, ok: !!res.ok, err: res.error ?? null, after, readError });
    console.error(`${control} = ${option}: ok=${res.ok} -> ${JSON.stringify(after)}`);
    save();

    // Verify the choice stuck and the panel survived it, instead of assuming.
    if (control === "Auflösung" || readError) {
      const stuck = !(await probe());
      if (stuck) await recover(`after ${control} = ${option}`);
    }
  }
  out.effects.push(entry);
  save();
}

// Reset: `Quellauflösung übernehmen` is the measured full reset of the settings rows;
// the export mode is a separate control and needs its own restore.
if (!(await probe())) await recover("before reset");
const mode = await selectOption({ label: "Exportmodus", text: "Einzelnes Segment" });
await sleep(1000);
const reset = await selectOption({ label: "Voreinstellung", text: "Quellauflösung übernehmen" });
await sleep(2000);
out.restored = values();
out.restoreOk = { mode: !!mode.ok, preset: !!reset.ok };
console.error(`reset mode=${mode.ok} preset=${reset.ok} -> ${JSON.stringify(out.restored)}`);
save();
console.error(`wrote ${OUT}option-effects2.json`);
