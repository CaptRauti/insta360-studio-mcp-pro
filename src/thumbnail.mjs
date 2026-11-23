// Thumbnail and scene-detection service (port discovered from
// studio-thumbnail-service.exe; see grpc-client.mjs:discoverThumbnail).
//
// Every field number and type below comes from the live descriptor inside
// studio_worker.dll -- research/proto_catalog.json, ThumbnailModule.proto,
// package service.Thumbnail. The first version of this file guessed them and was
// wrong in both directions, so the service silently dropped the payload: a
// string went into field 1, where it expects the int64 `id`, and the source file
// into field 3, where it expects `width`.
//
//   ThumbnailRequest   1 id  2 sourceGroup(message)  3 width  4 height
//                      5 frameIndex  6 renderType(enum)  7 task_type(enum)
//                      8 onlyUseKeyframe  9 taskPriority  10 clipId
//                      11 frameTimeMs  12 isCloud  13 mediaId  14 cloudMediaInfoJson
//                      15 thumbalPath  16 is_pano_export  17 is_pano_media
//                      18 export_type  19 aspect_ratio
//   ThumbnailReply     1 id  2 repeated ThumbnailInfo  3 errCode  4 errInfo
//   ThumbnailInfo      1 thumbnailPath  2 frameIndex  3 timeStampMs
//   SourceGroup        1 repeated sourceFile
//   SceneDetectRequest 1 source_group_name  2 source_group(SourceGroup)
//   SceneDetectReply   1 source_group_name  2 err_code
//   HeartBeat          1 count  2 exit_app
//
// The four methods the service serves:
//   SendRequest(ThumbnailRequest)              -> ThumbnailReply
//   SendSceneDetectRequest(SceneDetectRequest) -> SceneDetectReply
//   SendHeartBeatPackage(HeartBeat)            -> HeartBeat
//   Remove(SourceGroup)                        -> SourceGroup
//
// `Remove` takes a SourceGroup, not an empty message -- sending nothing asks the
// service to forget nothing.

import {
  asNumber,
  asString,
  decodeMessage,
  discoverThumbnail,
  fieldBool,
  fieldBytes,
  fieldInt,
  fieldString,
  unaryCall,
} from "./grpc-client.mjs";

export const SERVICE = "/service.Thumbnail.ThumbnailService";
const PATH_SEND = `${SERVICE}/SendRequest`;
const PATH_SCENE_DETECT = `${SERVICE}/SendSceneDetectRequest`;
const PATH_HEARTBEAT = `${SERVICE}/SendHeartBeatPackage`;
const PATH_REMOVE = `${SERVICE}/Remove`;

/** ThumbnailTaskType -- what the render is for. */
export const ThumbnailTaskType = { kFootageCover: 0, kSingleTask: 1, kQuickSeekTask: 2 };

/** ThumbnailRenderType -- how the frame is projected. */
export const ThumbnailRenderType = { kPlane: 0, kPlaneSphere: 1, kSphere: 2, kDewarp: 3, kStereo: 4 };

const list = (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);

/** SourceGroup { repeated string sourceFile = 1; } */
export function buildSourceGroup(files) {
  const names = Array.isArray(files) ? files : files ? [files] : [];
  return Buffer.concat(names.map((f) => fieldString(1, f)));
}

/**
 * ThumbnailRequest. Pass the media as `files` (wrapped into a SourceGroup) or as
 * an already built `sourceGroup` buffer.
 */
export function buildThumbnailRequest({
  id,
  files,
  sourceFile,
  sourceGroup,
  width,
  height,
  frameIndex,
  renderType,
  taskType,
  onlyUseKeyframe,
  taskPriority,
  clipId,
  frameTimeMs,
  isCloud,
  mediaId,
  cloudMediaInfoJson,
  thumbalPath,
  isPanoExport,
  isPanoMedia,
  exportType,
  aspectRatio,
} = {}) {
  const parts = [];
  if (id !== undefined) parts.push(fieldInt(1, id));
  const group = sourceGroup ?? (files || sourceFile ? buildSourceGroup(files ?? sourceFile) : null);
  if (group) parts.push(fieldBytes(2, group));
  if (width !== undefined) parts.push(fieldInt(3, width));
  if (height !== undefined) parts.push(fieldInt(4, height));
  if (frameIndex !== undefined) parts.push(fieldInt(5, frameIndex));
  if (renderType !== undefined) parts.push(fieldInt(6, renderType));
  if (taskType !== undefined) parts.push(fieldInt(7, taskType));
  if (onlyUseKeyframe !== undefined) parts.push(fieldBool(8, onlyUseKeyframe));
  if (taskPriority !== undefined) parts.push(fieldInt(9, taskPriority));
  if (clipId !== undefined) parts.push(fieldInt(10, clipId));
  if (frameTimeMs !== undefined) parts.push(fieldInt(11, frameTimeMs));
  if (isCloud !== undefined) parts.push(fieldBool(12, isCloud));
  if (mediaId !== undefined) parts.push(fieldString(13, mediaId));
  if (cloudMediaInfoJson !== undefined) parts.push(fieldString(14, cloudMediaInfoJson));
  if (thumbalPath !== undefined) parts.push(fieldString(15, thumbalPath));
  if (isPanoExport !== undefined) parts.push(fieldBool(16, isPanoExport));
  if (isPanoMedia !== undefined) parts.push(fieldBool(17, isPanoMedia));
  if (exportType !== undefined) parts.push(fieldInt(18, exportType));
  if (aspectRatio !== undefined) parts.push(fieldInt(19, aspectRatio));
  return Buffer.concat(parts);
}

/** ThumbnailInfo { 1 thumbnailPath, 2 frameIndex, 3 timeStampMs } */
export function decodeThumbnailInfo(buf) {
  const d = decodeMessage(buf);
  return {
    thumbnailPath: asString(d[1]),
    frameIndex: asNumber(d[2], 0),
    timeStampMs: asNumber(d[3], 0),
  };
}

export function decodeThumbnailReply(buf) {
  const d = decodeMessage(buf);
  return {
    id: asNumber(d[1], 0),
    thumbnails: list(d[2]).map(decodeThumbnailInfo),
    errCode: asNumber(d[3], -1),
    errInfo: asString(d[4]),
    raw: buf.toString("hex"),
  };
}

/** SceneDetectRequest { 1 source_group_name, 2 source_group } */
export function buildSceneDetectRequest({ sourceGroupName, files, sourceGroup } = {}) {
  const parts = [];
  if (sourceGroupName !== undefined) parts.push(fieldString(1, sourceGroupName));
  const group = sourceGroup ?? (files ? buildSourceGroup(files) : null);
  if (group) parts.push(fieldBytes(2, group));
  return Buffer.concat(parts);
}

export function decodeSceneDetectReply(buf) {
  const d = decodeMessage(buf);
  return {
    sourceGroupName: asString(d[1]),
    errCode: asNumber(d[2], -1),
    raw: buf.toString("hex"),
  };
}

/** HeartBeat { 1 count, 2 exit_app } */
export function buildHeartBeat({ count = 0, exitApp = false } = {}) {
  const parts = [];
  if (count) parts.push(fieldInt(1, count));
  if (exitApp) parts.push(fieldBool(2, true));
  return Buffer.concat(parts);
}

export function decodeHeartBeat(buf) {
  const d = decodeMessage(buf);
  return { count: asNumber(d[1], 0), exitApp: Boolean(asNumber(d[2], 0)) };
}

/** Ask for a rendered thumbnail; the reply carries the paths the service wrote. */
export async function requestThumbnail({ port, timeoutMs = 180000, ...request }) {
  const payload = buildThumbnailRequest(request);
  const buf = await unaryCall({ port, path: PATH_SEND, payload, timeoutMs });
  return decodeThumbnailReply(buf);
}

/** Ask the service to analyse a source's scene changes. */
export async function sendSceneDetect({ port, timeoutMs = 300000, ...request }) {
  const payload = buildSceneDetectRequest(request);
  const buf = await unaryCall({ port, path: PATH_SCENE_DETECT, payload, timeoutMs });
  return decodeSceneDetectReply(buf);
}

export async function thumbnailHeartbeat({ port, count = 1, exitApp = false, timeoutMs = 10000 } = {}) {
  const payload = buildHeartBeat({ count, exitApp });
  const buf = await unaryCall({ port, path: PATH_HEARTBEAT, payload, timeoutMs });
  return { ...decodeHeartBeat(buf), bytes: buf.length };
}

/** Drop cached entries for the listed files (the service expects a SourceGroup). */
export async function removeThumbnail({ port, files, sourceGroup, timeoutMs = 30000 } = {}) {
  const payload = sourceGroup ?? buildSourceGroup(files);
  const buf = await unaryCall({ port, path: PATH_REMOVE, payload, timeoutMs });
  const d = decodeMessage(buf);
  return { files: list(d[1]).map((v) => asString(v)), bytes: buf.length };
}

export function requireThumbnailPort() {
  const found = discoverThumbnail();
  if (!found) {
    throw new Error(
      "Insta360 Studio thumbnail service not found. Start Insta360 Studio so studio-thumbnail-service.exe is running.",
    );
  }
  return found.port;
}
