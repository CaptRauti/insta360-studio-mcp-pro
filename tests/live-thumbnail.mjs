// Live probe for the thumbnail / scene-detect service with the descriptor-correct
// payload. Prints what the service answers and which files it claims to have
// written, so the answer can be checked on disk rather than trusted.
//
//   node tests/live-thumbnail.mjs <media-file> [scene|thumb|remove|beat]

import { existsSync, statSync } from "node:fs";
import { discoverThumbnail } from "../src/grpc-client.mjs";
import {
  ThumbnailRenderType,
  ThumbnailTaskType,
  removeThumbnail,
  requestThumbnail,
  sendSceneDetect,
  thumbnailHeartbeat,
} from "../src/thumbnail.mjs";

const source = process.argv[2];
const mode = process.argv[3] ?? "thumb";
if (!source) {
  console.error("usage: node tests/live-thumbnail.mjs <media-file> [scene|thumb|remove|beat]");
  process.exit(2);
}

const found = discoverThumbnail();
if (!found) {
  console.error("thumbnail service not running (studio-thumbnail-service.exe)");
  process.exit(3);
}
console.log(`Thumbnail-Service: Port ${found.port} (${found.image ?? "studio-thumbnail-service.exe"})`);
console.log(`Quelle: ${source}${existsSync(source) ? ` (${statSync(source).size} Bytes)` : " -- NICHT VORHANDEN"}`);

if (mode === "scene") {
  const reply = await sendSceneDetect({ port: found.port, sourceGroupName: source, files: [source] });
  console.log("SceneDetectReply:", JSON.stringify(reply, null, 2));
} else if (mode === "remove") {
  console.log("Remove:", JSON.stringify(await removeThumbnail({ port: found.port, files: [source] }), null, 2));
} else if (mode === "beat") {
  console.log("HeartBeat:", JSON.stringify(await thumbnailHeartbeat({ port: found.port, count: 1 }), null, 2));
} else {
  const reply = await requestThumbnail({
    port: found.port,
    files: [source],
    width: 1280,
    height: 720,
    frameIndex: 0,
    taskType: ThumbnailTaskType.kSingleTask,
    renderType: ThumbnailRenderType.kDewarp,
    isPanoMedia: true,
  });
  console.log("ThumbnailReply:", JSON.stringify(reply, null, 2));
  for (const t of reply.thumbnails) {
    console.log(`  -> ${t.thumbnailPath} exists=${existsSync(t.thumbnailPath)}`);
  }
}
