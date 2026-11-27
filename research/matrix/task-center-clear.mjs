// Clearing the queue needs a confirmation, and the confirmation is in English.
//
// Measured 2026-11-27: `Alle löschen` opens `Please confirm whether to delete all exporting
// tasks` with `Löschen` and `Abbrechen` -- the app's UI is German but this dialog is not, so a
// text match must cover both. This clicks the confirm and checks the list is empty, then closes
// the panel. It exists to undo the two jobs the earlier probes queued at 08:30:38 / 08:31:59.
//
// Run: node research/matrix/task-center-clear.mjs

import { capture, click, sleep, uiState } from "../../src/ui.mjs";
import { ocrImage } from "../../src/ocr.mjs";
import { zoomOcr } from "../../src/export-dialog.mjs";

const TITLE = "Insta360 Studio";
const TASK_CENTER_ICON = { x: 1019, y: 18 };
const CONFIRM = { x: 688, y: 483 }; // `Löschen` in the confirm dialog (measured)

const log = (label, v) => console.error(`${label} ${typeof v === "string" ? v : JSON.stringify(v)}`);
const words = (p) => (ocrImage(p).words ?? []).map((w) => `${w.text}@${w.x},${w.y}`);
const out = { at: new Date().toISOString() };

// make sure the panel is open
let shot = capture({ title: TITLE });
let w = words(shot.path);
if (!w.some((x) => /Aufgaben-Center/.test(x))) {
  click({ title: TITLE, x: TASK_CENTER_ICON.x, y: TASK_CENTER_ICON.y });
  await sleep(2500);
  shot = capture({ title: TITLE });
  w = words(shot.path);
}
out.panelOpen = w.some((x) => /Aufgaben-Center/.test(x));
log("panel open:", out.panelOpen);
out.wordsBefore = w.filter((x) => /mp4|Warteschlange|Datensätze|^\d+@/.test(x));
log("queue rows before:", out.wordsBefore);

// confirm-dialog button if the dialog is up, else the panel's `Alle löschen`
const hasConfirm = w.some((x) => /Please@/.test(x));
if (hasConfirm) {
  log("confirm dialog already open -> confirming");
} else {
  const clear = w.find((x) => /^löschen@/.test(x)) ?? w.find((x) => /^Alle@6\d\d/.test(x));
  const pt = clear ? { x: Number(clear.split("@")[1].split(",")[0]), y: Number(clear.split("@")[1].split(",")[1]) } : { x: 632, y: 211 };
  log("clicking Alle löschen at:", pt);
  click({ title: TITLE, x: pt.x, y: pt.y });
  await sleep(2000);
}
click({ title: TITLE, x: CONFIRM.x, y: CONFIRM.y });
await sleep(2500);

shot = capture({ title: TITLE });
w = words(shot.path);
out.wordsAfter = w;
out.rowsAfter = w.filter((x) => /mp4|Warteschlange|Datensätze/.test(x));
out.countersAfter = w.filter((x) => /Datensätze/.test(x));
log("after confirm -> rows:", out.rowsAfter);
log("after confirm -> all words:", w);
out.shot = shot.path;

// close the panel: the title-bar icon toggles it
click({ title: TITLE, x: TASK_CENTER_ICON.x, y: TASK_CENTER_ICON.y });
await sleep(1500);
shot = capture({ title: TITLE });
const final = words(shot.path);
out.panelClosedAgain = !final.some((x) => /Aufgaben-Center/.test(x));
out.dialogOpenAtEnd = uiState({ title: TITLE }).dialogOpen;
log("panel closed again:", out.panelClosedAgain, "| dialogOpen:", out.dialogOpenAtEnd);

console.log(JSON.stringify(out, null, 2));
