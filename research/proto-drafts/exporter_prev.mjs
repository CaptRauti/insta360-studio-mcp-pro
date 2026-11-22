// High-level operations against the Studio exporter service.
//
// Field numbers below are taken verbatim from the FileDescriptorProto for
// "ExportModule.proto" (package service.Export) embedded in studio_worker.dll.
// The unit tests in tests/ round-trip these builders through decodeMessage so a
// field renumbering cannot pass silently.
//
// Live-verified service paths:
//   /service.Export2.Export2/StartExporting
//   /service.Export2.Export2/ExporterCancel
//   /service.Export2.Export2/SendHeartBeatPackage

import {
  asNumber,
  asString,
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

// ExportReply.err_code values observed from the live service.
export const STATUS = {
  0: "OK",
  2: "EXPORTER_START_FAILURE",
  1026: "NO_SOURCE_FILE",
};

// EncodeType enum from the binary descriptor.
export const ENCODE_TYPE = {
  kH264: 0,
  kH265: 1,
  kProres422: 2,
  kProres422LT: 3,
};

// SourceFileType enum.
export const SOURCE_FILE_TYPE = {
  kPhoto: 0,
  kVideo: 1,
  kEmptyVideo: 2,
};

// StabilizationType enum.
export const STABILIZATION_TYPE = {
  kFlowState: 0,
  kFPV: 1,
};

// InterpolationType enum.
export const INTERPOLATION_TYPE = {
  kOpticalFlowFrame: 0,
  kRepeatFrame: 1,
  kDefault: 2,
};

// ImageProcessingAccel enum.
export const IMAGE_PROCESSING_ACCEL = {
  kAuto: 0,
  kCPU: 1,
};

// ---------------------------------------------------------------------------
// Message builders — field numbers from the recovered descriptor
// ---------------------------------------------------------------------------

/** SourceGroup: repeated sourceFile = 1, repeated fileName = 2, ... */
export function buildSourceGroup({
  files = [],
  fileNames = [],
  groupIdentifier,
  groupName,
  groupStartIndex = 0,
  sourceGroupType = 0,
  isDngGroup = false,
  associatedFiles = [],
  panoFpvDataPath,
  stillQuatFilePath,
  immersionQuatFilePath,
} = {}) {
  const parts = [];
  for (const f of files) parts.push(fieldString(1, f));
  for (const f of fileNames) parts.push(fieldString(2, f));
  if (isDngGroup) parts.push(fieldBool(3, true));
  if (sourceGroupType) parts.push(fieldInt(4, sourceGroupType));
  if (groupIdentifier) parts.push(fieldString(5, groupIdentifier));
  if (groupName) parts.push(fieldString(6, groupName));
  if (groupStartIndex) parts.push(fieldInt(7, groupStartIndex));
  for (const f of associatedFiles) parts.push(fieldString(9, f));
  if (panoFpvDataPath) parts.push(fieldString(10, panoFpvDataPath));
  if (stillQuatFilePath) parts.push(fieldString(11, stillQuatFilePath));
  if (immersionQuatFilePath) parts.push(fieldString(12, immersionQuatFilePath));
  return Buffer.concat(parts);
}

/** TimelineSetting: trim_start=1, trim_end=2, duration_ms=6, ... */
export function buildTimelineSetting({
  trimStart,
  trimEnd,
  durationMs,
  mediaTrimStart,
  mediaTrimEnd,
  audioFadeIn,
  audioFadeOut,
} = {}) {
  const parts = [];
  if (trimStart !== undefined) parts.push(fieldDouble(1, trimStart));
  if (trimEnd !== undefined) parts.push(fieldDouble(2, trimEnd));
  if (durationMs !== undefined) parts.push(fieldDouble(6, durationMs));
  if (mediaTrimStart !== undefined) parts.push(fieldDouble(8, mediaTrimStart));
  if (mediaTrimEnd !== undefined) parts.push(fieldDouble(7, mediaTrimEnd));
  if (audioFadeIn !== undefined) parts.push(fieldDouble(9, audioFadeIn));
  if (audioFadeOut !== undefined) parts.push(fieldDouble(10, audioFadeOut));
  return Buffer.concat(parts);
}

/**
 * StitchingSetting — 64 fields. The booleans most users care about are
 * enableStab (1), enableDirectionalLock (2), enableDynamicStitching (3),
 * enableOpticalFlowStitching (4), enableImageFusion (5), enableColorPlus (6),
 * enableUnderWaterCorrection (7), enableLocalToneMap (8), enableMotionBlur (9),
 * enableRemoveGrain (15), enable_ai_stitching (37), enable_lut (41),
 * enable_deghost (46), enable_pano_fpv (47), enable_immersive_stab (50),
 * enable_head_track (54), enable_camera_movement (55), enable_beauty_mode (57).
 */
export function buildStitchingSetting({
  enableStab = false,
  enableDirectionalLock = false,
  enableDynamicStitching = false,
  enableOpticalFlowStitching = false,
  enableImageFusion = false,
  enableColorPlus = false,
  enableUnderWaterCorrection = false,
  enableLocalToneMap = false,
  enableMotionBlur = false,
  enableAudioDirectFocus = false,
  enableDroneFlag = false,
  enableTopMountedGyro = false,
  enableColdShoe = false,
  enableLogo = false,
  enableRemoveGrain = false,
  customBlendAngle,
  optimizedOffset,
  colorPlusStrength,
  ltmStrength,
  underWaterBalance,
  underWaterStrength,
  motionBlurStrength,
  motionBlurThreshold,
  stabilizationType,
  shellType,
  fovType,
  queryFovType,
  audioDenoiseType,
  userRotateDegree,
  projectionLayout,
  dewarpType,
  stabilizationLevel,
  starTailType,
  enableAiStitching = false,
  enableCoolingShell = false,
  enableHorizontalCorrect = false,
  horizontalCorrectAngle,
  enableLut = false,
  supportLut = false,
  enableTimeLogo = false,
  timeLogoFormat,
  timeLogoTransparency,
  enableDeghost = false,
  enablePanoFpv = false,
  panoFpvHorizontalOn = false,
  underWaterFilterIndex,
  enableImmersiveStab = false,
  deVersion,
  stabInputDataType,
  viewDirection,
  enableHeadTrack = false,
  enableCameraMovement = false,
  propellerGuardStatus,
  enableBeautyMode = false,
  hasHeadTrackKeyframe = false,
  enableFlatLogo = false,
  externFilterResourcePath,
  externFilterOpacity,
  enableMainWindow = false,
  viewCategoryFilter,
} = {}) {
  const bools = [
    [1, enableStab],
    [2, enableDirectionalLock],
    [3, enableDynamicStitching],
    [4, enableOpticalFlowStitching],
    [5, enableImageFusion],
    [6, enableColorPlus],
    [7, enableUnderWaterCorrection],
    [8, enableLocalToneMap],
    [9, enableMotionBlur],
    [10, enableAudioDirectFocus],
    [11, enableDroneFlag],
    [12, enableTopMountedGyro],
    [13, enableColdShoe],
    [14, enableLogo],
    [15, enableRemoveGrain],
    [37, enableAiStitching],
    [38, enableCoolingShell],
    [39, enableHorizontalCorrect],
    [41, enableLut],
    [42, supportLut],
    [43, enableTimeLogo],
    [46, enableDeghost],
    [47, enablePanoFpv],
    [48, panoFpvHorizontalOn],
    [50, enableImmersiveStab],
    [54, enableHeadTrack],
    [55, enableCameraMovement],
    [57, enableBeautyMode],
    [58, hasHeadTrackKeyframe],
    [59, enableFlatLogo],
    [63, enableMainWindow],
  ];
  const parts = [];
  for (const [n, v] of bools) if (v) parts.push(fieldBool(n, true));

  const floats = [
    [16, customBlendAngle],
    [40, horizontalCorrectAngle],
    [62, externFilterOpacity],
  ];
  for (const [n, v] of floats) if (v !== undefined) parts.push(fieldFloat(n, v));

  const ints = [
    [18, colorPlusStrength],
    [19, ltmStrength],
    [20, underWaterBalance],
    [21, underWaterStrength],
    [22, motionBlurStrength],
    [23, motionBlurThreshold],
    [25, shellType],
    [26, fovType],
    [27, queryFovType],
    [28, audioDenoiseType],
    [29, userRotateDegree],
    [32, projectionLayout],
    [35, stabilizationLevel],
    [36, starTailType],
    [44, timeLogoFormat],
    [45, timeLogoTransparency],
    [49, underWaterFilterIndex],
    [52, stabInputDataType],
    [53, viewDirection],
    [56, propellerGuardStatus],
    [64, viewCategoryFilter],
  ];
  for (const [n, v] of ints) if (v !== undefined) parts.push(fieldInt(n, v));

  const enums = [
    [24, stabilizationType],
    [34, dewarpType],
  ];
  for (const [n, v] of enums) if (v !== undefined) parts.push(fieldInt(n, v));

  const strings = [
    [17, optimizedOffset],
    [51, deVersion],
    [61, externFilterResourcePath],
  ];
  for (const [n, v] of strings) if (v) parts.push(fieldString(n, v));

  return Buffer.concat(parts);
}

/** UserSettings: is_free_capture=1, audio_volume=11, interpolation_type=12, ... */
export function buildUserSettings({
  isFreeCapture = false,
  removeGrainEnabled = false,
  removeGrainBlockEnabled = false,
  enableDashboard = false,
  noiseLevel,
  isSilent = false,
  aiRawEnable = false,
  audioVolume,
  interpolationType,
  dolbyVisionEnabled = false,
  enableAudioMixing = false,
  audioMixingWeight,
  audioTracksDelay,
  audioTrasksDefaultDelay,
  showDashboardRealDistance = false,
} = {}) {
  const parts = [];
  if (isFreeCapture) parts.push(fieldBool(1, true));
  if (removeGrainEnabled) parts.push(fieldBool(3, true));
  if (removeGrainBlockEnabled) parts.push(fieldBool(4, true));
  if (enableDashboard) parts.push(fieldBool(5, true));
  if (noiseLevel !== undefined) parts.push(fieldFloat(6, noiseLevel));
  if (isSilent) parts.push(fieldBool(8, true));
  if (aiRawEnable) parts.push(fieldBool(9, true));
  if (audioVolume !== undefined) parts.push(fieldFloat(11, audioVolume));
  if (interpolationType !== undefined) parts.push(fieldInt(12, interpolationType));
  if (dolbyVisionEnabled) parts.push(fieldBool(13, true));
  if (enableAudioMixing) parts.push(fieldBool(14, true));
  if (audioMixingWeight !== undefined) parts.push(fieldDouble(15, audioMixingWeight));
  if (audioTracksDelay !== undefined) parts.push(fieldInt(16, audioTracksDelay));
  if (audioTrasksDefaultDelay !== undefined) parts.push(fieldInt(17, audioTrasksDefaultDelay));
  if (showDashboardRealDistance) parts.push(fieldBool(19, true));
  return Buffer.concat(parts);
}

/** ImageExportParam: view_mode=1, interval_merge_stab_type=2, duration=3, ... */
export function buildImageExportParam({
  viewMode,
  intervalMergeStabType,
  duration,
  startInSecond,
  videoClipId,
  quaternions = [],
} = {}) {
  const parts = [];
  if (viewMode !== undefined) parts.push(fieldInt(1, viewMode));
  if (intervalMergeStabType !== undefined) parts.push(fieldInt(2, intervalMergeStabType));
  if (duration !== undefined) parts.push(fieldDouble(3, duration));
  if (startInSecond !== undefined) parts.push(fieldDouble(4, startInSecond));
  if (videoClipId !== undefined) parts.push(fieldInt(5, videoClipId));
  for (const q of quaternions) parts.push(fieldBytes(6, q));
  return Buffer.concat(parts);
}

/** ClipInfo: sourceGroup=1, timelineSetting=2, stitchingSetting=3, ... */
export function buildClipInfo({
  sourceGroup,
  timelineSetting,
  stitchingSetting,
  userSettings,
  imageExportParam,
  fileType,
  sourceFileName,
  videoInfoJson,
  mediaInfoJson,
  isPanoSource = false,
  isRoughTrimmed = false,
  timeCode,
  dashboardId,
  gpsInfo,
  cutSceneSetting,
  colorAdjustSetting,
  timeWaterMark,
  clipModelUrl,
  isCloudFootage = false,
  fileTailUrl,
  cloudPreviewUrl,
  additionInfo,
  bigboomObject,
  dashBoardSetting,
  audioSettings,
  loopVideoSegmentDurationsMs = [],
} = {}) {
  const parts = [];
  if (sourceGroup) parts.push(fieldBytes(1, sourceGroup));
  if (timelineSetting) parts.push(fieldBytes(2, timelineSetting));
  if (stitchingSetting) parts.push(fieldBytes(3, stitchingSetting));
  if (dashBoardSetting) parts.push(fieldBytes(4, dashBoardSetting));
  if (audioSettings) parts.push(fieldBytes(5, audioSettings));
  if (userSettings) parts.push(fieldBytes(6, userSettings));
  if (imageExportParam) parts.push(fieldBytes(7, imageExportParam));
  if (fileType !== undefined) parts.push(fieldInt(8, fileType));
  if (bigboomObject) parts.push(fieldBytes(9, bigboomObject));
  if (gpsInfo) parts.push(fieldBytes(10, gpsInfo));
  if (cutSceneSetting) parts.push(fieldBytes(11, cutSceneSetting));
  if (isCloudFootage) parts.push(fieldBool(12, true));
  if (fileTailUrl) parts.push(fieldString(13, fileTailUrl));
  if (videoInfoJson) parts.push(fieldString(14, videoInfoJson));
  if (cloudPreviewUrl) parts.push(fieldString(15, cloudPreviewUrl));
  if (sourceFileName) parts.push(fieldString(16, sourceFileName));
  if (additionInfo) parts.push(fieldBytes(17, additionInfo));
  if (clipModelUrl) parts.push(fieldString(18, clipModelUrl));
  if (isPanoSource) parts.push(fieldBool(19, true));
  if (colorAdjustSetting) parts.push(fieldBytes(20, colorAdjustSetting));
  if (timeWaterMark) parts.push(fieldBytes(21, timeWaterMark));
  if (isRoughTrimmed) parts.push(fieldBool(22, true));
  if (timeCode) parts.push(fieldString(23, timeCode));
  if (dashboardId) parts.push(fieldString(24, dashboardId));
  for (const d of loopVideoSegmentDurationsMs) parts.push(fieldInt(25, d));
  if (mediaInfoJson) parts.push(fieldString(26, mediaInfoJson));
  return Buffer.concat(parts);
}

/** ExportClipInfo: clipInfos=1, bgm_clip=2, text_clips=3, sticker_clips=4 */
export function buildExportClipInfo({
  clipInfos = [],
  bgmClips = [],
  textClips = [],
  stickerClips = [],
} = {}) {
  const parts = [];
  for (const c of clipInfos) parts.push(fieldBytes(1, c));
  for (const c of bgmClips) parts.push(fieldBytes(2, c));
  for (const c of textClips) parts.push(fieldBytes(3, c));
  for (const c of stickerClips) parts.push(fieldBytes(4, c));
  return Buffer.concat(parts);
}

/**
 * ExportParam: path=1, dest_dir=2, export_type=3, encode_type=6,
 * encode_bitrate=7, is_spherical=11, project_id=19, clip_count=26, ...
 */
export function buildExportParam({
  path,
  destDir,
  exportType,
  res,
  frameRate,
  encodeType,
  encodeBitrate,
  metaDataMake,
  metaDataModel,
  metaDataComment,
  isSpherical = false,
  requestFromMultipleClip = false,
  enableVideoDenoise = false,
  hasAudio = false,
  supportAudio = false,
  imageProcessingAccel,
  hardwareInfo,
  proxyType,
  projectId,
  enableDolbyVision = false,
  isExportPano = false,
  isCloudMedia = false,
  starTrailLengthType,
  enableDeflicker = false,
  uploadPlatformId,
  clipCount,
  enableApmp = false,
  reportApmpVisable = false,
  isScreenshotExport = false,
  screenshotTargetTimeMs,
  colorSetting,
  enableAiStitching3_0 = false,
} = {}) {
  const parts = [];
  if (path) parts.push(fieldString(1, path));
  if (destDir) parts.push(fieldString(2, destDir));
  if (exportType !== undefined) parts.push(fieldInt(3, exportType));
  if (res) parts.push(fieldBytes(4, res));
  if (frameRate) parts.push(fieldBytes(5, frameRate));
  if (encodeType !== undefined) parts.push(fieldInt(6, encodeType));
  if (encodeBitrate !== undefined) parts.push(fieldInt(7, encodeBitrate));
  if (metaDataMake) parts.push(fieldString(8, metaDataMake));
  if (metaDataModel) parts.push(fieldString(9, metaDataModel));
  if (metaDataComment) parts.push(fieldString(10, metaDataComment));
  if (isSpherical) parts.push(fieldBool(11, true));
  if (requestFromMultipleClip) parts.push(fieldBool(12, true));
  if (enableVideoDenoise) parts.push(fieldBool(13, true));
  if (hasAudio) parts.push(fieldBool(14, true));
  if (supportAudio) parts.push(fieldBool(15, true));
  if (imageProcessingAccel !== undefined) parts.push(fieldInt(16, imageProcessingAccel));
  if (hardwareInfo) parts.push(fieldBytes(17, hardwareInfo));
  if (proxyType) parts.push(fieldString(18, proxyType));
  if (projectId) parts.push(fieldString(19, projectId));
  if (enableDolbyVision) parts.push(fieldBool(20, true));
  if (isExportPano) parts.push(fieldBool(21, true));
  if (isCloudMedia) parts.push(fieldBool(22, true));
  if (starTrailLengthType !== undefined) parts.push(fieldInt(23, starTrailLengthType));
  if (enableDeflicker) parts.push(fieldBool(24, true));
  if (uploadPlatformId) parts.push(fieldString(25, uploadPlatformId));
  if (clipCount !== undefined) parts.push(fieldInt(26, clipCount));
  if (enableApmp) parts.push(fieldBool(27, true));
  if (reportApmpVisable) parts.push(fieldBool(28, true));
  if (isScreenshotExport) parts.push(fieldBool(29, true));
  if (screenshotTargetTimeMs !== undefined) parts.push(fieldDouble(30, screenshotTargetTimeMs));
  if (colorSetting !== undefined) parts.push(fieldInt(31, colorSetting));
  if (enableAiStitching3_0) parts.push(fieldBool(32, true));
  return Buffer.concat(parts);
}

/** ExportRequest: uuid=1, exportInfo=2, exportParam=3, jsonSetting=4, ... */
export function buildExportRequest({
  uuid,
  exportInfo,
  exportParam,
  jsonSetting,
  uiParam,
  markTrim = false,
  groupUuid,
  baseViewCount,
} = {}) {
  const parts = [];
  if (uuid) parts.push(fieldString(1, uuid));
  if (exportInfo) parts.push(fieldBytes(2, exportInfo));
  if (exportParam) parts.push(fieldBytes(3, exportParam));
  if (jsonSetting) parts.push(fieldString(4, jsonSetting));
  if (uiParam) parts.push(fieldBytes(5, uiParam));
  if (markTrim) parts.push(fieldBool(6, true));
  if (groupUuid) parts.push(fieldString(7, groupUuid));
  if (baseViewCount !== undefined) parts.push(fieldInt(8, baseViewCount));
  return Buffer.concat(parts);
}

// ---------------------------------------------------------------------------
// Reply decoding
// ---------------------------------------------------------------------------

/**
 * Decode an ExportReply from the recovered descriptor:
 *   1 uuid(string), 2 export_progress(float), 3 state_code(int),
 *   4 err_code(int), 5 err_info(string), 6 log_path(string), 7 reply_info
 */
export function decodeExportReply(buf) {
  const d = decodeMessage(buf);
  const errCode = asNumber(d[4], -1);
  const stateCode = asNumber(d[3], -1);
  return {
    uuid: asString(d[1]),
    progress: asNumber(d[2], 0),
    stateCode,
    errCode,
    errName: STATUS[errCode] ?? "UNKNOWN",
    errInfo: asString(d[5]),
    logPath: asString(d[6]),
    replyInfo: d[7] ? decodeMessage(d[7]) : null,
    raw: buf.toString("hex"),
  };
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

/**
 * Start an export. Returns the decoded reply. A non-zero err_code in the reply
 * is reported as data (not thrown) because Studio answers with a structured
 * error rather than a gRPC failure in most cases.
 */
export async function startExporting({ port, request, timeoutMs = 240000 }) {
  const buf = await unaryCall({ port, path: PATH_START, payload: request, timeoutMs });
  return decodeExportReply(buf);
}

export async function cancelExport({ port, uuid, timeoutMs = 30000 }) {
  const payload = fieldString(1, uuid);
  const buf = await unaryCall({ port, path: PATH_CANCEL, payload, timeoutMs });
  return decodeMessage(buf);
}

export async function heartbeat({ port, count = 1, exitApp = false, timeoutMs = 10000 }) {
  const parts = [];
  if (count !== undefined) parts.push(fieldInt(1, count));
  if (exitApp) parts.push(fieldBool(2, true));
  const buf = await unaryCall({ port, path: PATH_HEARTBEAT, payload: Buffer.concat(parts), timeoutMs });
  return decodeMessage(buf);
}

/** Resolve the exporter port, or throw a clear error. */
export function requireExporterPort() {
  const found = discoverExporter();
  if (!found) {
    throw new Error(
      "Insta360 Studio exporter service not found. Start Insta360 Studio and open a project so studio-exporter-service.exe is running.",
    );
  }
  return found.port;
}
