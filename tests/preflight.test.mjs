import assert from "node:assert/strict";
import { test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { checkProject, RULES, TRANSITION_KEYS, UNVERIFIABLE } from "../src/preflight.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const realFile = path.join(repo, "src", "preflight.mjs"); // any file that exists on disk
const DIR = path.join(repo, "MCP_Tests", "mcpFix");
const FILE = path.join(DIR, "ABCDEF.insproj");

const clip = (over = {}) => {
  const base = {
    id: "CLIP0001",
    name: "VID_001.mp4",
    url: realFile,
    sourceFrames: 300,
    source_total_frames: 300,
    source_left_trim: 0,
    source_right_trim: 0,
    leftTrim: 0,
    rightTrim: 0,
    startFrame: 0,
    ratio: 8,
    aspect_ratio_info: { currentAspectRatio: "8", current_aspect_ratio: 8, support_aspect_ratios: [8] },
    effect_filter: { externfilterId: "", externfilterName: "", externfilterOpacity: 70, externfilterResourcePath: "" },
    camera_movement: { camera_movement_models: [] },
    key_frame_track: {},
    dashboard_setting: { dashboardDataId: "", dashboardDataType: 0, dashboardSourceType: "TypeNoneData", dashboardStyle: "", enableDashboard: true, supportDashboard: true },
    audio_setting: { currentVolume: 100 },
    ...over,
  };
  if (!over.deep_track) {
    // The path is <projectPath>/<name>/<clipId>, so it has to follow the id the caller chose.
    base.deep_track = { cache_path: "", deep_track_list: [], original_clip_id: "", save_path: `${DIR}/mcpFix/${base.id}` };
  }
  return base;
};

const fixture = (over = {}) => {
  const clips = over.clips ?? [clip({ id: "CLIP0001", startFrame: 0 }), clip({ id: "CLIP0002", startFrame: 300 })];
  const tracks = over.tracks ?? [
    { audible: true, clips, id: "TRACK0001", locked: false, transitions: over.transitions ?? [], type: 0, visible: true, z: 0 },
    { audible: true, clips: [], id: "TRACK0002", locked: false, transitions: [], type: 2, visible: true, z: -1 },
  ];
  return {
    aspectRatio: "16:9",
    creationTime: "2026.11.26 10:00:00",
    fps: 30,
    frames: clips.reduce((n, c) => n + (c.sourceFrames - c.leftTrim - c.rightTrim), 0),
    id: "ABCDEF",
    isPanoramic: false,
    lastModifiedTime: "2026.11.26 10:00:00",
    markTrimEnd: clips.reduce((n, c) => n + (c.sourceFrames - c.leftTrim - c.rightTrim), 0),
    markTrimIn: 0,
    name: "mcpFix",
    projectPath: DIR.replace(/\\/g, "/"),
    tracks,
    ...over,
  };
};

const found = (r, rule) => r.violations.filter((v) => v.rule === rule);

test("a clean project passes, and every rule actually ran", () => {
  const r = checkProject(fixture(), { file: FILE, paths: false });
  assert.deepEqual(r.violations, [], "a clean fixture must produce no findings");
  assert.equal(r.ok, true);
  assert.deepEqual(r.summary.rulesNeverRan, [], "every rule must report a verdict — a rule that silently does not run reads as 'passed'");
  assert.equal(r.clear.length + r.dormant.length, RULES.length, "every rule is either clear or dormant, never absent");
});

test("a project outside the configured workspace is drift, not a failure", () => {
  // The fixture lives in the repo, the workspace is Studio's TimelineProject — so with `paths` on the rule
  // must say something. Which of the two it says depends on whether startup.ini declares a workspace at all,
  // so accept either and require that it never claims a silent pass.
  const r = checkProject(fixture(), { file: FILE });
  const hit = found(r, "g8-workspace");
  const dormant = r.dormant.find((d) => d.rule === "g8-workspace");
  assert.ok(hit.length || dormant, "the workspace rule must not be neither reported nor dormant");
  if (hit.length) {
    assert.equal(hit[0].severity, "warning");
    assert.match(hit[0].message, /outside the configured workspace/);
  }
  assert.ok(!r.clear.includes("g8-workspace"), "running from outside the workspace cannot be a pass");
});

test("the check does not modify the project it was handed", () => {
  const data = fixture();
  const before = JSON.stringify(data);
  checkProject(data, { file: FILE });
  assert.equal(JSON.stringify(data), before, "the preflight is read-only");
});

test("a startFrame that is not the running sum is an error", () => {
  const r = checkProject(fixture({ clips: [clip({ id: "A", startFrame: 0 }), clip({ id: "B", startFrame: 299 })] }), { file: FILE });
  assert.equal(found(r, "len").length, 1);
  assert.match(found(r, "len")[0].message, /startFrame/);
  assert.equal(found(r, "len")[0].severity, "error");
});

test("a frame count that disagrees with the clips is an error", () => {
  const r = checkProject(fixture({ frames: 999 }), { file: FILE });
  assert.match(found(r, "len")[0].message, /frames is 999 but the clips add up to 600/);
});

test("export markers that stop short of the timeline warn, and name the lost frames", () => {
  const r = checkProject(fixture({ markTrimEnd: 500 }), { file: FILE });
  assert.equal(found(r, "len").length, 0, "a short marker is not an arithmetic error");
  assert.equal(found(r, "export-range")[0].severity, "warning");
  assert.match(found(r, "export-range")[0].message, /the last 100 frames would not be exported/);
});

test("a marker past the end of the timeline is reported as past it", () => {
  const r = checkProject(fixture({ markTrimEnd: 900 }), { file: FILE });
  assert.match(found(r, "export-range")[0].message, /past the 600-frame timeline/);
});

test("markTrimIn other than 0 is part of the export range, not a defect", () => {
  const r = checkProject(fixture({ markTrimIn: 67 }), { file: FILE });
  assert.match(found(r, "export-range")[0].message, /starts 67 frames in/);
  assert.equal(r.ok, true, "an intentional in-point must not fail the project");
});

// G8 — identity and location
test("projectPath that is not the file's directory is reported, as drift", () => {
  const r = checkProject(fixture({ projectPath: "D:/somewhere/else/mcpFix" }), { file: FILE });
  assert.equal(found(r, "g8-project-path")[0].severity, "warning");
  assert.match(found(r, "g8-project-path")[0].message, /the file lives in/);
});

test("name and id are compared against the folder and the file name", () => {
  const byName = checkProject(fixture({ name: "other" }), { file: FILE });
  assert.match(found(byName, "g8-name")[0].message, /name is "other" but the folder is "mcpFix"/);
  const byId = checkProject(fixture({ id: "NOPE" }), { file: FILE });
  assert.match(found(byId, "g8-id")[0].message, /id is "NOPE"/);
});

test("without a file path, the path rules say so instead of passing", () => {
  const r = checkProject(fixture());
  for (const rule of ["g8-project-path", "g8-name", "g8-id", "g8-workspace"]) {
    assert.equal(found(r, rule).length, 0);
    assert.ok(r.dormant.some((d) => d.rule === rule), `${rule} must be reported as dormant`);
  }
});

test("a stale Deep Track path is drift, and re-pointing the clip clears it", () => {
  const stale = fixture({ clips: [clip({ id: "NEWID", deep_track: { save_path: `${DIR}/mcpFix/OLDID` } })] });
  const bad = checkProject(stale, { file: FILE });
  assert.equal(found(bad, "g8-deeptrack-path")[0].severity, "warning");
  const good = fixture({ clips: [clip({ id: "NEWID", deep_track: { save_path: `${DIR}/mcpFix/NEWID` } })] });
  assert.equal(found(checkProject(good, { file: FILE }), "g8-deeptrack-path").length, 0);
});

// G1 / G2 / A1 — the combination rules
test("movement together with keyframes on one clip is an error", () => {
  const c = clip({ camera_movement: { camera_movement_models: [{ id: 1 }] }, key_frame_track: { node_list: [{ time: 0 }] } });
  const r = checkProject(fixture({ clips: [c] }), { file: FILE });
  assert.equal(found(r, "g1-movement-conflict")[0].severity, "error");
});

test("movement alone on a flat project is clean", () => {
  const c = clip({ camera_movement: { camera_movement_models: [{ id: 1 }] } });
  const r = checkProject(fixture({ clips: [c] }), { file: FILE });
  assert.equal(found(r, "g1-movement-conflict").length, 0);
  assert.ok(r.clear.includes("g1-movement-conflict"), "the rule ran and passed");
  assert.ok(r.clear.includes("g2-movement-aspect"));
});

test("movement or keyframes on a 2:1 project are errors", () => {
  const move = checkProject(fixture({ aspectRatio: "2:1", clips: [clip({ camera_movement: { camera_movement_models: [{ id: 1 }] } })] }), { file: FILE });
  assert.match(found(move, "g2-movement-aspect")[0].message, /needs a flat ratio/);
  const keys = checkProject(fixture({ aspectRatio: "2:1", clips: [clip({ key_frame_track: { node_list: [{ time: 0 }] } })] }), { file: FILE });
  assert.match(found(keys, "a1-keyframe-aspect")[0].message, /keyframes need a flat ratio/);
});

test("rules whose trigger cannot exist are dormant, never clear", () => {
  const r = checkProject(fixture(), { file: FILE });
  for (const rule of ["g1-movement-conflict", "g2-movement-aspect", "a1-keyframe-aspect", "g5-deeptrack-360"]) {
    assert.ok(r.dormant.some((d) => d.rule === rule), `${rule} must be dormant on a project with none of it`);
    assert.ok(!r.clear.includes(rule), `${rule} must not claim to have passed`);
  }
});

// G3 — the false positive that made this rule honest
test("enableDashboard alone is not a configured dashboard", () => {
  const r = checkProject(fixture({ aspectRatio: "2:1", isPanoramic: true, clips: [clip()] }), { file: FILE });
  assert.equal(found(r, "g3-dashboard-flat").length, 0, "Studio's own projects carry enableDashboard:true with no Stats at all");
  assert.ok(r.dormant.some((d) => d.rule === "g3-dashboard-flat"));
});

test("a configured dashboard on a 360 project is an error, and on a flat project fine", () => {
  const c = clip({ dashboard_setting: { dashboardDataId: "abc", dashboardStyle: "style1", dashboardSourceType: "TypeGpsData", enableDashboard: true } });
  const pano = checkProject(fixture({ aspectRatio: "2:1", isPanoramic: true, clips: [c] }), { file: FILE });
  assert.match(found(pano, "g3-dashboard-flat")[0].message, /flat video only/);
  const flat = checkProject(fixture({ clips: [clip({ dashboard_setting: { dashboardDataId: "abc", dashboardStyle: "s", dashboardSourceType: "TypeGpsData" } })] }), { file: FILE });
  assert.equal(found(flat, "g3-dashboard-flat").length, 0);
});

// G4 / G5
test("Auto Frame's length rule only applies to 360 projects", () => {
  const flat = checkProject(fixture({ frames: 30, markTrimEnd: 30, clips: [clip({ sourceFrames: 30, source_total_frames: 30 })] }), { file: FILE });
  assert.equal(found(flat, "g4-autoframe-length").length, 0);
  assert.ok(flat.clear.includes("g4-autoframe-length"));
  const pano = checkProject(fixture({ isPanoramic: true, aspectRatio: "2:1", fps: 30, frames: 150, markTrimEnd: 150, clips: [clip({ sourceFrames: 150, source_total_frames: 150 })] }), { file: FILE });
  assert.match(found(pano, "g4-autoframe-length")[0].message, /5.0 s of timeline/);
});

test("Deep Track results on a non-360 project are an error", () => {
  const r = checkProject(fixture({ clips: [clip({ deep_track: { deep_track_list: [{ x: 1 }], save_path: "" } })] }), { file: FILE });
  assert.match(found(r, "g5-deeptrack-360")[0].message, /non-360/);
});

test("a second audio track is an error", () => {
  const r = checkProject(fixture({ tracks: [
    { audible: true, clips: [clip()], id: "T1", locked: false, transitions: [], type: 0, visible: true, z: 0 },
    { audible: true, clips: [], id: "T2", locked: false, transitions: [], type: 2, visible: true, z: -1 },
    { audible: true, clips: [], id: "T3", locked: false, transitions: [], type: 2, visible: true, z: -2 },
  ] }), { file: FILE });
  assert.match(found(r, "g7-one-audio-track")[0].message, /2 audio tracks/);
});

// assets
test("missing media is an error, and the message names the export symptom", () => {
  const r = checkProject(fixture({ clips: [clip({ url: "D:/gone/VID_001.mp4" })] }), { file: FILE });
  assert.match(found(r, "asset-media-path")[0].message, /Quelldatei fehlt/);
});

test("a filter whose LUT is gone is an error, and one with no filter is dormant", () => {
  const withFilter = (p) => clip({ effect_filter: { externfilterId: "HD Fireworks", externfilterName: "Fireworks I", externfilterResourcePath: p } });
  const bad = checkProject(fixture({ clips: [withFilter("D:/gone/x.cube.binary")] }), { file: FILE });
  assert.match(found(bad, "asset-filter-path")[0].message, /missing file/);
  const none = checkProject(fixture(), { file: FILE });
  assert.ok(none.dormant.some((d) => d.rule === "asset-filter-path"));
});

// transitions — including the counting bug this rule first had
test("a transition reported through the reader is judged on the file's own 12 keys", async () => {
  const { transitionState } = await import("../src/transitions.mjs");
  const track = {
    type: 0,
    clips: [clip({ id: "CLIP0001" }), clip({ id: "CLIP0002", startFrame: 300 })],
    transitions: [
      {
        defaultFrames: 14, frames: 14, id: "TRANS0001", maximumFrames: 60, minimumFrames: 6, name: "",
        nextClip: "CLIP0002", path: realFile, prevClip: "CLIP0001", resourceId: "ASSET1", state: 0, type: 2,
      },
    ],
  };
  const r = checkProject(fixture({ tracks: [track] }), { file: FILE });
  assert.deepEqual(found(r, "transition-shape"), [], "a well-formed entry must pass — the reader decorates it with pathExists/keys and those are not file keys");
  // and prove the decoration is really there, so the test would catch a regression to counting it
  const decorated = transitionState(track).transitions[0];
  assert.ok(Object.keys(decorated).length > TRANSITION_KEYS.length, "the reader is expected to add computed fields");
  assert.equal(decorated.keys.length, TRANSITION_KEYS.length);
});

test("a transition whose clips are not adjacent is an error", () => {
  const clips = [clip({ id: "A", startFrame: 0 }), clip({ id: "B", startFrame: 300 }), clip({ id: "C", startFrame: 600 })];
  const track = {
    type: 0,
    clips,
    transitions: [{
      defaultFrames: 14, frames: 14, id: "T", maximumFrames: 60, minimumFrames: 6, name: "",
      nextClip: "C", path: realFile, prevClip: "A", resourceId: "X", state: 0, type: 2,
    }],
  };
  const r = checkProject(fixture({ tracks: [track] }), { file: FILE });
  assert.match(found(r, "transition-shape")[0].message, /not adjacent \(positions 0 and 2\)/);
});

test("transition frames outside 6..60 are an error", () => {
  const track = {
    type: 0,
    clips: [clip({ id: "A" }), clip({ id: "B", startFrame: 300 })],
    transitions: [{
      defaultFrames: 14, frames: 200, id: "T", maximumFrames: 60, minimumFrames: 6, name: "",
      nextClip: "B", path: realFile, prevClip: "A", resourceId: "X", state: 0, type: 2,
    }],
  };
  const r = checkProject(fixture({ tracks: [track] }), { file: FILE });
  assert.match(found(r, "transition-shape")[0].message, /outside Studio's 6\.\.60/);
});

// honesty of the report itself
test("every unverifiable rule says why, and none is silently dropped", () => {
  assert.ok(UNVERIFIABLE.length >= 3);
  for (const u of UNVERIFIABLE) {
    assert.ok(u.id && u.title && u.why, `${u.id} must carry a reason`);
    assert.ok(u.why.length > 20, `${u.id}'s reason must explain the missing measurement`);
  }
  const r = checkProject(fixture(), { file: FILE });
  assert.deepEqual(r.unverifiable.map((u) => u.id), UNVERIFIABLE.map((u) => u.id));
});

test("a rule never reports both a violation and a pass", () => {
  const r = checkProject(fixture({ markTrimEnd: 10, projectPath: "D:/nope" }), { file: FILE });
  const violated = new Set(r.violations.map((v) => v.rule));
  for (const c of r.clear) assert.ok(!violated.has(c), `${c} reported as both clear and violated`);
  for (const d of r.dormant) assert.ok(!violated.has(d.rule), `${d.rule} reported as both dormant and violated`);
});

test("every violation carries the rule's title and its source", () => {
  const r = checkProject(fixture({ frames: 1 }), { file: FILE });
  for (const v of r.violations) {
    assert.ok(v.title && v.source, `${v.rule} must cite its title and source`);
  }
});

test("rule ids are unique and the catalogue is complete", () => {
  const ids = RULES.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const r of RULES) {
    assert.ok(r.title && r.source, `${r.id} needs a title and a source`);
    assert.ok(["error", "warning"].includes(r.severity), `${r.id} needs a severity`);
  }
  assert.ok(!ids.includes("ratio-selfconsistent"), "that rule was falsified by 21 real occurrences and must stay gone");
});

test("a project built from a template re-points every clip's tracking cache at that clip's own id", async () => {
  const { newProjectFrom } = await import("../src/project.mjs");
  const template = fixture({ projectPath: "D:/Dokumente/Insta360/Studio/TimelineProject/mcpKey", name: "mcpKey" });
  // The builder refuses a source whose length it cannot know ("file missing and no project references it"),
  // so hand it harvested models for the two files — that is the offline path a real build takes.
  const clipModels = new Map([
    ["D:/Videos/VID_001.mp4", [{ ...clip(), sourceFrames: 300, fps: 30, name: "VID_001.mp4" }]],
    ["D:/Videos/VID_002.mp4", [{ ...clip(), sourceFrames: 240, fps: 30, name: "VID_002.mp4" }]],
  ]);
  const built = newProjectFrom(template, {
    name: "mcpNew",
    projectPath: "D:/Dokumente/Insta360/Studio/TimelineProject/mcpNew",
    sources: ["D:/Videos/VID_001.mp4", "D:/Videos/VID_002.mp4"],
    clipModels,
  });
  const video = built.tracks.find((t) => t.type === 0);
  const paths = video.clips.map((c) => c.deep_track?.save_path);
  const want = video.clips.map((c) => `D:/Dokumente/Insta360/Studio/TimelineProject/mcpNew/mcpNew/${c.id}`);
  assert.deepEqual(paths, want, "the last segment is the clip's id — it used to be a fresh random uuid matching no clip");
  assert.equal(checkProject(built, { file: FILE, paths: false }).violations.filter((v) => v.rule === "g8-deeptrack-path").length, 0);
});
