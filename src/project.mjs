// .insproj project file handling.
//
// Verified against real projects in D:\Dokumente\Insta360\Studio\TimelineProject:
// the file is plain UTF-8 JSON (no binary header, no encryption). Top-level keys
// observed: aspectRatio, autoFps, creationTime, enableEffects, fps, frames, id,
// isPanoramic, lastModifiedTime, mainMagnetizable, markTrimEnd, markTrimIn,
// markTrimVisible, name, projectPath, tracks[], watermarkPanel*.
//
// Each track: { audible, clips[], id, locked, transitions[], type, visible }.
// Each clip carries camera_transform (eulers/fov), dewarp_setting,
// camera_movement, audio_setting, effect_filter and url (absolute source path).
//
// This module reads and writes those files directly, so an agent can retime,
// retarget keyframes or repoint a clip without touching the GUI.

import { readFile, writeFile, copyFile } from "node:fs/promises";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * Read the true frame count / fps / dimensions of a source clip.
 *
 * Studio stores the source length PER CLIP, not per project: two clips in one
 * project carry `sourceFrames` 904 and 337 for their two files. Cloning a
 * template clip and repointing only `url` therefore tells Studio that every clip
 * is as long as the template's file, and the export then fails with
 * "Quelldatei fehlt — die Materialdatei ist verloren gegangen" (measured: the
 * export dialog reported a 26480 MB output for an 800-frame timeline).
 *
 * ffprobe is used because it is the only decoder available here. It disagrees
 * with Studio by one frame on at least one file (905 vs 904), which is why
 * `harvestClips` — which lifts the value Studio itself computed out of an
 * existing project — is preferred whenever the file has been used before.
 */
export function probeSource(file) {
  if (!file || !existsSync(file)) return null;
  let raw;
  try {
    raw = execFileSync(
      "ffprobe",
      ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=nb_frames,r_frame_rate,width,height,duration", "-show_entries", "format=duration", "-of", "json", file],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true }
    );
  } catch {
    return null;
  }
  let info;
  try {
    info = JSON.parse(raw);
  } catch {
    return null;
  }
  const s = info.streams?.[0];
  if (!s) return null;
  const [num, den] = String(s.r_frame_rate ?? "0/1").split("/").map(Number);
  const fps = den ? num / den : 0;
  const duration = Number(s.duration ?? info.format?.duration ?? 0);
  // Studio's own count tracks duration*fps rather than the container's
  // nb_frames, so derive it the same way and only fall back to nb_frames.
  let frames = duration > 0 && fps > 0 ? Math.floor(duration * fps) : 0;
  if (!frames && s.nb_frames) frames = Number(s.nb_frames);
  return {
    frames,
    nbFrames: s.nb_frames ? Number(s.nb_frames) : null,
    fps,
    duration,
    width: s.width ?? null,
    height: s.height ?? null,
  };
}

/**
 * Collect, per source file, every clip Studio has written for it.
 *
 * Returns a list of candidates rather than one clip: a project built by earlier
 * (buggy) tooling also contains clips, and its values are wrong. Reconciliation
 * against the real file happens in `sourceMetaFor`, which is the only place that
 * can tell a good candidate from a bad one.
 */
export function harvestClips(root) {
  const out = new Map();
  if (!root || !existsSync(root)) return out;
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(root, entry.name);
    let names;
    try {
      names = readdirSync(dir);
    } catch {
      continue;
    }
    for (const n of names) {
      if (!n.toLowerCase().endsWith(".insproj")) continue;
      if (n.toLowerCase().includes("_backup")) continue;
      files.push(path.join(dir, n));
    }
  }
  for (const file of files) {
    let data;
    try {
      data = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      continue;
    }
    for (const track of data.tracks ?? []) {
      for (const clip of track.clips ?? []) {
        const url = clip.url;
        if (!url || !clip.sourceFrames) continue;
        const list = out.get(url) ?? [];
        if (!list.some((c) => c.sourceFrames === clip.sourceFrames)) list.push(clip);
        out.set(url, list);
      }
    }
  }
  return out;
}

/** Track type values seen in real projects. */
export const TRACK_TYPE = {
  0: "video",
  2: "audio",
  3: "overlay",
};

/** Parse a .insproj file. Throws with the file path on malformed JSON. */
export async function readProject(filePath) {
  const raw = await readFile(filePath, "utf8");
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Not a valid .insproj (JSON parse failed) at ${filePath}: ${err.message}`);
  }
  if (!data || typeof data !== "object" || !Array.isArray(data.tracks)) {
    throw new Error(`Not a valid .insproj (no tracks array) at ${filePath}`);
  }
  return data;
}

/** Write a project back. Creates a .bak copy first unless disabled. */
export async function writeProject(filePath, data, { backup = true } = {}) {
  if (backup && existsSync(filePath)) {
    await copyFile(filePath, `${filePath}.bak`);
  }
  const json = JSON.stringify(data, null, 4);
  await writeFile(filePath, json, "utf8");
  return { filePath, bytes: Buffer.byteLength(json, "utf8"), backup };
}

/** Compact summary of a project: name, fps, frames, tracks, clip sources. */
export function summarizeProject(data) {
  const tracks = (data.tracks ?? []).map((t, i) => ({
    index: i,
    id: t.id ?? null,
    type: t.type ?? null,
    typeName: TRACK_TYPE[t.type] ?? "unknown",
    clipCount: Array.isArray(t.clips) ? t.clips.length : 0,
    transitionCount: Array.isArray(t.transitions) ? t.transitions.length : 0,
    visible: t.visible ?? null,
    locked: t.locked ?? null,
  }));

  const clips = [];
  for (const [ti, t] of (data.tracks ?? []).entries()) {
    for (const [ci, c] of (t.clips ?? []).entries()) {
      clips.push({
        track: ti,
        index: ci,
        id: c.id ?? null,
        name: c.name ?? null,
        url: c.url ?? null,
        startFrame: c.startFrame ?? null,
        leftTrim: c.leftTrim ?? null,
        rightTrim: c.rightTrim ?? null,
        sourceFrames: c.sourceFrames ?? null,
        sourceTotalFrames: c.source_total_frames ?? null,
      });
    }
  }

  return {
    name: data.name ?? null,
    id: data.id ?? null,
    projectPath: data.projectPath ?? null,
    fps: data.fps ?? null,
    frames: data.frames ?? null,
    aspectRatio: data.aspectRatio ?? null,
    isPanoramic: data.isPanoramic ?? null,
    creationTime: data.creationTime ?? null,
    lastModifiedTime: data.lastModifiedTime ?? null,
    markTrimIn: data.markTrimIn ?? null,
    markTrimEnd: data.markTrimEnd ?? null,
    tracks,
    clips,
  };
}

/** Every distinct source file referenced by the project. */
export function projectSources(data) {
  const seen = new Set();
  for (const t of data.tracks ?? []) {
    for (const c of t.clips ?? []) {
      if (c.url) seen.add(c.url);
    }
  }
  return [...seen];
}

/** Read/write the camera transform (view direction) of one clip. */
export function getClipTransform(data, { track = 0, clip = 0 } = {}) {
  const c = data.tracks?.[track]?.clips?.[clip];
  if (!c) throw new Error(`No clip at track ${track} index ${clip}`);
  return {
    cameraTransform: c.camera_transform ?? null,
    cameraMovement: c.camera_movement ?? null,
    dewarpSetting: c.dewarp_setting ?? null,
    aspectRatioInfo: c.aspect_ratio_info ?? null,
  };
}

export function setClipTransform(data, { track = 0, clip = 0 } = {}, patch = {}) {
  const c = data.tracks?.[track]?.clips?.[clip];
  if (!c) throw new Error(`No clip at track ${track} index ${clip}`);
  if (patch.cameraTransform) c.camera_transform = { ...(c.camera_transform ?? {}), ...patch.cameraTransform };
  if (patch.cameraMovement) c.camera_movement = { ...(c.camera_movement ?? {}), ...patch.cameraMovement };
  if (patch.dewarpSetting) c.dewarp_setting = { ...(c.dewarp_setting ?? {}), ...patch.dewarpSetting };
  if (patch.url) c.url = patch.url;
  if (patch.name) c.name = patch.name;
  return c;
}

/** Repoint a clip at a different source file. */
export function repointClip(data, { track = 0, clip = 0 } = {}, newUrl, { renameTo } = {}) {
  const c = data.tracks?.[track]?.clips?.[clip];
  if (!c) throw new Error(`No clip at track ${track} index ${clip}`);
  const previous = c.url;
  c.url = projectPath(newUrl);
  if (renameTo) c.name = renameTo;
  return { previous, current: c.url, name: c.name };
}

/** Trim a clip in frames. */
export function trimClip(data, { track = 0, clip = 0 } = {}, { leftTrim, rightTrim } = {}) {
  const c = data.tracks?.[track]?.clips?.[clip];
  if (!c) throw new Error(`No clip at track ${track} index ${clip}`);
  if (Number.isFinite(leftTrim)) c.leftTrim = leftTrim;
  if (Number.isFinite(rightTrim)) c.rightTrim = rightTrim;
  return { leftTrim: c.leftTrim, rightTrim: c.rightTrim, sourceFrames: c.sourceFrames };
}

/** Locate .insproj files under a Studio project root. */
export async function findProjects(root) {
  const { readdir } = await import("node:fs/promises");
  const out = [];
  async function walk(dir, depth = 0) {
    if (depth > 3) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full, depth + 1);
      else if (e.name.toLowerCase().endsWith(".insproj")) out.push(full);
    }
  }
  await walk(root);
  return out;
}

// ---------------------------------------------------------------------------
// Building and editing timelines
//
// Everything below derives a project from one Studio itself wrote. That is not
// convenience, it is the only reliable route: `media_process` alone is 56 fields
// including capability flags (`supportLut`, `supportColorAdjust`) and bounds
// (`colorAdjustCommonMin`/`Max`), and a clip assembled from a handful of fields
// loads with the rest at parser defaults. `cloneClip` copies a real clip and
// patches it.
//
// Two rules that decide whether an edited file opens correctly:
//
//  1. **Clip order in `clips[]` is timeline order**, and each `startFrame` must
//     equal the running sum of the trimmed lengths before it. Studio recomputes
//     the timeline from these; a mismatch shifts or overlaps clips.
//  2. **Trims are measured in source frames**, so a clip's timeline length is
//     `source_total_frames - leftTrim - rightTrim` — not the raw source length.
// ---------------------------------------------------------------------------

/** Frames one clip occupies on the timeline, after trimming. */
export function clipLength(clip) {
  const total = clip?.source_total_frames ?? clip?.sourceFrames ?? 0;
  return Math.max(0, total - (clip?.leftTrim ?? 0) - (clip?.rightTrim ?? 0));
}

/** Where each clip sits, and how far its `startFrame` has drifted from the sum. */
export function timelineLayout(data) {
  const track = (data.tracks ?? []).find((t) => t.type === 0) ?? data.tracks?.[0];
  if (!track) return [];
  let cursor = 0;
  const out = [];
  for (const clip of track.clips ?? []) {
    const length = clipLength(clip);
    out.push({
      id: clip.id ?? null,
      name: clip.name ?? null,
      expectedStart: cursor,
      actualStart: clip.startFrame ?? null,
      length,
      drift: (clip.startFrame ?? 0) - cursor,
    });
    cursor += length;
  }
  return out;
}

/**
 * Lay clips out end to end, rewriting `startFrame` and the project's frame count.
 * This is what makes a hand-edited order actually take effect.
 */
export function relayout(data) {
  const track = (data.tracks ?? []).find((t) => t.type === 0) ?? data.tracks?.[0];
  if (!track) return data;
  let cursor = 0;
  for (const clip of track.clips ?? []) {
    clip.startFrame = cursor;
    cursor += clipLength(clip);
  }
  data.markTrimIn = 0;
  data.markTrimEnd = cursor;
  data.frames = cursor;
  return data;
}

/** Copy a clip and patch it — the safe way to build one. */
export function cloneClip(template, patch = {}) {
  const copy = JSON.parse(JSON.stringify(template));
  const { mediaProcess, effectFilter, audioSetting, ...rest } = patch;
  Object.assign(copy, rest);
  if (mediaProcess) Object.assign(copy.media_process, mediaProcess);
  if (effectFilter) Object.assign(copy.effect_filter, effectFilter);
  if (audioSetting) Object.assign(copy.audio_setting, audioSetting);
  return copy;
}

/**
 * A path the way Studio writes it into a project file.
 *
 * Studio writes forward slashes throughout — including for paths it built with
 * Windows path joining. Measured: a filter attached through `setEffect` landed as
 * `D:\Dokumente\...\HD Fireworks.cube.binary` while every other path field in the
 * same clip used forward slashes, because the path came from `path.join` on
 * Windows. Normalising here means a new caller cannot reintroduce it.
 */
export function projectPath(p) {
  return typeof p === "string" ? p.replace(/\\/g, "/") : p;
}

/** Give a clip (and nothing else) a fresh id, so Studio treats it as new. */
export function reId(clip, id) {
  const next = JSON.parse(JSON.stringify(clip));
  next.id = id ?? crypto.randomUUID().toUpperCase();
  return next;
}

/** Attach an external effect/filter package to a clip. */
export function setEffect(clip, { id, name, resourcePath, opacity = 70 } = {}) {
  clip.effect_filter = {
    ...(clip.effect_filter ?? {}),
    externfilterId: id ?? "",
    externfilterName: name ?? "",
    externfilterOpacity: opacity,
    externfilterResourcePath: projectPath(resourcePath ?? ""),
  };
  return clip;
}

/** Remove the external effect from a clip. */
export function clearEffect(clip) {
  return setEffect(clip, { id: "", name: "", resourcePath: "", opacity: 70 });
}

/** Switch `media_process` features on/off, optionally with their numbers. */
export function setMediaProcess(clip, values = {}) {
  clip.media_process = { ...(clip.media_process ?? {}), ...values };
  return clip;
}

/**
 * A transition in the shape Studio writes.
 *
 * `frames` is the transition's length and must stay within the asset's
 * `minimumFrames`/`maximumFrames`; Studio's own default was 14 with a max of 60.
 */
export function makeTransition({
  id,
  resourceId,
  resourcePath,
  prevClip,
  nextClip,
  frames = 30,
  defaultFrames = 14,
  minimumFrames = 6,
  maximumFrames = 60,
} = {}) {
  return {
    id: id ?? crypto.randomUUID().toUpperCase(),
    resourceId: resourceId ?? null,
    path: resourcePath == null ? null : projectPath(resourcePath),
    prevClip: prevClip ?? null,
    nextClip: nextClip ?? null,
    frames,
    defaultFrames,
    minimumFrames,
    maximumFrames,
    name: "",
    state: 0,
    type: 2,
  };
}

/**
 * The name Studio shows for a clip: the camera's own short name, not the name
 * the file was given when it was ingested. `VID_20260822_190557_049.mp4` is
 * `VID_049.mp4` to Studio — every album node Studio has written (24 of 24, across
 * four projects) maps the full path to that short form, and every clip in a
 * Studio-saved project carries it too. Ingestion adds the date and time; the
 * camera's own part is kept, including a lens index when the file has one
 * (`VID_<date>_<time>_00_001.insv` -> `VID_00_001.insv`). Anything that does not
 * match keeps the name it has on disk.
 *
 * Media is resolved by `url`, not by this name (measured: the loader opens
 * FrameReaders from the clip url), so this is about matching Studio's own files
 * rather than about loading — a name Studio did not write is a visible
 * difference in any comparison between our project and one Studio saved.
 */
export function clipDisplayName(fileName) {
  const base = path.basename(fileName);
  const m = /^([A-Za-z]+)_\d{8}_\d{6}_(.+)$/.exec(base);
  return m ? `${m[1]}_${m[2]}` : base;
}

/**
 * Per-file source metadata for a clip.
 *
 * The template clip is only a valid model for its own file. For any other file
 * the length must come from the file itself, or Studio will treat the media as
 * lost on export — measured: the export dialog reported a 26480 MB output for an
 * 800-frame timeline and then refused with "die Materialdatei ist verloren
 * gegangen".
 *
 * The real file is the authority. ffprobe supplies the count, and a clip
 * harvested from an existing project is used only when it agrees with the file
 * to within a frame or two — it exists to correct ffprobe's off-by-one (ffprobe
 * says 905 where Studio wrote 904), not to override the file. A harvested value
 * that disagrees is from a project built by earlier buggy tooling and is
 * discarded.
 */
export function sourceMetaFor(url, model, models = new Map()) {
  const candidates = models.get(url) ?? [];
  const probe = probeSource(url);
  const fallbackName = clipDisplayName(url);

  if (probe?.frames) {
    let best = null;
    let bestDelta = Infinity;
    for (const c of candidates) {
      const delta = Math.abs(c.sourceFrames - probe.frames);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = c;
      }
    }
    if (best && bestDelta <= 2) {
      return { name: best.name ?? fallbackName, frames: best.sourceFrames, fps: best.fps, from: "harvested", probe, candidates: candidates.length, clip: best };
    }
    return { name: fallbackName, frames: probe.frames, fps: Math.round(probe.fps) || model?.fps, from: "ffprobe", probe, candidates: candidates.length };
  }

  // File unreadable: fall back to the template, then to a harvested clip.
  if (model?.url === url && model.sourceFrames) {
    return { name: model.name ?? fallbackName, frames: model.sourceFrames, fps: model.fps, from: "template", candidates: candidates.length };
  }
  if (candidates.length) {
    const best = candidates.reduce((a, b) => (b.sourceFrames > a.sourceFrames ? b : a));
    return { name: best.name ?? fallbackName, frames: best.sourceFrames, fps: best.fps, from: "harvested-offline", candidates: candidates.length };
  }
  throw new Error(
    `cannot determine the length of ${url}: file missing and no project references it. ` +
      `Studio rejects a project whose sourceFrames do not match the file.`
  );
}

// `projectDir` is destructured from the `projectPath` key: the parameter would
// otherwise shadow the `projectPath()` normaliser this function calls.
export function newProjectFrom(template, { name, projectPath: projectDir, sources = [], fps, aspectRatio, clipModels = new Map() } = {}) {
  const base = JSON.parse(JSON.stringify(template));
  const video = (base.tracks ?? []).find((t) => t.type === 0) ?? (base.tracks ?? [])[0];
  if (!video) throw new Error("template has no video track");
  const model = (video.clips ?? [])[0];
  if (!model) throw new Error("template's video track has no clip to clone");

  const id = crypto.randomUUID().toUpperCase();
  const now = new Date();
  const stamp = (d) =>
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ` +
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

  base.id = id;
  base.name = name ?? "Unbenannt";
  base.projectPath = projectPath(projectDir ?? base.projectPath ?? "");
  base.creationTime = stamp(now);
  base.lastModifiedTime = stamp(now);
  base.enableEffects = true;
  base.autoFps = false;
  base.frames = 0;
  base.markTrimIn = 0;
  base.markTrimEnd = 0;
  if (fps) base.fps = fps;
  if (aspectRatio) base.aspectRatio = aspectRatio;

  const built = sources.map((url) => {
    const meta = sourceMetaFor(url, model, clipModels);
    // The clip that carries this file's true metadata is the better model: it
    // already has the right view/FOV state for the footage.
    const sourceModel = meta.clip ?? model;
    return {
      clip: reId(
        cloneClip(sourceModel, {
          url: projectPath(url),
          name: meta.name,
          sourceFrames: meta.frames,
          source_total_frames: meta.frames,
          startFrame: 0,
          leftTrim: 0,
          rightTrim: 0,
          source_left_trim: 0,
          source_right_trim: 0,
        })
      ),
      meta,
    };
  });
  video.clips = built.map((s) => s.clip);
  video.transitions = [];
  for (const track of base.tracks ?? []) {
    if (track !== video) track.clips = [];
  }

  // Cloned clips inherit the template's AI-tracking cache path, which points at
  // the template's project directory. Studio rewrites it on first save; writing
  // the correct path here keeps the file honest before Studio ever sees it.
  const basePath = (base.projectPath || "").replace(/\\/g, "/").replace(/\/$/, "");
  for (const c of video.clips) {
    if (c.deep_track && typeof c.deep_track === "object") {
      c.deep_track.save_path = `${basePath}/${base.name}/${crypto.randomUUID().toUpperCase()}`;
    }
    // Everything below is per-clip *editing* state, not source metadata. The
    // template clip carries whatever was applied to it, and a clone would
    // silently inherit it — measured: a template with a filter on clip 0 made
    // every new clip come back with that filter applied.
    c.effect_filter = { externfilterId: "", externfilterName: "", externfilterOpacity: 70, externfilterResourcePath: "" };
    if (c.key_frame_track) c.key_frame_track = {};
    if (c.play_rate_track) c.play_rate_track = {};
  }
  return relayout(base);
}
