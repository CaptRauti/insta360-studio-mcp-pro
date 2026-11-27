// Insta360 Studio's Media-page project file (`.insprj`) — read side.
//
// The Media page edits a *single* media file and keeps its own project file, separate from the
// Project page's `.insproj`. Everything the Media page owns lives here: per-clip manual colour,
// denoise, watermark, the Stats/Dashboard template, audio, stitching, speed (TimeShift) — which is
// why this reader is the prerequisite for those writers.
//
// Two encodings, by Studio version. Both measured over the 1337 `.insprj` on this machine:
//
//   Studio 6.x   JSON   `{ id, selectedId, projects: [ { id, name, clip: {...}, roughcut: {...} } ] }`
//                       `id` is the media path; the parent directory is **md5 of that path**
//                       (920/920 files — measured, see research/insprj_lookup.mjs)
//   Studio 5.x   XML    `<project version="2.0.0">` with `<meta app= version=>`, `<file_group>`,
//                       `<schemes><scheme><preference><rendering/><audio/>…`
//                       The XML-era parent directory is **not reliably** md5 of the media path:
//                       over the 417 XML files here, md5(cloud_media_id) holds for 10/371 and
//                       md5(folder + "/" + <file name>) for 46/406 — the rest are md5 of a string
//                       that is still unresolved (meta_cache.json holds only {"camera_accessory":0},
//                       so it is not the source). Those files are therefore found by the file name or
//                       by the media path inside them, and lookup says which way it matched.
//
// The XML reader maps only names that literally agree with the JSON field names. An equivalence
// that was not measured is reported under `unmapped` rather than invented.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { readPaths } from "./prefs.mjs";

/** How deep the fallback walk goes. The layout is `<root>/<hash>/<file>.insprj`. */
const MAX_WALK_DEPTH = 5;

/** The roots that hold Media-page projects, in the order they are searched. */
export function mediaProjectRoots({ env = process.env } = {}) {
  const { paths } = readPaths({ env });
  const roots = [];
  for (const key of ["footage_project_location", "project_location", "workspace_location"]) {
    const dir = paths[key];
    if (dir) roots.push({ key, dir: toForwardSlashes(dir) });
  }
  return roots;
}

export function toForwardSlashes(p) {
  return String(p).replace(/\\/g, "/");
}

/** md5 of the media path, as Studio derives its project directory. Confirmed on 920/920 files. */
export function mediaPathHash(mediaPath) {
  return createHash("md5").update(toForwardSlashes(mediaPath)).digest("hex");
}

/**
 * Which encoding is this file? Studio writes JSON from 6.x on and XML before that; the extension is
 * the same, so the first non-space character is the only reliable signal.
 */
export function detectEncoding(raw) {
  const head = String(raw).replace(/^\uFEFF/, "").trimStart().slice(0, 200);
  if (head.startsWith("{")) return "json";
  if (head.startsWith("<?xml") || head.startsWith("<project")) return "xml";
  return "unknown";
}

export function familyOf(file) {
  const p = toForwardSlashes(file);
  if (p.includes("/FootageProject/")) return "footage";
  if (path.basename(p) === ".insprj") return "bare";
  return "media";
}

/**
 * Find the Media-page project file(s) for a media file. The hash rule makes this exact for the
 * current format; the walk is the honest fallback for XML-era files, and each match says how it was
 * found so a caller can tell a certainty from a possibility.
 */
export function findMediaProjects({ media, name, roots = mediaProjectRoots(), searchContent = true } = {}) {
  const wanted = toForwardSlashes(media ?? name ?? "");
  if (!wanted) return { ok: false, note: "pass `media` (the media path) or `name` (its file name)" };
  const base = path.basename(wanted);
  const hash = mediaPathHash(wanted);
  const matches = [];
  const seen = new Set();

  const add = (file, how) => {
    const key = toForwardSlashes(file);
    if (seen.has(key)) return;
    seen.add(key);
    matches.push({ path: file, dir: path.dirname(file), family: familyOf(file), match: how });
  };

  for (const root of roots) {
    // 1. the exact one, if the hash rule holds
    const direct = `${root.dir}/${hash}`;
    if (existsSync(direct)) {
      for (const entry of safeReaddir(direct)) {
        if (entry.toLowerCase().endsWith(".insprj")) add(`${direct}/${entry}`, "hash");
      }
    }
    // 2. the walk: file name matches, or (optionally) the file mentions the media path
    for (const file of walk(root.dir, 0)) {
      const entry = path.basename(file);
      if (entry.toLowerCase() === base.toLowerCase()) {
        add(file, "name");
        continue;
      }
      if (!searchContent) continue;
      try {
        const raw = readFileSync(file, "utf8");
        if (raw.includes(wanted) || raw.includes(wanted.replace(/\//g, "\\"))) add(file, "content");
      } catch {
        /* unreadable file is not a match */
      }
    }
  }
  matches.sort((a, b) => (a.match === "hash" ? -1 : 0) - (b.match === "hash" ? -1 : 0));
  return {
    ok: matches.length > 0,
    hash,
    hashMatched: matches.some((m) => m.match === "hash"),
    matches,
    note: matches.length
      ? undefined
      : `no .insprj found for ${base} under ${roots.map((r) => r.dir).join(", ")}`,
  };
}

function safeReaddir(dir) {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

function walk(dir, depth, out = []) {
  if (depth > MAX_WALK_DEPTH) return out;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const p = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(p, depth + 1, out);
    else if (entry.name.toLowerCase().endsWith(".insprj")) out.push(p);
  }
  return out;
}

// --- normalisation -----------------------------------------------------------------------------
// Grouped by what a caller wants to change, with the file's own field names kept underneath, so a
// reader never has to guess which of `colorAdjustExposure`/`enableColorAdjust` is the value.

const COLOUR_KEYS = [
  "enableColorAdjust", "colorAdjustExposure", "colorAdjustWarmth", "colorAdjustTint",
  "colorAdjustContrast", "colorAdjustHighlights", "colorAdjustShadows", "colorAdjustSaturation",
  "colorAdjustVibrance", "colorAdjustBrightness", "colorAdjustBlackpoint", "colorAdjustDefinition",
  "colorAdjustBrilliance", "colorAdjustAutoadjust", "colorAdjustCommonMin", "colorAdjustCommonMax",
  "enableColorPlus", "colorPlusStrength", "colorPlusStrengthMin", "colorPlusStrengthMax",
];
const PROCESS_KEYS = [
  "enableAe", "supportAe", "enableLut", "supportLut", "enableMultiFrameDenoise",
  "enableSingleDenoise", "supportSingleDenoise", "enablePureShot", "supportPureShot",
  "enableMotionBlur", "motionBlurStrength", "motionBlurThreshold", "motionBlurEdited",
  "enableBeautyMode", "enableLocalToneMapping", "localToneMappingStrength",
  "localToneMappingStrengthMin", "localToneMappingStrengthMax", "enableHorizontalCorrect",
  "horizontalCorrectAngle", "horizontalCorrectDefaultAngle", "enableTimeLogo", "timeLogoFormat",
  "timeLogoTransparency", "enableUnderWaterCorrect", "underWaterStyle", "underWaterStrength",
  "underWaterStrengthMin", "underWaterStrengthMax", "supportUnderWaterCorrect",
];

function pick(source, keys) {
  const out = {};
  if (!source) return out;
  for (const key of keys) if (key in source) out[key] = source[key];
  return out;
}

const TRIM_KEYS = [
  "leftTrim", "rightTrim", "source_left_trim", "source_right_trim", "sourceFrames",
  "source_total_frames", "startFrame", "roughTrimmed", "lastTrimEditTime",
];

/** The clip's speed/TimeShift track — a list of rate segments, present only when retimed. */
export function playRateSegments(clip) {
  const list = clip?.play_rate_track?.play_rate_model_list;
  if (!Array.isArray(list)) return [];
  return list.map((seg) => ({
    start: seg.startTime,
    end: seg.endTime,
    min: seg.minPlayRate,
    max: seg.maxPlayRate,
    id: seg.name,
  }));
}

/**
 * Normalise one clip (the Media page's unit of work) into named groups. `raw` is the untouched
 * object so nothing the groups do not model is lost.
 */
export function normaliseClip(clip) {
  if (!clip || typeof clip !== "object") return null;
  const mp = clip.media_process ?? {};
  const dash = clip.dashboard_setting ?? {};
  return {
    name: clip.name ?? null,
    url: clip.url ?? null,
    id: clip.id ?? null,
    type: clip.type ?? null,
    subtype: clip.subtype ?? null,
    trim: pick(clip, TRIM_KEYS),
    framing: {
      ratio: clip.ratio ?? null,
      aspectRatio: clip.dewarp_setting?.aspectRatio ?? null,
      aspectRatioInfo: clip.aspect_ratio_info ?? null,
      fov: clip.camera_transform?.fov ?? null,
      eulers: clip.camera_transform?.eulers ?? null,
      distance: clip.camera_transform?.distance ?? null,
      dewarp: clip.dewarp_setting
        ? { removeDistortion: clip.dewarp_setting.removeDistortion ?? null, types: clip.dewarp_setting.all_dewarp_types ?? null }
        : null,
      inAsteroidMode: clip.inAsteroidMode ?? null,
      userRotateDegree: clip.userRotateDegree ?? null,
    },
    speed: {
      segments: playRateSegments(clip),
      hasSetPlayRateManually: clip.has_set_play_rate_manually ?? null,
    },
    colour: { ...pick(mp, COLOUR_KEYS), effectFilter: clip.effect_filter ?? null },
    process: pick(mp, PROCESS_KEYS),
    watermark: {
      flat: clip.flat_logo_watermark ?? null,
      logo: clip.logo_watermark ?? null,
      time: clip.time_watermark ?? null,
    },
    dashboard: {
      ...dash,
      // `dashboardStyle` is itself a JSON document (the Stats template); parse it so the caller sees
      // the template rather than a string that has to be parsed twice.
      styleParsed: parseEmbeddedJson(dash.dashboardStyle),
    },
    audio: clip.audio_setting ?? null,
    stitching: {
      optimization: clip.stitching_optimization ?? null,
      setting: clip.stitching_setting ?? null,
    },
    stabilization: clip.stab_setting ?? null,
    keyframes: {
      track: clip.key_frame_track ?? null,
      userKeyframeEnabled: clip.enable_user_keyframe ?? null,
    },
    extras: {
      hdrPreviewEnabled: clip.hdrPreviewEnabled ?? null,
      hdrPreviewUserToggled: clip.hdrPreviewUserToggled ?? null,
      viewType: clip.viewType ?? null,
      highlightData: clip.highlight_data ?? null,
      panoAnimationPresetId: clip.panoAnimationPresetId ?? null,
      deepTrack: clip.deep_track ?? null,
      headTrack: clip.head_track ?? null,
      cameraMovement: clip.camera_movement ?? null,
      supplementFrameType: clip.supplement_frame_type ?? null,
    },
    raw: clip,
  };
}

function parseEmbeddedJson(value) {
  if (typeof value !== "string" || !value.trim().startsWith("{")) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// --- XML (Studio 5.x) ---------------------------------------------------------------------------

/** Attributes are unescaped by the XML itself; this only undoes the entities we actually see. */
function unescapeXml(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&amp;/g, "&");
}

/**
 * Minimal XML → object converter for this document shape: elements, attributes, text. Repeated child
 * tags become arrays; a self-closing tag becomes `{}`. Attribute values are typed like the JSON side
 * (numbers and booleans) so the two encodings compare.
 */
export function xmlToObject(text) {
  const root = {};
  const stack = [{ node: root }];
  const tagRe = /<([?!/]?)([A-Za-z_][\w.:-]*)((?:\s+[\w.:-]+\s*=\s*"[^"]*")*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = tagRe.exec(text))) {
    const [, kind, name, attrs, selfClose, textChunk] = m;
    if (textChunk) {
      const t = unescapeXml(textChunk).trim();
      if (t) {
        const top = stack[stack.length - 1];
        if (top) top.node["#text"] = t;
      }
      continue;
    }
    if (kind === "?" || kind === "!") continue;
    if (kind === "/") {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const node = {};
    for (const a of attrs.matchAll(/([\w.:-]+)\s*=\s*"([^"]*)"/g)) node[a[1]] = typed(unescapeXml(a[2]));
    const parent = stack[stack.length - 1].node;
    if (name in parent) {
      if (!Array.isArray(parent[name])) parent[name] = [parent[name]];
      parent[name].push(node);
    } else parent[name] = node;
    if (!selfClose) stack.push({ node, name });
  }
  return root;
}

function typed(raw) {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw !== "" && /^-?\d+$/.test(raw)) return Number(raw);
  if (raw !== "" && /^-?\d*\.\d+$/.test(raw)) return Number(raw);
  return raw;
}

function parseXmlProject(text) {
  const tree = xmlToObject(text);
  const project = tree.project ?? {};
  const group = project.file_group ?? {};
  const schemes = project.schemes?.scheme;
  const list = Array.isArray(schemes) ? schemes : schemes ? [schemes] : [];
  const warning =
    "XML-era file (Studio 5.x): the element names differ from the JSON schema, so its values are "
    + "reported under `legacy` with their own names rather than mapped onto JSON fields. Only "
    + "`dashboard_setting` carries the same name at scheme level. The XML-era parent directory is only "
    + "sometimes md5 of the media path (10/371 by cloud_media_id, 46/406 by folder + name), so lookup "
    + "for these files falls back to a name/content match.";
  const translationNotes = [
    "measurement: `preference.trim_start`/`trim_end` are millisecond positions (0..15000 with "
    + "duration 15000 on a photo, 0..1799130 with duration 1799130 on a 30-min video), while the JSON "
    + "side stores frames in `leftTrim`/`rightTrim` — do not copy across without converting.",
    "measurement: `preference.audio.volume` reads 0.5 where the JSON `audio_setting.currentVolume` "
    + "reads 100; `preference.logo` uses `enable_logo`/`selected_logo` where the JSON uses "
    + "`logo_watermark.enableLogoWatermark`/`selectedLogoWatermarkPath`. Same-looking knobs with "
    + "different names and scales — no equivalence between the encodings was measured by round-trip.",
    "measurement: `preference.rendering.play_rate` sits *inside* `rendering` here, while the JSON side "
    + "has a clip-level `play_rate_track`.",
    "measurement: `preference.optimization.stitching`/`calibration` on the XML side correspond in "
    + "position to the JSON `stitching_optimization`/`stitching_setting` (names differ).",
  ];
  return {
    encoding: "xml",
    formatVersion: project.version ?? null,
    app: project.meta?.app ?? null,
    appVersion: project.meta?.version ?? null,
    creationTime: project.meta?.creation_time ?? null,
    mediaId: group.cloud_media_id ?? null,
    fileGroup: {
      type: group.type ?? null,
      folder: group.folder ?? null,
      isCloudFile: group.is_cloud_file ?? null,
      count: group.count ?? null,
      files: [group.file].flat().filter(Boolean).map((f) => f.name ?? f["#text"] ?? null),
    },
    warnings: [warning],
    translationNotes,
    items: list.map((scheme) => {
      const pref = scheme.preference ?? {};
      return {
        id: scheme.id ?? null,
        name: scheme.id ?? null,
        createTime: scheme.creation ?? null,
        modifiedTime: scheme.last_edit_time ?? null,
        // The one field whose name agrees with the JSON schema.
        dashboard: { setting: scheme.dashboard_setting ?? null },
        mappedFrom: ["dashboard_setting"],
        legacy: {
          preference: pref.ratio_height !== undefined || pref.trim_start !== undefined
            ? pick(pref, ["ratio_width", "ratio_height", "trim_start", "trim_end", "duration", "favourite", "shell_corrected"])
            : null,
          rendering: pref.rendering ?? null,
          bulletTime: pref.bullet_time ?? null,
          audio: pref.audio ?? null,
          optimization: pref.optimization ?? null,
          logo: pref.logo ?? null,
          playRate: pref.rendering?.play_rate ?? null,
          timeline: scheme.timeline ?? null,
          panoAnimation: scheme.pano_animation ?? null,
        },
        // Everything the groups above do not model, so nothing is silently dropped.
        unmapped: Object.fromEntries(
          Object.entries(scheme).filter(
            ([k]) => !["id", "creation", "last_edit_time", "dashboard_setting", "preference", "timeline", "pano_animation"].includes(k),
          ),
        ),
        xml: scheme,
      };
    }),
    xml: tree,
  };
}

// --- entry point -------------------------------------------------------------------------------

/** Read a Media-page project file, JSON or XML, into one normalised view. */
export function readMediaProject(file, { includeRaw = true } = {}) {
  if (!file) return { ok: false, note: "pass `file` (path to a .insprj)" };
  if (!existsSync(file)) return { ok: false, file, note: "no such file" };
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch (err) {
    return { ok: false, file, note: `unreadable: ${err.message}` };
  }
  const encoding = detectEncoding(raw);
  const base = {
    ok: true,
    file,
    family: familyOf(file),
    encoding,
    bytes: statSync(file).size,
    modified: new Date(statSync(file).mtimeMs).toISOString(),
    dirHash: path.basename(path.dirname(file)),
  };

  if (encoding === "json") {
    let doc;
    try {
      doc = JSON.parse(raw);
    } catch (err) {
      return { ...base, ok: false, note: `not valid JSON: ${err.message}` };
    }
    const items = (doc.projects ?? []).map((project) => {
      const { clip, ...rest } = project;
      return {
        id: project.id ?? null,
        name: project.name ?? null,
        createTime: project.createTime ?? null,
        modifiedTime: project.modifiedTime ?? null,
        roughcut: project.roughcut ?? null,
        rest,
        clip: normaliseClip(clip),
      };
    });
    return {
      ...base,
      formatVersion: null,
      mediaId: doc.id ?? null,
      selectedId: doc.selectedId ?? null,
      count: items.length,
      items,
      warnings: [],
      json: includeRaw ? doc : undefined,
    };
  }

  if (encoding === "xml") {
    const parsed = parseXmlProject(raw);
    return { ...base, ...parsed, count: parsed.items.length, xml: includeRaw ? parsed.xml : undefined };
  }

  return { ...base, ok: false, note: `unrecognised encoding (starts with ${JSON.stringify(raw.slice(0, 20))})` };
}

/** The compact payload the MCP tool returns: settings per item, no full raw trees. */
export function summariseMediaProject(project) {
  if (!project?.ok) return project;
  const stripRaw = (clip) => {
    if (!clip) return null;
    const { raw, ...rest } = clip;
    return rest;
  };
  return {
    ok: true,
    file: project.file,
    family: project.family,
    encoding: project.encoding,
    formatVersion: project.formatVersion ?? null,
    app: project.app ?? null,
    appVersion: project.appVersion ?? null,
    mediaId: project.mediaId ?? null,
    selectedId: project.selectedId ?? null,
    fileGroup: project.fileGroup ?? null,
    dirHash: project.dirHash,
    bytes: project.bytes,
    modified: project.modified,
    count: project.count,
    items: (project.items ?? []).map((item) => {
      const out = {
        id: item.id,
        name: item.name,
        createTime: item.createTime,
        modifiedTime: item.modifiedTime,
        roughcut: item.roughcut ?? null,
      };
      if (item.clip) out.clip = stripRaw(item.clip);
      if (item.legacy) {
        out.legacy = item.legacy;
        out.mappedFrom = item.mappedFrom;
        out.dashboard = item.dashboard;
      }
      out.unmapped = item.unmapped;
      return out;
    }),
    warnings: project.warnings ?? [],
    translationNotes: project.translationNotes,
  };
}
