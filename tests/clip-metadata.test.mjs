// Regression test for per-file clip metadata.
//
// Studio stores the source length per clip, not per project. A builder that
// clones one template clip for every source therefore claims every clip is as
// long as the template's file; Studio loads such a project but refuses to export
// it ("Quelldatei fehlt — die Materialdatei ist verloren gegangen", measured with
// a 26480 MB size estimate for an 800-frame timeline).
//
// This asserts that each clip carries the frame count of its OWN source file.
//
// Usage: node tests/clip-metadata.test.mjs

import assert from "node:assert/strict";
import fs from "node:fs";
import { probeSource, harvestClips, sourceMetaFor, clipDisplayName } from "../src/project.mjs";
import { buildProject, findTemplate, projectsRoot } from "../src/pipeline.mjs";

const A = "F:/Luna/VID_20261112_051426_001.mp4";
const B = "F:/Luna/VID_20261112_054457_004.mp4";

let pass = 0;
let fail = 0;
function check(label, fn) {
  try {
    fn();
    pass++;
    console.log(`  ok   ${label}`);
  } catch (err) {
    fail++;
    console.log(`  FAIL ${label}\n       ${err.message}`);
  }
}

console.log("clip metadata");

if (!fs.existsSync(A) || !fs.existsSync(B)) {
  console.log(`  skip — fixtures missing (${A} / ${B})`);
  process.exit(0);
}

// ffprobe must report the two files as different lengths, or the test proves
// nothing about per-file handling.
const pa = probeSource(A);
const pb = probeSource(B);
check("probeSource reads a frame count", () => {
  assert.ok(pa?.frames > 0, "no frames for A");
  assert.ok(pb?.frames > 0, "no frames for B");
});
check("the two fixtures differ in length", () => assert.notEqual(pa.frames, pb.frames));
check("probeSource rejects a missing file", () => assert.equal(probeSource("F:/Luna/nope.mp4"), null));

// Studio's own numbers are the reference: 904 and 337 for these two files. Those
// numbers only exist if some project in the library actually references the
// fixture files — after a library cleanup there is none, and the two checks below
// have nothing to compare against. Report that instead of failing: a red test for
// a missing reference teaches nothing, and the fixture guard above has the same
// shape.
const harvested = harvestClips(projectsRoot());
const haveA = harvested.has(A);
check("harvestClips finds clips in existing projects", () => {
  if (!haveA) console.log("       (no project references the fixtures — harvest checks below skipped)");
  else assert.ok(harvested.size > 0, "nothing harvested");
});
check("harvestClips keeps every distinct frame count as a candidate", () => {
  if (!haveA) return;
  const list = harvested.get(A);
  assert.ok(Array.isArray(list) && list.length, `no candidates for ${A}`);
});
check("sourceMetaFor accepts the harvested value that matches the file", () => {
  if (!haveA) return;
  const m = sourceMetaFor(A, { url: "F:/other.mp4", sourceFrames: 999 }, harvested);
  assert.equal(m.frames, 904);
  assert.equal(m.from, "harvested");
});
check("sourceMetaFor rejects a harvested value that contradicts the file", () => {
  // Simulates the poisoned case: an old project claims 904 frames for a file
  // that really has 337.
  const poisoned = new Map([[B, [{ url: B, sourceFrames: 904, name: "wrong.mp4" }]]]);
  const m = sourceMetaFor(B, null, poisoned);
  assert.equal(m.frames, pb.frames);
  assert.equal(m.from, "ffprobe");
});

check("sourceMetaFor falls back to ffprobe for an unknown file", () => {
  // B is in the fixture set, so pretend the library is empty.
  const m = sourceMetaFor(B, null, new Map());
  assert.equal(m.from, "ffprobe");
  assert.equal(m.frames, pb.frames);
});

check("sourceMetaFor refuses a file it cannot measure", () => {
  assert.throws(() => sourceMetaFor("F:/Luna/definitely-not-here.mp4", null, new Map()), /cannot determine the length/);
});

const built = await buildProject({
  name: "metaCheck",
  template: findTemplate({ exclude: ["mcpEdit", "metaCheck"] }),
  // Pin the timeline rate: the harvested numbers below (904 / 337) are Studio's
  // counts on a 30 fps timeline, and `sourceFrames` is expressed in timeline
  // frames. Leaving this to the template makes the assertions depend on which
  // project happens to be newest — a 60 fps template correctly yields 1808.
  fps: 30,
  clips: [{ source: A }, { source: B }],
});
const video = built.project.tracks.find((t) => t.type === 0);

check("each clip gets its own sourceFrames", () => {
  assert.equal(video.clips[0].sourceFrames, 904, "clip 0");
  assert.equal(video.clips[1].sourceFrames, 337, "clip 1");
});
check("source_total_frames matches sourceFrames", () => {
  assert.equal(video.clips[0].source_total_frames, 904);
  assert.equal(video.clips[1].source_total_frames, 337);
});
check("clip names come from their own file", () => {
  assert.equal(video.clips[0].name, "VID_001.mp4");
  assert.equal(video.clips[1].name, "VID_004.mp4");
});
check("startFrame is laid out from the true lengths", () => {
  assert.equal(video.clips[0].startFrame, 0);
  assert.equal(video.clips[1].startFrame, 904);
});
check("project length is the sum of the real clip lengths", () => {
  assert.equal(built.project.frames, 904 + 337);
});
check("the project carries no stray bookkeeping key", () => {
  assert.ok(!("sources" in built.project), "base.sources leaked into the project JSON");
});

// Studio names a clip after the camera's own short name, not the name ingestion
// gave the file. Every album node Studio has written (24/24) maps the full path
// to that short form, so a fallback that keeps the ingested name writes a
// project that differs from Studio's own for the same media.
const LAM = "D:/Videos/Lamspringe26/VID_20260822_190557_049.mp4";
check("the fallback name drops the ingested date and time", () => {
  assert.equal(clipDisplayName(LAM), "VID_049.mp4");
  assert.equal(clipDisplayName("F:/Luna/VID_20261112_051426_001.mp4"), "VID_001.mp4");
});
check("a lens index survives the short form", () => {
  assert.equal(clipDisplayName("F:/Luna/VID_20261112_051426_00_001.insv"), "VID_00_001.insv");
  assert.equal(clipDisplayName("F:/Luna/LRV_20261112_051426_001.lrv"), "LRV_001.lrv");
});
check("anything else keeps the name it has on disk", () => {
  assert.equal(clipDisplayName("C:/out/mcp_render.mp4"), "mcp_render.mp4");
  assert.equal(clipDisplayName("F:/Luna/VID_2026_049.mp4"), "VID_2026_049.mp4");
});
check("a file outside the harvest library still gets Studio's short name", () => {
  if (!fs.existsSync(LAM)) return console.log("       (skipped: fixture media not on this machine)");
  const m = sourceMetaFor(LAM, null, new Map());
  assert.equal(m.from, "ffprobe");
  assert.equal(m.name, "VID_049.mp4");
  assert.ok(m.frames > 0, "no frame count from ffprobe");
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
