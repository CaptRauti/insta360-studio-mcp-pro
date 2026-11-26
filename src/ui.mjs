// UI layer for Insta360 Studio.
//
// Why this exists: Studio's Qt canvas exposes nothing to UI Automation (the
// control tree is empty — verified), and its gRPC exporter service accepts
// StartExporting requests but never writes a file. The only path that actually
// produces output is the real GUI export dialog. So this module drives the GUI
// the way a human would: locate the window, screenshot it (PrintWindow, so it
// works even when the window is occluded), find the accent-coloured primary
// button by pixel colour, click it, and wait for the file to appear.
//
// Everything here is deterministic — no vision model, no hardcoded coordinates.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { findText, ocrImage } from "./ocr.mjs";
import { readPng, findAccentBoxes } from "./png.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WIN32_PS1 = path.join(HERE, "win32.ps1");
const UIA_PS1 = path.join(HERE, "uia.ps1");

export const DEFAULT_WINDOW_TITLE = "Insta360 Studio";
export const DEFAULT_OUT_DIR = path.join(os.homedir(), "Desktop");

/**
 * Quiet mode — on by default, because somebody is usually working on this machine.
 *
 * Off (INSTA360_QUIET=0) the primitives below behave like a person at the
 * keyboard: the window is raised and focused, the pointer is moved to the click
 * point and a real button press is injected. That fights whoever else is using
 * the machine — the cursor jumps away mid-drag and the window takes the front
 * from whatever they were typing in — and it is also *unreliable* while they
 * work: the window can move between the screenshot the coordinates came from
 * and the moment of the click.
 *
 * On, the same primitives stay out of the way: nothing is moved, nothing is
 * raised, the pointer is untouched, and a click is delivered as WM_* messages to
 * the window under the point. Read as a policy question, not a debugging one:
 * see win32.ps1 for the mechanism.
 */
export function quiet() {
  return process.env.INSTA360_QUIET !== "0";
}

function shotDir() {
  const dir = process.env.INSTA360_SHOT_DIR ?? path.join(os.tmpdir(), "insta360-studio-mcp");
  mkdirSync(dir, { recursive: true });
  return dir;
}

function runPs(script, args, { timeout = 30000 } = {}) {
  // Only win32.ps1 knows the flag; uia.ps1 would fail on an unknown parameter.
  const argv = script === WIN32_PS1 && quiet() ? [...args, "-Quiet"] : args;
  let out;
  try {
    out = execFileSync(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, ...argv],
      { encoding: "utf8", timeout, windowsHide: true },
    );
  } catch (err) {
    // A refusal is a decision, not a crash: the script writes a JSON object to
    // stdout and exits non-zero. Surface its `error`, not the command line --
    // otherwise every quiet-mode refusal reaches the caller as an unreadable
    // "Command failed: powershell -NoProfile ..." blob.
    const raw = String(err.stdout ?? "").trim();
    const last = raw.split(/\r?\n/).filter(Boolean).pop() ?? "";
    let parsed = null;
    try {
      parsed = JSON.parse(last);
    } catch {
      /* not JSON: fall back to the raw text */
    }
    const e = new Error(parsed?.error ?? (raw || String(err.stderr ?? "").trim() || `powershell exited ${err.status}`));
    e.status = err.status;
    e.detail = parsed;
    throw e;
  }
  const text = out.trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

// ---------------------------------------------------------------------------
// Window primitives
// ---------------------------------------------------------------------------

/** Locate the Studio window and return its screen rectangle. */
export function windowInfo(title = DEFAULT_WINDOW_TITLE) {
  const r = runPs(WIN32_PS1, ["-Action", "find", "-Title", title]);
  if (!r || r.ok === false) throw new Error(`Studio window "${title}" not found`);
  return r;
}

/**
 * Bring the window to the front.
 *
 * Required before any capture: Studio's window can be fully painted yet still
 * read back blank (measured: a 2576x1408 capture of 16 KB, OCR 0 words) while it
 * is not the foreground window. The same capture after `focus` returned 44 words.
 * A window that has just been started by `spawn` is never in the foreground, so
 * this is the difference between "Studio did not render" and "Studio was simply
 * behind something".
 */
/**
 * Force the window to repaint. A window that is not in the foreground is not
 * composited, so its last presented frame can lag one interaction behind —
 * measured: a message click switches the panel, but the capture only shows it
 * after something else nudges the window. Call this before reading the UI back.
 */
export function redraw({ title = DEFAULT_WINDOW_TITLE } = {}) {
  const r = runPs(WIN32_PS1, ["-Action", "redraw", "-Title", title], { timeout: 30000 });
  return typeof r === "string" ? JSON.parse(r.trim().split("\n").pop()) : r;
}

export function focusWindow({ title = DEFAULT_WINDOW_TITLE, force = false } = {}) {
  // Raising the window is exactly what quiet mode exists to avoid, and it is not
  // needed for reading: PrintWindow renders a window that is merely behind others
  // (measured — see README, "Quiet mode"). Pass force:true when a human has to
  // see it. The window state still has to be reported, because a *minimised*
  // window cannot be captured at all — "find" reads the state without touching it.
  if (quiet() && !force) {
    const info = runPs(WIN32_PS1, ["-Action", "find", "-Title", title], { timeout: 30000 });
    return { ...(typeof info === "string" ? JSON.parse(info.trim().split("\n").pop()) : info), quiet: true, skipped: "focus" };
  }
  const r = runPs(WIN32_PS1, ["-Action", "focus", "-Title", title], { timeout: 30000 });
  if (!r || r.ok === false) throw new Error(`could not focus "${title}"`);
  return r;
}

/** Move/resize the window so click coordinates are stable across runs. */
export function moveWindow({ title = DEFAULT_WINDOW_TITLE, x = 100, y = 40, width = 1384, height = 900 } = {}) {
  if (quiet()) {
    throw new Error(
      "quiet mode does not move the Studio window (it would drag it onto the user's primary monitor); " +
        "set INSTA360_QUIET=0 if you really want the old behaviour",
    );
  }
  const r = runPs(WIN32_PS1, ["-Action", "move", "-Title", title, "-X", String(x), "-Y", String(y), "-Keys", `${width}x${height}`]);
  if (!r || r.ok === false) throw new Error(`could not move Studio window`);
  return windowInfo(title);
}

/**
 * Screenshot the window. mode "print" uses PrintWindow (occlusion-proof);
 * "screen" uses BitBlt of the visible area.
 */
export function capture({ title = DEFAULT_WINDOW_TITLE, mode = "print", out } = {}) {
  const file = out ?? path.join(shotDir(), `studio-${Date.now()}.png`);
  const args = ["-Action", "capture", "-Title", title, "-Out", file];
  if (mode === "print") args.push("-Text", "print");
  const r = runPs(WIN32_PS1, args, { timeout: 30000 });
  if (!r || r.ok === false) throw new Error(`capture failed for "${title}"`);
  return { path: file, width: r.width, height: r.height, mode: r.mode ?? mode, window: r };
}

/** Click at window-relative coordinates. */
export function click({ title = DEFAULT_WINDOW_TITLE, x, y, double = false, button = "left" } = {}) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("click needs numeric x and y");
  const action = double ? "dblclick" : "click";
  const args = ["-Action", action, "-Title", title, "-X", String(Math.round(x)), "-Y", String(Math.round(y))];
  // Studio creates a view keyframe from a right-button gesture, so the button has to
  // reach the helper; it is not a detail the caller can drop.
  if (button && button !== "left") args.push("-Button", button);
  const r = runPs(WIN32_PS1, args);
  if (!r || r.ok === false) throw new Error(`click failed at ${x},${y}`);
  return r;
}

/**
 * Right-button drag, which is how Studio sets a view keyframe.
 *
 * A right click alone only raises the context menu: the gesture that writes a
 * keyframe is press-drag-release over the preview ("Halte die rechte Maustaste
 * gedrückt und ziehe, um die Ansicht mit Keyframes festzulegen"), so the moves
 * between the two are the operation, not padding.
 */
export function rightDrag({ title = DEFAULT_WINDOW_TITLE, from, to, settleMs = 1500, direct = false } = {}) {
  if (!from || !to) throw new Error("rightDrag needs {from:{x,y}, to:{x,y}}");
  const args = [
    "-Action", "rightdrag", "-Title", title,
    "-X", String(Math.round(from.x)), "-Y", String(Math.round(from.y)),
    "-ToX", String(Math.round(to.x)), "-ToY", String(Math.round(to.y)),
    "-SleepMs", String(settleMs),
  ];
  // -Direct names the window and sends client coordinates, skipping the z-order lookup.
  // Without it a covering window makes the point resolve to another process and the
  // helper refuses (correctly) — which is the normal case here, since the operator's
  // own windows sit over Studio.
  if (direct) args.push("-Direct");
  const r = runPs(WIN32_PS1, args);
  if (!r || r.ok === false) throw new Error(`rightDrag failed ${from.x},${from.y} -> ${to.x},${to.y}`);
  return r;
}

/** Send a key chord to the window, e.g. "^{s}" or "{ESC}". */
/**
 * The keys the quiet path can deliver, by the names SendKeys uses for them.
 * Every one of these is a single key with no modifier, which is the whole point:
 * a modifier has to come from the real keyboard, so a chord cannot be faked.
 */
const PLAIN_KEYS = {
  enter: "ENTER", return: "ENTER", tab: "TAB", esc: "ESCAPE", escape: "ESCAPE",
  backspace: "BACKSPACE", back: "BACKSPACE", del: "DELETE", delete: "DELETE",
  ins: "INSERT", insert: "INSERT", home: "HOME", end: "END", space: "SPACE",
  up: "UP", down: "DOWN", left: "LEFT", right: "RIGHT",
  pgup: "PAGEUP", pgdn: "PAGEDOWN", pageup: "PAGEUP", pagedown: "PAGEDOWN",
};

/**
 * Read a SendKeys string that is exactly *one* plain key, or return null.
 *
 * Only whole single-token forms qualify: "{ENTER}", "{ESC}", "ENTER", "{TAB}".
 * Anything with a modifier, a repeat count or a second key is a chord and does
 * not qualify -- a partial reading of "^{a}" or "a{ENTER}b" is how a chord would
 * silently turn into some other keystroke.
 */
export function plainKey(keys) {
  const s = String(keys ?? "").trim();
  const m = s.match(/^\{([A-Za-z]+)\}$/) ?? s.match(/^([A-Za-z]+)$/);
  if (!m) return null;
  return PLAIN_KEYS[m[1].toLowerCase()] ?? null;
}

export function sendKeys({ title = DEFAULT_WINDOW_TITLE, keys } = {}) {
  // A single key with no modifier is not a chord, so the message path can carry
  // it: {ESC} closes an overlay, {ENTER} presses a button. Everything else still
  // needs the system keyboard queue, which quiet mode will not touch.
  const single = quiet() ? plainKey(keys) : null;
  if (single) return { ...keyMsg({ title, key: single }), translated: `{${single}}` };
  const r = runPs(WIN32_PS1, ["-Action", "keys", "-Title", title, "-Keys", keys]);
  if (!r || r.ok === false) throw new Error(`key "${keys}" failed`);
  return r;
}

/**
 * Type literal text into whatever has the keyboard focus.
 *
 * Goes through SendKeys, so reserved characters (`+ ^ % ~ ( ) { } [ ]`) must be
 * escaped by the caller — see `escapeSendKeys` below.
 */
export function typeText({ title = DEFAULT_WINDOW_TITLE, text } = {}) {
  const r = runPs(WIN32_PS1, ["-Action", "type", "-Title", title, "-Text", text]);
  if (!r || r.ok === false) throw new Error(`typing failed`);
  return r;
}

/**
 * Send keys to the window under (x, y) — window-relative, like click().
 *
 * Needed for the export dialog's CEF/HTML inputs: a synthesized click gives them
 * the mouse but not the keyboard, and SetFocus on its own fails across threads,
 * so win32.ps1 attaches the two thread input queues and sends in the same action.
 */
export function keysAt({ title = DEFAULT_WINDOW_TITLE, x, y, keys } = {}) {
  const r = runPs(WIN32_PS1, ["-Action", "atkeys", "-Title", title, "-X", String(x), "-Y", String(y), "-Keys", keys]);
  if (!r || r.ok === false) throw new Error(`keysAt "${keys}" failed`);
  return r;
}

/** Type literal text into the window under (x, y); see keysAt. */
export function typeAt({ title = DEFAULT_WINDOW_TITLE, x, y, text } = {}) {
  // The two transports read characters differently: WM_CHAR (quiet) carries them
  // literally, SendKeys (loud) treats "^", "+", "%", "{}" as syntax. Escape here,
  // where the transport is known -- a call site that escaped its own text sent a
  // path containing "^" to the quiet path as the literal "{^}".
  const payload = quiet() ? String(text ?? "") : escapeSendKeys(String(text ?? ""));
  const r = runPs(WIN32_PS1, ["-Action", "atkeys", "-Title", title, "-X", String(x), "-Y", String(y), "-Text", payload]);
  if (!r || r.ok === false) throw new Error("typeAt failed");
  return r;
}

/**
 * Press one key, delivered as a window message to the child under (x, y).
 *
 * The quiet-mode counterpart of `sendKeys`, for the keys that carry no modifier:
 * Enter, Tab, Escape, Backspace, Delete, Home, End, the arrows. A chord cannot
 * be delivered this way -- Chromium builds the modifier state from the real
 * keyboard, so a synthesised Ctrl+A arrives as a bare "a" -- which is why the
 * dialog clears fields with End + Backspace instead of select-all.
 */
export function keyMsg({ title = DEFAULT_WINDOW_TITLE, x, y, key, repeat = 1 } = {}) {
  const args = ["-Action", "keymsg", "-Title", title, "-Key", String(key), "-Repeat", String(repeat)];
  // -1 is "no point given": the script then targets the content child under the
  // window's centre. Omitting the arguments would mean (0,0), the frame corner.
  const point = Number.isFinite(x) && Number.isFinite(y) ? [Math.round(x), Math.round(y)] : [-1, -1];
  args.push("-X", String(point[0]), "-Y", String(point[1]));
  const r = runPs(WIN32_PS1, args);
  if (!r || r.ok === false) throw new Error(`key "${key}" failed: ${r?.error ?? "no output"}`);
  return r;
}

/**
 * Empty a text field without a chord: End, then Backspace once per character.
 * `chars` must cover the current value; the extra presses land on an empty field
 * and do nothing.
 */
export function clearField({ title = DEFAULT_WINDOW_TITLE, x, y, chars = 40 } = {}) {
  const n = Math.max(1, Math.min(400, Math.round(chars)));
  keyMsg({ title, x, y, key: "END" });
  keyMsg({ title, x, y, key: "BACKSPACE", repeat: n });
  return { cleared: n };
}

/** Escape the characters SendKeys reads as modifiers or grouping. */
export function escapeSendKeys(text) {
  return String(text).replace(/[+^%~(){}\[\]]/g, (c) => `{${c}}`);
}

/** Dump the UI Automation tree (returns [] for Studio's Qt canvas — expected). */
export function uiaTree({ title = DEFAULT_WINDOW_TITLE, depth = 4 } = {}) {
  const r = runPs(UIA_PS1, ["-Title", title, "-MaxDepth", String(depth)], { timeout: 45000 });
  if (Array.isArray(r)) return r;
  if (r && r.raw) return [];
  return [];
}

// ---------------------------------------------------------------------------
// Pixel analysis
// ---------------------------------------------------------------------------

const PLAYER_REGION = { x0: 0.26, y0: 0.12, x1: 0.78, y1: 0.70 };
const TOOLBAR_REGION = { x0: 0.80, y0: 0.0, x1: 1.0, y1: 0.11 };
const DIALOG_REGION = { x0: 0.0, y0: 0.55, x1: 1.0, y1: 1.0 };

function absRegion(img, rel) {
  return {
    x0: Math.round(img.width * rel.x0),
    y0: Math.round(img.height * rel.y0),
    x1: Math.round(img.width * rel.x1),
    y1: Math.round(img.height * rel.y1),
  };
}

/**
 * Classify the current screen. Returns the accent buttons it found, positioned
 * by role: `toolbarExport` when the export dialog is closed, `dialogExport`
 * when it is open.
 */
export function analyzeShot(file) {
  const img = readPng(file);
  const toolbar = findAccentBoxes(img, { region: absRegion(img, TOOLBAR_REGION) });
  const dialog = findAccentBoxes(img, { region: absRegion(img, DIALOG_REGION) });
  const player = absRegion(img, PLAYER_REGION);

  // Is anything actually rendered in the player? An empty player is a flat
  // placeholder: very few distinct colours and almost no edge energy.
  let sum = 0;
  let sumSq = 0;
  let n = 0;
  let edges = 0;
  const { width, data } = img;
  for (let y = player.y0; y < player.y1; y += 2) {
    for (let x = player.x0; x < player.x1; x += 2) {
      const i = (y * width + x) * 3;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      sum += lum;
      sumSq += lum * lum;
      n++;
      if (x + 2 < player.x1) {
        const j = i + 6;
        const lum2 = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
        if (Math.abs(lum2 - lum) > 12) edges++;
      }
    }
  }
  const mean = n ? sum / n : 0;
  const variance = n ? sumSq / n - mean * mean : 0;
  const edgeFrac = n ? edges / n : 0;

  return {
    width: img.width,
    height: img.height,
    dialogOpen: dialog.length > 0,
    toolbarExport: toolbar[0] ?? null,
    dialogExport: dialog[0] ?? null,
    player: {
      meanLuma: Math.round(mean),
      stdDev: Math.round(Math.sqrt(Math.max(variance, 0))),
      edgeFraction: Number(edgeFrac.toFixed(3)),
      likelyEmpty: Math.sqrt(Math.max(variance, 0)) < 12 && edgeFrac < 0.02,
    },
  };
}

/** Labels that exist only inside the export dialog. */
export const DIALOG_LABELS = [
  "Auflösung",
  "Kodierung",
  "Voreinstellung",
  "Farbraum",
  "Bitrate",
  "Rahmen",
  "Dateiname",
];

/**
 * Do these OCR hits describe the export dialog? Two labels is the threshold: a
 * single one could be a stray match, while two can only come from the dialog.
 */
export function looksLikeExportDialog(found = []) {
  return found.length >= 2;
}

/**
 * Check a window for the export dialog's own labels.
 *
 * Needed because an accent box in the dialog region is weaker evidence than it
 * looks. Measured: an accent box at x=1422, y=1006 (110x32) on a 2576x1408 window
 * was present while `readDialog()` came back with **zero** fields and the OCR of
 * the same capture listed the media library (`Medienbibliothek`, `VID_002mp4`)
 * instead of any dialog label. The same box is also present while the dialog is
 * unmistakably open, so the box alone cannot separate the two states -- the
 * dialog's labels can, and that is what decides here.
 *
 * What caused that intermediate state is *not* established: the capture may have
 * caught the dialog half-painted, or the library is genuinely what was on screen.
 * Hence `dialogCheck` in `uiState`, which reports which evidence was used
 * (`labels`, `accent-only`, `ocr-failed`, `no-accent`) instead of a bare boolean.
 */
export function exportDialogLabels({ title = DEFAULT_WINDOW_TITLE, shot } = {}) {
  const file = shot ?? capture({ title, mode: "print" }).path;
  const ocr = ocrImage(file);
  if (!ocr.ok) return { ok: false, error: ocr.error, shot: file };
  const found = DIALOG_LABELS.filter((label) => findText(ocr, label).length > 0);
  return { ok: true, found, isDialog: looksLikeExportDialog(found), shot: file };
}

/** One-shot: screenshot + analysis. */
export function uiState({ title = DEFAULT_WINDOW_TITLE, mode = "print", verifyDialog = true } = {}) {
  const shot = capture({ title, mode });
  const analysis = analyzeShot(shot.path);
  const state = { window: windowInfo(title), screenshot: shot.path, ...analysis };

  // Pixels alone are weaker evidence about the dialog than they look (see
  // exportDialogLabels), so the labels get the last word whenever an accent box
  // in the dialog region was found. `dialogCheck` records which one decided.
  if (state.dialogOpen && verifyDialog) {
    const probe = exportDialogLabels({ title, shot: shot.path });
    state.dialogLabels = probe.found ?? [];
    if (probe.ok) {
      state.dialogOpen = probe.isDialog;
      state.dialogCheck = probe.isDialog ? "labels" : "accent-only";
    } else {
      state.dialogCheck = "ocr-failed";
    }
  } else {
    state.dialogCheck = state.dialogOpen ? "unverified" : "no-accent";
  }
  return state;
}

// ---------------------------------------------------------------------------
// Export orchestration
// ---------------------------------------------------------------------------

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function listVideos(dir) {
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir)
      .filter((f) => /\.(mp4|mov|mkv)$/i.test(f))
      .map((f) => {
        const p = path.join(dir, f);
        let size = 0;
        let mtime = 0;
        try {
          const st = statSync(p);
          size = st.size;
          mtime = st.mtimeMs;
        } catch {
          /* file vanished mid-scan */
        }
        return { file: p, name: f, size, mtime };
      });
  } catch {
    return [];
  }
}

/**
 * Open the export dialog (click the toolbar's accent button), optionally click
 * the dialog's primary button, and wait for a new file to appear in `outDir`.
 *
 * stage: "dialog" opens the dialog and stops; "full" also starts the export.
 *
 * `minBytes` guards against a false finish: Studio creates the output file as a
 * stub (a few dozen bytes) while the encoder spins up, and a size that merely
 * stops changing for a few seconds is not proof the export is done. Only a file
 * that is stable AND at least this large counts as finished.
 *
 * `settings` sets dialog controls before the export starts, e.g.
 * `{ Voreinstellung: "4K", Kodierung: "H.264" }`. Each entry is read back
 * afterwards, so the reply says what actually took effect.
 */
export async function runExport({
  title = DEFAULT_WINDOW_TITLE,
  outDir = null,
  stage = "full",
  settings = null,
  settleMs = 1200,
  timeoutMs = 15 * 60 * 1000,
  pollMs = 2000,
  stableFor = 5,
  minBytes = 64 * 1024,
} = {}) {
  const log = [];

  const state0 = uiState({ title });
  log.push({ step: "state", dialogOpen: state0.dialogOpen, player: state0.player });

  if (!state0.dialogOpen) {
    const btn = state0.toolbarExport;
    if (!btn) throw new Error("export button not found in the toolbar — is a project open?");
    click({ title, x: btn.cx, y: btn.cy });
    log.push({ step: "click-toolbar", at: { x: btn.cx, y: btn.cy } });
    await sleep(settleMs);
  }

  const state1 = uiState({ title });
  log.push({ step: "state", dialogOpen: state1.dialogOpen });
  if (!state1.dialogOpen) {
    throw new Error("export dialog did not open after clicking the toolbar button");
  }
  // Where the file lands is decided by the dialog, not by `outDir`: "Pfad" is a
  // folder picker (quiet mode will not retype it), so the dialog is the only
  // authority on the destination. Watching the folder the caller named instead
  // is how a finished export read as no export at all -- and why the reply now
  // says which folder was used and whether it was the one asked for.
  const normal = (p) => String(p).replace(/\//g, "\\").replace(/\\+$/, "").toLowerCase();
  const { dialogOutDir } = await import("./export-dialog.mjs");
  const dialogDir = dialogOutDir({ title });
  const watchDir = dialogDir ?? outDir ?? DEFAULT_OUT_DIR;
  const asked = outDir ?? null;
  const mismatch = asked !== null && normal(asked) !== normal(watchDir);
  const before = new Map(listVideos(watchDir).map((v) => [v.name, v.size]));
  log.push({
    step: "outdir",
    dir: watchDir,
    source: dialogDir ? "dialog" : "argument",
    asked,
    mismatch,
  });

  // Imported here rather than at the top: export-dialog.mjs already imports this
  // module, and a static import back would make the cycle load-order dependent.
  let applied = null;
  if (settings && Object.keys(settings).length) {
    const { applySettings } = await import("./export-dialog.mjs");
    applied = await applySettings({ title, settings });
    log.push({ step: "settings", report: applied.report });
    const failed = applied.report.filter((r) => r.ok === false || r.changed === false);
    if (failed.length) log.push({ step: "settings-not-applied", failed });
  }

  if (stage === "dialog") {
    return {
      ok: true,
      stage,
      dialogOpen: true,
      clicked: false,
      outDir: watchDir,
      outDirAsked: asked,
      outDirSource: dialogDir ? "dialog" : "argument",
      outDirMismatch: mismatch,
      settings: applied,
      log,
    };
  }

  const btn = state1.dialogExport;
  if (!btn) throw new Error("export dialog is open but its primary button was not found");
  click({ title, x: btn.cx, y: btn.cy });
  log.push({ step: "click-dialog", at: { x: btn.cx, y: btn.cy } });

  const deadline = Date.now() + timeoutMs;
  let candidate = null;
  let lastSize = -1;
  let stable = 0;
  while (Date.now() < deadline) {
    await sleep(pollMs);
    const now = listVideos(watchDir);
    const fresh = now.filter((v) => {
      const prev = before.get(v.name);
      return prev === undefined || v.size !== prev;
    });
    if (fresh.length) {
      const newest = fresh.sort((a, b) => b.mtime - a.mtime)[0];
      if (candidate && candidate.file === newest.file) {
        if (newest.size === lastSize) stable++;
        else stable = 0;
        lastSize = newest.size;
        candidate = newest;
        if (stable >= stableFor && newest.size >= minBytes) {
          log.push({ step: "done", file: newest.file, size: newest.size });
          return {
            ok: true,
            stage,
            dialogOpen: false,
            file: newest.file,
            size: newest.size,
            outDir: watchDir,
            outDirAsked: asked,
            outDirSource: dialogDir ? "dialog" : "argument",
            outDirMismatch: mismatch,
            settings: applied,
            log,
          };
        }
        if (stable === stableFor) {
          log.push({ step: "too-small", file: newest.file, size: newest.size });
        }
      } else {
        candidate = newest;
        lastSize = newest.size;
        stable = 0;
        log.push({ step: "watching", file: newest.file, size: newest.size });
      }
    }
  }

  throw new Error(
    `export did not produce a file of at least ${minBytes} bytes in ${watchDir} ` +
      `within ${Math.round(timeoutMs / 1000)}s` +
      (candidate ? ` (last seen: ${candidate.file} @ ${candidate.size} bytes)` : ""),
  );
}

/** Wait for a specific file (or the newest new file) to reach a stable size. */
export async function waitForExport({
  file,
  outDir = DEFAULT_OUT_DIR,
  timeoutMs = 15 * 60 * 1000,
  pollMs = 2000,
  stableFor = 3,
} = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastSize = -1;
  let stable = 0;
  let target = file ?? null;
  while (Date.now() < deadline) {
    await sleep(pollMs);
    if (!target) {
      const newest = listVideos(outDir).sort((a, b) => b.mtime - a.mtime)[0];
      if (newest) target = newest.file;
      else continue;
    }
    if (!existsSync(target)) continue;
    const size = statSync(target).size;
    if (size === lastSize && size > 0) stable++;
    else stable = 0;
    lastSize = size;
    if (stable >= stableFor) return { ok: true, file: target, size };
  }
  throw new Error(`no stable export file within ${Math.round(timeoutMs / 1000)}s`);
}
