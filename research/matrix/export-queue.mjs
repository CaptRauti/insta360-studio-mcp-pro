// What does the export dialog's second button do?
//
// Manual, 2026-11-26: the dialog's bottom row holds `Zur Warteschlange` and `Exportieren`, and
// only `Exportieren` is accent-coloured (SKILL.md). So the queue button cannot be found by
// colour -- it has to be found by OCR text. This measures what it *does*:
//
//   1. open the dialog, OCR the bottom row, report both buttons' boxes
//   2. snapshot every file under the Studio tree (path -> size/mtime)
//   3. click `Zur Warteschlange`
//   4. what changed on screen (dialog still open? a queue view?) and on disk (a queue file?,
//      the preset model?) -- and whether anything started exporting
//
// Run:  node research/matrix/export-queue.mjs [> out.log]
// Leaves the dialog as it found it where it can; prints what it could not undo.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { capture, click, runExport, sleep, uiState, windowInfo } from "../../src/ui.mjs";
import { ocrImage, findText, describeOcr } from "../../src/ocr.mjs";

const TITLE = "Insta360 Studio";
const ROOT = path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"), "Insta360", "Insta360 Studio");

/** path -> "size@mtime" for every file under the Studio tree. */
function snapshotTree(root) {
  const out = new Map();
  const walk = (dir, depth = 0) => {
    if (depth > 6) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full, depth + 1);
      else {
        try {
          const st = fs.statSync(full);
          out.set(full, `${st.size}@${Math.round(st.mtimeMs)}`);
        } catch {
          /* vanished mid-walk */
        }
      }
    }
  };
  walk(root);
  return out;
}

function diffTree(before, after) {
  const added = [];
  const changed = [];
  const removed = [];
  for (const [f, v] of after) {
    if (!before.has(f)) added.push({ file: f, now: v });
    else if (before.get(f) !== v) changed.push({ file: f, before: before.get(f), now: v });
  }
  for (const f of before.keys()) if (!after.has(f)) removed.push(f);
  const short = (f) => path.relative(ROOT, f);
  return {
    added: added.map((a) => ({ file: short(a.file), now: a.now })),
    changed: changed.map((c) => ({ file: short(c.file), before: c.before, now: c.now })),
    removed: removed.map(short),
  };
}

/** The dialog's bottom row, as words. The queue button's label is **truncated by its own
 * width** — the plain OCR reads only `Zur`, and at 4x it reads `Zur` + `Wartes...` (measured
 * 2026-11-26, same truncation the option labels show). So match the stem, not the word. */
function buttonsOf(result) {
  const grab = (needle) =>
    findText(result, needle).map((h) => ({ text: h.text, x: h.x, y: h.y, left: h.left, top: h.top, w: h.width, h: h.height }));
  return {
    queue: [...grab("Wartes"), ...grab("Zur").filter((w) => w.text.trim().toLowerCase() === "zur")],
    export: grab("Exportieren"),
  };
}

/** Files on the Desktop (the dialog's out dir), so a queued job that starts is not missed. */
function desktopFiles() {
  const dir = path.join(os.homedir(), "Desktop");
  const out = new Map();
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isFile()) continue;
      try {
        const st = fs.statSync(path.join(dir, e.name));
        out.set(e.name, `${st.size}@${Math.round(st.mtimeMs)}`);
      } catch {
        /* skip */
      }
    }
  } catch {
    /* no Desktop */
  }
  return out;
}

function diffMap(before, after, limit = 20) {
  const added = [];
  const changed = [];
  for (const [f, v] of after) {
    if (!before.has(f)) added.push(f);
    else if (before.get(f) !== v) changed.push(f);
  }
  return { added: added.slice(0, limit), changed: changed.slice(0, limit) };
}

function ocrWindow(tag) {
  const shot = capture({ title: TITLE });
  const ocr = ocrImage(shot.path);
  return { shot, ocr, buttons: buttonsOf(ocr) };
}

const log = (label, value) => console.error(`${label} ${typeof value === "string" ? value : JSON.stringify(value)}`);
const out = { at: new Date().toISOString(), steps: [] };

// 1. make sure the dialog is open
const opened = await runExport({ title: TITLE, stage: "dialog" });
log("dialogOpen:", opened.dialogOpen);
out.dialogOpened = opened.dialogOpen;

const win = windowInfo(TITLE);
out.window = { width: win?.width, height: win?.height };

// 2. where are the two buttons?
const before = ocrWindow("before");
log("window:", `${before.shot.width}x${before.shot.height}`);
log("queue button:", before.buttons.queue);
log("export button:", before.buttons.export);
log("export accent box:", uiState({ title: TITLE }).dialogExport);
out.buttonsBefore = before.buttons;
out.exportAccent = uiState({ title: TITLE }).dialogExport;

const queueBtn = before.buttons.queue[0];
if (!queueBtn) {
  log("VERDICT:", "no `Zur Wartes...` word found — cannot click the queue button");
  out.verdict = "button-not-found";
  out.words = (before.ocr.words ?? []).map((w) => w.text);
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

// The queue button sits left of the accent Exportieren box; click the label itself, which is
// inside its hit area. (Clicking blind 100 px left of the accent is what SKILL.md warns about.)
out.queueButton = queueBtn;
out.accentLeft = before.exportAccent ? before.exportAccent.x : null;

// 3. snapshot tree + Desktop, then click
const treeBefore = snapshotTree(ROOT);
const deskBefore = desktopFiles();
log("tree files before:", treeBefore.size);
log("desktop files before:", deskBefore.size);

click({ title: TITLE, x: queueBtn.x, y: queueBtn.y });
log("clicked queue button at:", { x: queueBtn.x, y: queueBtn.y });

// A queued job may start on its own, so watch for a while, not just once.
await sleep(4000);
const after = ocrWindow("after");
const state = uiState({ title: TITLE });
log("dialogOpen after 4s:", state.dialogOpen);
log("screen after 4s:", describeOcr(after.ocr)?.lines?.slice(0, 30));
out.onScreenAfter4s = describeOcr(after.ocr)?.lines?.slice(0, 40) ?? [];
out.dialogOpenAfter4s = state.dialogOpen;
out.buttonsAfter = after.buttons;

await sleep(8000);
const state2 = uiState({ title: TITLE });
const deskAfter = desktopFiles();
const treeAfter = snapshotTree(ROOT);
log("dialogOpen after 12s:", state2.dialogOpen);
log("desktop diff:", diffMap(deskBefore, deskAfter));
log("tree diff:", diffTree(treeBefore, treeAfter));

out.clicked = { x: queueBtn.x, y: queueBtn.y };
out.dialogOpenAfter12s = state2.dialogOpen;
out.desktopDiff = diffMap(deskBefore, deskAfter);
out.treeDiff = diffTree(treeBefore, treeAfter);
out.screenshotBefore = before.shot.path;
out.screenshotAfter = after.shot.path;

// The queue is a real feature the user owns: say plainly what state this left behind.
out.leftBehind = state2.dialogOpen
  ? "dialog still open (the queue button does not close it)"
  : "dialog closed by the queue button";

console.log(JSON.stringify(out, null, 2));
