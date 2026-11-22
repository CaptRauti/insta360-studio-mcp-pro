// Round-trip tests for the hand-rolled protobuf layer and the .insproj reader.
// These run without Studio: they assert the encoders/decoders agree and that
// the field numbers match the recovered descriptor.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { decodeMessage, fieldInt, fieldString, varint } from "../src/grpc-client.mjs";
import {
  buildExportHeader,
  buildExportParams,
  buildLocalExtraParams,
  buildLocalImageExportParam,
  buildLocalVideoExportParam,
  buildSourceGroup,
  buildStitchingSetting,
  decodeExportReply,
} from "../src/exporter.mjs";
import { readProject, summarizeProject, projectSources, setClipTransform, trimClip, repointClip } from "../src/project.mjs";

const str = (buf) => buf.toString("utf8");

test("varint encodes single and multi byte values", () => {
  assert.equal(varint(0).toString("hex"), "00");
  assert.equal(varint(1).toString("hex"), "01");
  assert.equal(varint(127).toString("hex"), "7f");
  assert.equal(varint(128).toString("hex"), "8001");
  assert.equal(varint(300).toString("hex"), "ac02");
});

test("fieldString round-trips through decodeMessage", () => {
  const buf = fieldString(1, "hello");
  const out = decodeMessage(buf);
  assert.equal(str(out[1]), "hello");
});

test("fieldInt round-trips through decodeMessage", () => {
  const out = decodeMessage(fieldInt(2, 42));
  assert.equal(out[2], 42);
});

test("SourceGroup uses field 1 for the repeated source path", () => {
  const sg = buildSourceGroup({ sourceFiles: ["C:/a.insv"], groupIdentifier: "test" });
  const out = decodeMessage(sg);
  assert.equal(str(out[1]), "C:/a.insv");
  assert.equal(str(out[3]), "test");
});

test("ExportHeader carries taskId, exportName and savePath", () => {
  const h = buildExportHeader({ taskId: "t1", exportName: "n1", savePath: "C:/out" });
  const out = decodeMessage(h);
  assert.equal(str(out[1]), "t1");
  assert.equal(str(out[2]), "n1");
  assert.equal(str(out[3]), "C:/out");
});

test("LocalVideoExportParam keeps the descriptor field numbers", () => {
  const v = buildLocalVideoExportParam({ stitchType: 2, enableStab: true, enableImageFusion: true });
  const out = decodeMessage(v);
  assert.equal(out[10], 2, "stitchType is field 10");
  assert.equal(out[22], 1, "enableStab is field 22");
  assert.equal(out[11], 1, "enableImageFusion is field 11");
});

test("LocalExtraParams nests the video params under field 2", () => {
  const inner = buildLocalVideoExportParam({ stitchType: 1 });
  const outer = buildLocalExtraParams({ exportType: 2, videoExportParams: [inner] });
  const out = decodeMessage(outer);
  assert.equal(out[1], 2, "exportType is field 1");
  const nested = decodeMessage(out[2]);
  assert.equal(nested[10], 1, "stitchType is field 10 inside the video param");
});

test("ExportParams nests header and extra params; source group sits in imageExportParam", () => {
  const params = buildExportParams({
    exportHeader: buildExportHeader({ taskId: "t", exportName: "e", savePath: "C:/o" }),
    localExtraParams: buildLocalExtraParams({
      exportType: 2,
      videoExportParams: [buildLocalVideoExportParam({ stitchType: 1 })],
      imageExportParam: buildLocalImageExportParam({
        sourceGroup: buildSourceGroup({ sourceFiles: ["C:/a.insv"] }),
        stitching: buildStitchingSetting({ enableImageFusion: true }),
      }),
    }),
  });
  const out = decodeMessage(params);
  assert.ok(out[1], "exportHeader present");
  assert.ok(out[3], "localExtraParams present");
  const extra = decodeMessage(out[3]);
  assert.equal(extra[1], 2, "exportType");
  const image = decodeMessage(extra[3]);
  const sg = decodeMessage(image[2]);
  assert.equal(str(sg[1]), "C:/a.insv", "sourceGroup is field 2 of LocalImageExportParam");
  assert.equal(decodeMessage(image[5])[4], 1, "enableImageFusion is field 4 of StitchingSetting");
});

test("decodeExportReply reads the live reply shape", () => {
  // Captured from the running service against an empty request:
  //   f2 = 1.0 (progress float), f4 = 1026 (status), f5 = message, f6 = log path.
  const reply = Buffer.concat([
    fieldString(1, "task-abc"),
    fieldInt(2, 1),
    fieldInt(4, 1026),
    fieldString(5, "There is no source file."),
    fieldString(6, "C:/log/x.log"),
  ]);
  const decoded = decodeExportReply(reply);
  assert.equal(decoded.uuid, "task-abc");
  assert.equal(decoded.errCode, 1026);
  assert.equal(decoded.err, "NO_SOURCE_FILE");
  assert.equal(decoded.errInfo, "There is no source file.");
  assert.equal(decoded.logPath, "C:/log/x.log");
});

test("insproj reader parses a real-shaped project and summarizes it", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "insproj-"));
  const file = path.join(dir, "p.insproj");
  const project = {
    name: "Test",
    fps: 60,
    frames: 120,
    isPanoramic: false,
    tracks: [
      {
        id: "t1",
        type: 0,
        visible: true,
        clips: [
          {
            id: "c1",
            name: "a.mp4",
            url: "C:/videos/a.mp4",
            startFrame: 0,
            leftTrim: 0,
            rightTrim: 0,
            sourceFrames: 120,
            source_total_frames: 120,
            camera_transform: { eulers: { pitch: { type: 0, value: 0 } } },
          },
        ],
        transitions: [],
      },
    ],
  };
  await writeFile(file, JSON.stringify(project), "utf8");
  try {
    const data = await readProject(file);
    const summary = summarizeProject(data);
    assert.equal(summary.name, "Test");
    assert.equal(summary.tracks.length, 1);
    assert.equal(summary.clips.length, 1);
    assert.equal(summary.clips[0].url, "C:/videos/a.mp4");
    assert.deepEqual(projectSources(data), ["C:/videos/a.mp4"]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("insproj reader rejects a non-project JSON file", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "insproj-bad-"));
  const file = path.join(dir, "bad.insproj");
  await writeFile(file, JSON.stringify({ hello: "world" }), "utf8");
  try {
    await assert.rejects(() => readProject(file), /tracks/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("clip edits mutate the expected fields", () => {
  const data = {
    tracks: [
      {
        clips: [
          {
            id: "c1",
            url: "C:/old.mp4",
            leftTrim: 0,
            rightTrim: 0,
            camera_transform: { eulers: { yaw: { type: 0, value: 0 } } },
          },
        ],
      },
    ],
  };
  setClipTransform(data, { track: 0, clip: 0 }, { cameraTransform: { fov: { type: 0, value: 1.5 } } });
  assert.equal(data.tracks[0].clips[0].camera_transform.fov.value, 1.5);

  const trim = trimClip(data, { track: 0, clip: 0 }, { leftTrim: 10, rightTrim: 20 });
  assert.equal(trim.leftTrim, 10);
  assert.equal(trim.rightTrim, 20);

  const repoint = repointClip(data, { track: 0, clip: 0 }, "C:/new.mp4", { renameTo: "new.mp4" });
  assert.equal(repoint.previous, "C:/old.mp4");
  assert.equal(data.tracks[0].clips[0].url, "C:/new.mp4");
  assert.equal(data.tracks[0].clips[0].name, "new.mp4");
});
