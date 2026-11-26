// Drive the controls inside Studio's export dialog.
//
// The dialog is CEF/HTML rendered inside the main window: no UI Automation
// tree and no remote-debugging port, so everything here is screenshot, OCR and
// click. Four things make that work, all of them measured rather than guessed:
//
//  1. The list boxes *toggle*: one click opens, the next closes. Never assume a
//     click opened a list -- check that the region actually changed.
//  2. An opened list box paints a lighter panel over the dialog below it, so the
//     mean gray value of the changed region rises sharply. Measured: 30 when
//     closed, 47.5 when open. That, not OCR, is how "open" is decided; OCR is
//     only used for the option text.
//  3. The full-window OCR pass misreads and misplaces the small option rows --
//     `H.265` came back as `4265` and the row landed ~40 px off its real
//     position, which would click the wrong entry. Option text and coordinates
//     therefore always come from a 4x upscaled crop of the measured region.
//  4. The region itself is obtained by diffing the frames either side of the
//     click, so it is correct for every control and survives a window resize.
//     (Measured for reference: x 566, width 340, top = label y + 2.)

import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { ocrImage } from "./ocr.mjs";
import { capture, clearField, click, sleep, typeAt, windowInfo } from "./ui.mjs";

const FFMPEG = path.join(
  os.homedir(), "AppData", "Local", "hermes", "tools", "ffmpeg-9.0.1-win32-x64", "bin", "ffmpeg.exe",
);
const FFPROBE = FFMPEG.replace(/ffmpeg\.exe$/, "ffprobe.exe");

/** Labels in the dialog's left column; their values sit in the right one. */
// The column is narrow, so the QML elides the longer labels and the OCR reports
// them cut off ("Exportmod...", "Voreinstellu...", "Bitrate(Mb...", "Kodierungs...").
// Matching therefore compares only the first eight characters, which every elided
// form still carries. Measured on 6.0.9: skipping "Exportmodus" meant the tool
// reported eight controls for a panel that has nine.
export const CONTROLS = [
  "Dateiname",
  "Pfad",
  "Exportmodus",
  "Voreinstellung",
  "Auflösung",
  "Rahmen",
  "Bitrate",
  "Kodierung",
  "Farbraum",
];

/** How fast a channel must change to count as content rather than noise. */
const DIFF_THRESHOLD = 24;

// ---------------------------------------------------------------------------
// Pixels
// ---------------------------------------------------------------------------

/** Decode a PNG to an 8-bit gray plane via ffmpeg, so no image lib is needed. */
function grayPlane(png) {
  const [w, h] = execFileSync(FFPROBE, [
    "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
    "-of", "csv=p=0", png,
  ], { encoding: "utf8" }).trim().split(",").map(Number);
  const raw = execFileSync(FFMPEG, ["-v", "error", "-i", png, "-f", "rawvideo", "-pix_fmt", "gray", "-"],
    { maxBuffer: 1 << 28 });
  return { width: w, height: h, raw };
}

/** Mean gray over a rect. The list box's panel raises it well above the dialog. */
function meanRegion(plane, r) {
  let sum = 0;
  let n = 0;
  for (let y = r.y; y < Math.min(r.y + r.h, plane.height); y++) {
    for (let x = r.x; x < Math.min(r.x + r.w, plane.width); x++) {
      sum += plane.raw[y * plane.width + x];
      n++;
    }
  }
  return n ? sum / n : 0;
}

/** Bounding box of the pixels that differ between two equally sized planes. */
function diffBox(a, b) {
  let x0 = a.width;
  let y0 = a.height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < a.height; y++) {
    const base = y * a.width;
    for (let x = 0; x < a.width; x++) {
      const i = base + x;
      if (Math.abs(a.raw[i] - b.raw[i]) > DIFF_THRESHOLD) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

// ---------------------------------------------------------------------------
// OCR
// ---------------------------------------------------------------------------

function snap(title) {
  const file = capture({ title, mode: "print" });
  const ocr = ocrImage(file.path);
  if (!ocr.ok) throw new Error(`OCR failed: ${ocr.error}`);
  return { file, ocr, plane: grayPlane(file.path), planeFile: file.path, ocrRaw: ocr };
}

/** OCR a crop, upscaled, with coordinates mapped back to screenshot space. */
export function zoomOcr(png, { x, y, w, h, factor = 4 } = {}) {
  const out = png.replace(/\.png$/, `-zoom${factor}.png`);
  execFileSync(FFMPEG, [
    "-y", "-v", "error", "-i", png,
    "-vf", `crop=${w}:${h}:${x}:${y},scale=iw*${factor}:ih*${factor}:flags=lanczos`,
    out,
  ], { timeout: 60000 });
  const ocr = ocrImage(out);
  return {
    ok: ocr.ok,
    file: out,
    words: (ocr.words ?? []).map((word) => ({
      text: word.text,
      x: Math.round(x + word.x / factor),
      y: Math.round(y + word.y / factor),
      w: Math.round(word.w / factor),
      h: Math.round(word.h / factor),
    })),
  };
}

// ---------------------------------------------------------------------------
// Dialog reading
// ---------------------------------------------------------------------------

// Where a control's value sits, **relative to its own label**.
//
// The first version of this used absolute pixels taken from a 1384x900 window
// (labels at x~478, values at x~575, "right of 700 is other UI"). Those numbers
// do not survive a bigger window: on a 2576x1408 window the same labels sit at
// x~1074 with their values at x~1171, so the value column fell outside the
// hardcoded bound and **every** control read as "not found" while its label was
// plainly in the OCR.
//
// Measured at both sizes, the offsets from the label are the same: the value
// starts 97 px right of the label, its words run out at ~222 px (1384 wide) and
// ~237 px (2576 wide), and the nearest unrelated text on the row ("Speichern",
// "Mana.„") sits 355-1430 px away. Hence a span of 250 px from the label -- the
// text itself is barely bigger in the larger window, only the layout moved.
const VALUE_SPAN = 250;
/** Row tolerance: 13 px at the reference size, but a taller font needs more. */
const rowTolerance = (lab) => Math.max(13, Math.round((lab.h ?? 12) * 1.5));

/** The label's row: the value cells sitting right of it on the same line. */
export function rowFor(ocr, label) {
  const key = label.toLowerCase().slice(0, 8);
  // A label can be read **twice** in the same window: the dialog's left column
  // and the project-info panel behind it. That panel has a "Rahmen" row of its
  // own — the project's frame rate, `60fps`, so the *value* does not tell them
  // apart either. Measured on 6.0.9 with a 360 project open: the panel's row sits
  // at x~1205 while the dialog's controls are at x~656, and taking the first OCR
  // match clicked 549 px into the panel, where nothing happens ("list box for
  // Rahmen did not open in 4 clicks"). The dialog's own column is the leftmost
  // candidate that actually has value cells beside it, so leftmost wins.
  const labels = ocr.words.filter((w) => w.text.toLowerCase().startsWith(key)).sort((a, b) => a.x - b.x);
  for (const lab of labels) {
    // Bound the right edge relative to the label: the OCR also reads unrelated
    // text far right on the same line (x~1318 on the small layout, x~2506 on the
    // large one), which would drag the cell's centre across the window and click
    // into empty space.
    const cells = ocr.words
      .filter((w) => Math.abs(w.y - lab.y) <= rowTolerance(lab) && w.x > lab.x + lab.w && w.x < lab.x + VALUE_SPAN)
      .sort((a, b) => a.x - b.x);
    if (!cells.length) continue; // e.g. a label whose row is elsewhere on screen
    const x0 = cells[0].x;
    return {
      label,
      y: lab.y,
      // Click into the middle of the cell, not on its text: the boxes are wider
      // than what they display and the arrow sits at the right end.
      click: { x: Math.round(x0 + 82), y: lab.y + 8 },
      value: cells.map((w) => w.text).join(" "),
    };
  }
  return null;
}

/**
 * The controls that are not list boxes, so they take a different code path.
 *
 * `Dateiname` is listed for the dialog variants that have the field at all; the
 * video dialog on 6.0.9 does not.
 */
export const TEXT_FIELDS = ["Dateiname", "Pfad"];

export const isTextBox = (label) => TEXT_FIELDS.includes(label);

/**
 * Controls that open a modal window instead of taking a value in place.
 *
 * Measured on 6.0.9: a click on `Pfad` opens a folder picker called
 * "Ordner öffnen" — a native shell dialog owned by Studio. While it is up it
 * swallows **every** click and keystroke, so the export dialog looks dead: its
 * list boxes stop opening ("did not open in 4 clicks"), and pixel-diffing the
 * dialog shows nothing, because PrintWindow of the parent does not include the
 * picker. That is worth knowing before concluding a control ignores input —
 * check for modal windows of the same process first.
 *
 * So this one is never clicked by the automation: the picker is where the value
 * is chosen, and its own "Ordner:" field rejects a typed path with "Der
 * Ordnername ist ungültig." Driving its list is not built yet.
 */
export const PICKER_FIELDS = ["Pfad"];

export const isPickerField = (label) => PICKER_FIELDS.includes(label);

/** Read every control in the dialog, plus the window rect. */
/**
 * Normalise a folder as the dialog's "Pfad" row reads it.
 *
 * OCR returns it with forward slashes ("C:/Users/stefa/Desktop"), sometimes with
 * a trailing separator and quote marks. Anything that is not an absolute Windows
 * path returns "" -- a folder that cannot exist is worse than no answer, because
 * it would be watched for a file that can never appear there.
 */
export function parseDialogDir(raw) {
  const s = String(raw ?? "")
    .trim()
    .replace(/^["'\u201e\u201c]+|["'\u201e\u201c]+$/g, "")
    .trim()
    // "\" and "|" are the two glyphs OCR gives for a separator, and Windows
    // forbids "|" in a name, so turning it into a separator is never wrong.
    .replace(/[\/|]/g, "\\")
    .replace(/\\+$/, "");
  if (!/^[A-Za-z]:\\/.test(s) && !/^\\\\[^\\]/.test(s)) return "";
  return s;
}

/**
 * The folder the export dialog will write into, as the dialog itself shows it.
 *
 * "Pfad" is a folder picker -- it cannot be typed into, and in quiet mode nothing
 * retypes it -- so the dialog is the only authority on the destination, and this
 * is what `runExport` watches. Returns null when the dialog shows nothing usable,
 * so the caller can fall back and say which it did.
 */
export function dialogOutDir({ title = "Insta360 Studio" } = {}) {
  let raw = null;
  try {
    raw = readDialog({ title }).fields?.Pfad?.value ?? null;
  } catch {
    return null;
  }
  const dir = parseDialogDir(raw);
  if (!dir) return null;
  try {
    if (!statSync(dir).isDirectory()) return null;
  } catch {
    return null;
  }
  return dir;
}

export function readDialog({ title = "Insta360 Studio" } = {}) {
  const frame = snap(title);
  const fields = {};
  for (const name of CONTROLS) {
    const row = rowFor(frame.ocr, name);
    if (row) fields[name] = { value: row.value, click: row.click };
  }
  return { ok: true, window: windowInfo(title), screenshot: frame.planeFile, fields, words: frame.ocr.words };
}

// ---------------------------------------------------------------------------
// List boxes
// ---------------------------------------------------------------------------

/** Fold OCR words into option rows, tolerating the pitch measured at ~36 px. */
export function optionRows(words) {
  const rows = [];
  for (const w of [...words].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const row = rows.find((r) => Math.abs(r.y - w.y) <= 10);
    if (row) {
      row.parts.push(w);
      row.y = Math.min(row.y, w.y);
    } else {
      rows.push({ y: w.y, parts: [w] });
    }
  }
  return rows.map((r) => {
    r.parts.sort((a, b) => a.x - b.x);
    return {
      text: r.parts.map((p) => p.text).join(" ").replace(/\s+/g, " ").trim(),
      parts: r.parts,
      x: Math.min(...r.parts.map((p) => p.x)),
      y: Math.min(...r.parts.map((p) => p.y)),
      h: Math.max(...r.parts.map((p) => p.h)),
    };
  }).sort((a, b) => a.y - b.y);
}

/**
 * Strip the selection marker from the row that holds the current value.
 *
 * That row draws a marker about 20 px left of the text column (measured:
 * "H.265" starts at x 609, the marked row at 587). OCR reads the marker as a
 * stray token and prepends it, giving "s/ H.265". Real option text never starts
 * left of the column every row shares, so that column is the reference.
 */
export function stripIndicators(rows, gap = 10) {
  if (rows.length < 2) return rows;
  const starts = rows.map((r) => r.x).sort((a, b) => a - b);
  const mid = starts.length >> 1;
  const column = starts.length % 2 ? starts[mid] : (starts[mid - 1] + starts[mid]) / 2;
  return rows.map((r) => {
    const parts = r.parts.filter((p) => p.x >= column - gap);
    if (parts.length === r.parts.length) return r;
    return {
      ...r,
      parts,
      x: Math.min(...parts.map((p) => p.x)),
      text: parts.map((p) => p.text).join(" ").replace(/\s+/g, " ").trim(),
    };
  });
}

/** Read the options of an open list box, using a 4x crop of its measured rect. */
export function readOptions(frame, box, factor = 4) {
  // Crop the measured rect exactly. A margin above it would pull in the field's
  // own value line (the box top sits only ~2 px below it), which then shows up
  // as a phantom first option.
  const crop = {
    x: Math.max(0, box.x),
    y: Math.max(0, box.y),
    w: Math.min(box.w, frame.plane.width - box.x),
    h: Math.min(box.h, frame.plane.height - box.y),
  };
  const zoom = zoomOcr(frame.planeFile, { ...crop, factor });
  const rows = stripIndicators(optionRows(zoom.words).filter((o) => o.text));
  return { crop, factor, options: dropClippedRows(rows, crop.y), rows, words: zoom.words };
}

/**
 * Drop rows that hug the crop's top edge.
 *
 * Measured cause, not a guess: the control's **own value line** sits just above
 * the list rectangle and overhangs it by about 8 px, so the crop catches the
 * bottom of those glyphs -- "Benutzerdefiniert" arrives as "utzeraetlmert",
 * "1080P - 1920 x 1080" as "- IYZU X 1", with a glyph height of ~8 px against
 * ~10-11 px for a whole row. The same entry is listed again in full inside the
 * box, so such a row is a fragment, not an option.
 *
 * The margin is 20 px because the first real option sits **32 px** (codec list)
 * to **42 px** (resolution list) below the box top, while the fragment sits at
 * 0-3 px. Five px only ever worked by luck: the box is measured by pixel-diffing
 * two frames, so its top wanders a few px between runs.
 */
export function dropClippedRows(rows, cropY, margin = 20) {
  return rows.filter((r) => r.y - cropY > margin);
}

/**
 * Guarantee a control's list box is open, and return its options.
 *
 * The box toggles, so a click may as easily close as open it. Each attempt
 * clicks and then compares the frames either side: if the changed region got
 * brighter, that click opened the list. Clicks are repeated until one does,
 * because a click that closed the list is just a wasted attempt, not an error.
 */
export async function openControl({ title = "Insta360 Studio", label, attempts = 4 } = {}) {
  let previous = snap(title);
  const row = rowFor(previous.ocr, label);
  if (!row) return { ok: false, error: `control "${label}" not found` };

  for (let attempt = 1; attempt <= attempts; attempt++) {
    click({ title, x: row.click.x, y: row.click.y });
    await sleep(1100);

    const current = snap(title);
    const box = diffBox(previous.plane, current.plane);
    if (box && box.w > 40 && box.h > 40) {
      const before = meanRegion(previous.plane, box);
      const after = meanRegion(current.plane, box);
      if (after > before + 4) {
        // This click opened the list box.
        const { options, rows, crop, words, factor } = readOptions(current, box);
        return {
          ok: true,
          label,
          current: row.value,
          click: row.click,
          box,
          crop,
          factor,
          brightness: { closed: +before.toFixed(1), open: +after.toFixed(1) },
          options: options.map((o) => o.text),
          // `rows` is every row read off the popup (with coordinates), `filtered`
          // is what survived the fragment/marker filters -- keep both so a
          // mis-filtered row can be diagnosed instead of disappearing silently.
          rows,
          filtered: options,
          words,
          attempt,
        };
      }
    }
    previous = current;
  }
  return { ok: false, error: `list box for "${label}" did not open in ${attempts} clicks`, label };
}

/**
 * Close an open list box again by clicking its value cell (the boxes toggle).
 *
 * Leaving one open is not harmless: the next control's value cell can sit under
 * the open list, so the next click lands on an *option* instead of on that
 * control. Measured: probing "Voreinstellung" and then "Kodierung" silently
 * picked a preset and reported a 340x369 list box -- the union of both regions.
 * Close after reading unless an option is about to be clicked.
 */
export async function closeControl({ title = "Insta360 Studio", label, attempts = 4 } = {}) {
  let previous = snap(title);
  const row = rowFor(previous.ocr, label);
  if (!row) return { ok: false, error: `control "${label}" not found` };

  let sawOpen = false;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    click({ title, x: row.click.x, y: row.click.y });
    await sleep(1100);

    const current = snap(title);
    const box = diffBox(previous.plane, current.plane);
    if (box && box.w > 40 && box.h > 40) {
      const before = meanRegion(previous.plane, box);
      const after = meanRegion(current.plane, box);
      if (after > before + 4) sawOpen = true;
      if (sawOpen && after < before - 4) {
        return {
          ok: true,
          label,
          closed: true,
          box,
          brightness: { open: +before.toFixed(1), closed: +after.toFixed(1) },
          attempt,
        };
      }
      if (!sawOpen && after < before - 4) {
        // It was open on entry and this click shut it.
        return { ok: true, label, closed: true, box, brightness: { open: +before.toFixed(1), closed: +after.toFixed(1) }, attempt };
      }
    }
    previous = current;
  }
  // No brightness transition at all over four clicks: not a list box, nothing to close.
  return { ok: true, label, closed: false, isListBox: false };
}

/**
 * Pick an option by text (case-insensitive, whitespace-insensitive substring).
 * Reads the field back afterwards, so a mis-click cannot pass for success.
 *
 * Asking for the value that is already set returns early: the row carrying the
 * current value draws a marker that OCR can glue to the text and misread
 * ("H.265" arrives as "1-1.265"), so that row is the one row not to match
 * against. Every option worth switching to is a different row.
 */
export async function selectOption({ title = "Insta360 Studio", label, text } = {}) {
  const wanted = norm(text);
  const currentValue = readDialog({ title }).fields[label]?.value;
  if (currentValue !== undefined && wanted.length >= 3 && matches(currentValue, text)) {
    return {
      ok: true,
      label,
      picked: currentValue,
      before: currentValue,
      after: currentValue,
      changed: false,
      note: "already the current value",
    };
  }

  const opened = await openControl({ title, label });
  if (!opened.ok) return opened;

  const hits = opened.rows.filter((r) => optionMatch(r.text, text));
  if (!hits.length) {
    // Leave no box open behind us: a failed pick that stays open makes the *next*
    // read report the list's rows as the dialog's values. A second click on the
    // control toggles the popup shut.
    click({ title, x: opened.click.x, y: opened.click.y });
    await sleep(900);
    return { ok: false, error: `no option matching "${text}"`, options: opened.options };
  }

  const option = hits[0];
  // A row is ~36 px tall; its text box is the most reliable click target.
  click({ title, x: option.x + 30, y: option.y + Math.max(6, Math.round(option.h / 2)) });
  await sleep(1000);

  const after = readDialog({ title });
  const now = after.fields[label]?.value;
  return {
    ok: true,
    label,
    picked: option.text,
    before: opened.current,
    after: now,
    changed: now !== opened.current,
    options: opened.options,
    brightness: opened.brightness,
  };
}

/**
 * Type a value into one of the dialog's text fields and read it back.
 *
 * The field is clicked first so the caret lands in it, then select-all before
 * typing: without that the new text is appended to whatever was already there.
 * `Enter` commits, because these fields only hand their value on when the caret
 * leaves them.
 */
export async function setText({ title = "Insta360 Studio", label, text } = {}) {
  if (isPickerField(label)) {
    // Deliberately no click: this control opens a modal picker, and leaving one
    // open is worse than not trying at all.
    return {
      ok: false,
      label,
      error: `"${label}" is chosen in a window of its own, not typed into`,
      note:
        "clicking it opens the modal folder picker \"Ordner öffnen\", which then swallows every click and " +
        "keystroke until it is cancelled",
    };
  }

  const before = readDialog({ title });
  const row = before.fields[label];
  if (!row) {
    return { ok: false, label, error: "field not found in the export dialog", fields: Object.keys(before.fields) };
  }

  const want = String(text ?? "");
  const at = { title, x: row.click.x, y: row.click.y };
  // The click puts the caret in the field; text and keys then have to go to the
  // same spot (typeAt/keyMsg), because CEF gives its inputs the mouse but not the
  // keyboard focus.
  click(at);
  await sleep(600);
  // Clear with End + Backspace, never with Ctrl+A: a synthesised chord does not
  // reach the renderer (its modifier state comes from the real keyboard, so
  // Ctrl+A would arrive as a bare "a"), and SendKeys would type the rest into
  // whatever window the operator has in the foreground.
  clearField({ ...at, chars: String(row.value ?? "").length + 4 });
  await sleep(300);
  if (want !== "") typeAt({ ...at, text: want });
  // No commit key: measured on Studio 6.0.9, the field and its display update as
  // the characters arrive ("mcpTest(2).mp4" -> "mcpTest(2).mp4X" read back from
  // the picture). ENTER is deliberately not sent -- in this dialog it would press
  // the default button, which is Export.
  await sleep(600);

  const after = readDialog({ title });
  const now = after.fields[label]?.value;
  if (now === row.value) {
    return {
      ok: false,
      label,
      requested: want,
      before: row.value,
      after: now,
      changed: false,
      error: "the field did not take typed input",
      note:
        'typed with WM_CHAR at the row\'s click point. If this repeats: the row is a picker rather than a ' +
        "text field (Pfad is a folder picker), or the click point no longer matches a changed layout",
    };
  }
  return { ok: true, label, requested: want, before: row.value, after: now, changed: true };
}

const norm = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, "");

/**
 * Second-pass normalisation for the OCR engine's habitual confusions in this
 * dialog: "Rec.709 10bit" is read as "Rec.709 IObit" and "H.265" loses its dot.
 * Applied to both sides, so a request written the way the UI displays it still
 * matches the mangled reading.
 */
const normLoose = (s) => norm(s).replace(/[^a-z0-9]/g, "").replace(/[il]/g, "1").replace(/o/g, "0");

/** True when `text` contains `want`, exactly or tolerating those confusions. */
export const matches = (text, want) =>
  norm(text).includes(norm(want)) || normLoose(text).includes(normLoose(want));

/** Drop a trailing ellipsis, which is how the QML marks a truncated string. */
const stripElision = (s) => norm(s).replace(/[\s.…·]+$/, "").trim();

/**
 * True when an option row and the requested text are the same string, allowing
 * either side to be elided.
 *
 * Long options are truncated *inside the list box* too, not just in the label
 * column: "Quellauflösung übernehmen" is drawn as "Quellauflösung überneh...".
 * `matches` asks whether one string contains the other, which the truncated row
 * never does in either direction — so the row was declared missing, no click was
 * made, **and the box stayed open**, poisoning every read after it (the next
 * read reported the open list's rows as the dialog's values: Rahmen read
 * "TikTok-Pano"). Comparing the shared prefix instead of containment fixes the
 * cause; the toggle-shut below fixes the blast radius.
 */
export function optionMatch(text, want) {
  if (matches(text, want)) return true;
  for (const key of [norm, normLoose]) {
    const a = key(stripElision(text));
    const b = key(stripElision(want));
    if (!a || !b) continue;
    const n = Math.min(a.length, b.length);
    if (n >= 6 && a.slice(0, n) === b.slice(0, n)) return true;
  }
  return false;
}

/**
 * Set several dialog controls in one go, reading each field back to prove it took.
 *
 * A control whose current value already matches is skipped rather than re-picked:
 * every list-box round trip costs two clicks plus two waits, and each open box
 * briefly covers the controls below it.
 */
export async function applySettings({ title = "Insta360 Studio", settings = {} } = {}) {
  const before = readDialog({ title });
  const report = [];

  for (const [label, want] of Object.entries(settings)) {
    if (want === undefined || want === null || want === "") continue;
    const cur = before.fields[label]?.value;

    if (cur !== undefined && norm(want).length >= 3 && matches(cur, want)) {
      report.push({ control: label, value: cur, changed: false, note: "already set" });
      continue;
    }

    const res = isTextBox(label)
      ? await setText({ title, label, text: want })
      : await selectOption({ title, label, text: want });
    report.push({
      control: label,
      requested: want,
      before: res.before,
      after: res.after,
      ok: !!res.ok,
      changed: !!res.changed,
      error: res.error,
      options: res.ok ? undefined : res.options,
    });
  }

  const after = readDialog({ title });
  return {
    report,
    changed: report.filter((r) => r.changed).map((r) => r.control),
    failed: report.filter((r) => r.ok === false).map((r) => `${r.control}: ${r.error}`),
    settings: Object.fromEntries(Object.entries(after.fields).map(([k, v]) => [k, v.value])),
  };
}
