// Tests for the OCR layer that gives the UI tools text-based targeting.
//
// findText is pure JS and fully deterministic. ocrImage/ocrLanguages exercise
// the real Windows OCR engine, so they need PowerShell + a recogniser; the
// image they read is generated on the fly, so no fixture is checked in.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { findText, ocrImage, ocrLanguages } from "../src/ocr.mjs";

// --- a synthetic result shaped exactly like ocr.ps1's output -----------------

const RESULT = {
  ok: true,
  lang: "de-DE",
  width: 900,
  height: 260,
  lines: [
    {
      text: "Exportieren",
      words: [{ text: "Exportieren", x: 40, y: 30, w: 140, h: 28 }],
    },
    {
      text: "Auflösung 4K",
      words: [
        { text: "Auflösung", x: 40, y: 130, w: 100, h: 20 },
        { text: "4K", x: 160, y: 130, w: 24, h: 20 },
      ],
    },
  ],
};
RESULT.words = RESULT.lines.flatMap((l) => l.words.map((w) => ({ ...w, line: l.text })));

test("findText matches a single word case-insensitively", () => {
  const hits = findText(RESULT, "exportieren");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].text, "Exportieren");
  assert.equal(hits[0].level, "word");
});

test("findText returns the box centre as the click point", () => {
  const [hit] = findText(RESULT, "Exportieren");
  assert.equal(hit.x, 40 + 140 / 2);
  assert.equal(hit.y, 30 + 28 / 2);
  assert.deepEqual(
    { left: hit.left, top: hit.top, width: hit.width, height: hit.height },
    { left: 40, top: 30, width: 140, height: 28 },
  );
});

test("findText matches a partial word", () => {
  assert.equal(findText(RESULT, "portier").length, 1);
});

test("findText prefers a whole line when the needle contains a space", () => {
  const hits = findText(RESULT, "Auflösung 4K");
  assert.equal(hits.length, 1);
  assert.equal(hits[0].level, "line");
  assert.equal(hits[0].left, 40);
  assert.equal(hits[0].width, 160 + 24 - 40);
  assert.equal(hits[0].x, Math.round(40 + (160 + 24 - 40) / 2));
});

test("findText falls back to words when the spaced needle matches no line", () => {
  const hits = findText(RESULT, "Exportieren 4K");
  assert.equal(hits.length, 0);
});

test("findText returns nothing for an unknown string or empty input", () => {
  assert.deepEqual(findText(RESULT, "Abbrechen"), []);
  assert.deepEqual(findText(RESULT, "  "), []);
  assert.deepEqual(findText({ ok: true, words: [] }, "x"), []);
});

test("findText tolerates OCR that drops umlauts", () => {
  const flat = {
    ok: true,
    lines: [{ text: "Aufloesung", words: [{ text: "Aufloesung", x: 10, y: 10, w: 80, h: 16 }] }],
  };
  flat.words = flat.lines.flatMap((l) => l.words);
  assert.equal(findText(flat, "aufloesung").length, 1);
});

// --- the real engine --------------------------------------------------------

test("ocrLanguages reports at least one installed recogniser", () => {
  const langs = ocrLanguages();
  assert.ok(Array.isArray(langs), "expected an array of language tags");
  assert.ok(langs.length > 0, `no OCR language installed (got ${JSON.stringify(langs)})`);
});

test("ocrImage reads real text out of a generated image", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "insta360-ocr-"));
  const png = path.join(dir, "ui.png").replace(/\\/g, "/");

  const draw = [
    "Add-Type -AssemblyName System.Drawing",
    "$bmp = New-Object System.Drawing.Bitmap 900,260",
    "$g = [System.Drawing.Graphics]::FromImage($bmp)",
    "$g.Clear([System.Drawing.Color]::FromArgb(32,32,34))",
    "$f = New-Object System.Drawing.Font 'Segoe UI',22",
    "$g.DrawString('Exportieren', $f, [System.Drawing.Brushes]::White, 40, 30)",
    "$g.DrawString('Abbrechen', $f, [System.Drawing.Brushes]::White, 40, 90)",
    `$bmp.Save('${png}',[System.Drawing.Imaging.ImageFormat]::Png)`,
    "$g.Dispose(); $bmp.Dispose()",
  ].join("; ");

  execFileSync("powershell", ["-NoProfile", "-Command", draw], { timeout: 60000, windowsHide: true });
  assert.ok(existsSync(png), "test image was not written");

  const result = ocrImage(png);
  assert.equal(result.ok, true, result.error);
  assert.equal(result.width, 900);
  assert.equal(result.height, 260);
  assert.ok(result.words.length >= 2, `expected words, got ${JSON.stringify(result.words)}`);

  const hits = findText(result, "Exportieren");
  assert.equal(hits.length, 1, `expected one hit, got ${JSON.stringify(hits)}`);

  // The click point must land inside the drawn text's neighbourhood.
  assert.ok(hits[0].x > 100 && hits[0].x < 250, `x out of range: ${hits[0].x}`);
  assert.ok(hits[0].y > 20 && hits[0].y < 80, `y out of range: ${hits[0].y}`);
});

test("ocrImage survives characters outside the console code page", () => {
  // Regression: PowerShell's stdout defaulted to the OEM code page (ibm850), so
  // a curly quote read off the UI was best-fit mapped to a bare 0x22 and
  // silently broke the JSON string -- every word came back as "unparsable OCR
  // output". The wrapper must force UTF-8 so non-ASCII survives the pipe.
  const dir = mkdtempSync(path.join(os.tmpdir(), "insta360-ocr-"));
  const png = path.join(dir, "quote.png").replace(/\\/g, "/");

  const draw = [
    "Add-Type -AssemblyName System.Drawing",
    "$bmp = New-Object System.Drawing.Bitmap 900,140",
    "$g = [System.Drawing.Graphics]::FromImage($bmp)",
    "$g.Clear([System.Drawing.Color]::FromArgb(32,32,34))",
    "$f = New-Object System.Drawing.Font 'Segoe UI',28",
    "$g.DrawString(([char]0x201E + 'Projekt-Manager'), $f, [System.Drawing.Brushes]::White, 40, 40)",
    `$bmp.Save('${png}',[System.Drawing.Imaging.ImageFormat]::Png)`,
    "$g.Dispose(); $bmp.Dispose()",
  ].join("; ");

  execFileSync("powershell", ["-NoProfile", "-Command", draw], { timeout: 60000, windowsHide: true });
  assert.ok(existsSync(png), "test image was not written");

  const result = ocrImage(png);
  assert.equal(result.ok, true, `JSON must stay parseable, got: ${result.error}`);

  const text = result.words.map((w) => w.text).join(" ");
  assert.ok(text.includes("Projekt"), `expected the drawn text, got ${JSON.stringify(text)}`);
  assert.ok(
    result.words.some((w) => [...w.text].some((c) => c.codePointAt(0) > 127)),
    `expected a non-ASCII character to survive the pipe, got ${JSON.stringify(text)}`,
  );
});

test("ocrImage reports a missing file instead of throwing", () => {
  const result = ocrImage("C:/definitely/not/here.png");
  assert.equal(result.ok, false);
  assert.match(result.error, /not found/);
});
