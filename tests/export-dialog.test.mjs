// Unit tests for the export dialog's OCR helpers.
//
// These run without Studio: the samples are the word lists the real Windows OCR
// engine produced for Studio 6.0.9's export dialog, including the two traps that
// broke earlier versions -- stray text far right on the same line, and options
// split into two words.

import assert from "node:assert/strict";
import { test } from "node:test";

import { dropClippedRows, optionRows, rowFor, stripIndicators } from "../src/export-dialog.mjs";

// As OCR reported it: labels at x~478, values at x~575, and unrelated fragments
// at x~1318 on the same visual line as the codec row.
const DIALOG_OCR = {
  words: [
    { text: "Kodierung", x: 478, y: 546, w: 90, h: 14 },
    { text: "h265", x: 575, y: 546, w: 34, h: 13 },
    { text: "erscha_.", x: 1318, y: 552, w: 58, h: 12 },
    { text: "Mana.„", x: 1322, y: 618, w: 44, h: 13 },
    { text: "Auflösung", x: 478, y: 383, w: 82, h: 14 },
    { text: "1080P", x: 575, y: 383, w: 46, h: 13 },
    { text: "-", x: 626, y: 383, w: 8, h: 13 },
    { text: "1920", x: 639, y: 383, w: 34, h: 13 },
    { text: "x", x: 678, y: 383, w: 8, h: 13 },
    { text: "1080", x: 690, y: 383, w: 34, h: 13 },
  ],
};

test("rowFor reads the value cell of a labelled row", () => {
  const row = rowFor(DIALOG_OCR, "Kodierung");
  assert.ok(row, "row not found");
  assert.equal(row.value, "h265");
  assert.equal(row.y, 546);
});

test("rowFor ignores unrelated text far right on the same line", () => {
  // Regression: this fragment used to be folded in as a value cell, dragging the
  // computed click x from 657 to ~997 -- into empty space, so the list box never
  // opened.
  const row = rowFor(DIALOG_OCR, "Kodierung");
  assert.ok(!row.value.includes("erscha_"), `value swallowed stray text: ${row.value}`);
  assert.equal(row.click.x, 657, "click x must stay in the value column");
  assert.equal(row.click.y, 554);
});

test("rowFor joins multi-word values", () => {
  const row = rowFor(DIALOG_OCR, "Auflösung");
  assert.ok(row, "row not found");
  assert.equal(row.value, "1080P - 1920 x 1080");
});

test("rowFor is case-insensitive and returns null for unknown labels", () => {
  assert.ok(rowFor(DIALOG_OCR, "kodierung"));
  assert.equal(rowFor(DIALOG_OCR, "Bitrate"), null);
});

test("optionRows keeps the measured 36 px pitch as separate rows", () => {
  // Real measurements: H.264 y=580, H.265 y=616, ProRes y=652, ProRes 422 LT y=688.
  const rows = optionRows([
    { text: "H.264", x: 612, y: 580, w: 40, h: 12 },
    { text: "H.265", x: 609, y: 616, w: 40, h: 12 },
    { text: "ProRes", x: 606, y: 652, w: 52, h: 12 },
    { text: "422", x: 660, y: 652, w: 26, h: 12 },
    { text: "ProRes", x: 603, y: 688, w: 52, h: 13 },
    { text: "422LT", x: 657, y: 688, w: 34, h: 13 },
  ]);
  assert.deepEqual(rows.map((r) => r.text), ["H.264", "H.265", "ProRes 422", "ProRes 422LT"]);
  assert.deepEqual(rows.map((r) => r.y), [580, 616, 652, 688]);
});

test("optionRows joins words of one option despite vertical jitter", () => {
  // OCR puts words of the same visual row a few pixels apart.
  const rows = optionRows([
    { text: "ProRes", x: 606, y: 652, w: 52, h: 12 },
    { text: "422", x: 660, y: 657, w: 26, h: 12 },
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].text, "ProRes 422");
});

test("optionRows sorts rows top to bottom and reports the topmost y", () => {
  const rows = optionRows([
    { text: "b", x: 610, y: 650, w: 10, h: 10 },
    { text: "a", x: 610, y: 590, w: 10, h: 10 },
  ]);
  assert.deepEqual(rows.map((r) => r.text), ["a", "b"]);
  assert.equal(rows[0].y, 590);
});

test("optionRows drops nothing when a single option is read", () => {
  const rows = optionRows([{ text: "H.265", x: 609, y: 616, w: 40, h: 12 }]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].text, "H.265");
});

test("dropClippedRows removes the fragment the popup clips at its top edge", () => {
  // Measured: the open codec list's box starts at y=594, and its first visible
  // row is the current selection ("H.265") cut off mid-glyph, read as "s/ H.265".
  // The same entry appears in full further down, so the fragment must go.
  const rows = [
    { text: "s/ H.265", x: 606, y: 597, h: 7 },
    { text: "H.264", x: 612, y: 630, h: 12 },
    { text: "H.265", x: 609, y: 666, h: 12 },
    { text: "ProRes 422", x: 606, y: 702, h: 12 },
    { text: "ProRes 422LT", x: 603, y: 738, h: 13 },
  ];
  assert.deepEqual(dropClippedRows(rows, 594).map((r) => r.text),
    ["H.264", "H.265", "ProRes 422", "ProRes 422LT"]);
});

test("dropClippedRows keeps a first row that sits clear of the top edge", () => {
  // The normal case, measured on the same list: first row 32 px below the box top.
  const rows = [
    { text: "H.264", x: 612, y: 580, h: 12 },
    { text: "H.265", x: 609, y: 616, h: 12 },
  ];
  assert.equal(dropClippedRows(rows, 548).length, 2);
});

test("stripIndicators removes the marker glyph from the selected row", () => {
  // Measured: the row holding the current value draws its marker at x 587 while
  // every option text starts at x 603-610, so OCR prepends the stray token "s/".
  const rows = optionRows([
    { text: "H.264", x: 610, y: 633, w: 40, h: 10 },
    { text: "s/", x: 587, y: 669, w: 12, h: 11 },
    { text: "H.265", x: 609, y: 669, w: 40, h: 11 },
    { text: "ProRes", x: 608, y: 705, w: 52, h: 11 },
    { text: "422", x: 660, y: 705, w: 26, h: 11 },
    { text: "ProRes", x: 607, y: 741, w: 52, h: 11 },
    { text: "422LT", x: 657, y: 741, w: 34, h: 11 },
  ]);
  assert.deepEqual(stripIndicators(rows).map((r) => r.text),
    ["H.264", "H.265", "ProRes 422", "ProRes 422LT"]);
});

test("stripIndicators leaves rows untouched when no marker is drawn", () => {
  const rows = optionRows([
    { text: "1080P", x: 609, y: 427, w: 46, h: 10 },
    { text: "2K", x: 606, y: 463, w: 24, h: 10 },
  ]);
  assert.deepEqual(stripIndicators(rows).map((r) => r.text), ["1080P", "2K"]);
});

test("dropClippedRows drops the clipped row even when it is the current value", () => {
  // Measured on the resolution list: the clipped fragment spells the selected
  // option ("Benutzerdefiniert"), which is also listed below in full.
  const rows = [
    { text: "utzeraetlmert", x: 606, y: 387, h: 6 },
    { text: "1080P - 1920 x 1080", x: 609, y: 421, h: 12 },
    { text: "Benutzerdefiniert", x: 606, y: 529, h: 12 },
  ];
  assert.deepEqual(dropClippedRows(rows, 385).map((r) => r.text),
    ["1080P - 1920 x 1080", "Benutzerdefiniert"]);
});
