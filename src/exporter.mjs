// High-level operations against the Studio exporter service.
//
// Every field number below comes verbatim from the FileDescriptorProto blobs
// embedded in studio_worker.dll:
//
//   ExportModule2.proto @113528384  (len 685)  -> service Export2 + reply msgs
//   ExportParams.proto   @113629472  (len 4272) -> ExportParams request tree
//
// Live-verified service paths:
//   /service.Export2.Export2/StartExporting
//   /service.Export2.Export2/ExporterCancel
//   /service.Export2.Export2/SendHeartBeatPackage
//
// Request shape (verified):
//   ExportParams {
//     exportHeader     = 1  ExportHeader   (taskId, exportName, savePath, ...)
//     mainParams       = 2  CloudExportData  (cloud path; not needed locally)
//     localExtraParams = 3  LocalExtraParams
//   }
//   LocalExtraParams {
//     exportType        = 1  ExportType enum
//     videoExportParam  = 2  repeated LocalVideoExportParam
//     imageExportParam  = 3  LocalImageExportParam
//     videoFxZOrder     = 4  repeated LocalVideoFxZOrder
//   }
//   LocalImageExportParam {
//     starTrailType = 1, sourceGroup = 2, view_mode = 3, stitching = 5, ...
//   }
//   SourceGroup { sourceFile = 1 repeated string, source_group_type = 2, ... }
//
// The unit tests in tests/ round-trip these builders through decodeMessage so a
// field renumbering cannot pass silently.

import {
  decodeMessage,
  discoverExporter,
  fieldBool,
  fieldBytes,
  fieldDouble,
  fieldFloat,
  fieldInt,
  fieldString,
  unaryCall,
} from "./grpc-client.mjs";

const PATH_START = "/service.Export2.Export2/StartExporting";
const PATH_CANCEL = "/service.Export2.Export2/ExporterCancel";
const PATH_HEARTBEAT = "/service.Export2.Export2/SendHeartBeatPackage";

// ---------------------------------------------------------------- enums ----

/** ExportType — from ExportParams.proto. */
export const EXPORT_TYPE = {
  PHOTO: 0,
  DNG_TO_DNG: 1,
  DNG_TO_JPG: 2,
  DNG_WITH_JPG: 3,
  NO_EXTRA_INFO_DNG_EXPORT: 4,
  JPG_SEQUENCE: 5,
  DNG_SEQUENCE_DNG: 6,
  DNG_SEQUENCE_JPG: 7,
  DNG_SEQUENCE_DNG_WITH_JPG: 8,
  VIDEO: 9,
  VIDEO_CLIP: 10,
  DEMUX_TO_JPEG: 11,
  SEQUENCE: 12,
  MUX_TO_VIDEO: 13,
  MUX_TO_PURESHOT_VIDEO: 14,
  MERGED_MIX: 15,
  MERGED_ONLY: 16,
  DNG_MERGED_JPG: 17,
  DNG_MERGED_DNG: 18,
  DNG_MERGED_EXR: 19,
  JPG_MERGED: 20,
  JPG_MERGED_GROUP: 21,
  DNG_MERGED_GROUP: 22,
  DNG_MERGED_GROUP_DNG: 23,
  SOURCE_CLIP: 24,
  PANO_PIC_ANIMATION: 25,
  PANO_PIC_ANIMATION_PRESET: 26,
  STAR_TRAIL_VIDEO: 27,
  STAR_TRAIL_PHOTO: 28,
  VIDEO_TO_JPEG_SEQUENCE: 29,
  PROJECT_COVER_PHOTO: 30,
  PANO_VIDEO: 31,
  INVALID_EXPORT_TYPE: 32,
  PLACE_HOLDER_TYPE: 33,
};

/** StitchType — LocalVideoExportParam.stitch_type (field 10). */
export const STITCH_TYPE = {
  TEMPLATE: 0,
  DYNAMIC: 1,
  OPTICAL: 2,
  AI: 3,
};

/** StabilizationType — LocalVideoExportParam.stab_type (field 16). */
export const STABILIZATION_TYPE = {
  NONE: 0,
  FLOWSTATE: 1,
  FPV: 2,
};

/** StarTrailType — LocalImageExportParam.starTrailType (field 1). */
export const STAR_TRAIL_TYPE = {
  NONE: 0,
  CIRCLE: 1,
  LINE: 2,
};

/** ExportReply.state_code / err_code names observed live. */
export const STATE = {
  0: "OK",
  1: "RUNNING",
  2: "FAILED",
  3: "CANCELLED",
  4: "DONE",
};

/** Error codes seen from the live service. */
export const ERR = {
  0: "OK",
  2: "EXPORTER_START_FAILURE",
  1026: "NO_SOURCE_FILE",
};

// ------------------------------------------------------- message builders ---

/** SourceGroup — sourceFile is REPEATED (field 1). */
export function buildSourceGroup({
  sourceFiles = [],
  sourceGroupType = 0,
  groupIdentifier = "",
  groupStartIndex = 0,
  destFileNames = [],
} = {}) {
  const parts = [];
  for (const f of sourceFiles) parts.push(fieldString(1, f));
  if (sourceGroupType) parts.push(fieldInt(2, sourceGroupType));
  if (groupIdentifier) parts.push(fieldString(3, groupIdentifier));
  if (groupStartIndex) parts.push(fieldInt(4, groupStartIndex));
  for (const d of destFileNames) parts.push(fieldString(5, d));
  return Buffer.concat(parts);
}

/** ExportHeader — taskId=1, exportName=2, savePath=3, ... */
export function buildExportHeader({
  taskId,
  exportName = "",
  savePath = "",
  protoMd5 = "",
  protoName = "",
  videoDuration = 0,
  framerate = "",
  bitrate = "",
  width = 0,
  height = 0,
  extraDataReqList = [],
  materialList = [],
} = {}) {
  const parts = [];
  if (taskId) parts.push(fieldString(1, taskId));
  if (exportName) parts.push(fieldString(2, exportName));
  if (savePath) parts.push(fieldString(3, savePath));
  if (protoMd5) parts.push(fieldString(4, protoMd5));
  if (protoName) parts.push(fieldString(5, protoName));
  if (videoDuration) parts.push(fieldInt(6, videoDuration));
  if (framerate) parts.push(fieldString(7, framerate));
  if (bitrate) parts.push(fieldString(8, bitrate));
  if (width) parts.push(fieldInt(9, width));
  if (height) parts.push(fieldInt(10, height));
  for (const item of extraDataReqList) {
    parts.push(fieldBytes(11, buildExtraDataReqItem(item)));
  }
  for (const item of materialList) {
    parts.push(fieldBytes(12, buildMaterialItem(item)));
  }
  return Buffer.concat(parts);
}

/**
 * ExtraDataReqItem — extraType=1, valueType=2, value=3, fileName=4,
 * businessSource=5, source=6, transitionType=7, localFilePath=8.
 * This is where auxiliary inputs (LUTs, dashboard data, GPX tracks) are named.
 */
export function buildExtraDataReqItem({
  extraType = "",
  valueType = "",
  value = "",
  fileName = "",
  businessSource = "",
  source = "",
  transitionType = "",
  localFilePath = "",
} = {}) {
  const parts = [];
  if (extraType) parts.push(fieldString(1, extraType));
  if (valueType) parts.push(fieldString(2, valueType));
  if (value) parts.push(fieldString(3, value));
  if (fileName) parts.push(fieldString(4, fileName));
  if (businessSource) parts.push(fieldString(5, businessSource));
  if (source) parts.push(fieldString(6, source));
  if (transitionType) parts.push(fieldString(7, transitionType));
  if (localFilePath) parts.push(fieldString(8, localFilePath));
  return Buffer.concat(parts);
}

/**
 * MaterialItem — index=1, type=2, value=3.
 *
 * ExportParams carries no media path anywhere else: LocalVideoExportParam has
 * only a clipIndex, and CloudExportData is the project model. So this list is
 * the one place a source file can be named, which is what the service needs to
 * find the footage it is asked to export.
 */
export function buildMaterialItem({ index = 0, type = "", value = "" } = {}) {
  const parts = [];
  if (index) parts.push(fieldInt(1, index));
  if (type) parts.push(fieldString(2, type));
  if (value) parts.push(fieldString(3, value));
  return Buffer.concat(parts);
}

/** StitchingSetting — stabilization_level=1 ... enableimagefusion=4 ... */
export function buildStitchingSetting({
  stabilizationLevel = 0,
  shellType = 0,
  optimizedOffset = "",
  enableImageFusion = false,
  enableAiStitching = false,
  enableDynamicStitching = false,
  enableOpticalFlowStitching = false,
} = {}) {
  const parts = [];
  if (stabilizationLevel) parts.push(fieldInt(1, stabilizationLevel));
  if (shellType) parts.push(fieldInt(2, shellType));
  if (optimizedOffset) parts.push(fieldString(3, optimizedOffset));
  if (enableImageFusion) parts.push(fieldBool(4, true));
  if (enableAiStitching) parts.push(fieldBool(5, true));
  if (enableDynamicStitching) parts.push(fieldBool(6, true));
  if (enableOpticalFlowStitching) parts.push(fieldBool(7, true));
  return Buffer.concat(parts);
}

/** Quaternion — w=1, x=2, y=3, z=4. */
export function buildQuaternion({ w = 1, x = 0, y = 0, z = 0 } = {}) {
  return Buffer.concat([fieldFloat(1, w), fieldFloat(2, x), fieldFloat(3, y), fieldFloat(4, z)]);
}

/** DashboardExtraFrame — timestampMs=1, horizontalSpeed=2, aboveGroundHeight=3. */
export function buildDashboardExtraFrame({ timestampMs = 0, horizontalSpeed = 0, aboveGroundHeight = 0 } = {}) {
  return Buffer.concat([
    fieldDouble(1, timestampMs),
    fieldDouble(2, horizontalSpeed),
    fieldDouble(3, aboveGroundHeight),
  ]);
}

/** DashboardExtra — repeated frames=1, accelerationMin=2, ... */
export function buildDashboardExtra({ frames = [], accelerationMin = 0, verticalSpeedMin = 0, horizontalSpeedMax = 0, horizontalSpeedMin = 0, aboveGroundHeightMax = 0 } = {}) {
  const parts = [];
  for (const f of frames) parts.push(fieldBytes(1, f));
  if (accelerationMin) parts.push(fieldDouble(2, accelerationMin));
  if (verticalSpeedMin) parts.push(fieldDouble(3, verticalSpeedMin));
  if (horizontalSpeedMax) parts.push(fieldDouble(4, horizontalSpeedMax));
  if (horizontalSpeedMin) parts.push(fieldDouble(5, horizontalSpeedMin));
  if (aboveGroundHeightMax) parts.push(fieldDouble(6, aboveGroundHeightMax));
  return Buffer.concat(parts);
}

/** LogoInfo — logo_path=1, logo_size=2, logo_location=3, ... */
export function buildLogoInfo({ logoPath = "", logoSize = 0, logoLocation = 0, logoCornerRadius = 0, logoFeather = 0, logoRotate = 0 } = {}) {
  const parts = [];
  if (logoPath) parts.push(fieldString(1, logoPath));
  if (logoSize) parts.push(fieldFloat(2, logoSize));
  if (logoLocation) parts.push(fieldInt(3, logoLocation));
  if (logoCornerRadius) parts.push(fieldInt(4, logoCornerRadius));
  if (logoFeather) parts.push(fieldInt(5, logoFeather));
  if (logoRotate) parts.push(fieldInt(6, logoRotate));
  return Buffer.concat(parts);
}

/** FlatLogoInfo — flat_logo_path=1, flat_logo_transparency=2, ... */
export function buildFlatLogoInfo({ flatLogoPath = "", flatLogoTransparency = 0, flatLogoLocation = 0, isCn = false } = {}) {
  const parts = [];
  if (flatLogoPath) parts.push(fieldString(1, flatLogoPath));
  if (flatLogoTransparency) parts.push(fieldInt(2, flatLogoTransparency));
  if (flatLogoLocation) parts.push(fieldInt(3, flatLogoLocation));
  if (isCn) parts.push(fieldBool(4, true));
  return Buffer.concat(parts);
}

/**
 * LocalVideoExportParam — 36 fields recovered from the descriptor.
 * Field numbers: stitch_type=10, enable_image_fusion=11, enable_gpx_export=12,
 * stab_level=15, stab_type=16, enable_stab=22, ...
 */
export function buildLocalVideoExportParam({
  enableDeflicker = false,
  enableApmp = false,
  timeCode = "",
  isCloudFootage = false,
  cloudMediaInfoJson = "",
  cloudPreviewUrl = "",
  clipIndex = 0,
  loopVideoJsonContent = [],
  srcTotalDurationMs = 0,
  stitchType = 0,
  enableImageFusion = false,
  enableGpxExport = false,
  logoInfo = null,
  dewarpType = null,
  stabLevel = null,
  stabType = 0,
  enableDirectionLock = false,
  enablePanoFpv = false,
  enableImmersion = false,
  enableHeadTrack = false,
  enableCameraMove = false,
  enableStab = false,
  dashboardExtra = null,
  enableFlatLogo = false,
  flatLogoInfo = null,
  realUserRotationDegree = 0,
  propellerGuardStatus = 0,
  enableColdShoe = false,
  enableCoolingShell = false,
  cloudStillQuatPath = "",
  cloudImmersionQuatPath = "",
  screenshotTargetTimeMs = 0,
  photoGroupType = 0,
  enableBottomStitchingOptimize = false,
  accessoryType = 0,
  customBlendAngle = 0,
} = {}) {
  const parts = [];
  if (enableDeflicker) parts.push(fieldBool(1, true));
  if (enableApmp) parts.push(fieldBool(2, true));
  if (timeCode) parts.push(fieldString(3, timeCode));
  if (isCloudFootage) parts.push(fieldBool(4, true));
  if (cloudMediaInfoJson) parts.push(fieldString(5, cloudMediaInfoJson));
  if (cloudPreviewUrl) parts.push(fieldString(6, cloudPreviewUrl));
  if (clipIndex) parts.push(fieldInt(7, clipIndex));
  for (const s of loopVideoJsonContent) parts.push(fieldString(8, s));
  if (srcTotalDurationMs) parts.push(fieldDouble(9, srcTotalDurationMs));
  if (stitchType) parts.push(fieldInt(10, stitchType));
  if (enableImageFusion) parts.push(fieldBool(11, true));
  if (enableGpxExport) parts.push(fieldBool(12, true));
  if (logoInfo) parts.push(fieldBytes(13, logoInfo));
  if (dewarpType !== null) parts.push(fieldInt(14, dewarpType));
  if (stabLevel !== null) parts.push(fieldInt(15, stabLevel));
  if (stabType) parts.push(fieldInt(16, stabType));
  if (enableDirectionLock) parts.push(fieldBool(17, true));
  if (enablePanoFpv) parts.push(fieldBool(18, true));
  if (enableImmersion) parts.push(fieldBool(19, true));
  if (enableHeadTrack) parts.push(fieldBool(20, true));
  if (enableCameraMove) parts.push(fieldBool(21, true));
  if (enableStab) parts.push(fieldBool(22, true));
  if (dashboardExtra) parts.push(fieldBytes(23, dashboardExtra));
  if (enableFlatLogo) parts.push(fieldBool(24, true));
  if (flatLogoInfo) parts.push(fieldBytes(25, flatLogoInfo));
  if (realUserRotationDegree) parts.push(fieldInt(26, realUserRotationDegree));
  if (propellerGuardStatus) parts.push(fieldInt(27, propellerGuardStatus));
  if (enableColdShoe) parts.push(fieldBool(28, true));
  if (enableCoolingShell) parts.push(fieldBool(29, true));
  if (cloudStillQuatPath) parts.push(fieldString(30, cloudStillQuatPath));
  if (cloudImmersionQuatPath) parts.push(fieldString(31, cloudImmersionQuatPath));
  if (screenshotTargetTimeMs) parts.push(fieldDouble(32, screenshotTargetTimeMs));
  if (photoGroupType) parts.push(fieldInt(33, photoGroupType));
  if (enableBottomStitchingOptimize) parts.push(fieldBool(34, true));
  if (accessoryType) parts.push(fieldInt(35, accessoryType));
  if (customBlendAngle) parts.push(fieldFloat(36, customBlendAngle));
  return Buffer.concat(parts);
}

/**
 * LocalImageExportParam — starTrailType=1, sourceGroup=2, view_mode=3,
 * interval_merge_stab_type=4, stitching=5, start_in_second=6, ...
 */
export function buildLocalImageExportParam({
  starTrailType = 0,
  sourceGroup = null,
  viewMode = 0,
  intervalMergeStabType = 0,
  stitching = null,
  startInSecond = 0,
  videoClipId = 0,
  quaternions = [],
  aiRawEnable = false,
  panoAnimationTransitions = [],
} = {}) {
  const parts = [];
  if (starTrailType) parts.push(fieldInt(1, starTrailType));
  if (sourceGroup) parts.push(fieldBytes(2, sourceGroup));
  if (viewMode) parts.push(fieldInt(3, viewMode));
  if (intervalMergeStabType) parts.push(fieldInt(4, intervalMergeStabType));
  if (stitching) parts.push(fieldBytes(5, stitching));
  if (startInSecond) parts.push(fieldDouble(6, startInSecond));
  if (videoClipId) parts.push(fieldInt(7, videoClipId));
  for (const q of quaternions) parts.push(fieldBytes(8, q));
  if (aiRawEnable) parts.push(fieldBool(9, true));
  for (const t of panoAnimationTransitions) parts.push(fieldInt(10, t));
  return Buffer.concat(parts);
}

/** LocalVideoFxZOrder — positionZ=1. */
export function buildLocalVideoFxZOrder({ positionZ = 0 } = {}) {
  return positionZ ? fieldInt(1, positionZ) : Buffer.alloc(0);
}

/** LocalExtraParams — exportType=1, videoExportParam=2 rep, imageExportParam=3, videoFxZOrder=4 rep. */
export function buildLocalExtraParams({
  exportType = EXPORT_TYPE.VIDEO,
  videoExportParams = [],
  imageExportParam = null,
  videoFxZOrders = [],
} = {}) {
  const parts = [];
  if (exportType) parts.push(fieldInt(1, exportType));
  for (const v of videoExportParams) parts.push(fieldBytes(2, v));
  if (imageExportParam) parts.push(fieldBytes(3, imageExportParam));
  for (const z of videoFxZOrders) parts.push(fieldBytes(4, z));
  return Buffer.concat(parts);
}

/** ExportParams — exportHeader=1, mainParams=2, localExtraParams=3. */
export function buildExportParams({ exportHeader = null, mainParams = null, localExtraParams = null } = {}) {
  const parts = [];
  if (exportHeader) parts.push(fieldBytes(1, exportHeader));
  if (mainParams) parts.push(fieldBytes(2, mainParams));
  if (localExtraParams) parts.push(fieldBytes(3, localExtraParams));
  return Buffer.concat(parts);
}

// ------------------------------------------------------------ reply decode ---

/** Decode ExportReply: uuid=1, export_progress=2, state_code=3, err_code=4, err_info=5, log_path=6, reply_info=7. */
export function decodeExportReply(buf) {
  const m = decodeMessage(buf);
  const reply = {
    uuid: m[1] ? String(m[1]) : "",
    exportProgress: typeof m[2] === "number" ? m[2] : 0,
    stateCode: typeof m[3] === "number" ? m[3] : 0,
    errCode: typeof m[4] === "number" ? m[4] : 0,
    errInfo: m[5] ? String(m[5]) : "",
    logPath: m[6] ? String(m[6]) : "",
  };
  reply.state = STATE[reply.stateCode] ?? `STATE_${reply.stateCode}`;
  reply.err = ERR[reply.errCode] ?? `ERR_${reply.errCode}`;
  if (m[7]) {
    const ri = decodeMessage(m[7]);
    reply.replyInfo = {
      defringeRateList: Array.isArray(ri[1]) ? ri[1] : ri[1] !== undefined ? [ri[1]] : [],
      exportPerfEt: ri[2] ? String(ri[2]) : "",
      clipIndex: typeof ri[3] === "number" ? ri[3] : 0,
      thumbnailPath: ri[4] ? String(ri[4]) : "",
    };
  }
  return reply;
}

// ------------------------------------------------------------- operations ---

/** StartExporting — returns the decoded ExportReply. */
export async function startExporting({ port, params, timeoutMs = 240000 }) {
  const payload = Buffer.isBuffer(params) ? params : buildExportParams(params);
  const raw = await unaryCall({ port, path: PATH_START, payload, timeoutMs });
  return { ...decodeExportReply(raw), rawBytes: raw.length };
}

/** ExporterCancel — CancelInfo{uuid=1}. */
export async function cancelExport({ port, uuid, timeoutMs = 30000 }) {
  const payload = fieldString(1, uuid);
  const raw = await unaryCall({ port, path: PATH_CANCEL, payload, timeoutMs });
  const m = decodeMessage(raw);
  return { uuid: m[1] ? String(m[1]) : "", rawBytes: raw.length };
}

/** SendHeartBeatPackage — HeartBeat{count=1, exit_app=2}. */
export async function heartbeat({ port, count = 1, exitApp = false, timeoutMs = 10000 }) {
  const parts = [fieldInt(1, count)];
  if (exitApp) parts.push(fieldBool(2, true));
  const payload = Buffer.concat(parts);
  const raw = await unaryCall({ port, path: PATH_HEARTBEAT, payload, timeoutMs });
  const m = decodeMessage(raw);
  return { count: typeof m[1] === "number" ? m[1] : 0, exitApp: m[2] === 1, rawBytes: raw.length };
}

/** Resolve the exporter port or throw a helpful error. */
export function requireExporterPort() {
  const found = discoverExporter();
  if (!found) {
    throw new Error(
      "Insta360 Studio exporter service is not running. Start Insta360 Studio and open a project first.",
    );
  }
  return found.port;
}
