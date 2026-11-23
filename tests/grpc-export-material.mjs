// Does ExportHeader.materialList carry the source file the exporter needs?
//
// ExportParams has no media path anywhere else: LocalVideoExportParam holds only
// a clipIndex, and CloudExportData is the project model (version, source,
// exportinfo, fileclipinfo, baseSegment — all render settings, no path). So
// materialList is the only place a file can be named, and the reply's err_info
// is the oracle for whether the service accepted it.
//
// Usage: node tests/grpc-export-material.mjs [sourceFile]

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { discoverExporter, unaryCall, fieldBytes } from "../src/grpc-client.mjs";
import {
  buildExportParams,
  buildExportHeader,
  buildLocalExtraParams,
  buildLocalVideoExportParam,
  decodeExportReply,
} from "../src/exporter.mjs";

const CANDIDATES = [
  "D:/Videos/X6/Camera01/VID_20260917_193416_00_002.insv",
  "D:/Videos/X6/Camera01/VID_20260917_192757_00_001.insv",
  "F:/X6/Camera01/VID_20261113_112549_00_001.insv",
];

function pickSource() {
  const explicit = process.argv[2];
  const list = explicit ? [explicit, ...CANDIDATES] : CANDIDATES;
  for (const candidate of list) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

const source = pickSource();
if (!source) {
  console.log("keine .insv gefunden — Pfad als Argument übergeben");
  process.exit(1);
}

const outDir = path.join(os.homedir(), "Desktop", "mcp-export-test");
fs.mkdirSync(outDir, { recursive: true });

const { port } = await discoverExporter();
console.log("Exporter-Port:", port);
console.log("Quelle:", source, `(${(fs.statSync(source).size / 1048576).toFixed(0)} MB)`);
console.log("Ziel:", outDir);
console.log();

const stamp = Date.now();
const VARIANTS = ["video", "0", "insv", "source"];

for (const materialType of VARIANTS) {
  const taskId = `mcp-${stamp}-${materialType}`;
  const savePath = path.join(outDir, `${taskId}.mp4`);

  const exportHeader = buildExportHeader({
    taskId,
    exportName: path.basename(savePath),
    savePath,
    videoDuration: 0,
    framerate: "30",
    bitrate: "100",
    width: 3840,
    height: 2160,
    materialList: [{ index: 0, type: materialType, value: source }],
  });

  const localExtraParams = buildLocalExtraParams({
    exportType: 13, // MUX_TO_VIDEO
    videoExportParam: [
      buildLocalVideoExportParam({
        clipIndex: 0,
        stitchType: 1,
        stabType: 0,
        enableStab: true,
        enableImageFusion: true,
      }),
    ],
  });

  const payload = buildExportParams({ exportHeader, localExtraParams });

  let reply;
  try {
    const raw = await unaryCall({
      port,
      path: "/service.Export2.Export2/StartExporting",
      payload,
      timeoutMs: 60000,
    });
    reply = decodeExportReply(raw);
  } catch (err) {
    console.log(`materialList.type=${JSON.stringify(materialType)} -> Fehler: ${err.message}`);
    continue;
  }

  console.log(`materialList.type=${JSON.stringify(materialType)}`);
  console.log("   Antwort:", JSON.stringify(reply));

  // Give the exporter time to actually write something.
  await new Promise((resolve) => setTimeout(resolve, 6000));
  const produced = fs.existsSync(savePath);
  console.log(`   Datei nach 6 s: ${produced ? `${(fs.statSync(savePath).size / 1048576).toFixed(1)} MB` : "nicht erzeugt"}`);
  console.log();

  if (produced) {
    console.log("TREFFER — materialList ist der Medienkanal.");
    break;
  }
}

console.log("Inhalt des Zielordners:");
for (const name of fs.readdirSync(outDir)) {
  const full = path.join(outDir, name);
  console.log(`   ${name}  ${(fs.statSync(full).size / 1024).toFixed(0)} KB`);
}
