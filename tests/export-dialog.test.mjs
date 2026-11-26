// Unit tests for the export dialog's OCR helpers.
//
// These run without Studio: the samples are the word lists the real Windows OCR
// engine produced for Studio 6.0.9's export dialog, including the two traps that
// broke earlier versions -- stray text far right on the same line, and options
// split into two words.

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  clickableRow,
  optionMatch,
  dropClippedRows,
  matches,
  optionRows,
  parseDialogDir,
  preferExact,
  rowFor,
  stripIndicators,
} from "../src/export-dialog.mjs";
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

test("rowFor prefers the dialog's column when the label is read twice", () => {
  // Measured on 6.0.9 with a 360 project open: the project-info panel behind the
  // export dialog carries its own "Rahmen" row (the project's frame rate), at
  // x~1150 with its value at x~1205 -- while the dialog's controls are at x~478.
  // Both rows read "60fps", so only the x tells them apart. The first-match
  // version clicked x=1287 into the panel and the list box never opened.
  const ocr = {
    words: [
      { text: "Rahmen", x: 1152, y: 276, w: 58, h: 14 },
      { text: "60fps", x: 1218, y: 276, w: 38, h: 13 },
      { text: "Rahmen", x: 478, y: 276, w: 58, h: 14 },
      { text: "60fps", x: 545, y: 276, w: 38, h: 13 },
    ],
  };
  const row = rowFor(ocr, "Rahmen");
  assert.ok(row, "row not found");
  assert.equal(row.value, "60fps");
  assert.equal(row.click.x, 627, "click must land in the dialog's value column, not the info panel");
  assert.ok(row.click.x < 1000, `click escaped the dialog: x=${row.click.x}`);
});

test("rowFor skips a label match whose row has no value cells", () => {
  const ocr = {
    words: [
      { text: "Rahmen", x: 1152, y: 276, w: 58, h: 14 }, // panel label with no cells right of it
      { text: "Rahmen", x: 478, y: 276, w: 58, h: 14 },
      { text: "30fps", x: 545, y: 276, w: 38, h: 13 },
    ],
  };
  const row = rowFor(ocr, "Rahmen");
  assert.ok(row, "the dialog row must still be found");
  assert.equal(row.value, "30fps");
});

test("rowFor re-reads a row at zoom when the native pass drops a short value", () => {
  // Measured on 6.0.9: choosing `25.00` in `Rahmen` leaves the row *displaying*
  // `25.00` at x~574, but the native OCR pass returns the label alone — the value
  // word is simply absent — so the row was skipped and `Rahmen` read back as
  // MISSING (or as the project-info panel's own row). The same cell reads cleanly
  // at 4-5x, which is what this fallback does.
  const ocr = {
    words: [
      { text: "Rahmen:", x: 479, y: 429, w: 52, h: 10 }, // no value word beside it
      { text: "Bitrate(Mb...", x: 479, y: 475, w: 80, h: 12 },
    ],
  };
  const regions = [];
  const row = rowFor(ocr, "Rahmen", {
    png: "unused.png",
    reread: (region) => {
      regions.push(region);
      return {
        ok: true,
        words: [
          { text: "Rahmen:", x: 479, y: 429, w: 52, h: 10 },
          { text: "25.00", x: 574, y: 429, w: 30, h: 10 },
        ],
      };
    },
  });
  assert.ok(row, "row not found");
  assert.equal(row.value, "25.00");
  assert.equal(row.click.x, 656, "click must land in the dialog's value column");
  assert.equal(row.zoomed, true, "the fallback must be flagged");
  assert.equal(regions.length, 1, "exactly one zoomed re-read");
  assert.ok(regions[0].x <= 479 && regions[0].w >= 250, `strip must cover the value: ${JSON.stringify(regions[0])}`);
});

test("rowFor does not re-read when the native pass already found the value", () => {
  let called = 0;
  const row = rowFor(DIALOG_OCR, "Kodierung", {
    png: "unused.png",
    reread: () => {
      called += 1;
      return { ok: true, words: [] };
    },
  });
  assert.equal(row.value, "h265");
  assert.equal(called, 0, "the cheap path must not pay for a zoom");
});

test("preferExact picks the bare rate, not the preset header that contains it", () => {
  // Measured on 6.0.9: the Rahmen list is headed by the preset spelled out with its
  // rate. Asking for "50.00" used to match the header first and set the *preset*.
  const rows = [
    { text: "Quellbild-Framerate übernehmen - 50.00", x: 500, y: 100, h: 12 },
    { text: "25.00", x: 500, y: 136, h: 12 },
    { text: "50.00", x: 500, y: 172, h: 12 },
  ];
  assert.equal(preferExact(rows, "50.00").text, "50.00");
  assert.equal(preferExact(rows, "25.00").text, "25.00");
  // without an exact counterpart, containment still matches (the header case)
  assert.equal(preferExact(rows, "Quellbild-Framerate übernehmen").text, "Quellbild-Framerate übernehmen - 50.00");
  assert.equal(preferExact(rows, "TikTok"), null, "no match must stay null");
});

test("optionMatch accepts an option the list box elided", () => {
  // The list box truncates long options the same way the label column does.
  assert.equal(optionMatch("Quellauflösung überneh...", "Quellauflösung übernehmen"), true);
  assert.equal(optionMatch("Voreinstellu...", "Voreinstellung"), true);
  assert.equal(optionMatch("Empfohlen", "Empfohlen"), true);
});

test("optionMatch tolerates the l/1 and o/0 OCR confusions", () => {
  assert.equal(optionMatch("Rec.709 IObit", "Rec.709 10bit"), true);
});

test("optionMatch refuses near misses", () => {
  // A shared six-character prefix is not enough on its own: these differ in the
  // characters that carry the meaning, and picking the wrong codec silently is
  // worse than reporting no match.
  assert.equal(optionMatch("h265", "h264"), false);
  assert.equal(optionMatch("Youtube-Pano", "TikTok-Pano"), false);
  assert.equal(optionMatch("Rec.709 10bit", "Rec.709 8bit"), false);
});

test("rowFor finds a label the QML elided", () => {
  // The left column elides long labels, so the OCR sees "Exportmod..." and an
  // exact-label match finds nothing -- the panel then reads as eight controls
  // when it has nine.
  const ocr = {
    words: [
      { text: "Exportmod...", x: 478, y: 300, w: 78, h: 14 },
      { text: "Einzelnes", x: 570, y: 300, w: 60, h: 13 },
      { text: "Segment", x: 634, y: 300, w: 44, h: 13 },
    ],
  };
  const row = rowFor(ocr, "Exportmodus");
  assert.ok(row, "elided label must still match");
  assert.equal(row.value, "Einzelnes Segment");
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

// The export destination comes from the dialog, so the folder it names has to
// survive OCR: those readings are what a real `Pfad` row looked like.

test("parseDialogDir turns the OCR reading of a folder into a path", () => {
  // Measured: the row read back as "C:/Users/stefa/Desktop".
  assert.equal(parseDialogDir("C:/Users/stefa/Desktop"), "C:\\Users\\stefa\\Desktop");
  // A stray separator or quote is trimmed, not kept.
  assert.equal(parseDialogDir('"C:\\out\\"'), "C:\\out");
  // Backslash read as a pipe: Windows forbids "|", so this is a separator.
  assert.equal(parseDialogDir("C:|Users|stefa|Desktop"), "C:\\Users\\stefa\\Desktop");
  // A UNC share is still absolute.
  assert.equal(parseDialogDir("\\\\srv\\share"), "\\\\srv\\share");
});

test("parseDialogDir refuses anything that cannot be a folder", () => {
  // A relative path would be watched somewhere unpredictable: better no answer,
  // because the caller then falls back and says so.
  assert.equal(parseDialogDir("Desktop"), "");
  assert.equal(parseDialogDir(""), "");
  assert.equal(parseDialogDir(null), "");
  // The label instead of the value, which is what a misread row looks like.
  assert.equal(parseDialogDir("Pfad"), "");
});

// Measured on the 2026-11-26 option sweep: the `Auflösung` list box came back with the
// right labels but no positions, and the pick died inside `click` with a message that
// named neither the control nor the option.

const row = (text, x, y, h = 20) => ({ text, x, y, h });

test("clickableRow picks the matching row that has coordinates", () => {
  const rows = [row("1080P - 1080 x 1920", undefined, undefined), row("1080P - 1080 x 1920", 486, 700)];
  assert.deepEqual(clickableRow(rows, "1080P - 1080 x 1920"), row("1080P - 1080 x 1920", 486, 700));
});

test("clickableRow keeps an exact match over a looser one", () => {
  const rows = [row("2160P", 486, 660), row("1080P", 486, 700)];
  assert.equal(clickableRow(rows, "1080P").text, "1080P");
});

test("clickableRow returns null when nothing matching can be clicked", () => {
  assert.equal(clickableRow([row("2160P", undefined, undefined)], "2160P"), null);
  assert.equal(clickableRow([row("2160P", 1, 2)], "1080P"), null, "no match at all");
  assert.equal(clickableRow([], "1080P"), null);
  assert.equal(clickableRow(undefined, "1080P"), null);
});

test("clickableRow does not invent a position from a half-filled row", () => {
  // Only one of x/y is a bug, not a position: clicking at NaN is exactly the failure
  // this guards against.
  assert.equal(clickableRow([row("H.265", 486, undefined)], "H.265"), null);
  assert.equal(clickableRow([row("H.265", undefined, 700)], "H.265"), null);
});
