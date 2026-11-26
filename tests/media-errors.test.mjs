// Unit tests for the log-line classifier. Pure: text in, sentences out.
//
// The fixtures are **verbatim fragments from a decrypted session log** (2026-11-24,
// read with `grepLogs({decrypt:true})`) — the same lines the patterns in
// src/media-errors.mjs were written from, so a pattern that stops matching a real log
// fails here instead of quietly reporting nothing.

import assert from "node:assert/strict";
import { test } from "node:test";

import { MEDIA_ERRORS, classifyLogText } from "../src/media-errors.mjs";

const BAD_FRAME =
  "24 23:55:35.386]  49048 0658< I frame_util.cc:1157:  [FUNC:studio::util::FrameConversion::LoadPlayerErrorFrameImageData]:  [bad_frame] Successfully loaded player error frame image:";

const BENIGN_SESSION = [
  "24 23:55:53.701]  49048 76624 I hwaccel_util.cpp:0990:  disableHwaccelDecoder: 0",
  "24 23:55:53.701]  49048 76624 I hwaccel_util.cpp:0994:  decoderHwaccel: CUDA",
  "24 23:55:53.710]  49048 76624 I ProbeWorker.cc:0346:   candidate decoder hwaccel: 0 CUDA",
  "24 23:55:53.710]  49048 76624 I ProbeWorker.cc:0421:  try decoder: CUDA_h264 width: 640 height: 480",
  "24 23:55:53.710]  49048 76624 I ProbeWorker.cc:0421:  try decoder: CUDA_hevc width: 640 height: 480",
  "24 23:55:53.710]  49048 76624 I ProbeWorker.cc:0442:  choose decoder hwaccel: CUDA_h264",
  "24 23:55:53.710]  49048 76624 I ProbeMaster.cc:0047:  h264_cuvid @ 0000021252ADB140 Invalid pkt_timestamp, passing timestamps as-is",
  "24 23:55:35.380]  49048 0658< I ExtraInfoAsset.cc:0389:  extrainfo asset Parse: iotool read header fail",
  "24 23:55:35.512]  49048 0658< W text_library_model.cpp:0663:  [FUNC:pro::TextLibraryModel::DeserializePersistentList]:  File named D:/x/Download failed to open",
  '24 23:55:50.801]  49048 09664 W :0000:  stream 3 finished with error: "Connection closed"',
].join("\n");

test("the red-frame state is reported as a media problem with an action", () => {
  const r = classifyLogText(BAD_FRAME);
  assert.equal(r.actionable, 1);
  assert.equal(r.benign, 0);
  const hit = r.hits[0];
  assert.equal(hit.id, "corrupted-frame");
  assert.match(hit.plain, /Corrupted Frame/i);
  assert.ok(hit.action.length > 20, "a stuck page needs something to do");
  assert.match(hit.sample, /bad_frame|LoadPlayerErrorFrameImageData/);
});

test("a normal session reports nothing to act on", () => {
  const r = classifyLogText(BENIGN_SESSION);
  assert.equal(r.actionable, 0, "no media error in a healthy session");
  assert.ok(r.benign >= 3, `expected the benign lines to be named, got ${JSON.stringify(r.hits.map((h) => h.id))}`);
  assert.match(r.summary, /nur Unkritisches/);
});

test("lines that only look alarming are named anyway", () => {
  const r = classifyLogText(BENIGN_SESSION);
  for (const id of ["pkt-timestamp", "extra-info-parse", "stream-closed", "missing-local-file"]) {
    assert.ok(r.hits.some((h) => h.id === id), `${id} should be recognised (and marked benign)`);
  }
  assert.ok(r.hits.every((h) => h.severity !== "media"), "none of them is actionable");
});

test("the decode path is extracted, because it explains speed", () => {
  const r = classifyLogText(BENIGN_SESSION);
  assert.equal(r.decodePath.chosen, "CUDA_h264");
  assert.equal(r.decodePath.hardwareDisabled, false);
  assert.deepEqual(r.decodePath.candidates.slice().sort(), ["CUDA", "CUDA_h264", "CUDA_hevc"]);
});

test("repeated lines are counted, not repeated", () => {
  const r = classifyLogText([BAD_FRAME, BAD_FRAME, BAD_FRAME].join("\n"));
  assert.equal(r.hits.length, 1);
  assert.equal(r.hits[0].count, 3);
});

test("empty input says so instead of inventing a problem", () => {
  const r = classifyLogText("");
  assert.deepEqual(r.hits, []);
  assert.equal(r.actionable, 0);
  assert.match(r.summary, /keine der bekannten Meldungen/);
});

test("every table entry carries the log text it was measured from", () => {
  for (const def of MEDIA_ERRORS) {
    assert.match(def.evidence, /:\d+|\bstream\b/i, `${def.id} needs a real log fragment as evidence`);
    assert.ok(def.plain.length > 40 && def.action.length > 2, `${def.id} needs a plain sentence and an action`);
    assert.ok(["media", "benign"].includes(def.severity));
  }
});
