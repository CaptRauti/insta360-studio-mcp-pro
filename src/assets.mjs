// Studio's local asset library: what is installed, and under which name.
//
// Everything Studio offers as effect/transition/filter/movement/text/audio is a
// local file under `Studio/Download/`. The folders are named by opaque ids
// (UUID or hash), while the human-readable names sit in `Download/info/*.json`.
// This module joins the two so a caller can say "HD Fireworks" instead of
// `filter/HD Fireworks/1765962688000/HD Fireworks.cube.binary`.
//
// Nothing here touches the cloud: the manifests are read from disk, and the
// paths returned are the local ones Studio itself stores in `.insproj`.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * Where Studio keeps what.
 *
 * Measured on this install — the two roots are genuinely different, and mixing
 * them up makes a project invisible:
 *
 *   mediaRoot  D:/Dokumente/Insta360/Studio          Download/ (effects,
 *                                                    transitions, LUTs, audio),
 *                                                    TimelineProject/ (projects)
 *   configRoot AppData/Local/Insta360/Insta360 Studio nle/ (project library
 *                                                    pro.insproj), log/, cache/
 *
 * `Download/` does **not** exist under AppData, and `nle/` does **not** exist
 * under Dokumente. Both are resolved separately.
 */
export function studioRoots({ mediaRoot, configRoot } = {}) {
  const media = mediaRoot ?? process.env.INSTA360_STUDIO_MEDIA ?? "D:/Dokumente/Insta360/Studio";
  const config = configRoot ?? process.env.INSTA360_STUDIO_CONFIG ?? path.join(os.homedir(), "AppData", "Local", "Insta360", "Insta360 Studio");
  return {
    mediaRoot: media,
    configRoot: config,
    download: path.join(media, "Download"),
    timelineProjects: path.join(media, "TimelineProject"),
    library: path.join(config, "nle", "pro.insproj"),
    log: path.join(config, "log"),
  };
}

/** The media root (Download/). Kept for callers that only need the library. */
export function studioDataRoot(override) {
  return studioRoots({ mediaRoot: override }).mediaRoot;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function listDirs(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }
}

/**
 * Newest version folder inside an asset folder.
 *
 * Studio keeps several versions of one asset side by side
 * (`filter/HD Fireworks/<timestamp>/HD Fireworks.cube.binary`). The manifest
 * names the current one; when it does not, the highest numeric folder is the
 * best guess and the caller can still see what was picked.
 */
function pickVersion(assetDir, manifestValue) {
  const versions = listDirs(assetDir).filter((v) => /^\d+$/.test(v));
  if (manifestValue) {
    const name = path.basename(String(manifestValue));
    if (versions.includes(name)) return name;
  }
  if (!versions.length) return null;
  return versions.sort((a, b) => Number(b) - Number(a))[0];
}

function walkFiles(dir, out = [], depth = 0) {
  if (depth > 3) return out;
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(full, out, depth + 1);
    else out.push(full);
  }
  return out;
}

/**
 * The whole installed library, joined with its manifest names.
 *
 * Returns per kind an array of `{ name, id, dir, version, files, resource }`,
 * where `resource` is the path a project file would carry.
 */
export function assetLibrary({ root } = {}) {
  const dataRoot = studioDataRoot(root);
  const download = path.join(dataRoot, "Download");
  const info = path.join(download, "info");
  const result = { dataRoot, download, kinds: {} };

  // ---- filters (LUTs) -----------------------------------------------------
  // `downloaded_filter.json` is a plain array of names; the manifest maps the
  // name to `<name>/<version>`.
  const filterManifest = readJson(path.join(info, "filter_resource_manifest.json")) ?? {};
  const filters = [];
  for (const name of listDirs(path.join(download, "filter"))) {
    if (name === "cover") continue;
    const dir = path.join(download, "filter", name);
    const version = pickVersion(dir, filterManifest[name]);
    const files = version ? walkFiles(path.join(dir, version)) : [];
    const cube = files.find((f) => f.toLowerCase().endsWith(".cube.binary"));
    filters.push({
      name,
      id: name,
      dir,
      version,
      files,
      resource: cube ?? files[0] ?? null,
    });
  }
  result.kinds.filter = filters;

  // ---- transitions --------------------------------------------------------
  // Named manifest: id -> version. The display name lives in
  // `persistent_transition.json` / `download_transition.json` (materialId -> name).
  const transManifest = readJson(path.join(info, "transition_resource_manifest.json")) ?? {};
  const transNames = new Map();
  for (const file of ["persistent_transition.json", "download_transition.json"]) {
    const list = readJson(path.join(info, file));
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      if (item?.materialId) {
        const label = item.name?.de_DE ?? item.name?.en_US ?? Object.values(item.name ?? {})[0];
        if (label) transNames.set(String(item.materialId), label);
      }
    }
  }
  const transitions = [];
  for (const id of Object.keys(transManifest)) {
    const dir = path.join(download, "transition", id);
    const version = pickVersion(dir, transManifest[id]);
    transitions.push({
      name: transNames.get(id) ?? id,
      id,
      dir,
      version,
      files: version ? walkFiles(path.join(dir, version)) : [],
      resource: version ? path.join(dir, version) : null,
      defaultDuration: null,
    });
  }
  result.kinds.transition = transitions;

  // ---- movements (camera moves) ------------------------------------------
  const moveManifest = readJson(path.join(info, "movement_resource_manifest.json")) ?? {};
  result.kinds.movement = Object.keys(moveManifest).map((id) => {
    const dir = path.join(download, "movement", id);
    return { name: id, id, dir, version: null, files: walkFiles(dir), resource: dir };
  });

  // ---- text presets -------------------------------------------------------
  const textManifest = readJson(path.join(info, "text_resource_manifest.json")) ?? {};
  result.kinds.text = Object.keys(textManifest).map((id) => {
    const dir = path.join(download, "text", id);
    return { name: id, id, dir, version: String(textManifest[id]), files: walkFiles(dir), resource: dir };
  });

  // ---- audio --------------------------------------------------------------
  // `persistent_music.json` / `online_music.json` carry names + localUrl.
  const audio = [];
  for (const file of ["persistent_music.json", "online_music.json"]) {
    const list = readJson(path.join(info, file));
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      audio.push({
        name: item.musicName ?? String(item.musicId),
        id: String(item.musicId ?? item.musicIdString ?? ""),
        dir: item.localUrl ? path.dirname(item.localUrl) : null,
        version: null,
        files: item.localUrl ? [item.localUrl] : [],
        resource: item.localUrl ?? item.bgmUrl ?? null,
        durationMs: item.durationMs ?? null,
        author: item.authorName ?? null,
      });
    }
  }
  result.kinds.audio = audio;

  // ---- effects ------------------------------------------------------------
  // `downloaded_effect.json` only records that an id was downloaded (no name);
  // the ids match folders under `effect/`. Names are not in the manifest, so the
  // id is the name and `count` tells the caller how much is really installed.
  const effRecords = readJson(path.join(info, "downloaded_effect.json"))?.records ?? {};
  const effDirs = listDirs(path.join(download, "effect"));
  result.kinds.effect = effDirs.map((id) => {
    const dir = path.join(download, "effect", id);
    return {
      name: id,
      id,
      dir,
      version: pickVersion(dir, null),
      files: walkFiles(dir),
      resource: dir,
      downloaded: Boolean(effRecords[id]),
    };
  });

  return result;
}

/** Counts per kind — cheap overview without materialising every file list. */
export function librarySummary({ root } = {}) {
  const dataRoot = studioDataRoot(root);
  const download = path.join(dataRoot, "Download");
  const summary = { dataRoot, download, counts: {} };
  for (const kind of ["effect", "transition", "filter", "movement", "text", "audio", "sticker"]) {
    summary.counts[kind] = listDirs(path.join(download, kind)).length;
  }
  const info = path.join(download, "info");
  const pano = readJson(path.join(info, "downloaded_pano.json"))?.timestamps ?? {};
  summary.counts.pano = Object.keys(pano).length;
  summary.pano = Object.keys(pano);
  return summary;
}

/** Look one asset up by name or id, case-insensitively. */
export function findAsset(kind, query, { root } = {}) {
  const lib = assetLibrary({ root });
  const list = lib.kinds[kind];
  if (!list) return { ok: false, error: `unknown kind: ${kind}`, kinds: Object.keys(lib.kinds) };
  const q = String(query ?? "").trim().toLowerCase();
  const exact = list.find((a) => a.name.toLowerCase() === q || String(a.id).toLowerCase() === q);
  const partial = list.find((a) => a.name.toLowerCase().includes(q) || String(a.id).toLowerCase().includes(q));
  const hit = exact ?? partial;
  if (!hit) return { ok: false, error: `no ${kind} matching "${query}"`, candidates: list.slice(0, 20).map((a) => a.name) };
  return { ok: true, asset: hit };
}
