// Thumbnail / scene-detection service operations (port is dynamic, discovered
// via studio-thumbnail-service.exe).
//
// Live-verified methods on /service.Thumbnail.ThumbnailService:
//   SendRequest          -> renders a thumbnail/scene-detect request
//   SendHeartBeatPackage -> keep-alive, returns empty
//   Remove               -> drops a cached thumbnail, returns empty

import {
  asNumber,
  asString,
  decodeMessage,
  discoverThumbnail,
  fieldInt,
  fieldString,
  unaryCall,
} from "./grpc-client.mjs";

const PATH_SEND = "/service.Thumbnail.ThumbnailService/SendRequest";
const PATH_HEARTBEAT = "/service.Thumbnail.ThumbnailService/SendHeartBeatPackage";
const PATH_REMOVE = "/service.Thumbnail.ThumbnailService/Remove";

/**
 * ThumbnailRequest: 1 sourceGroup, 2 taskType, 3 sourceFile.
 * The service answers with a ThumbnailReply carrying a status int and a message
 * when the request cannot be served.
 */
export function buildThumbnailRequest({ sourceGroup, sourceFile, taskType = 0 }) {
  const parts = [];
  if (sourceGroup) parts.push(fieldString(1, sourceGroup));
  if (taskType) parts.push(fieldInt(2, taskType));
  if (sourceFile) parts.push(fieldString(3, sourceFile));
  return Buffer.concat(parts);
}

export function decodeThumbnailReply(buf) {
  const d = decodeMessage(buf);
  return {
    status: asNumber(d[2], -1),
    message: asString(d[3]),
    raw: buf.toString("hex"),
  };
}

export async function requestThumbnail({ port, sourceFile, sourceGroup, taskType = 0, timeoutMs = 120000 }) {
  const payload = buildThumbnailRequest({ sourceGroup, sourceFile, taskType });
  const buf = await unaryCall({ port, path: PATH_SEND, payload, timeoutMs });
  return decodeThumbnailReply(buf);
}

export async function thumbnailHeartbeat({ port, timeoutMs = 10000 }) {
  const buf = await unaryCall({ port, path: PATH_HEARTBEAT, payload: Buffer.alloc(0), timeoutMs });
  return { bytes: buf.length };
}

export async function removeThumbnail({ port, timeoutMs = 10000 }) {
  const buf = await unaryCall({ port, path: PATH_REMOVE, payload: Buffer.alloc(0), timeoutMs });
  return { bytes: buf.length };
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
