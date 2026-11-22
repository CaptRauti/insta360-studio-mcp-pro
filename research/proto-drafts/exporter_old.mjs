// High-level operations against the Studio exporter service.
//
// Every builder here mirrors the field numbers recovered from the binary's
// ExportParams.proto descriptor. The unit tests in tests/ round-trip these
// builders through decodeMessage so a field renumbering cannot pass silently.

import {
  asNumber,
  asString,
  decodeMessage,
  discoverExporter,
  fieldInt,
  fieldString,
  unaryCall,
} from "./grpc-client.mjs";

const PATH_START = "/service.Export2.Export2/StartExporting";
const PATH_CANCEL = "/service.Export2.Export2/ExporterCancel";
const PATH_HEARTBEAT = "/service.Export2.Export2/SendHeartBeatPackage";

// Status codes observed from the live service. The exporter answers with a
// protobuf reply whose field 4 carries the status and field 5 the message.
export const STATUS = {
  0: "OK",
  1026: "NO_SOURCE_FILE",
  2: "EXPORTER_START_FAILURE",
};

// ---------------------------------------------------------------------------
// Message builders
// ---------------------------------------------------------------------------

/** SourceGroup: repeated sourceFile = 1, group_identifier = 3 */
export function buildSourceGroup({ files, groupIdentifier = "mcp" }) {
  const parts = [];
  for (const f of files) parts.push(fieldString(1, f));
  if (groupIdentifier) parts.push(fieldString(3, groupIdentifier));
  return Buffer.concat(parts);
}

/** ExportHeader: task_id = 1, exportName = 2, savePath = 3 */
export function buildExportHeader({ taskId, exportName = "export", savePath }) {
  const parts = [fieldString(1, taskId)];
  if (exportName) parts.push(fieldString(2, exportName));
  if (savePath) parts.push(fieldString(3, savePath));
  return Buffer.concat(parts);
}

/**
 * LocalVideoExportParam. Field numbers are taken verbatim from the recovered
 * descriptor (ExportParams.proto, package service.Export2):
 *   1 enableDeflicker, 2 enableApmp, 3 timeCode, 4 clipIndex,
 *   5 stitchType, 6 enableImageFusion, 7 enableGpx,
 *   8 dewarpType, 9 stabType, 10 enableDirection,
 *   11 enablePanoFpv, 12 enableCameraFpv, 13 enableStab,
 *   14 enableCoolingShoe, 15 enableBottomStitch
 */
export function buildVideoExportParam({
  enableDeflicker = false,
  enableApmp = false,
  clipIndex = 0,
  stitchType = 0,
  enableImageFusion = false,
  enableGpx = false,
  dewarpType = 0,
  stabType = 0,
  enableDirection = false,
  enablePanoFpv = false,
  enableCameraFpv = false,
  enableStab = false,
  enableCoolingShoe = false,
  enableBottomStitch = false,
} = {}) {
  const parts = [];
  if (enableDeflicker) parts.push(fieldInt(1, 1));
  if (enableApmp) parts.push(fieldInt(2, 1));
  if (clipIndex) parts.push(fieldInt(4, clipIndex));
  if (stitchType) parts.push(fieldInt(5, stitchType));
  if (enableImageFusion) parts.push(fieldInt(6, 1));
  if (enableGpx) parts.push(fieldInt(7, 1));
  if (dewarpType) parts.push(fieldInt(8, dewarpType));
  if (stabType) parts.push(fieldInt(9, stabType));
  if (enableDirection) parts.push(fieldInt(10, 1));
  if (enablePanoFpv) parts.push(fieldInt(11, 1));
  if (enableCameraFpv) parts.push(fieldInt(12, 1));
  if (enableStab) parts.push(fieldInt(13, 1));
  if (enableCoolingShoe) parts.push(fieldInt(14, 1));
  if (enableBottomStitch) parts.push(fieldInt(15, 1));
  return Buffer.concat(parts);
}

/** LocalExtraParams: 1 videoExportParam, 2 imageExportParam, 3 exportType */
export function buildLocalExtraParams({ exportType = 2, videoExportParam, imageExportParam }) {
  const parts = [];
  if (videoExportParam) parts.push(fieldString(1, videoExportParam));
  if (imageExportParam) parts.push(fieldString(2, imageExportParam));
  if (exportType) parts.push(fieldInt(3, exportType));
  return Buffer.concat(parts);
}

/** ExportParams: 1 exportHeader, 2 sourceGroup, 3 localExtraParams */
export function buildExportParams({ header, sourceGroup, localExtraParams }) {
  const parts = [];
  if (header) parts.push(fieldString(1, header));
  if (sourceGroup) parts.push(fieldString(2, sourceGroup));
  if (localExtraParams) parts.push(fieldString(3, localExtraParams));
  return Buffer.concat(parts);
}

// ---------------------------------------------------------------------------
// Reply decoding
// ---------------------------------------------------------------------------

/** Decode an ExportReply: 2 progress(float), 4 status(int), 5 message, 6 logPath, 1 taskId */
export function decodeExportReply(buf) {
  const d = decodeMessage(buf);
  const status = asNumber(d[4], -1);
  return {
    taskId: asString(d[1]),
    progress: asNumber(d[2], 0),
    status,
    statusName: STATUS[status] ?? "UNKNOWN",
    message: asString(d[5]),
    logPath: asString(d[6]),
    raw: buf.toString("hex"),
  };
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

/**
 * Start an export. Returns the decoded reply. A non-zero status in the reply is
 * reported as data (not thrown) because Studio answers with a structured error
 * rather than a gRPC failure in most cases.
 */
export async function startExporting({ port, params, timeoutMs = 240000 }) {
  const buf = await unaryCall({ port, path: PATH_START, payload: params, timeoutMs });
  return decodeExportReply(buf);
}

export async function cancelExport({ port, taskId, timeoutMs = 30000 }) {
  const payload = Buffer.concat([fieldString(1, taskId)]);
  const buf = await unaryCall({ port, path: PATH_CANCEL, payload, timeoutMs });
  return decodeExportReply(buf);
}

export async function heartbeat({ port, clientId = "insta360-mcp", timeoutMs = 10000 }) {
  const payload = Buffer.concat([fieldString(1, clientId)]);
  const buf = await unaryCall({ port, path: PATH_HEARTBEAT, payload, timeoutMs });
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
