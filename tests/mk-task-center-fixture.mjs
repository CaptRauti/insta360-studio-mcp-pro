// Builds tests/fixtures/task-center-words.json from the *real* OCR captures that the probes in
// research/matrix/ produced. Run once, after re-running those probes if the fixture is stale:
//   node tests/mk-task-center-fixture.mjs
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const T = process.env.TMPDIR || os.tmpdir();
const list = JSON.parse(fs.readFileSync(path.join(T, "tc-list.json"), "utf8"));
const clear = JSON.parse(fs.readFileSync(path.join(T, "tc-clear.json"), "utf8"));

const parse = (arr) =>
  arr.map((s) => {
    const m = /^(.*)@(\d+),(\d+)$/.exec(s);
    if (!m) throw new Error(`unparsable word: ${s}`);
    return { text: m[1], x: Number(m[2]), y: Number(m[3]) };
  });

// Measured 4x zoom of the confirmation dialog (window-relative px), transcribed from the probe.
const confirmWords = [
  ["O", 514, 398],
  ["Alarm", 540, 399],
  ["schlange", 892, 421],
  ["Please", 541, 429],
  ["confirm", 581, 429],
  ["whether", 629, 429],
  ["to", 679, 430],
  ["delete", 695, 429],
  ["all", 735, 429],
  ["exporting", 752, 429],
  ["tasks", 813, 429],
  ["Löschen", 688, 483],
  ["Abbrechen", 782, 483],
  ["schlange", 892, 489],
].map(([text, x, y]) => ({ text, x, y }));

const fixture = {
  _note:
    "Real OCR word lists captured from Studio's window on 2026-11-27 (window 1384x900 at screen 352,132). Nothing here is synthesised; coordinates are window-relative pixels.",
  _sources: {
    taskCenterTwoQueued:
      "plain OCR of the window showing the Task Center with two queued jobs (research/matrix/task-center-list.mjs)",
    taskCenterAfterClear:
      "plain OCR right after confirming the deletion (research/matrix/task-center-clear.mjs)",
    queueConfirmZoom: "4x zoom OCR of the confirmation dialog",
  },
  taskCenterTwoQueued: parse(list.plainWords),
  taskCenterAfterClear: parse(clear.wordsAfter),
  queueConfirmZoom: confirmWords,
};

const out = path.join("tests", "fixtures", "task-center-words.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(fixture, null, 2) + "\n");
console.log(
  `wrote ${out}: ${fixture.taskCenterTwoQueued.length} / ${fixture.taskCenterAfterClear.length} / ${confirmWords.length} words`,
);
