/**
 * The `Medienverarbeitung:` group's checkbox rows -- the parsing behind readProcessingGroup.
 *
 * The fixture (tests/fixtures/medienverarbeitung-words.json) is the *actual* word list a probe
 * captured from Studio 6.0.9 with raw dual-lens `.insv` sources open; regenerate it with
 * `node tests/mk-medienverarbeitung-fixture.mjs <capture.png>` (see the file's own note on which
 * media makes the group render at all).
 *
 * What these tests are really guarding: the group's rows have no value cell, so the existing
 * `rowFor` could never see them, and the naive way to find them -- "the lines below the label" --
 * would swallow the dialog's footer. The fixture contains that footer, so the regression is real
 * rather than imagined.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  parseProcessingGroup,
  parseCheckValue,
  checkState,
  checkboxAt,
  matches,
  isTextBox,
  CONTROLS,
  CHECKBOX_MEAN_ABOVE,
  PROCESSING_GROUP,
} from "../src/export-dialog.mjs";

const fixture = JSON.parse(fs.readFileSync("tests/fixtures/medienverarbeitung-words.json", "utf8"));
const words = fixture.checked.words;
const ocr = { words };

test("the group label is found in the real capture", () => {
  const g = parseProcessingGroup(ocr);
  assert.equal(g.ok, true);
  assert.equal(g.found, true);
  assert.equal(g.label, PROCESSING_GROUP);
  // The OCR elides the label to "Medienvera._."; the measured position is the witness.
  assert.equal(g.labelX, 479);
  assert.equal(g.labelY, 634);
});

test("its one rendered row reads its caption off the box glyph", () => {
  const g = parseProcessingGroup(ocr);
  assert.equal(g.rows.length, 1, "one checkbox row rendered on this media");
  const [row] = g.rows;
  // The OCR glues the box onto the caption ("O Optimierung der unteren Naht") and leaves a lone
  // "o" at the right edge of the row; neither is part of the caption.
  assert.equal(row.caption, "Optimierung der unteren Naht");
  assert.equal(row.captionX, 586);
  assert.equal(row.captionY, 634);
});

test("the box and its click point come from the measured offsets", () => {
  const [row] = parseProcessingGroup(ocr).rows;
  // Measured on the capture: the box spans x 566-584, y 633-646, and clicking (576, 640)
  // toggled it (verified by reading the fill back).
  assert.deepEqual(row.box, { x: 566, y: 633, w: 18, h: 14 });
  assert.deepEqual(row.click, { x: 575, y: 640 });
});

test("the same row parses when the box is empty, with the box glyph left of the caption", () => {
  // The unchecked capture is the case the anchor exists for: the OCR reads the empty box as an "O"
  // at x 566, i.e. *left* of the caption. A parser that anchored on the line's minimum x would see
  // an offset of 87 px instead of 107 and drop the row entirely.
  const unchecked = { words: fixture.unchecked.words };
  const g = parseProcessingGroup(unchecked);
  assert.equal(g.rows.length, 1);
  const [row] = g.rows;
  assert.equal(row.caption, "Optimierung der unteren Naht");
  assert.equal(row.captionX, 586, "the anchor is the caption, not the box");
  assert.deepEqual(row.box, { x: 566, y: 633, w: 18, h: 14 });
  assert.deepEqual(row.click, { x: 575, y: 640 });
  // Same geometry in both states, so a caller can click it without knowing the state first.
  assert.deepEqual(row.click, parseProcessingGroup(ocr).rows[0].click);
});

test("the dialog's footer does not become a checkbox row", () => {
  // The fixture carries the footer words ("Größe:" at x 571, "Dauer:" at x 449, the buttons at
  // x 704/843). "Größe:" sits only 15 px left of the caption column, so a parser that accepted
  // "any line below the label" would report it as a row -- and a click on it would do nothing.
  const footer = words.filter((w) => w.y >= 750);
  assert.ok(footer.length >= 4, "the fixture must actually contain footer words");
  const g = parseProcessingGroup(ocr);
  assert.equal(g.rows.length, 1);
  assert.equal(
    g.rows.some((r) => /größe|dauer|exportieren/i.test(r.caption)),
    false,
    "no footer word may be reported as a checkbox caption",
  );
});

test("a second aligned line below the anchor is part of the group", () => {
  // The walk below the anchor: captions that start where the first one did belong to the group.
  const extra = { text: "HDR", x: 586, y: 680, w: 24, h: 10 };
  const g = parseProcessingGroup({ words: [...words, extra] });
  assert.equal(g.rows.length, 2);
  assert.equal(g.rows[1].caption, "HDR");
  assert.deepEqual(g.rows[1].click, { x: 575, y: 686 });
});

test("a caption that starts elsewhere ends the group", () => {
  // 30 px right of the anchor is a different column, not another caption: the group stops.
  const stray = { text: "weiter", x: 616, y: 680, w: 36, h: 10 };
  const g = parseProcessingGroup({ words: [...words, stray] });
  assert.equal(g.rows.length, 1);
});

test("a dialog without the group says why, instead of reporting no rows", () => {
  // On already-stitched .mp4 sources the group is absent entirely (C4 in the backlog) -- the
  // answer has to name that, or a caller reads "no rows" as "nothing is enabled".
  const g = parseProcessingGroup({ words: words.filter((w) => !/^medienvera/i.test(w.text)) });
  assert.equal(g.ok, false);
  assert.equal(g.found, false);
  assert.match(g.reason, /raw\s+dual-lens \.insv/);
});

test("the fill decides checked, at the measured threshold", () => {
  assert.equal(checkState(136.0), "checked"); // measured filled
  assert.equal(checkState(69.2), "unchecked"); // measured empty
  assert.equal(checkState(CHECKBOX_MEAN_ABOVE), "checked");
  assert.equal(checkState(CHECKBOX_MEAN_ABOVE - 0.1), "unchecked");
  assert.equal(checkState(0), "unchecked");
});

test("the offsets are the caption's, so a moved row follows it", () => {
  assert.deepEqual(checkboxAt({ x: 600, y: 700 }).click, { x: 589, y: 706 });
  assert.deepEqual(checkboxAt({ x: 600, y: 700 }).box, { x: 580, y: 699, w: 18, h: 14 });
});

test("a checkbox request is parsed in both vocabularies, and refused otherwise", () => {
  // The dialog is German, the export job's metadata English -- the caller picks either.
  for (const word of ["checked", "check", "on", "true", "wahr", "ja", "aktiv", "an", "ein", "1"]) {
    assert.equal(parseCheckValue(word), "checked", word);
  }
  for (const word of ["unchecked", "off", "false", "falsch", "nein", "inaktiv", "aus", "0"]) {
    assert.equal(parseCheckValue(word), "unchecked", word);
  }
  // Case and spacing are not the caller's problem.
  assert.equal(parseCheckValue("  AUS "), "unchecked");
  assert.equal(parseCheckValue("An"), "checked");
  // Anything else is refused rather than guessed at: an option text is not a checkbox word.
  for (const word of ["H.265", "h265", "yes", "", null, undefined, "checked!"]) {
    assert.equal(parseCheckValue(word), null, String(word));
  }
});

test("the caption is not a dialog label or a text field, so the tool routes it to the checkbox", () => {
  // studio_ui_export_set picks its path from the control's *name* (a label? a text field?) and
  // falls back to the checkbox for anything else. These are the three facts that decide it: if
  // the caption ever became a label, the setter would try to open a list box on it instead.
  const caption = "Optimierung der unteren Naht";
  assert.equal(CONTROLS.some((label) => matches(label, caption)), false, "the caption is not in the label column");
  assert.equal(isTextBox(caption), false, "and it is not one of the two text fields");
  // The real labels still route the old way, so the fallback cannot swallow them.
  assert.equal(CONTROLS.some((label) => matches(label, "Kodierung")), true);
  assert.equal(isTextBox("Dateiname"), true);
  // The group's own name is not a label either -- it names a *group*, not a control.
  assert.equal(CONTROLS.some((label) => matches(label, PROCESSING_GROUP)), false);
});
