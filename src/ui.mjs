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

import { readPng, findAccentBoxes } from "./png.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WIN32_PS1 = path.join(HERE, "win32.ps1");
const UIA_PS1 = path.join(HERE, "uia.ps1");

export const DEFAULT_WINDOW_TITLE = "Insta360 Studio";
export const DEFAULT_OUT_DIR = path.join(os.homedir(), "Desktop");

function shotDir() {
  const dir = process.env.INSTA360_SHOT_DIR ?? path.join(os.tmpdir(), "insta360-studio-mcp");
  mkdirSync(dir, { recursive: true });
  return dir;
}

function runPs(script, args, { timeout = 30000 } = {}) {
  const out = execFileSync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, ...args],
    { encoding: "utf8", timeout, windowsHide: true },
  );
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

/** Move/resize the window so click coordinates are stable across runs. */
export function moveWindow({ title = DEFAULT_WINDOW_TITLE, x = 100, y = 40, width = 1384, height = 900 } = {}) {
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
export function click({ title = DEFAULT_WINDOW_TITLE, x, y, double = false } = {}) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("click needs numeric x and y");
  const action = double ? "dblclick" : "click";
  const r = runPs(WIN32_PS1, ["-Action", action, "-Title", title, "-X", String(Math.round(x)), "-Y", String(Math.round(y))]);
  if (!r || r.ok === false) throw new Error(`click failed at ${x},${y}`);
  return r;
}

/** Send a key chord to the window, e.g. "^{s}" or "{ESC}". */
export function sendKeys({ title = DEFAULT_WINDOW_TITLE, keys } = {}) {
  const r = runPs(WIN32_PS1, ["-Action", "key", "-Title", title, "-Keys", keys]);
  if (!r || r.ok === false) throw new Error(`key "${keys}" failed`);
  return r;
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

/** One-shot: screenshot + analysis. */
export function uiState({ title = DEFAULT_WINDOW_TITLE, mode = "print" } = {}) {
  const shot = capture({ title, mode });
  const analysis = analyzeShot(shot.path);
  return { window: windowInfo(title), screenshot: shot.path, ...analysis };
}

// ---------------------------------------------------------------------------
// Export orchestration
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
 */
export async function runExport({
  title = DEFAULT_WINDOW_TITLE,
  outDir = DEFAULT_OUT_DIR,
  stage = "full",
  settleMs = 1200,
  timeoutMs = 15 * 60 * 1000,
  pollMs = 2000,
  stableFor = 3,
} = {}) {
  const before = new Map(listVideos(outDir).map((v) => [v.name, v.size]));
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
  if (stage === "dialog") {
    return { ok: true, stage, dialogOpen: true, clicked: false, log };
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
    const now = listVideos(outDir);
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
        if (stable >= stableFor) {
          log.push({ step: "done", file: newest.file, size: newest.size });
          return { ok: true, stage, dialogOpen: false, file: newest.file, size: newest.size, log };
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
    `export did not produce a file in ${outDir} within ${Math.round(timeoutMs / 1000)}s` +
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
