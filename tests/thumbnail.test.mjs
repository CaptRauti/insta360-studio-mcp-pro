// Regression tests for the thumbnail / scene-detect service payloads.
//
// These exist because the first version of src/thumbnail.mjs guessed the field
// numbers instead of reading them from the descriptor, and the service answered
// by silently dropping the payload: it never wrote a single thumbnail in any
// test run, which nobody noticed because no test covered the builders. Every
// expectation below is the descriptor from studio_worker.dll
// (research/proto_catalog.json, ThumbnailModule.proto, package service.Thumbnail)
// or a reply captured from the live service on port 4098.

import assert from "node:assert/strict";
import test from "node:test";

import { decodeMessage } from "../src/grpc-client.mjs";
import {
  ThumbnailRenderType,
  ThumbnailTaskType,
  buildHeartBeat,
  buildSceneDetectRequest,
  buildSourceGroup,
  buildThumbnailRequest,
  decodeHeartBeat,
  decodeSceneDetectReply,
  decodeThumbnailInfo,
  decodeThumbnailReply,
} from "../src/thumbnail.mjs";

/** Reply the live service sent for a 360 .insv (one ThumbnailInfo). */
const LIVE_THUMBNAIL_REPLY =
  "12620a60443a2f446f6b756d656e74652f496e7374613336302f53747564696f2f50726f6a6563742f39343738323762396433633561623834643338383330303734353365376630612f7468756d626e61696c2f636c69705f305f636f7665722e6a7067";

test("ThumbnailTaskType and ThumbnailRenderType match the descriptor", () => {
  assert.deepEqual(ThumbnailTaskType, { kFootageCover: 0, kSingleTask: 1, kQuickSeekTask: 2 });
  assert.deepEqual(ThumbnailRenderType, { kPlane: 0, kPlaneSphere: 1, kSphere: 2, kDewarp: 3, kStereo: 4 });
});

test("SourceGroup repeats sourceFile as field 1", () => {
  const d = decodeMessage(buildSourceGroup(["a.insv", "b.insv"]));
  assert.deepEqual(
    (Array.isArray(d[1]) ? d[1] : [d[1]]).map((v) => v.toString()),
    ["a.insv", "b.insv"],
  );
});

test("files land in ThumbnailRequest field 2, not field 1", () => {
  const d = decodeMessage(buildThumbnailRequest({ files: ["a.insv"] }));
  assert.equal(d[1], undefined, "field 1 is the int64 id and must stay empty");
  assert.ok(Buffer.isBuffer(d[2]), "field 2 is the SourceGroup message");
  assert.equal(decodeMessage(d[2])[1].toString(), "a.insv");
});

test("width, height, frameIndex, renderType and taskType sit at 3/4/5/6/7", () => {
  const d = decodeMessage(
    buildThumbnailRequest({
      files: ["a.insv"],
      width: 1280,
      height: 720,
      frameIndex: 7,
      renderType: ThumbnailRenderType.kDewarp,
      taskType: ThumbnailTaskType.kSingleTask,
    }),
  );
  assert.equal(d[3], 1280);
  assert.equal(d[4], 720);
  assert.equal(d[5], 7);
  assert.equal(d[6], 3);
  assert.equal(d[7], 1);
});

test("a string in field 1 is not how this service is addressed", () => {
  // The bug this file guards: `sourceGroup` as a string in field 1. If someone
  // reintroduces it, the request must fail loudly here instead of producing an
  // empty reply at runtime.
  const buggy = buildThumbnailRequest({ files: ["a.insv"] });
  const d = decodeMessage(buggy);
  assert.equal(typeof d[1], "undefined");
  assert.equal(Buffer.isBuffer(d[2]), true);
});

test("id, pano flags and aspect ratio are carried", () => {
  const d = decodeMessage(
    buildThumbnailRequest({ id: 42, files: ["a.insv"], isPanoMedia: true, isPanoExport: true, aspectRatio: 1 }),
  );
  assert.equal(d[1], 42);
  assert.equal(d[17], 1);
  assert.equal(d[16], 1);
  assert.equal(d[19], 1);
});

test("decodeThumbnailReply reads the reply the live service sent", () => {
  const r = decodeThumbnailReply(Buffer.from(LIVE_THUMBNAIL_REPLY, "hex"));
  assert.equal(r.thumbnails.length, 1);
  assert.match(r.thumbnails[0].thumbnailPath, /thumbnail\/clip_0_cover\.jpg$/);
  assert.equal(r.thumbnails[0].frameIndex, 0);
  assert.equal(r.thumbnails[0].timeStampMs, 0);
  assert.equal(r.errCode, -1, "unset errCode means no error was reported");
});

test("decodeThumbnailInfo reads path at 1, frame at 2, timestamp at 3", () => {
  const hex = Buffer.concat([
    Buffer.from([0x0a, 0x03]),
    Buffer.from("abc"),
    Buffer.from([0x10, 0x05, 0x18, 0x64]),
  ]);
  assert.deepEqual(decodeThumbnailInfo(hex), { thumbnailPath: "abc", frameIndex: 5, timeStampMs: 100 });
});

test("SceneDetectRequest carries the group name and the files", () => {
  const d = decodeMessage(buildSceneDetectRequest({ sourceGroupName: "grp", files: ["a.insv"] }));
  assert.equal(d[1].toString(), "grp");
  assert.equal(decodeMessage(d[2])[1].toString(), "a.insv");
});

test("an empty SceneDetectReply decodes to the no-answer the service gives", () => {
  assert.deepEqual(decodeSceneDetectReply(Buffer.alloc(0)), { sourceGroupName: "", errCode: -1, raw: "" });
});

test("HeartBeat is count at 1 and exit_app at 2", () => {
  assert.deepEqual(decodeHeartBeat(buildHeartBeat({ count: 1 })), { count: 1, exitApp: false });
  assert.deepEqual(decodeHeartBeat(buildHeartBeat({ count: 2, exitApp: true })), { count: 2, exitApp: true });
  assert.deepEqual(decodeHeartBeat(Buffer.from("0801", "hex")), { count: 1, exitApp: false });
});
