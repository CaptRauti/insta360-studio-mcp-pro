/**
 * Studio's own rules, as a preflight.
 *
 * Studio refuses impossible combinations or silently degrades them (the manual states which), and the
 * cost lands on the export — minutes or hours later, as a failed job or a wrong result. Every rule here
 * is either measured from this install or quoted from Insta360's manual, and each one says which.
 *
 * The hard part is honesty, so the result separates four things rather than lumping them together:
 *
 *   clear        — the rule was evaluated against this project and it passes
 *   violations   — the rule fired
 *   dormant      — the rule is real but its trigger cannot exist in *this* file (e.g. no clip has a
 *                  movement template applied yet), so it neither fires nor proves anything
 *   unverifiable — the manual states the rule but no measured field carries it (nothing in the file
 *                  says "this is a TimeShift clip"), so we must not pretend to check it
 *
 * A preflight that quietly drops the rules it cannot evaluate reads as "all clear" when it is really
 * "not asked" — the failure mode this project has already paid for twice (a feature written off as
 * unused because the search looked in the wrong container).
 *
 * Rule ids keep the backlog's letters (G1..G8, A1) so a violation points back at its backlog entry.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { timelineLayout } from "./project.mjs";
import { readPaths } from "./prefs.mjs";
import { FRAME_LIMITS, transitionState } from "./transitions.mjs";

/** The entry shape both harvests agreed on (docs/INSPROJ_SCHEMA.md §5, ASSET_CATALOG.md §2.2). */
export const TRANSITION_KEYS = [
  "defaultFrames", "frames", "id", "maximumFrames", "minimumFrames", "name",
  "nextClip", "path", "prevClip", "resourceId", "state", "type",
];

const PANO_RATIO = "2:1";
const AUTOFRAME_MIN_SECONDS = 10; // manual: 360 video > 10 s (edit-function/auto-frame)

/** Signs of use — field names measured in docs/INSPROJ_SCHEMA.md §3(b). */
const usesMovement = (c) => (c?.camera_movement?.camera_movement_models?.length ?? 0) > 0;
const usesDeepTrack = (c) => (c?.deep_track?.deep_track_list?.length ?? 0) > 0;
const usesKeyframes = (c) => (c?.key_frame_track?.node_list?.length ?? 0) > 0;
/**
 * A dashboard is *configured* only when it names data or a style. `enableDashboard` alone is not the
 * signal: it is `true`, with `dashboardDataId:""` and `dashboardStyle:""`, in Studio's own Lamspringe
 * project and in a project with no Stats at all — a first version of this rule read the flag and
 * flagged 2 clips of a real project on it.
 */
const dashboardOn = (c) => {
  const d = c?.dashboard_setting;
  if (!d) return false;
  return Boolean(String(d.dashboardDataId ?? "") || String(d.dashboardStyle ?? "")) ||
    (d.dashboardSourceType !== undefined && d.dashboardSourceType !== "TypeNoneData");
};

export const RULES = [
  { id: "len", title: "Timeline arithmetic: Σ clip length = frames, startFrame = running sum", severity: "error", source: "measured — INSPROJ_SCHEMA.md §6 (zero drift on the clip chain in every populated project)" },
  { id: "export-range", title: "Export markers cover the timeline (markTrimIn 0 .. markTrimEnd = frames)", severity: "warning", source: "measured — §1 + StefanTest (markTrimEnd 1651 while the timeline is 2325) and mcpKey (2216 vs 2270): the markers are the *export range*, so a short one silently drops the tail" },
  { id: "g8-project-path", title: "projectPath names the directory the project file sits in", severity: "warning", source: "manual — clip-management (FAQ 4); note our own test builds carry the mismatch and Studio opens them, so this is drift rather than a proven failure" },
  { id: "g8-name", title: "name is the project folder's name", severity: "warning", source: "manual — clip-management (FAQ 4)" },
  { id: "g8-id", title: "project id equals the file name stem", severity: "warning", source: "measured — §1 (normally equal, not required to be)" },
  { id: "g8-workspace", title: "projectPath is inside the configured workspace", severity: "warning", source: "manual — clip-management (FAQ 4): storage location and project file path must agree" },
  { id: "g8-deeptrack-path", title: "deep_track.save_path is <projectPath>/<name>/<clipId>", severity: "warning", source: "measured — §3(b): Studio re-points this on open, so a stale path is drift it repairs itself" },
  { id: "g1-movement-conflict", title: "Movement cannot be combined with Deep Track or keyframes on one clip", severity: "error", source: "manual — edit-function/movement" },
  { id: "g2-movement-aspect", title: "Movement requires a flat aspect ratio (not 2:1)", severity: "error", source: "manual — edit-function/movement" },
  { id: "a1-keyframe-aspect", title: "Keyframes require a flat aspect ratio (not 2:1)", severity: "error", source: "manual — edit-function/keyframe" },
  { id: "g3-dashboard-flat", title: "Stats/Dashboard works with flat video only", severity: "error", source: "manual — dashboard-function" },
  { id: "g4-autoframe-length", title: "Auto Frame needs 360 footage longer than 10 s", severity: "warning", source: "manual — edit-function/auto-frame" },
  { id: "g5-deeptrack-360", title: "Deep Track is 360 video only", severity: "error", source: "manual — edit-function/deep-tracking-function" },
  { id: "g7-one-audio-track", title: "One audio track only", severity: "error", source: "manual — preference-settings/audio-settings" },
  { id: "asset-filter-path", title: "An applied filter's LUT is on disk", severity: "error", source: "measured — §3(b) effect_filter.externfilterResourcePath" },
  { id: "asset-transition-path", title: "A transition's payload is on disk", severity: "error", source: "measured — §5" },
  { id: "asset-media-path", title: "Every clip's media file is on disk", severity: "error", source: "measured — §0: missing media exports as “Quelldatei fehlt”" },
  { id: "transition-shape", title: "A transition carries the measured 12 keys, frames 6..60, joins adjacent clips", severity: "error", source: "measured — §5 + ASSET_CATALOG.md §2.2" },
];

/** Rules the manual states but no measured field carries — reported as not asked, never as passed. */
export const UNVERIFIABLE = [
  { id: "g3-mode", title: "Stats is not for Timelapse/Starlapse/TimeShift/Slow Motion/Bullet Time", source: "manual — dashboard-function", why: "nothing measured identifies those modes (play_rate_track is {} in every clip, supplement_frame_type is unexplained)" },
  { id: "g4-mode", title: "Auto Frame is not for Timelapse/Bullet Time/Slow Motion", source: "manual — edit-function/auto-frame", why: "same missing mode marker as g3-mode" },
  { id: "g5-mode", title: "Deep Track is not for Bullet Time/Timelapse", source: "manual — deep-tracking-function", why: "same missing mode marker" },
  { id: "g6-watermark-source", title: "Watermark works on original camera media only", source: "manual — edit-function/watermark", why: "no measured field distinguishes original camera media from an exported/re-encoded file" },
  { id: "g7-track-format", title: "BGM is one track, MP3/WAV, and recording is impossible", source: "manual — preference-settings/audio-settings", why: "no BGM container appears in any observed project (the measured top-level key union in §1 has none)" },
];

const normalize = (p) => String(p ?? "").replace(/\\/g, "/").replace(/\/+$/, "");

/**
 * @param {object} data parsed .insproj
 * @param {{file?: string, paths?: boolean}} [opts] `file` lets G8 compare paths and names; `paths`
 *        (default true) also compares against startup.ini [preference].
 */
export function checkProject(data, { file = null, paths = true } = {}) {
  /** @type {{rule: string, status: "clear"|"violation"|"dormant", where?: string, message?: string}[]} */
  const verdicts = [];
  const say = (rule, status, where, message) => verdicts.push({ rule, status, where, message });

  const tracks = data.tracks ?? [];
  const video = tracks.find((t) => t.type === 0) ?? tracks[0] ?? null;
  const clips = video?.clips ?? [];
  const panoramic = data.isPanoramic === true;
  const ratio = String(data.aspectRatio ?? "");
  const seconds = data.fps > 0 ? (data.frames ?? 0) / data.fps : null;

  // ---- timeline arithmetic (§6) -----------------------------------------------
  const layout = timelineLayout(data);
  const sum = layout.reduce((n, c) => n + c.length, 0);
  if (!clips.length) {
    say("len", "dormant", "project", "the timeline carries no clips");
    say("export-range", "dormant", "project", "no clips");
  } else {
    const bad = [];
    if (sum !== data.frames) bad.push(`frames is ${data.frames} but the clips add up to ${sum}`);
    const drifted = layout.filter((c) => c.drift !== 0);
    if (drifted.length) bad.push(`${drifted.length} clip(s) carry a startFrame that is not the running sum (${drifted[0].name}: ${drifted[0].actualStart} vs ${drifted[0].expectedStart}) — the timeline will not line up`);
    bad.forEach((m) => say("len", "violation", "project", m));
    if (!bad.length) say("len", "clear", "project");

    // markTrimIn..markTrimEnd is the *export range*, measured against projects where it is short on purpose
    // and against §6 where it equalled `frames`: a narrowly set marker silently drops the tail on export.
    const inMark = data.markTrimIn ?? 0;
    const endMark = data.markTrimEnd ?? null;
    if (endMark === null && inMark === 0) say("export-range", "dormant", "project", "the file carries no export markers");
    else if (inMark === 0 && endMark === sum) say("export-range", "clear", "project");
    else {
      const bits = [];
      if (inMark !== 0) bits.push(`markTrimIn is ${inMark}, so the export starts ${inMark} frames in`);
      if (endMark !== null && endMark !== sum) {
        bits.push(endMark < sum
          ? `markTrimEnd is ${endMark} while the timeline is ${sum} frames — the last ${sum - endMark} frames would not be exported`
          : `markTrimEnd is ${endMark}, past the ${sum}-frame timeline`);
      }
      say("export-range", "violation", "project", bits.join("; "));
    }
  }

  // ---- G8: identity, location, tracking cache ---------------------------------
  if (!file) {
    for (const r of ["g8-project-path", "g8-name", "g8-id", "g8-workspace"]) say(r, "dormant", "project", "no file path was supplied to compare against");
  } else {
    const dir = path.dirname(file);
    const stem = path.basename(file).replace(/\.insproj$/i, "");
    const folder = path.basename(dir);
    const actual = normalize(dir);

    const declared = normalize(data.projectPath);
    if (!declared) say("g8-project-path", "dormant", "project", "the file declares no projectPath");
    else if (declared.toLowerCase() !== actual.toLowerCase()) say("g8-project-path", "violation", "project", `projectPath is ${declared} but the file lives in ${actual} — the manual's first rule is that the project file path and its storage location agree`);
    else say("g8-project-path", "clear", "project");

    if (!data.name) say("g8-name", "dormant", "project", "the file declares no name");
    else if (data.name !== folder) say("g8-name", "violation", "project", `name is "${data.name}" but the folder is "${folder}"`);
    else say("g8-name", "clear", "project");

    if (!data.id) say("g8-id", "dormant", "project", "the file declares no id");
    else if (data.id !== stem) say("g8-id", "violation", "project", `id is "${data.id}" but the file is "${stem}.insproj" — Studio writes them equal, so a mismatch survives a rename it should not have`);
    else say("g8-id", "clear", "project");

    if (!paths) {
      say("g8-workspace", "dormant", "project", "path checks were switched off");
    } else {
      let ws = null;
      try {
        const p = readPaths();
        ws = p?.workspace_location?.value ?? p?.workspace_location ?? null;
      } catch {
        ws = null;
      }
      if (!ws) say("g8-workspace", "dormant", "project", "startup.ini declares no workspace_location");
      else if (actual.toLowerCase().startsWith(normalize(ws).toLowerCase())) say("g8-workspace", "clear", "project");
      else say("g8-workspace", "violation", "project", `project is in ${actual}, outside the configured workspace ${normalize(ws)} (startup.ini [preference] workspace_location)`);
    }
  }

  let deepTrackPaths = 0;
  for (const [i, c] of clips.entries()) {
    const sp = String(c?.deep_track?.save_path ?? "");
    if (!sp) continue;
    deepTrackPaths += 1;
    const want = `${normalize(data.projectPath)}/${data.name ?? ""}/${c.id ?? ""}`;
    if (normalize(sp) !== want) {
      say("g8-deeptrack-path", "violation", `clip ${i} ${c.name ?? ""}`, `deep_track.save_path is ${sp} but this project expects ${want} — a stale path means the tracking cache belongs to another project`);
    }
  }
  if (deepTrackPaths) {
    if (!verdicts.some((v) => v.rule === "g8-deeptrack-path" && v.status === "violation")) say("g8-deeptrack-path", "clear", "project");
  } else say("g8-deeptrack-path", "dormant", "project", "no clip carries a deep_track.save_path");

  // ---- G1 / G2 / A1 ------------------------------------------------------------
  const movement = clips.filter(usesMovement);
  const deepTrack = clips.filter(usesDeepTrack);
  const keyframes = clips.filter(usesKeyframes);

  if (!movement.length) {
    say("g1-movement-conflict", "dormant", "project", "no clip has a camera movement applied (camera_movement_models is empty in every clip on this install)");
    say("g2-movement-aspect", "dormant", "project", "no clip has a camera movement applied");
  } else {
    const clash = clips.filter((c) => usesMovement(c) && (usesDeepTrack(c) || usesKeyframes(c)));
    if (clash.length) say("g1-movement-conflict", "violation", `${clash.length} clip(s)`, "movement is applied together with keyframes or Deep Track on the same clip — Studio refuses the combination");
    else say("g1-movement-conflict", "clear", "project");
    if (!ratio) say("g2-movement-aspect", "dormant", "project", "the file declares no aspectRatio");
    else if (ratio === PANO_RATIO) say("g2-movement-aspect", "violation", "project", `movement is applied but the project is ${PANO_RATIO} — movement needs a flat ratio`);
    else say("g2-movement-aspect", "clear", "project");
  }

  if (!keyframes.length) say("a1-keyframe-aspect", "dormant", "project", "no clip has keyframes");
  else if (!ratio) say("a1-keyframe-aspect", "dormant", "project", "the file declares no aspectRatio");
  else if (ratio === PANO_RATIO) say("a1-keyframe-aspect", "violation", "project", `keyframes are set but the project is ${PANO_RATIO} — reframing keyframes need a flat ratio`);
  else say("a1-keyframe-aspect", "clear", "project");

  // ---- G3 / G4 / G5 ------------------------------------------------------------
  const dashboards = clips.filter(dashboardOn);
  if (!dashboards.length) say("g3-dashboard-flat", "dormant", "project", "no clip has a dashboard configured (enableDashboard alone is true even in projects with no Stats)");
  else if (panoramic || ratio === PANO_RATIO) say("g3-dashboard-flat", "violation", `${dashboards.length} clip(s)`, "the dashboard is enabled but the project is 360/2:1 — Stats works with flat video only");
  else say("g3-dashboard-flat", "clear", "project");

  if (!panoramic) say("g4-autoframe-length", "clear", "project", "not a 360 project, so Auto Frame's length rule does not apply");
  else if (seconds !== null && seconds <= AUTOFRAME_MIN_SECONDS) say("g4-autoframe-length", "violation", "project", `this 360 project holds ${seconds.toFixed(1)} s of timeline — Auto Frame needs more than ${AUTOFRAME_MIN_SECONDS} s of 360 footage`);
  else say("g4-autoframe-length", "clear", "project");

  if (!deepTrack.length) say("g5-deeptrack-360", "dormant", "project", "no clip has a Deep Track result (deep_track_list is empty in every clip on this install)");
  else if (!panoramic) say("g5-deeptrack-360", "violation", `${deepTrack.length} clip(s)`, "Deep Track results on a non-360 project — the manual allows 360 video only");
  else say("g5-deeptrack-360", "clear", "project");

  // ---- G7 ---------------------------------------------------------------------
  const audioTracks = tracks.filter((t) => t.type === 2);
  if (audioTracks.length > 1) say("g7-one-audio-track", "violation", "project", `${audioTracks.length} audio tracks — Studio's audio settings allow one`);
  else say("g7-one-audio-track", "clear", "project");

  // ---- assets on disk ----------------------------------------------------------
  let filtersChecked = 0;
  for (const [i, c] of clips.entries()) {
    const p = c?.effect_filter?.externfilterResourcePath;
    if (!p) continue;
    filtersChecked += 1;
    if (!existsSync(p)) say("asset-filter-path", "violation", `clip ${i} ${c.name ?? ""}`, `the applied filter "${c.effect_filter?.externfilterName || c.effect_filter?.externfilterId || "?"}" points at a missing file: ${p}`);
  }
  if (filtersChecked) {
    if (!verdicts.some((v) => v.rule === "asset-filter-path" && v.status === "violation")) say("asset-filter-path", "clear", "project");
  } else say("asset-filter-path", "dormant", "project", "no clip has a filter applied");

  const transitions = tracks.flatMap((t, ti) => transitionState(t).transitions.map((x) => ({ ...x, track: ti })));
  let transitionPaths = 0;
  for (const t of transitions) {
    if (!t.path) continue;
    transitionPaths += 1;
    if (!existsSync(t.path)) say("asset-transition-path", "violation", `track ${t.track}`, `the transition payload is missing: ${t.path}`);
  }
  if (transitionPaths) {
    if (!verdicts.some((v) => v.rule === "asset-transition-path" && v.status === "violation")) say("asset-transition-path", "clear", "project");
  } else say("asset-transition-path", "dormant", "project", "no track carries a transition");

  let mediaChecked = 0;
  for (const [i, c] of clips.entries()) {
    if (!c.url) continue;
    mediaChecked += 1;
    if (!existsSync(c.url)) say("asset-media-path", "violation", `clip ${i} ${c.name ?? ""}`, `the source media is not on disk: ${c.url} — opening the project gives “Lade Dateien…”, an export gives “Quelldatei fehlt”`);
  }
  if (mediaChecked) {
    if (!verdicts.some((v) => v.rule === "asset-media-path" && v.status === "violation")) say("asset-media-path", "clear", "project");
  } else say("asset-media-path", "dormant", "project", "no clip names a media file");

  // ---- transition shape (what the writer enforces, applied to a whole file) -----
  if (!transitions.length) {
    say("transition-shape", "dormant", "project", "no track carries a transition");
  } else {
    const ids = clips.map((c) => c.id);
    let fired = false;
    for (const t of transitions) {
      const where = `track ${t.track} ${String(t.prevClip).slice(0, 8)} → ${String(t.nextClip).slice(0, 8)}`;
      // Count the keys the *file* carries. `transitionState()` decorates every entry with computed
      // fields (`pathExists`, `keys`), so reading Object.keys of what it returns counts the reader, not
      // the file — a first version reported "14 keys" for a perfectly good 12-key entry.
      const keys = Array.isArray(t.keys) ? [...t.keys].sort() : Object.keys(t).filter((k) => !["pathExists", "keys", "track"].includes(k)).sort();
      if (JSON.stringify(keys) !== JSON.stringify([...TRANSITION_KEYS].sort())) {
        fired = true;
        say("transition-shape", "violation", where, `the entry carries ${keys.length} keys, the measured shape has ${TRANSITION_KEYS.length}`);
      }
      const f = Number(t.frames);
      if (!(f >= FRAME_LIMITS.minimumFrames && f <= FRAME_LIMITS.maximumFrames)) {
        fired = true;
        say("transition-shape", "violation", where, `frames is ${t.frames}, outside Studio's ${FRAME_LIMITS.minimumFrames}..${FRAME_LIMITS.maximumFrames}`);
      }
      const pi = ids.indexOf(t.prevClip);
      const ni = ids.indexOf(t.nextClip);
      if (pi < 0 || ni < 0) {
        fired = true;
        say("transition-shape", "violation", where, "a clip it names is not on that track");
      } else if (ni !== pi + 1) {
        fired = true;
        say("transition-shape", "violation", where, `the two clips are not adjacent (positions ${pi} and ${ni}) — a transition joins neighbours`);
      }
    }
    if (!fired) say("transition-shape", "clear", "project");
  }

  // ---- report ------------------------------------------------------------------
  const byRule = (id) => RULES.find((r) => r.id === id);
  const violations = verdicts
    .filter((v) => v.status === "violation")
    .map((v) => ({ ...v, severity: byRule(v.rule)?.severity ?? "error", title: byRule(v.rule)?.title ?? null, source: byRule(v.rule)?.source ?? null }));
  const statusOf = (id) => {
    const vs = verdicts.filter((v) => v.rule === id);
    if (vs.some((v) => v.status === "violation")) return "violation";
    if (vs.some((v) => v.status === "clear")) return "clear";
    if (vs.some((v) => v.status === "dormant")) return "dormant";
    return "never-ran";
  };
  const clear = RULES.filter((r) => statusOf(r.id) === "clear").map((r) => r.id);
  const dormant = RULES
    .filter((r) => statusOf(r.id) === "dormant")
    .map((r) => ({ rule: r.id, title: r.title, why: verdicts.find((v) => v.rule === r.id && v.status === "dormant")?.message ?? null }));
  const neverRan = RULES.filter((r) => statusOf(r.id) === "never-ran").map((r) => r.id);

  return {
    ok: violations.filter((v) => v.severity === "error").length === 0,
    violations,
    clear,
    dormant,
    unverifiable: UNVERIFIABLE.map((u) => ({ ...u })),
    summary: {
      errors: violations.filter((v) => v.severity === "error").length,
      warnings: violations.filter((v) => v.severity === "warning").length,
      rulesTotal: RULES.length,
      rulesClear: clear.length,
      rulesDormant: dormant.length,
      rulesUnverifiable: UNVERIFIABLE.length,
      rulesNeverRan: neverRan,
    },
  };
}
