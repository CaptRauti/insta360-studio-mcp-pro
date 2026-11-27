// The export queue: Studio's Task Center, driven and read through OCR.
//
// What this is (all measured 2026-11-26/27 on a 1384x900 window, Studio 6.0.x):
//
//   `Zur Warteschlange` is the export dialog's *second* button. It is NOT accent-coloured, so
//   the accent search that finds `Exportieren` cannot find it -- and its label is truncated by
//   the button's own width: the plain OCR reads `Zur`, 4x reads `Zur` + `Wartes...`. Clicking it
//   closes the dialog and enqueues the job instead of running it: the session log shows
//   `export_button_view_model.cpp: [Export Start]` then
//   `exporter_manager.cc: ExporterManager::EnqueueTask: Export2 task enqueued, {<id>}, auto_start: 0`
//   -- and `Exportieren` is the same path with `auto_start: 1` (that one ran to completion).
//
//   The queue lives in the window's *Task Center* view (`Aufgaben-Center`), which the title-bar
//   icon at x = 0.736 * width, y = 18 opens (measured: the `Exporti...` title-bar label sits at
//   x=1207 and the icon 188 px to its left, so the x is derived from that OCR anchor where the
//   label is visible, and from the measured fraction otherwise). The panel lists
//   `Lokaler Export` / `Cloud-Export` / `Download` / `Freigabe verwalten`, a section
//   `Export-Warteschlange` with a count before `Export-Datensätze`, and a table
//   `Dateiname | Dateigröße | Status`; a queued row's status reads `Warteschlange`, and an empty
//   queue says `Es sind keine lokalen Exportaufgaben in Arbeit`. Header buttons:
//   `Alle starten`, `Alle pausieren`, `Alle löschen`.
//
//   `Alle löschen` does not clear anything by itself: it opens the *English* confirm
//   `Please confirm whether to delete all exporting tasks` with `Löschen` and `Abbrechen`
//   (German UI, English dialog -- so a matcher has to accept both).
//
// Two things this module deliberately does NOT claim:
//
//   * `run`/`pause` are located and their labels are verified, but a live `Alle starten` has not
//     been executed yet (it would export a duplicate file). Until that run happens, treat the
//     result of `run` as "the button was clicked", not "an export happened".
//   * Studio sometimes ignores synthetic input entirely (see the backlog's C4 blocker): the window
//     answers, yet `SetForegroundWindow` fails and clicks do nothing. Every step here re-reads the
//     screen and reports `ok: false` with what it saw instead of assuming the click landed.

import { capture, click, sleep, uiState } from "./ui.mjs";
import { ocrImage } from "./ocr.mjs";
import { zoomOcr } from "./export-dialog.mjs";

const DEFAULT_TITLE = "Insta360 Studio";

/** Measured on a 1384x900 window. Recorded as fractions so a different size is visible. */
const REF_WINDOW = { width: 1384, height: 900 };
const ICON_REL = { x: 1019 / REF_WINDOW.width, y: 18 / REF_WINDOW.height };
const ICON_OFFSET_FROM_EXPORT_LABEL = 188; // `Exporti...` at x=1207, icon at x=1019

const PANEL_REGION = { x: 0, y: 60, w: 900, h: 540 };
const BOTTOM_ROW_Y = 700; // anything below this in the export dialog is the button row

const asWords = (ocr) => (ocr.words ?? []).map((w) => ({ text: w.text, x: w.x, y: w.y, w: w.width, h: w.height }));

// ---------------------------------------------------------------------------
// Pure parsers (no I/O -- these are what the tests exercise)
// ---------------------------------------------------------------------------

/**
 * The queue's table, from the Task Center's OCR words.
 *
 * Rows are the words that look like an output file name; the size and status for a row are the
 * nearest ones on the same line (within a few px), because OCR emits them as separate words.
 */
export function parseTaskCenter(words = []) {
  const has = (re) => words.filter((w) => re.test(w.text));
  const joined = words.map((w) => w.text).join(" ");

  const dsatz = words.find((w) => /Datensätze/.test(w.text));
  // Measured: `2` at x=498 and `Export-Datensätze` at x=535, same line -- the count is the number
  // immediately to its left. (A second, unrelated `3` sits to the right of the label.)
  const countWord = dsatz
    ? words
        .filter((w) => Math.abs(w.y - dsatz.y) <= 4 && w.x < dsatz.x && /^\d+$/.test(w.text))
        .sort((a, b) => b.x - a.x)[0]
    : null;
  const fileNameWords = words.filter((w) => /\.(mp4|mov|insv|mp3|wav|jpg|png)\(?\d*\)?$/i.test(w.text) || /\.(mp4|mov|insv)\)?$/.test(w.text));
  const sizeWords = words.filter((w) => /^\d+(\.\d+)?(GB|MB|KB)$/i.test(w.text));
  const statusWords = words.filter((w) => /^(Warteschlange|Wartend|Wartest|Läuft|Fertig|Abgeschlossen|Fehlgeschlagen|Pausiert|Abgebrochen)/i.test(w.text));

  // group file names by line
  const rows = [];
  const seen = new Set();
  for (const f of fileNameWords) {
    const key = `${Math.round(f.y / 30)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // The nearest word of each kind on the row, never further than 30 px: measured, a row's
    // status sits ~15 px below its name, and the *next* row's status ~80 px away -- a wider
    // window makes one row swallow its neighbour's status.
    const nearest = (list) => {
      const near = list.filter((w) => Math.abs(w.y - f.y) <= 30);
      if (!near.length) return null;
      return near.sort((a, b) => Math.abs(a.y - f.y) - Math.abs(b.y - f.y))[0];
    };
    const size = nearest(sizeWords);
    const status = nearest(statusWords);
    rows.push({
      file: f.text,
      nameX: f.x,
      nameY: f.y,
      size: size ? size.text : null,
      status: status ? status.text : null,
    });
  }

  const button = (re) => {
    const w = words.find((x) => re.test(x.text));
    return w ? { text: w.text, x: w.x, y: w.y } : null;
  };

  return {
    panelOpen: /Aufgaben-Center/.test(joined),
    heading: has(/Aufgaben-Center/)[0]?.text ?? null,
    sections: ["Lokaler Export", "Cloud-Export", "Download", "Freigabe verwalten"].filter((s) => joined.includes(s)),
    count: countWord ? Number(countWord.text) : null,
    countKnown: Boolean(countWord),
    rows,
    empty: /keine lokalen Exportaufgaben in Arbeit/.test(joined),
    buttons: {
      start: button(/^starten$/i),
      pause: button(/^pausieren$/i),
      clear: button(/^löschen$/i),
    },
  };
}

/**
 * The `Alle löschen` confirmation. Studio's UI is German; this dialog is English.
 *
 * The confirm button is the one on the same line as `Abbrechen`, to its left (measured:
 * `Löschen` at x=688 and `Abbrechen` at x=782, both y=483) -- matching on the word alone would
 * also hit the panel's own `Alle löschen`, which sits at y~211.
 */
export function parseQueueConfirm(words = []) {
  const cancel = words.find((w) => /^(abbrechen|cancel)$/i.test(w.text) && w.y > 400);
  const prompt = words
    .filter((w) => w.y > 380 && w.y < 460 && /^[\x20-\x7e]+$/.test(w.text))
    .sort((a, b) => a.x - b.x)
    .map((w) => w.text)
    .join(" ");
  // Match the *label* first: the panel's own `Alle löschen` sits at y~211 with the same word, so a
  // line-based pick alone can land on a size or a neighbouring control (measured: `1.50GB` at
  // x=762, y=474 is within 12 px of the dialog's buttons).
  const labels = /^(löschen|delete|ok|ja|yes|bestätigen|confirm)$/i;
  const confirmWord =
    (cancel && words.filter((w) => labels.test(w.text) && Math.abs(w.y - cancel.y) <= 8 && w.x < cancel.x).sort((a, b) => b.x - a.x)[0]) ||
    words.filter((w) => labels.test(w.text) && w.y > 400).sort((a, b) => a.y - b.y)[0];
  return {
    shown: Boolean(cancel) || /confirm|delete all/i.test(prompt),
    prompt: prompt || null,
    confirm: confirmWord ? { text: confirmWord.text, x: confirmWord.x, y: confirmWord.y } : null,
    cancel: cancel ? { text: cancel.text, x: cancel.x, y: cancel.y } : null,
  };
}

/**
 * The export dialog's bottom-row queue button. Its label is truncated by the button's width, so
 * match the stem (`Wartes`) or a bare `Zur` on the button row -- never the full word.
 */
export function findQueueButton(words = []) {
  const row = words.filter((w) => w.y > BOTTOM_ROW_Y);
  const wartes = row.find((w) => /wartes/i.test(w.text));
  if (wartes) return { text: wartes.text, x: wartes.x, y: wartes.y };
  const zur = row.find((w) => /^zur$/i.test(w.text.trim()));
  return zur ? { text: zur.text, x: zur.x, y: zur.y } : null;
}

// ---------------------------------------------------------------------------
// Screen interaction
// ---------------------------------------------------------------------------

/** The pure part: where the icon sits, given the window size and the words on screen. */
export function taskCenterIconFor({ width = REF_WINDOW.width, height = REF_WINDOW.height, words = [] } = {}) {
  const exportLabel = words.find((w) => /^Exporti/i.test(w.text) && w.y < 40);
  const x = exportLabel
    ? Math.round(exportLabel.x - ICON_OFFSET_FROM_EXPORT_LABEL)
    : Math.round(ICON_REL.x * width);
  return {
    x,
    y: Math.round(ICON_REL.y * height),
    source: exportLabel ? "export-label-anchor" : "measured-fraction",
    window: { width, height },
    // neighbours to try when the first click yields no panel (OCR/DPI drift)
    fallbacks: [x - 34, x + 34, x - 115, x + 115].map((fx) => ({ x: fx, y: Math.round(ICON_REL.y * height) })),
  };
}

/** Where the Task Center icon is: anchored on the visible `Exporti...` label when there is one. */
export function taskCenterIcon({ title = DEFAULT_TITLE, words = [] } = {}) {
  const info = uiState({ title });
  return taskCenterIconFor({ width: info.width, height: info.height, words });
}

/** Read whatever the window currently shows, as words. */
export function readScreen({ title = DEFAULT_TITLE } = {}) {
  const shot = capture({ title });
  return { shot, words: asWords(ocrImage(shot.path)) };
}

/** Read the queue panel, opening the Task Center first unless it is already up. */
export function readQueue({ title = DEFAULT_TITLE, open = true } = {}) {
  let { shot, words } = readScreen({ title });
  let parsed = parseTaskCenter(words);
  const tried = [];

  if (!parsed.panelOpen && open) {
    const icon = taskCenterIcon({ title, words });
    const candidates = [{ x: icon.x, y: icon.y }, ...icon.fallbacks];
    for (const c of candidates) {
      click({ title, x: c.x, y: c.y });
      sleep(2200);
      const next = readScreen({ title });
      const p = parseTaskCenter(next.words);
      tried.push({ at: c, panelOpen: p.panelOpen });
      if (p.panelOpen) {
        shot = next.shot;
        words = next.words;
        parsed = p;
        break;
      }
    }
  }

  // The panel is wider than the sidebar; read it at 4x too, where truncated labels resolve.
  let zoomed = null;
  if (parsed.panelOpen) {
    const z = zoomOcr(shot.path, PANEL_REGION);
    if (z?.words?.length) {
      const pz = parseTaskCenter(z.words);
      zoomed = pz;
      // prefer the zoomed read for rows: it resolves `Warteschlange` that plain OCR truncates
      if (pz.rows.length >= parsed.rows.length) parsed = { ...parsed, rows: pz.rows, count: pz.count ?? parsed.count };
    }
  }

  return {
    ok: parsed.panelOpen,
    ...parsed,
    zoomRows: zoomed?.rows ?? null,
    earlierWords: words.length,
    shot: shot.path,
    iconTried: tried,
    note: parsed.panelOpen
      ? undefined
      : "the Task Center did not open -- Studio ignores synthetic input in some states (see the C4 blocker); the window answers but the click does nothing",
  };
}

/** Click one of the panel's header buttons by label. */
export function clickQueueButton({ title = DEFAULT_TITLE, label }) {
  const { shot, words } = readScreen({ title });
  const parsed = parseTaskCenter(words);
  if (!parsed.panelOpen) {
    return { ok: false, reason: "task-center-not-open", hint: "call readQueue first (it opens the view)" };
  }
  const table = { start: /^starten$/i, pause: /^pausieren$/i, clear: /^löschen$/i };
  const m = table[label];
  if (!m) return { ok: false, reason: "unknown-label", expected: Object.keys(table) };
  const btn = words.find((w) => m.test(w.text) && w.y < 300);
  if (!btn) return { ok: false, reason: "button-not-found", label, shot: shot.path };
  click({ title, x: btn.x, y: btn.y });
  return { ok: true, clicked: label, at: { x: btn.x, y: btn.y } };
}

/**
 * Clear the queue: `Alle löschen`, then the confirmation. `Alle löschen` alone changes nothing.
 */
export async function clearQueue({ title = DEFAULT_TITLE } = {}) {
  const before = readQueue({ title });
  if (!before.ok) return { ok: false, reason: "task-center-not-open", detail: before.note };

  const first = clickQueueButton({ title, label: "clear" });
  if (!first.ok) return { ok: false, reason: first.reason, detail: first };
  await sleep(2000);

  let { shot, words } = readScreen({ title });
  let confirm = parseQueueConfirm(words);
  if (!confirm.shown || !confirm.confirm) {
    return {
      ok: false,
      reason: "confirmation-not-found",
      clicked: first,
      saw: words.map((w) => w.text),
      note: "`Alle löschen` opens a confirmation; without it nothing is deleted",
    };
  }

  click({ title, x: confirm.confirm.x, y: confirm.confirm.y });
  await sleep(2500);
  const after = readQueue({ title, open: false });
  return {
    ok: true,
    clicked: first,
    confirm: { prompt: confirm.prompt, button: confirm.confirm.text },
    countBefore: before.count,
    countAfter: after.ok ? after.count : null,
    emptyAfter: after.ok ? after.empty : null,
    remaining: after.ok ? after.rows : null,
    shotAfter: after.shot,
  };
}

/**
 * Enqueue an export instead of running it: the export dialog's `Zur Warteschlange`.
 *
 * Requires the dialog open (`runExport({stage:'dialog'})`). The dialog closes on success, which is
 * how the click is verified -- together with the queue count moving, when `verify` is on.
 */
export async function addToQueue({ title = DEFAULT_TITLE, verify = true } = {}) {
  const state = uiState({ title });
  if (!state.dialogOpen) {
    return { ok: false, reason: "export-dialog-not-open", hint: "call studio_ui_export with stage 'dialog' first" };
  }

  const countBefore = verify ? readQueue({ title }) : null;

  const { words } = readScreen({ title });
  const btn = findQueueButton(words);
  if (!btn) {
    return {
      ok: false,
      reason: "queue-button-not-found",
      bottomRow: words.filter((w) => w.y > BOTTOM_ROW_Y).map((w) => w.text),
      note: "the label is truncated by the button's width; the stem is `Wartes`",
    };
  }

  click({ title, x: btn.x, y: btn.y });
  await sleep(2500);
  const closed = !uiState({ title }).dialogOpen;
  const result = { ok: closed, clicked: { text: btn.text, x: btn.x, y: btn.y }, dialogClosed: closed };
  if (!closed) result.note = "the dialog did not close -- the click did not land (see the C4 blocker)";

  if (verify && closed) {
    const after = readQueue({ title });
    result.queue = {
      countBefore: countBefore?.ok ? countBefore.count : null,
      countAfter: after.ok ? after.count : null,
      rows: after.ok ? after.rows : null,
      empty: after.ok ? after.empty : null,
    };
    if (after.ok && countBefore?.ok && countBefore.count != null && after.count != null) {
      result.enqueued = after.count > countBefore.count;
    }
  }
  return result;
}
