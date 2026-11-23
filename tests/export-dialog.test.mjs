// Unit tests for the export dialog's OCR helpers.
//
// These run without Studio: the samples are the word lists the real Windows OCR
// engine produced for Studio 6.0.9's export dialog, including the two traps that
// broke earlier versions -- stray text far right on the same line, and options
// split into two words.

import assert from "node:assert/strict";
import { test } from "node:test";

import { dropClippedRows, matches, optionRows, rowFor, stripIndicators } from "../src/export-dialog.mjs";
import { DIALOG_LABELS, looksLikeExportDialog } from "../src/ui.mjs";

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

test("dropClippedRows removes the fragment at the crop's top edge", () => {
  // Measured: the open codec list's box starts at y=594 and the field's own
  // value line overhangs it, so its glyph bottoms are read as "s/ H.265" with a
  // height of 7 px instead of a whole row's 12. The entry appears in full lower
  // down, so the fragment must go.
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

test("the measured resolution list: value line out, four options in", () => {
  // Real rows read off the Auflösung list with "Benutzerdefiniert" selected, box
  // top y=385: the overhanging value line at dy=0 with a cut glyph height, then
  // the four options at dy 42/78/114/149.
  const rows = [
    { text: "- IYZU X 1", x: 614, y: 385, h: 8 },
    { text: "1080P - 1920 x 1080", x: 609, y: 427, h: 10 },
    { text: "2K - 2560 x 1440", x: 608, y: 463, h: 10 },
    { text: "4K - 3840 x 2160", x: 608, y: 499, h: 10 },
    { text: "Benutzerdefiniert", x: 609, y: 534, h: 11 },
  ];
  assert.deepEqual(dropClippedRows(rows, 385).map((r) => r.text), [
    "1080P - 1920 x 1080",
    "2K - 2560 x 1440",
    "4K - 3840 x 2160",
    "Benutzerdefiniert",
  ]);
});

test("the top-edge margin only reaches into the gap above the first option", () => {
  // The threshold is 20 px: the first real option sits 32-42 px below the box
  // top, so the margin must not creep up to it even if the box is measured a few
  // pixels too high.
  const rowAt = (dy) => [{ text: "H.264", x: 612, y: 400 + dy, h: 12 }];
  assert.equal(dropClippedRows(rowAt(20), 400).length, 0, "20 px is still the fragment band");
  assert.equal(dropClippedRows(rowAt(21), 400).length, 1, "21 px is clear of it");
  assert.equal(dropClippedRows(rowAt(32), 400).length, 1, "measured first option is kept");
});

test("rowFor finds the value column in a window twice the measured size", () => {
  // Real OCR from a 2576x1408 Studio window (the layout everything was first
  // measured on was 1384x900). The labels moved from x~478 to x~1074 and the
  // values from x~575 to x~1171, while the label-to-value distance stayed at
  // 97 px -- an absolute right-edge bound of 700 therefore found *nothing* and
  // every control read as "not found". The bound is label-relative now.
  const ocr = {
    width: 2576,
    height: 1408,
    words: [
      { text: "Auflösung", x: 1074, y: 637, w: 61, h: 13 },
      { text: "1080P", x: 1171, y: 637, w: 42, h: 12 },
      { text: "-", x: 1209, y: 637, w: 8, h: 12 },
      { text: "1920", x: 1219, y: 637, w: 32, h: 12 },
      { text: "x", x: 1250, y: 637, w: 8, h: 12 },
      { text: "1080", x: 1261, y: 637, w: 32, h: 12 },
      { text: "Mana.„", x: 2506, y: 637, w: 42, h: 12 },
    ],
  };
  const row = rowFor(ocr, "Auflösung");
  assert.ok(row, "the label's row must be found");
  assert.equal(row.value, "1080P - 1920 x 1080");
  assert.equal(row.click.x, 1253, "click lands in the value cell, not on the stray text");
});

test("rowFor still bounds the row at the reference window size", () => {
  // Same rule at 1384x900, where the stray text sits at x~1318.
  const ocr = {
    width: 1384,
    height: 900,
    words: [
      { text: "Kodierung", x: 478, y: 600, w: 52, h: 11 },
      { text: "H.265", x: 575, y: 600, w: 34, h: 11 },
      { text: "unrelated", x: 1318, y: 600, w: 60, h: 11 },
    ],
  };
  const row = rowFor(ocr, "Kodierung");
  assert.equal(row.value, "H.265");
  assert.equal(row.click.x, 657);
});

test("looksLikeExportDialog needs two of the dialog's own labels", () => {
  // An accent "Exportieren" box exists in the window with the dialog closed as
  // well as with it open, so the labels are the discriminator -- and one lone
  // label is not enough to call it.
  assert.equal(looksLikeExportDialog([]), false);
  assert.equal(looksLikeExportDialog(["Exportieren"]), false);
  assert.equal(looksLikeExportDialog(["Auflösung"]), false);
  assert.equal(looksLikeExportDialog(["Auflösung", "Kodierung"]), true);
  assert.equal(DIALOG_LABELS.includes("Auflösung"), true);
  assert.equal(DIALOG_LABELS.includes("Exportieren"), false, "that one is not dialog-only");
});

test("matches tolerates the OCR engine's confusions in this dialog", () => {
  // All left-hand values are real Windows OCR output from Studio 6.0.9; the
  // right-hand side is what the UI actually displays.
  assert.equal(matches("H265", "H.265"), true, "dropped dot");
  assert.equal(matches("Rec.709 IObit", "Rec.709 10bit"), true, "IObit for 10bit");
  assert.equal(matches("ProRes 422LT", "ProRes 422 LT"), true, "spacing only");
  assert.equal(matches("1080P - 1920 x 1080", "1080P"), true, "prefix request");
});

test("matches stays discriminating between neighbouring options", () => {
  assert.equal(matches("H.264", "H.265"), false);
  assert.equal(matches("ProRes 422", "ProRes 422LT"), false);
  assert.equal(matches("25.00", "50.00"), false);
  // The marked row's misreading is why selectOption short-circuits on the
  // current value instead of matching that row at all.
  assert.equal(matches("1-1.265", "H.265"), false);
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
