/**
 * Export queue tests -- the OCR parsing behind readQueue/clearQueue/addToQueue.
 *
 * The fixtures in tests/fixtures/task-center-words.json are the *actual* word lists the probes
 * captured from Studio (see tests/mk-task-center-fixture.mjs for provenance). Two cases say so
 * explicitly where a list had to be assembled rather than captured.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  parseTaskCenter,
  parseQueueConfirm,
  findQueueButton,
  taskCenterIconFor,
} from "../src/export-queue.mjs";

const fixture = JSON.parse(fs.readFileSync("tests/fixtures/task-center-words.json", "utf8"));
const { taskCenterTwoQueued, taskCenterAfterClear, queueConfirmZoom } = fixture;

test("the Task Center with two queued jobs reads as a queue of two", () => {
  const q = parseTaskCenter(taskCenterTwoQueued);
  assert.equal(q.panelOpen, true, "the heading should be recognised");
  assert.equal(q.heading, "Aufgaben-Center");
  assert.deepEqual(q.sections, ["Lokaler Export", "Cloud-Export", "Download", "Freigabe verwalten"]);
  assert.equal(q.count, 2, "the count is the number left of `Export-Datensätze`");
  assert.equal(q.countKnown, true);
  assert.equal(q.empty, false);
  assert.equal(q.rows.length, 2, `expected two rows, got ${JSON.stringify(q.rows)}`);
});

test("a queued row carries its size and its status", () => {
  const q = parseTaskCenter(taskCenterTwoQueued);
  for (const row of q.rows) {
    assert.equal(row.size, "1.50GB", `row ${row.file} lost its size`);
    assert.equal(row.status, "Warteschlange", `row ${row.file} lost its status`);
  }
});

test("plain OCR truncates long file names, and the parser does not invent the missing part", () => {
  // Measured: the plain pass yields `(2).mp4` at x=623 while the 4x pass resolves the full
  // `VID_20260917_192757_00_001(2).mp4`. So the parser must pass the truncated text through
  // rather than completing it -- readQueue prefers the 4x rows for exactly this reason.
  const q = parseTaskCenter(taskCenterTwoQueued);
  assert.deepEqual(
    q.rows.map((r) => r.file).sort(),
    ["(2).mp4", "(3).mp4"],
    "the plain pass is expected to be truncated; readQueue swaps in the zoomed rows",
  );
});

test("an empty queue reads as empty and has no count", () => {
  const q = parseTaskCenter(taskCenterAfterClear);
  assert.equal(q.panelOpen, true);
  assert.equal(q.empty, true, "`Es sind keine lokalen Exportaufgaben in Arbeit` means empty");
  assert.deepEqual(q.rows, []);
  assert.equal(q.count, null, "the UI drops the number when the queue is empty");
  assert.equal(q.countKnown, false);
  // A stray `3` sits to the *right* of the label in this state; it is not the queue length.
  assert.ok(taskCenterAfterClear.some((w) => w.text === "3" && w.x > 640), "fixture still has the decoy");
});

test("a full file name with a status on its own line parses as one row (matcher case, not a capture)", () => {
  const words = [
    { text: "Aufgaben-Center", x: 631, y: 149 },
    { text: "VID_20260917_192757_00_001(2).mp4", x: 448, y: 407 },
    { text: "1.50GB", x: 762, y: 407 },
    { text: "Warteschlange", x: 856, y: 421 },
  ];
  const q = parseTaskCenter(words);
  assert.equal(q.rows.length, 1);
  assert.equal(q.rows[0].file, "VID_20260917_192757_00_001(2).mp4");
  assert.equal(q.rows[0].status, "Warteschlange");
});

test("the panel's header buttons are found by their labels", () => {
  const q = parseTaskCenter(taskCenterTwoQueued);
  assert.equal(q.buttons.start.text, "starten");
  assert.equal(q.buttons.pause.text, "pausieren");
  assert.equal(q.buttons.clear.text, "löschen");
  // measured positions, on the header row above the queue
  assert.equal(q.buttons.start.y, 212);
  assert.equal(q.buttons.clear.x, 631);
});

test("the delete confirmation is recognised, in English, with its two buttons", () => {
  const c = parseQueueConfirm(queueConfirmZoom);
  assert.equal(c.shown, true);
  assert.match(c.prompt, /confirm/i);
  assert.match(c.prompt, /delete all exporting tasks/i);
  assert.equal(c.confirm.text, "Löschen");
  assert.equal(c.confirm.x, 688);
  assert.equal(c.confirm.y, 483);
  assert.equal(c.cancel.text, "Abbrechen");
  assert.equal(c.cancel.x, 782);
});

test("with the panel still on screen, the confirmation wins over the panel's own `löschen`", () => {
  // The panel has `Alle löschen` at y=211; the dialog has `Löschen` at y=483. Clicking the wrong
  // one would just re-open the dialog, so the dialog's button must be the one chosen.
  const combined = [...taskCenterTwoQueued, ...queueConfirmZoom];
  const c = parseQueueConfirm(combined);
  assert.equal(c.confirm.x, 688, "must pick the dialog's button, not the panel's");
  assert.equal(c.confirm.y, 483);
});

test("no confirmation on screen means no confirmation", () => {
  const c = parseQueueConfirm(taskCenterTwoQueued);
  assert.equal(c.shown, false);
  assert.equal(c.confirm, null);
});

test("the queue button in the export dialog is found from its truncated label", () => {
  // The button is narrower than its label, so the plain pass reads `Zur` and 4x reads
  // `Wartes...`. Anything below y=700 is the dialog's button row.
  const withStem = [
    { text: "Wartes...", x: 640, y: 789 },
    { text: "Exportieren", x: 820, y: 789 },
  ];
  assert.deepEqual(findQueueButton(withStem), { text: "Wartes...", x: 640, y: 789 });

  const withZur = [{ text: "Zur", x: 636, y: 789 }];
  assert.equal(findQueueButton(withZur).text, "Zur");

  // a `Zur` higher up the dialog is not the button row
  assert.equal(findQueueButton([{ text: "Zur", x: 636, y: 300 }]), null);
  assert.equal(findQueueButton([]), null);
});

test("the Task Center icon is anchored on the export label, else on the measured fraction", () => {
  const anchored = taskCenterIconFor({ width: 1384, height: 900, words: taskCenterTwoQueued });
  assert.equal(anchored.source, "export-label-anchor");
  assert.equal(anchored.x, 1020, "the label sits at x=1208, the icon 188 px to its left");
  assert.equal(anchored.y, 18);

  const fractional = taskCenterIconFor({ width: 1384, height: 900, words: [] });
  assert.equal(fractional.source, "measured-fraction");
  assert.equal(fractional.x, 1019, "1019/1384 of the width");
  assert.equal(fractional.y, 18);

  // a different window size scales the fallback, and the neighbours stay clickable candidates
  const smaller = taskCenterIconFor({ width: 1280, height: 800, words: [] });
  assert.equal(smaller.x, Math.round((1019 / 1384) * 1280));
  assert.equal(smaller.y, Math.round((18 / 900) * 800));
  assert.equal(smaller.fallbacks.length, 4);
});
