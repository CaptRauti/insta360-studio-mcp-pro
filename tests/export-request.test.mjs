// Round-trips for the request-side builders that carry the source file.
//
// These exist because the media path is easy to lose: ExportParams names a file
// in exactly one place (SourceGroup.sourceFile under LocalImageExportParam) plus
// ExportHeader.materialList, and a silently dropped field only shows up as
// errCode 1026 "There is no source file." from the service at runtime.
//
// decodeMessage hands length-delimited fields back as Buffers, so string
// assertions go through asString().

import assert from "node:assert/strict";
import test from "node:test";

import { asString, decodeMessage } from "../src/grpc-client.mjs";
import {
  EXPORT_TYPE,
  buildExportHeader,
  buildExtraDataReqItem,
  buildMaterialItem,
  buildLocalExtraParams,
  buildLocalImageExportParam,
  buildSourceGroup,
} from "../src/exporter.mjs";

test("buildMaterialItem carries index, type and value", () => {
  const buf = buildMaterialItem({ index: 3, type: "video", value: "D:/x.insv" });
  const decoded = decodeMessage(buf);
  assert.equal(decoded["1"], 3);
  assert.equal(asString(decoded["2"]), "video");
  assert.equal(asString(decoded["3"]), "D:/x.insv");
});

test("buildMaterialItem omits unset fields", () => {
  const decoded = decodeMessage(buildMaterialItem({ value: "D:/x.insv" }));
  assert.deepEqual(Object.keys(decoded), ["3"]);
});

test("buildExtraDataReqItem carries all eight fields", () => {
  const buf = buildExtraDataReqItem({
    extraType: "lut",
    valueType: "file",
    value: "v",
    fileName: "f.cube",
    businessSource: "local",
    source: "ui",
    transitionType: "cut",
    localFilePath: "D:/f.cube",
  });
  const decoded = decodeMessage(buf);
  assert.equal(asString(decoded["1"]), "lut");
  assert.equal(asString(decoded["4"]), "f.cube");
  assert.equal(asString(decoded["8"]), "D:/f.cube");
  assert.equal(Object.keys(decoded).length, 8);
});

test("buildExportHeader puts materialList at 12 and extraDataReqList at 11", () => {
  const buf = buildExportHeader({
    taskId: "t",
    extraDataReqList: [{ extraType: "lut" }],
    materialList: [{ index: 0, type: "video", value: "D:/x.insv" }],
  });
  const decoded = decodeMessage(buf);
  assert.equal(asString(decoded["1"]), "t");
  assert.ok(Buffer.isBuffer(decoded["11"]), "field 11 must be a nested message");
  assert.ok(Buffer.isBuffer(decoded["12"]), "field 12 must be a nested message");
  assert.equal(asString(decodeMessage(decoded["11"])["1"]), "lut");
  assert.equal(asString(decodeMessage(decoded["12"])["3"]), "D:/x.insv");
});

test("buildExportHeader still carries the scalar fields", () => {
  const decoded = decodeMessage(
    buildExportHeader({ savePath: "C:/out", width: 3840, height: 2160, bitrate: "100" }),
  );
  assert.equal(asString(decoded["3"]), "C:/out");
  assert.equal(asString(decoded["8"]), "100");
  assert.equal(decoded["9"], 3840);
  assert.equal(decoded["10"], 2160);
});

test("the image route nests sourceGroup.sourceFile", () => {
  const imageParam = buildLocalImageExportParam({
    sourceGroup: buildSourceGroup({ sourceFiles: ["C:/p.jpg"] }),
  });
  const extra = buildLocalExtraParams({ exportType: EXPORT_TYPE.JPG_SEQUENCE, imageExportParam: imageParam });
  const decoded = decodeMessage(extra);
  assert.equal(decoded["1"], 5, "exportType sits at field 1");
  const param = decodeMessage(decoded["3"]);
  assert.equal(
    asString(decodeMessage(param["2"])["1"]),
    "C:/p.jpg",
    "sourceFile survives two levels of nesting",
  );
});

test("ExportType numbering matches the service descriptor", () => {
  assert.equal(EXPORT_TYPE.PHOTO, 0);
  assert.equal(EXPORT_TYPE.JPG_SEQUENCE, 5);
  assert.equal(EXPORT_TYPE.VIDEO, 9);
  assert.equal(EXPORT_TYPE.VIDEO_CLIP, 10);
  assert.equal(EXPORT_TYPE.MUX_TO_VIDEO, 13);
  assert.equal(EXPORT_TYPE.PLACE_HOLDER_TYPE, 33);
});
