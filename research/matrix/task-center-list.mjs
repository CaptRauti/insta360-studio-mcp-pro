// The Task Center panel: map it, read its list, and clear the queue I left behind.
//
// Measured 2026-11-27: the title-bar icon at (1019,18) opens it; the panel shows a heading
// `Aufgaben-Center`, category rows (`Lokaler Export`, `Cloud-Export`, `Download`,
// `Freigabe verwalten`) and header buttons `Alle starten` / `Alle pausieren` / `Alle löschen`.
// Two queued jobs from the earlier probes are sitting in it (enqueued 08:30:38 and 08:31:59,
// both auto_start: 0) -- this reads the list and then clears it, so nothing is left pending.
//
// Run: node research/matrix/task-center-list.mjs

import { capture, click, sleep, uiState } from "../../src/ui.mjs";
import { ocrImage, findText } from "../../src/ocr.mjs";
import { zoomOcr } from "../../src/export-dialog.mjs";
import { readLogTail } from "../../src/logs.mjs";

const TITLE = "Insta360 Studio";
const SESSION_LOG =
  "C:/Users/stefa/AppData/Local/Insta360/Insta360 Studio/log/studio/2026_11_26_22_07_39_10844/2026_11_26_22_07_39_10844.log";
const TASK_CENTER_ICON = { x: 1019, y: 18 };

const logTail = async () => {
  const r = await readLogTail({ file: SESSION_LOG, lines: 150 });
  return (r?.lines ?? []).map((l) => String(l));
};
const log = (label, v) => console.error(`${label} ${typeof v === "string" ? v : JSON.stringify(v)}`);
const words = (p) => (ocrImage(p).words ?? []).map((w) => `${w.text}@${w.x},${w.y}`);

const out = { at: new Date().toISOString() };

// 1. open the panel
const before = await logTail();
click({ title: TITLE, x: TASK_CENTER_ICON.x, y: TASK_CENTER_ICON.y });
await sleep(2500);
const after = await logTail();
out.openedLogLines = after.filter((l) => !before.includes(l)).slice(0, 10);
const shot = capture({ title: TITLE });
out.shotOpen = shot.path;
log("open log lines:", out.openedLogLines);

// 2. read it: plain + zoomed regions
const plain = ocrImage(shot.path);
out.plainWords = (plain.words ?? []).map((w) => `${w.text}@${w.x},${w.y}`);
log("plain words:", out.plainWords.length);

const regions = [
  ["panel-left", { x: 0, y: 64, w: 400, h: 460 }],
  ["panel-mid", { x: 260, y: 64, w: 560, h: 460 }],
  ["panel-wide", { x: 0, y: 64, w: 900, h: 500 }],
];
out.zoom = {};
for (const [tag, box] of regions) {
  try {
    const z = zoomOcr(shot.path, box);
    out.zoom[tag] = (z.words ?? []).map((w) => `${w.text}@${w.x},${w.y}`);
    log(`zoom4 ${tag}:`, out.zoom[tag].slice(0, 60));
  } catch (e) {
    out.zoom[tag] = `failed: ${e.message}`;
    log(`zoom4 ${tag} failed:`, e.message);
  }
}

// 3. clear: click `Alle löschen`
const clearBtn = findText(plain, "löschen").filter((w) => /löschen/i.test(w.text))[0] ?? null;
out.clearButton = clearBtn ? { text: clearBtn.text, x: clearBtn.x, y: clearBtn.y } : null;
// The label sits inside the button; click its centre if the box is known, else the word.
const clickPoint = clearBtn
  ? { x: clearBtn.x, y: clearBtn.y }
  : { x: 631, y: 211 }; // measured fallback: `löschen` label of `Alle löschen`
out.clearClick = clickPoint;

const beforeClear = await logTail();
click({ title: TITLE, x: clickPoint.x, y: clickPoint.y });
await sleep(3000);
const afterClear = await logTail();
out.clearLogLines = afterClear.filter((l) => !beforeClear.includes(l)).slice(0, 25);
log("after clear, new log lines:", out.clearLogLines);

const shot2 = capture({ title: TITLE });
out.shotAfterClear = shot2.path;
const plain2 = ocrImage(shot2.path);
out.wordsAfterClear = (plain2.words ?? []).map((w) => `${w.text}@${w.x},${w.y}`);
log("words after clear:", out.wordsAfterClear.length);

// 4. close the panel again
click({ title: TITLE, x: 1053, y: 18 });
await sleep(1500);
const closed = await logTail();
out.closeLogLines = closed.filter((l) => !afterClear.includes(l)).slice(0, 6);
log("after close, new log lines:", out.closeLogLines);
out.dialogOpenAtEnd = uiState({ title: TITLE }).dialogOpen;

console.log(JSON.stringify(out, null, 2));
