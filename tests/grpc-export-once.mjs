// One clean gRPC export, start to finish, with the output verified on disk.
//
// The photo/image ExportTypes accept a source named directly in
// LocalImageExportParam.sourceGroup.sourceFile, so they can be driven without a
// project loaded in the app. Note the semantics: savePath is treated as an
// output *directory* and the file lands inside it, named after the source (or
// SourceGroup.dest_file_name when set).
//
// Usage: node tests/grpc-export-once.mjs [sourceFile] [exportType]

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { discoverExporter, unaryCall, fieldInt, decodeMessage } from "../src/grpc-client.mjs";
import {
  buildExportParams,
  buildExportHeader,
  buildLocalExtraParams,
  buildLocalImageExportParam,
  buildSourceGroup,
  decodeExportReply,
} from "../src/exporter.mjs";

const source = process.argv[2] || "C:/Users/stefa/Desktop/Nightsky Luna.jpg";
const exportType = Number(process.argv[3] ?? 0); // 0 = PHOTO

if (!fs.existsSync(source)) {
  console.log("Quelle fehlt:", source);
  process.exit(1);
}

const outDir = path.join(os.homedir(), "Desktop", "mcp-export-once");
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const { port } = await discoverExporter();
const taskId = `mcp-once-${Date.now()}`;

console.log("Port:", port, "| ExportType:", exportType, "| Quelle:", source);
console.log("Zielordner:", outDir);

const payload = buildExportParams({
  exportHeader: buildExportHeader({
    taskId,
    exportName: `${taskId}.jpg`,
    savePath: outDir,
  }),
  localExtraParams: buildLocalExtraParams({
    exportType,
    imageExportParam: buildLocalImageExportParam({
      sourceGroup: buildSourceGroup({ sourceFiles: [source] }),
    }),
  }),
});

const raw = await unaryCall({
  port,
  path: "/service.Export2.Export2/StartExporting",
  payload,
  timeoutMs: 120000,
});
const reply = decodeExportReply(raw);
console.log("Antwort:", JSON.stringify(reply));

// Wait for output. The exporter answers StartExporting immediately with
// stateCode 1 (RUNNING) and then drives its loop off SendHeartBeatPackage, so
// the client has to keep the heartbeat going while the work happens — a single
// request that just waits produces nothing.
function scan() {
  const found = [];
  for (const entry of fs.readdirSync(outDir)) {
    const full = path.join(outDir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      for (const inner of fs.readdirSync(full)) {
        const innerFull = path.join(full, inner);
        const innerStat = fs.statSync(innerFull);
        if (innerStat.isFile() && innerStat.size > 0) found.push([innerFull, innerStat.size]);
      }
    } else if (stat.size > 0) {
      found.push([full, stat.size]);
    }
  }
  return found;
}

function buildHeartBeat(count) {
  // HeartBeat { count = 1 int64, exit_app = 2 bool }
  const parts = [fieldInt(1, count)];
  return Buffer.concat(parts);
}

let produced = [];
for (let attempt = 0; attempt < 60; attempt += 1) {
  try {
    const beat = await unaryCall({
      port,
      path: "/service.Export2.Export2/SendHeartBeatPackage",
      payload: buildHeartBeat(attempt + 1),
      timeoutMs: 15000,
    });
    const decoded = decodeMessage(beat);
    if (attempt % 5 === 0) {
      console.log(`   Heartbeat ${attempt + 1}: ${JSON.stringify(decoded).slice(0, 160)}`);
    }
  } catch (err) {
    console.log(`   Heartbeat ${attempt + 1} Fehler: ${err.message}`);
  }
  produced = scan();
  if (produced.length > 0) break;
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

console.log();
if (produced.length === 0) {
  console.log("KEINE Ausgabe erzeugt");
  process.exit(1);
}
for (const [file, size] of produced) {
  console.log(`ERZEUGT  ${(size / 1048576).toFixed(2)} MB  ${file}`);
}
