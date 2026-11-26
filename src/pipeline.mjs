// The end-to-end pipeline: source footage in, finished video out.
//
// The division of labour is forced by what Studio will and will not accept:
//
//   * The exporter resolves footage from its *own* project state. Handing it a
//     job over gRPC fails with EXPORTER_START_FAILURE for every video type, no
//     matter what the UI is showing (measured in three UI states). Video export
//     therefore has to run through the GUI.
//   * Building the timeline does *not* have to run through the GUI. A `.insproj`
//     written on disk is read and honoured: measured round-trip of a project
//     built here (3 clips, per-clip trims, a filter, a transition) came back from
//     Studio with every value intact — Studio only re-IDs clips/transitions and
//     re-points `deep_track.save_path` at the new project.
//
// So the pipeline writes the timeline as a file and only uses the GUI for the
// two things that need it: opening the project, and running the export.
//
// One ordering rule matters: **Studio reads `pro.insproj` at startup and
// rewrites it from memory on exit.** A project registered while Studio is
// running is therefore lost when Studio closes. Register with Studio down, then
// start it — which is why the pipeline stops Studio before writing.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync, spawn } from "node:child_process";
import { readProject, writeProject, newProjectFrom, summarizeProject, timelineLayout, relayout, makeTransition, setEffect, trimClip, harvestClips, BUILD_MARKER } from "./project.mjs";
import { assetLibrary, findAsset, librarySummary, studioDataRoot } from "./assets.mjs";
import { readScreen, openProject as openProjectGui, openTab, findWord } from "./editor.mjs";
import { runExport, sleep, DEFAULT_WINDOW_TITLE, windowInfo, focusWindow } from "./ui.mjs";
import { applySettings } from "./export-dialog.mjs";

export const STUDIO_EXE = path.join(os.homedir(), "AppData/Local/Insta360/Apps/Insta360 Studio/current/Insta360 Studio.exe");
export const PRO_LIST = path.join(os.homedir(), "AppData/Local/Insta360/Insta360 Studio/nle/pro.insproj");

/** Where Studio keeps its timeline projects. */
export function projectsRoot() {
  const dataRoot = studioDataRoot();
  return path.join(dataRoot, "TimelineProject");
}

/* ------------------------------------------------------------------ process */

/**
 * Run a PowerShell snippet.
 *
 * `-NonInteractive` and an ignored stdin are both required: without them
 * PowerShell tries to read the console and dies with "stdin is not a tty" as
 * soon as stdout is a pipe (measured: the same call works interactively and
 * fails with exit code 1 under `| tee`).
 */
function ps(script, { retries = 3, delayMs = 400 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return execFileSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", script], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      }).trim();
    } catch (err) {
      lastErr = err;
      if (attempt < retries - 1) sleepSync(delayMs * (attempt + 1));
    }
  }
  throw lastErr;
}

/** Blocking sleep — `ps` is called from sync helpers, so it cannot await. */
function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

export function studioProcess() {
  let out;
  try {
    out = ps(`Get-Process 'Insta360 Studio' -ErrorAction SilentlyContinue | Select-Object -First 1 -Property Id,MainWindowHandle | ConvertTo-Json -Compress`);
  } catch {
    return null;
  }
  if (!out) return null;
  try {
    const p = JSON.parse(out);
    return { pid: p.Id, hwnd: p.MainWindowHandle || 0 };
  } catch {
    return null;
  }
}

/**
 * Wait until Studio has a real top-level window.
 *
 * Studio reports a window handle of 0 for several seconds while it starts, and
 * screenshotting before it appears yields a blank frame — so the wait is on the
 * handle, not on the process existing.
 */
export async function waitForWindow({ timeoutMs = 90000, pollMs = 2000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const p = studioProcess();
    if (p?.hwnd) {
      await sleep(3000);
      return p;
    }
    await sleep(pollMs);
  }
  return null;
}

/**
 * Wait until the start page is actually painted.
 *
 * A window handle appears long before the CEF renderer has drawn anything: the
 * handle is there in ~10s while the library needs ~20s. Opening a project too
 * early fails with "project library not on screen" even though the project
 * exists — measured in the first pipeline run, where a fixed 3s settle after the
 * handle was not enough.
 */
export async function waitForLibrary({ title = DEFAULT_WINDOW_TITLE, timeoutMs = 120000, pollMs = 2500 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    try {
      // The window state has to be read before the capture: a *minimised* Studio
      // cannot be captured at all (its frame is not composited), and quiet mode
      // will not restore it. Merely being behind other windows is fine.
      const state = focusWindow({ title });
      if (state?.iconic) {
        return {
          ok: false,
          error: "Studio is minimised — restore its window, then run again (quiet mode does not raise or move windows)",
          words: 0,
        };
      }
    } catch {
      // Window may not exist yet; the capture below will report it.
    }
    try {
      const screen = readScreen({ title });
      if (screen.ok) {
        last = screen;
        if (findWord(screen.words, "Projektbibliothek", { exact: false })) return { ok: true, waited: true };
      }
    } catch {
      // Window may be mid-repaint; keep polling.
    }
    await sleep(pollMs);
  }
  return { ok: false, error: "start page did not render in time", words: last?.words?.length ?? 0 };
}

export async function stopStudio({ timeoutMs = 20000 } = {}) {
  const p = studioProcess();
  if (!p) return { ok: true, wasRunning: false };
  ps(`$p = Get-Process -Id ${p.pid} -ErrorAction SilentlyContinue; if ($p) { [void]$p.CloseMainWindow() }`);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!studioProcess()) return { ok: true, wasRunning: true, graceful: true };
    await sleep(1000);
  }
  ps(`Stop-Process -Id ${p.pid} -Force -ErrorAction SilentlyContinue`);
  for (let i = 0; i < 15; i++) {
    if (!studioProcess()) return { ok: true, wasRunning: true, graceful: false };
    await sleep(1000);
  }
  return { ok: false, error: "Studio did not stop" };
}

export async function startStudio({ timeoutMs = 90000 } = {}) {
  if (!fs.existsSync(STUDIO_EXE)) return { ok: false, error: `Studio not found at ${STUDIO_EXE}` };
  spawn(STUDIO_EXE, [], { detached: true, stdio: "ignore" }).unref();
  const p = await waitForWindow({ timeoutMs });
  if (!p) return { ok: false, error: "Studio window did not appear" };
  // Studio reads pro.insproj at start-up, so a project switch means a restart, and
  // the fresh window is placed in front by Windows itself — not by us. Do not
  // raise it as well; a background Studio captures fine (see focusWindow).
  try {
    focusWindow({ title: DEFAULT_WINDOW_TITLE });
  } catch {
    // Non-fatal: the caller's waitForLibrary will report if the UI never paints.
  }
  return { ok: true, pid: p.pid, hwnd: p.hwnd };
}

/** Stop and start Studio so it re-reads `pro.insproj`. */
export async function restartStudio(opts = {}) {
  const stopped = await stopStudio(opts);
  if (!stopped.ok) return stopped;
  const started = await startStudio(opts);
  if (!started.ok) return started;
  return { ok: true, restarted: stopped.wasRunning, pid: started.pid, hwnd: started.hwnd };
}

/* --------------------------------------------------------------- project list */

function readProList() {
  if (!fs.existsSync(PRO_LIST)) return { projects: [] };
  try {
    return JSON.parse(fs.readFileSync(PRO_LIST, "utf8"));
  } catch {
    return { projects: [] };
  }
}

/** Add or replace an entry in Studio's project list. Call this with Studio down. */
export function registerProject(entry) {
  const list = readProList();
  list.projects = (list.projects ?? []).filter((p) => p.name !== entry.name && p.id !== entry.id);
  list.projects.push(entry);
  fs.writeFileSync(PRO_LIST, JSON.stringify(list, null, 4), "utf8");
  return { ok: true, count: list.projects.length, projects: list.projects.map((p) => p.name) };
}

export function unregisterProject(name) {
  const list = readProList();
  const before = list.projects?.length ?? 0;
  list.projects = (list.projects ?? []).filter((p) => p.name !== name);
  fs.writeFileSync(PRO_LIST, JSON.stringify(list, null, 4), "utf8");
  return { ok: true, removed: before - list.projects.length };
}

export function listProjects() {
  return readProList().projects ?? [];
}

/**
 * Put a project first in Studio's own project list (`nle/pro.insproj`).
 *
 * Written for the keyframe acceptance test, which needs Studio to *load* a project after a
 * restart. Scope and limits, measured:
 *
 * - Putting a project first did **not** make a freshly started Studio open it — the start
 *   page showed the media library and stayed there, no autosave of the project file. So this
 *   is not a way to open a project; treat the ordering as a hint, not a switch.
 * - The start page's sidebar is not a way in either: its "Projektbibliothek" entry does not
 *   respond to a click while the media page is showing (measured: 0 px changed, after 30 s,
 *   at 1384x900). The click path *does* work once an editor is already open — that is how
 *   `openProject` switches projects — so a fresh start has no reachable project library.
 */
export function setCurrentProject(name) {
  const list = readProList();
  const entries = list.projects ?? [];
  const idx = entries.findIndex((p) => String(p.name).toLowerCase() === String(name).toLowerCase());
  if (idx < 0) return { ok: false, error: `project "${name}" is not registered`, projects: entries.map((p) => p.name) };
  const [entry] = entries.splice(idx, 1);
  entries.unshift(entry);
  list.projects = entries;
  fs.writeFileSync(PRO_LIST, JSON.stringify(list, null, 4), "utf8");
  return { ok: true, current: entry.name, projects: entries.map((p) => p.name) };
}

/** Turn a project directory or .insproj path into { dir, file }. */
function resolveProjectPath(target) {
  const p = path.resolve(target);
  let stat;
  try {
    stat = fs.statSync(p);
  } catch {
    return null;
  }
  if (stat.isDirectory()) {
    const files = fs.readdirSync(p).filter((f) => f.endsWith(".insproj") && !f.includes("_backup"));
    if (!files.length) return null;
    const file = path.join(p, files[0]);
    return { dir: p, file };
  }
  if (!p.endsWith(".insproj")) return null;
  return { dir: path.dirname(p), file: p };
}

/**
 * Open a project in the Studio GUI, whether or not it is registered.
 *
 * `openProject` (editor.mjs) clicks a card in the library, and the library only
 * shows projects listed in `pro.insproj`. A project that exists on disk but was
 * never registered — or was moved between folders, so its `projectPath` is
 * stale — therefore cannot be opened at all: the card is simply not there. That
 * is the "project did not open" failure, and it is a registration gap, not a
 * broken project.
 *
 * So: resolve the target on disk, read its own id/name, register it with Studio
 * **down** (Studio rewrites pro.insproj from memory on exit, so a registration
 * written while it runs is lost), then start Studio and click the card. When the
 * project is already registered and Studio is already up, this degrades to a
 * plain click without a restart.
 *
 * @param {string} target  project directory or .insproj file
 */
export async function openProjectAt(target, { title = DEFAULT_WINDOW_TITLE, settleMs = 12000 } = {}) {
  const resolved = resolveProjectPath(target);
  if (!resolved) return { ok: false, error: `no .insproj found at ${target}` };

  let data;
  try {
    data = await readProject(resolved.file);
  } catch (err) {
    return { ok: false, error: err.message };
  }

  const name = data.name ?? path.basename(resolved.dir);
  const id = data.id ?? path.basename(resolved.file, ".insproj");
  const projectPath = resolved.dir.replace(/\\/g, "/");

  const key = (v) => String(v ?? "").toLowerCase();
  const registered = listProjects().find((p) => key(p.name) === key(name) || key(p.id) === key(id));
  const stale = registered && key(registered.projectPath) !== key(projectPath);

  const already = Boolean(registered) && !stale;
  if (already) {
    const up = studioProcess();
    if (!up) {
      const started = await startStudio();
      if (!started.ok) return { ok: false, error: started.error, registered: true };
      const ready = await waitForLibrary({ title });
      if (!ready.ok) return { ok: false, error: ready.error, registered: true };
    }
    const opened = await openProjectGui(name, { title, settleMs, verifyFile: resolved.file });
    return { ...opened, registered: true, restarted: false, name };
  }

  // Register with Studio down, then bring it up on the fresh list.
  const stop = await stopStudio();

  // A moved project still carries its old `projectPath` inside the file. Studio
  // trusts that field, so it must point at where the project actually lives.
  // Only repair when the recorded path is gone — never when it still exists.
  let repaired = false;
  if (data.projectPath && !fs.existsSync(String(data.projectPath).replace(/\//g, path.sep))) {
    data.projectPath = projectPath;
    await writeProject(resolved.file, data, { backup: true });
    repaired = true;
  }

  const entry = {
    adsorbable: true,
    aspectRatio: data.aspectRatio ?? "16:9",
    autoFps: data.autoFps ?? false,
    creationTime: data.creationTime ?? "",
    enableEffects: data.enableEffects ?? true,
    fps: data.fps ?? 30,
    frames: data.frames ?? 0,
    id,
    isPanoramic: data.isPanoramic ?? false,
    lastModifiedTime: data.lastModifiedTime ?? "",
    lowQualityProxyType: -1,
    mainMagnetizable: data.mainMagnetizable ?? true,
    name,
    previewable: false,
    projectMediaType: "",
    projectPath,
  };
  const reg = registerProject(entry);

  const started = await startStudio();
  if (!started.ok) {
    return { ok: false, error: started.error, registered: true, name, registration: reg, stages: [{ stage: "stop-studio", wasRunning: stop.wasRunning }] };
  }
  const ready = await waitForLibrary({ title });
  if (!ready.ok) return { ok: false, error: ready.error, registered: true, name, registration: reg };

  const opened = await openProjectGui(name, { title, settleMs, verifyFile: resolved.file });
  return {
    ...opened,
    registered: true,
    restarted: true,
    stalePath: stale || undefined,
    repairedPath: repaired || undefined,
    name,
    project: resolved.file,
    registration: reg,
  };
}

/* -------------------------------------------------------------------- assets */

/** Turn a user-supplied asset name into the id/path pair a clip needs. */
export function resolveAsset(kind, query) {
  if (!query) return null;
  const hit = findAsset(kind, query);
  if (!hit.ok) return null;
  const a = hit.asset;
  return {
    id: a.id ?? a.name,
    name: a.name,
    resource: a.resource ?? a.path ?? a.dir ?? "",
  };
}

export function assetCatalog() {
  const s = librarySummary();
  const lib = assetLibrary();
  return {
    root: s.dataRoot,
    counts: s.counts,
    filters: lib.kinds.filter.map((a) => a.name),
    transitions: lib.kinds.transition.map((a) => a.name),
    effects: lib.kinds.effect.map((a) => a.name),
    text: lib.kinds.text.map((a) => a.name),
    movements: lib.kinds.movement.map((a) => a.name),
  };
}

/* ------------------------------------------------------------------- builder */

/**
 * Marker file written into a project directory this tooling created.
 *
 * `findTemplate` must never pick a project this tooling wrote. It did: it
 * returned `mcpE2E`, an earlier output of the builder, so the builder was
 * modelling itself on its own output — a template has to be a project *Studio*
 * authored. The marker is a file beside the project rather than a key inside it,
 * because the project JSON has to stay comparable with what Studio writes.
 *
 * A directory is only treated as ours when the marker is there, so a project the
 * user created in the GUI is never skipped by mistake.
 */
export { BUILD_MARKER };

/** Record that this tooling wrote (or owns) the project in `dir`. */
export function markBuilt(dir, extra = {}) {
  const file = path.join(dir, BUILD_MARKER);
  const payload = { tool: "insta360-studio-mcp-pro", at: new Date().toISOString(), ...extra };
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return file;
}

/** Was the project in this directory written by this tooling? */
export function isBuiltProject(dir) {
  return fs.existsSync(path.join(dir, BUILD_MARKER));
}

/**
 * Pick a project file to clone as a template.
 *
 * A clip is a large, interdependent settings block (56-field `media_process`,
 * capability flags, bounds), and a project carries watermark/magnet/HDR fields
 * of its own. Cloning a project Studio itself wrote is the only reliable way to
 * get all of that right, so the newest real project on disk is used as the
 * template.
 *
 * The candidate must actually contain a video clip: sorting by file size is not
 * enough — measured, the largest project on this machine is audio-only and
 * `newProjectFrom` rejects it.
 */
export function findTemplate({ exclude = [], root = projectsRoot() } = {}) {
  // An explicit template beats discovery: the newest project on disk is only a
  // guess at what is representative footage.
  const forced = process.env.INSTA360_TEMPLATE;
  if (forced) return fs.existsSync(forced) ? forced : null;
  if (!fs.existsSync(root)) return null;
  const skip = new Set(exclude);
  const candidates = [];
  for (const dir of fs.readdirSync(root)) {
    if (skip.has(dir)) continue;
    const full = path.join(root, dir);
    let stat;
    try {
      stat = fs.statSync(full);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;
    if (isBuiltProject(full)) continue; // our own output is not a template
    for (const f of fs.readdirSync(full)) {
      if (!f.endsWith(".insproj") || f.includes("_backup")) continue;
      const p = path.join(full, f);
      try {
        const st = fs.statSync(p);
        candidates.push({ file: p, mtime: st.mtimeMs, size: st.size });
      } catch {}
    }
  }
  candidates.sort((a, b) => b.mtime - a.mtime);

  for (const c of candidates) {
    try {
      const data = JSON.parse(fs.readFileSync(c.file, "utf8"));
      const video = (data.tracks ?? []).find((t) => t.type === 0);
      if (video && Array.isArray(video.clips) && video.clips.length > 0) {
        return c.file;
      }
    } catch {
      // Not a usable project — keep looking.
    }
  }
  return null;
}

/**
 * Build a project object from a simple edit description.
 *
 * `clips` entries: { source, start, end, effect, opacity, volume, speed }
 * `transitions` entries: { name, frames, after }  (after = clip index)
 */
export async function buildProject({ name, template, clips = [], transitions = [], fps, aspectRatio, projectPath }) {
  const templateData = typeof template === "string" ? await readProject(template) : template;
  const sources = clips.map((c) => c.source);
  // Per-file metadata: a clip is only a valid model for the file it points at,
  // so existing projects are harvested for a clip per source file. Without this
  // every clip inherits the template clip's length and Studio refuses to export
  // the result ("Materialdatei verloren gegangen").
  const clipModels = harvestClips(projectsRoot());
  const project = newProjectFrom(templateData, { name, projectPath, sources, fps, aspectRatio, clipModels });
  const video = project.tracks.find((t) => t.type === 0);
  if (!video) throw new Error("template produced no video track");

  const report = [];
  video.clips.forEach((clip, i) => {
    const spec = clips[i] ?? {};
    const total = clip.source_total_frames ?? clip.sourceFrames ?? 0;
    const from = Number.isFinite(spec.start) ? spec.start : 0;
    const to = Number.isFinite(spec.end) ? spec.end : total;
    // Studio trims are frames removed from each side of the source.
    clip.leftTrim = Math.max(0, Math.round(from));
    clip.rightTrim = Math.max(0, Math.round(total - to));
    if (spec.name) clip.name = spec.name;

    if (spec.effect) {
      const a = resolveAsset("filter", spec.effect);
      if (a) setEffect(clip, { id: a.id, name: a.name, resourcePath: a.resource, opacity: spec.opacity ?? 70 });
      else report.push({ clip: i, warning: `filter "${spec.effect}" not found` });
    }
    if (spec.volume !== undefined && clip.audio_setting) {
      // The field is `currentVolume`, not `volume` — measured against a clip
      // Studio wrote. There is also a `preDetachVolume` and a `currentMixingWeight`.
      clip.audio_setting.currentVolume = spec.volume;
    }
    if (spec.fadeIn !== undefined && clip.audio_setting) clip.audio_setting.currentFadeIn = spec.fadeIn;
    if (spec.fadeOut !== undefined && clip.audio_setting) clip.audio_setting.currentFadeOut = spec.fadeOut;
    report.push({
      clip: i,
      source: spec.source,
      sourceFrames: total,
      trim: [clip.leftTrim, clip.rightTrim],
      length: total - clip.leftTrim - clip.rightTrim,
      effect: clip.effect_filter?.externfilterName || null,
    });
  });

  relayout(project);

  video.transitions = [];
  for (const t of transitions) {
    const a = resolveAsset("transition", t.name);
    if (!a) {
      report.push({ transition: t.name, warning: "transition not found" });
      continue;
    }
    const after = Number.isFinite(t.after) ? t.after : 0;
    const prev = video.clips[after];
    const next = video.clips[after + 1];
    if (!prev || !next) {
      report.push({ transition: t.name, warning: `no clip pair at index ${after}` });
      continue;
    }
    video.transitions.push(
      makeTransition({
        resourceId: a.id,
        resourcePath: a.resource,
        prevClip: prev.id,
        nextClip: next.id,
        frames: t.frames ?? 30,
      })
    );
  }

  return { project, report, summary: summarizeProject(project), layout: timelineLayout(project) };
}

/**
 * Write a project to disk and register it, with Studio stopped.
 *
 * Returns the file path; the caller is expected to start Studio and open it.
 */
export async function writeAndRegister({ name, project, overwrite = true }) {
  const dir = path.join(projectsRoot(), name);
  const file = path.join(dir, `${project.id}.insproj`);
  if (!overwrite && fs.existsSync(file)) return { ok: false, error: `${file} exists` };
  fs.mkdirSync(dir, { recursive: true });
  // Mark before writing the project: from here on the directory is our output and
  // must never be picked as a template, however the write ends.
  markBuilt(dir, { project: name });
  const w = await writeProject(file, project, { backup: false });
  const reg = registerProject({
    adsorbable: true,
    aspectRatio: project.aspectRatio ?? "16:9",
    autoFps: false,
    creationTime: project.creationTime,
    enableEffects: true,
    fps: project.fps ?? 30,
    frames: project.frames ?? 0,
    id: project.id,
    isPanoramic: project.isPanoramic ?? false,
    lastModifiedTime: project.lastModifiedTime,
    lowQualityProxyType: -1,
    mainMagnetizable: true,
    markTrimEnd: project.markTrimEnd ?? 0,
    markTrimIn: project.markTrimIn ?? 0,
    markTrimVisible: false,
    name,
    previewable: false,
    projectMediaType: "",
    projectPath: dir.replace(/\\/g, "/"),
  });
  return { ok: true, file: w.filePath, bytes: w.bytes, registered: reg };
}

/* ------------------------------------------------------------------ pipeline */

/**
 * Source clips in, exported video out.
 *
 * Stages, each reported separately so a caller can see how far it got:
 *   1. stop Studio            (so the project list can be written)
 *   2. build + write project
 *   3. start Studio, open the project
 *   4. apply export settings, run the export, verify the file
 */
export async function runPipeline({
  name = "mcpEdit",
  clips = [],
  transitions = [],
  export: exportOpts = {},
  fps,
  aspectRatio,
  title = DEFAULT_WINDOW_TITLE,
  keepStudioOpen = true,
  onStage = () => {},
} = {}) {
  const stages = [];
  const stage = (s, data) => {
    stages.push({ stage: s, ...data });
    onStage(s, data);
  };

  if (!clips.length) return { ok: false, error: "no clips given", stages };

  // 1. Studio down — required before touching pro.insproj.
  const stop = await stopStudio();
  stage("stop-studio", { wasRunning: stop.wasRunning, graceful: stop.graceful ?? null });

  // 2. Build and write.
  const template = findTemplate({ exclude: [name] });
  if (!template) return { ok: false, error: `no template project found under ${projectsRoot()}`, stages };
  const built = await buildProject({
    name,
    template,
    clips,
    transitions,
    fps,
    aspectRatio,
    projectPath: path.join(projectsRoot(), name).replace(/\\/g, "/"),
  });
  const written = await writeAndRegister({ name, project: built.project });
  if (!written.ok) return { ok: false, error: written.error, stages };
  stage("write-project", {
    file: written.file,
    bytes: written.bytes,
    template,
    frames: built.summary.frames,
    clips: built.report,
  });

  // 3. Studio up, project open.
  const started = await startStudio();
  if (!started.ok) return { ok: false, error: started.error, stages };
  const ready = await waitForLibrary({ title });
  stage("start-studio", { pid: started.pid, hwnd: started.hwnd, libraryReady: ready.ok });
  if (!ready.ok) return { ok: false, error: ready.error, stages };
  const opened = await openProjectGui(name, { title });
  stage("open-project", {
    ok: opened.ok,
    clicked: opened.clicked ?? null,
    error: opened.error ?? null,
    visible: opened.visible ?? null,
    text: opened.text?.slice(0, 200) ?? null,
  });
  if (!opened.ok) return { ok: false, error: "project did not open in the editor", stages };

  // 4. Export.
  const exp = await runExport({ title, ...exportOpts });
  stage("export", {
    ok: exp.ok,
    file: exp.file ?? null,
    bytes: exp.size ?? null,
    settings: exp.settings ?? null,
    error: exp.error ?? null,
  });

  if (!keepStudioOpen) await stopStudio();

  return { ok: Boolean(exp.ok), stages, project: written.file, file: exp.file ?? null };
}

export { applySettings };
