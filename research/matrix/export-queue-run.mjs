// Does the queue button *run* a job, and where does it write?
//
// The single-shot probe (export-queue.mjs) showed: clicking `Zur Warteschlange` closes the dialog,
// rewrites video_export_preset_model.json, and 12 s later no new file exists and no new export log
// appeared. A queued export could still start later, or write somewhere else. This watches instead
// of guessing: click it, then poll the out dir, the Desktop and the log directory for four minutes.
//
// Run: node research/matrix/export-queue-run.mjs

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { capture, click, runExport, sleep, uiState } from "../../src/ui.mjs";
import { ocrImage, findText, describeOcr } from "../../src/ocr.mjs";

const TITLE = "Insta360 Studio";
const OUT_DIR = path.join(os.homedir(), "Desktop");
const LOG_DIR = path.join(
  process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"),
  "Insta360",
  "Insta360 Studio",
  "log",
  "studio",
);
const WATCH_MS = 4 * 60 * 1000;
const STEP_MS = 10 * 1000;

const listDir = (dir, filter = () => true) => {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && filter(e.name))
      .map((e) => {
        const st = fs.statSync(path.join(dir, e.name));
        return { name: e.name, size: st.size, mtime: Math.round(st.mtimeMs) };
      })
      .sort((a, b) => b.mtime - a.mtime);
  } catch {
    return [];
  }
};

const newestSession = () => {
  const dirs = fs
    .readdirSync(LOG_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "archive")
    .map((e) => ({ name: e.name, mtime: fs.statSync(path.join(LOG_DIR, e.name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
  return dirs[0]?.name ?? null;
};
const logFiles = (session) => listDir(path.join(LOG_DIR, session));

const log = (label, value) => console.error(`${label} ${typeof value === "string" ? value : JSON.stringify(value)}`);
const out = { at: new Date().toISOString(), timeline: [] };

// The queue button's label is truncated by its own width: plain OCR reads `Zur`, 4x reads
// `Zur` + `Wartes...`. Match the stem.
const queueWord = (ocr) => {
  const hits = [...findText(ocr, "wartes"), ...findText(ocr, "Zur").filter((w) => w.text.trim().toLowerCase() === "zur")];
  return hits.filter((h) => h.y > 700)[0] ?? null;
};

// 1. dialog open?
const opened = await runExport({ title: TITLE, stage: "dialog" });
log("dialogOpen at start:", opened.dialogOpen);

const shot = capture({ title: TITLE });
const ocr = ocrImage(shot.path);
const btn = queueWord(ocr);
if (!btn) {
  log("VERDICT:", "queue button not on screen — aborting rather than clicking blind");
  const stateWords = (ocr.words ?? []).filter((w) => w.y > 700).map((w) => `${w.text}@${w.x},${w.y}`);
  out.verdict = "no-queue-button";
  out.bottomWords = stateWords;
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}
out.clickedAt = { x: btn.x, y: btn.y };

const session = newestSession();
const before = {
  outDir: listDir(OUT_DIR, (n) => /\.(mp4|mov|insv)$/i.test(n)),
  logs: logFiles(session),
  desktop: listDir(OUT_DIR),
};
log("session dir:", session);
log("out dir files before:", before.outDir.length);
log("log files before:", before.logs.map((f) => f.name));

// 2. click
click({ title: TITLE, x: btn.x, y: btn.y });
log("clicked queue button at:", `${btn.x},${btn.y}`);

// 3. watch
const t0 = Date.now();
let step = 0;
let sawProgress = null;
while (Date.now() - t0 < WATCH_MS) {
  await sleep(STEP_MS);
  step++;
  const secs = Math.round((Date.now() - t0) / 1000);

  const nowOut = listDir(OUT_DIR, (n) => /\.(mp4|mov|insv)$/i.test(n));
  const nowLogs = logFiles(session);
  const newOut = nowOut.filter((f) => !before.outDir.some((b) => b.name === f.name));
  const grownLogs = nowLogs.filter((f) => {
    const b = before.logs.find((x) => x.name === f.name);
    return !b || f.size !== b.size || f.mtime !== b.mtime;
  });
  const grownOut = nowOut.filter((f) => {
    const b = before.outDir.find((x) => x.name === f.name);
    return b && f.size !== b.size;
  });

  const entry = {
    t: `${secs}s`,
    dialogOpen: uiState({ title: TITLE }).dialogOpen,
    newOut: newOut.map((f) => `${f.name}(${f.size})`),
    grownOut: grownOut.map((f) => `${f.name}=${f.size}`),
    grownOrNewLogs: grownLogs.map((f) => `${f.name}:${f.size}`),
  };
  out.timeline.push(entry);
  if (newOut.length || grownOut.length || grownLogs.length) log(`t+${secs}s`, entry);

  // one look on screen, 20 s in, for a progress indicator
  if (!sawProgress && secs >= 20) {
    const s = capture({ title: TITLE });
    const o = ocrImage(s.path);
    sawProgress = describeOcr(o)?.lines?.filter((l) => /warte|queue|export|%|Fortschritt|Render/i.test(l)) ?? [];
    out.progressLines = sawProgress;
    out.progressShot = s.path;
    log("screen lines matching progress words:", sawProgress);
  }
}

const after = listDir(OUT_DIR);
const verdict = {
  newVideoFiles: listDir(OUT_DIR, (n) => /\.(mp4|mov|insv)$/i.test(n)).filter(
    (f) => !before.outDir.some((b) => b.name === f.name),
  ).map((f) => f.name),
  newDesktopFiles: after.filter((f) => !before.desktop.some((b) => b.name === f.name)).map((f) => f.name),
  newOrGrownLogs: logFiles(session).filter((f) => {
    const b = before.logs.find((x) => x.name === f.name);
    return !b || f.size !== b.size || f.mtime !== b.mtime;
  }).map((f) => `${f.name}:${f.size}`),
};
out.verdict = verdict;
log("VERDICT:", verdict);
out.leftBehind = uiState({ title: TITLE }).dialogOpen
  ? "dialog still open at the end"
  : "dialog closed (queue click closed it, as before)";

console.log(JSON.stringify(out, null, 2));
