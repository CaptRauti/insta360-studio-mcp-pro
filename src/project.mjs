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
import { existsSync } from "node:fs";
import path from "node:path";

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
  c.url = newUrl;
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
