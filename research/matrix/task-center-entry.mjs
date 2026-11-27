// Where is the Task Center? The app loads qrc:/qml/project_tab/task_center/* at startup, and
// exporter_manager enqueues export tasks into task_center::CloudExportItemModel, so a UI must
// exist. It is not in the log (no `openTask...` call was ever made), so look at the window:
// the left page list and the title bar, at 4x, for any text entry that could open it.
//
// Run: node research/matrix/task-center-entry.mjs

import { capture, uiState } from "../../src/ui.mjs";
import { ocrImage } from "../../src/ocr.mjs";
import { zoomOcr } from "../../src/export-dialog.mjs";

const TITLE = "Insta360 Studio";
const shot = capture({ title: TITLE });
const state = uiState({ title: TITLE });
console.log("shot:", shot.path, `${shot.width}x${shot.height}`, "dialogOpen:", state.dialogOpen);

const regions = [
  ["left-sidebar", { x: 0, y: 0, w: 260, h: shot.height }],
  ["title-bar", { x: 0, y: 0, w: shot.width, h: 64 }],
  ["title-bar-right", { x: shot.width - 420, y: 0, w: 420, h: 64 }],
  ["left-sidebar-lower", { x: 0, y: Math.round(shot.height / 2), w: 260, h: Math.round(shot.height / 2) }],
];

// plain OCR of everything, so nothing is missed if zoomOcr misbehaves on a region
const plain = ocrImage(shot.path);
const all = (plain.words ?? []).map((w) => `${w.text}@${Math.round(w.x)},${Math.round(w.y)}`);
console.log("plain words:", all.length);
console.log("plain, x<260:", all.filter((w) => Number(w.split("@")[1].split(",")[0]) < 260));
console.log("plain, y<64:", all.filter((w) => Number(w.split("@")[1].split(",")[1]) < 64));

for (const [tag, box] of regions) {
  try {
    const z = zoomOcr(shot.path, box);
    const words = (z.words ?? []).map((w) => `${w.text}@${w.x},${w.y}`).sort((a, b) => a.localeCompare(b));
    console.log(`zoom4 ${tag}:`, JSON.stringify(words));
  } catch (e) {
    console.log(`zoom4 ${tag} failed:`, e.message);
  }
}
