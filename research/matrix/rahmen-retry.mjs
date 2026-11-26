// C1 residual, last gap: the six explicit frame rates in the `Rahmen` list.
//
// option-effects2.mjs walked the whole matrix but five of six rates came back
// ok:false — and even the one that returned ok:true (`24.00`) left the row reading
// `Die Bildrate des Projekts anpassen`, which is either a selection that did not
// stick or a readback that does not report the rate. Both are worth knowing, and a
// readback cannot tell them apart, so this runner records OCR words of the settings
// strip next to the field readback, and recovers (close/reopen the export dialog)
// before every attempt instead of only after `Auflösung`.
//
//   node research/matrix/rahmen-retry.mjs
import fs from "node:fs";

import { closeControl, openControl, readDialog, selectOption } from "../../src/export-dialog.mjs";
import { click, sendKeys, sleep, uiState } from "../../src/ui.mjs";

const OUT = new URL(".", import.meta.url).pathname.replace(/^\//, "");
const log = { started: null, attempts: [], restored: null };
const save = () => fs.writeFileSync(OUT + "rahmen-retry.json", JSON.stringify(log, null, 1));
const values = () => {
  const { fields } = readDialog({});
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.value]));
};

// The settings strip only: words right of x=980, so the saved OCR stays small and
// still contains every label/value row. `uiState` has no raw `words` — its OCR text
// arrives as `dialogLabels` (the dialog's own label scan).
const strip = () => {
  const r = uiState({});
  const words = (r.dialogLabels ?? []).filter((w) => (w.x ?? 0) >= 980);
  const v = values();
  return { rahmen: v.Rahmen, auflösung: v.Auflösung, screenshot: r.screenshot, words: words.map((w) => `${w.text}@${w.y}`) };
};

function ensureDialog() {
  const s = uiState({});
  if (s.dialogOpen) return false;
  const btn = s.toolbarExport;
  if (!btn) throw new Error("no export button in the toolbar — is a project open?");
  click({ x: btn.cx, y: btn.cy });
  return true;
}

async function probe() {
  const r = await openControl({ label: "Farbraum" });
  if (r.ok) await closeControl({ label: "Farbraum" });
  return !!r.ok;
}

// Recover by closing and reopening the dialog, then prove the panel is alive again.
async function recover(reason) {
  if (uiState({}).dialogOpen) {
    sendKeys({ keys: "{ESC}" });
    await sleep(1400);
  }
  const reopened = ensureDialog();
  await sleep(1800);
  const alive = await probe();
  console.error(`recover(${reason}): reopened=${reopened} alive=${alive}`);
  return alive;
}

ensureDialog();
await sleep(1800);
log.started = values();
save();

const rates = ["Die Bildrate des Projekts anpassen - 6000", "24.00", "25.00", "29.97", "30.00", "50.00", "59.94"];
const texts = ["Die Bildrate des Projekts anpassen", "24.00", "25.00", "29.97", "30.00", "50.00", "59.94"];
const opened = await openControl({ label: "Rahmen" });
const board = (opened.options ?? []).slice();
await closeControl({ label: "Rahmen" });
console.error(`Rahmen list: ${JSON.stringify(board)}`);
if (!opened.ok) await recover("open Rahmen");

for (let i = 0; i < texts.length; i++) {
  if (!(await probe())) await recover(`before Rahmen=${texts[i]}`);

  const tries = [];
  let ok = false;
  for (const label of [texts[i], rates[i]]) {
    const res = await selectOption({ label: "Rahmen", text: label });
    await sleep(1200);
    const state = strip();
    tries.push({ tried: label, ok: !!res.ok, err: res.error ?? null, after: state });
    console.error(`Rahmen = ${label}: ok=${res.ok} readback=${state.rahmen} ocr=${JSON.stringify(state.words)}`);
    save();
    if (res.ok) { ok = true; break; }
    if (!(await probe())) await recover(`after failed Rahmen=${label}`);
  }
  log.attempts.push({ want: texts[i], ok, tries });
  save();
}

if (!(await probe())) await recover("before reset");
const reset = await selectOption({ label: "Voreinstellung", text: "Quellauflösung übernehmen" });
await sleep(1800);
log.restored = values();
log.resetOk = !!reset.ok;
console.error(`reset=${reset.ok} -> ${JSON.stringify(log.restored)}`);
save();
console.error(`wrote ${OUT}rahmen-retry.json`);
