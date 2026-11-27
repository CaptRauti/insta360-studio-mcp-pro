// Which title-bar icon opens the Task Center?
//
// Measured: the title bar's right side holds the `Exportieren` button (x≈1207) plus three
// textless icon buttons (x≈904, 1019, 1053 — OCR reads them as `o`, `00`, `g`). The Task Center
// panel (qrc:/qml/project_tab/task_center/*) must be reachable somehow; the log never shows it
// opening. So: click each candidate, watch the *log* for a new line (a QML page load, a popup
// count, a task_center call) and the *screen* for new text, then close whatever appeared.
//
// Run: node research/matrix/task-center-probe.mjs

import { capture, click, sendKeys, sleep, uiState } from "../../src/ui.mjs";
import { ocrImage } from "../../src/ocr.mjs";
import { readLogTail } from "../../src/logs.mjs";

const TITLE = "Insta360 Studio";
const SESSION_LOG =
  "C:/Users/stefa/AppData/Local/Insta360/Insta360 Studio/log/studio/2026_11_26_22_07_39_10844/2026_11_26_22_07_39_10844.log";

const CANDIDATES = [
  { name: "icon-904", x: 904, y: 18 },
  { name: "icon-1019", x: 1019, y: 18 },
  { name: "icon-1053", x: 1053, y: 18 },
];

const logTail = async () => {
  const r = await readLogTail({ file: SESSION_LOG, lines: 120 });
  return (r?.lines ?? []).map((l) => String(l));
};

const words = (path) => (ocrImage(path).words ?? []).map((w) => `${w.text}@${w.x},${w.y}`);

const log = (label, v) => console.error(`${label} ${typeof v === "string" ? v : JSON.stringify(v)}`);
const out = { at: new Date().toISOString(), probes: [] };

const before0 = await logTail();
log("baseline log lines:", before0.length);
out.dialogOpenAtStart = uiState({ title: TITLE }).dialogOpen;

for (const c of CANDIDATES) {
  const before = await logTail();
  const shotBefore = capture({ title: TITLE });
  const wordsBefore = new Set(words(shotBefore.path));

  click({ title: TITLE, x: c.x, y: c.y });
  await sleep(2200);

  const after = await logTail();
  const fresh = after.filter((l) => !before.includes(l));
  const state = uiState({ title: TITLE });
  const shotAfter = capture({ title: TITLE });
  const wordsAfter = words(shotAfter.path);
  const newWords = wordsAfter.filter((w) => !wordsBefore.has(w));

  const probe = {
    candidate: c,
    dialogOpen: state.dialogOpen,
    newLogLines: fresh.slice(0, 25),
    newWords: newWords.slice(0, 40),
    shot: shotAfter.path,
  };
  out.probes.push(probe);
  log(`--- ${c.name} ---`);
  log("new log lines:", fresh.slice(0, 14));
  log("new words on screen:", newWords.slice(0, 25));

  // close whatever opened before trying the next candidate
  sendKeys({ title: TITLE, keys: "{ESC}" });
  await sleep(1600);
  const state2 = uiState({ title: TITLE });
  probe.closedAgain = !state2.dialogOpen;
  log("after ESC dialogOpen:", state2.dialogOpen);
}

console.log(JSON.stringify(out, null, 2));
