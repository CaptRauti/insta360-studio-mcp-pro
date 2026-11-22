// Final gRPC export matrix: materialList variants + long wait, watch Desktop.
import * as E from "./src/exporter.mjs";
import { discoverExporter, fieldString, fieldInt, fieldBytes } from "./src/grpc-client.mjs";
import fs from "node:fs";
import path from "node:path";

const SRC = "F:/Luna/VID_20261112_051426_001.mp4";
const OUT = "C:/Users/stefa/Desktop";
const FOOTAGE_ID = "VID_20261112_051426_001.mp4+30+3840x2160+305****0855";
const PROJ_DIR = "D:/Dokumente/Insta360/Studio/FootageProject/988d3df2637cadc3474862319173d5ef";

const found = discoverExporter();
if (!found) { console.log("NO EXPORTER"); process.exit(1); }
const port = found.port;
console.log("port", port);

const before = new Set(fs.readdirSync(OUT).filter(f => /\.(mp4|mov)$/i.test(f)));

function materialItem(index, type, value) {
  return Buffer.concat([fieldInt(1, index), fieldString(2, type), fieldString(3, value)]);
}

function header({ taskId, extra = [] }) {
  const parts = [
    fieldString(1, taskId),
    fieldString(2, "grpc_test_" + taskId.slice(-6)),
    fieldString(3, OUT),
    fieldInt(9, 3840),
    fieldInt(10, 2160),
  ];
  for (const e of extra) parts.push(fieldBytes(12, e));
  return Buffer.concat(parts);
}

const variants = [
  { name: "13+mat_path", type: 13, mats: [materialItem(0, "video", SRC)] },
  { name: "13+mat_footage", type: 13, mats: [materialItem(0, "footage", FOOTAGE_ID)] },
  { name: "13+mat_projdir", type: 13, mats: [materialItem(0, "project", PROJ_DIR)] },
  { name: "9+mat_path", type: 9, mats: [materialItem(0, "video", SRC)] },
  { name: "10+mat_path", type: 10, mats: [materialItem(0, "video", SRC)] },
  { name: "13+mat_path+srcgroup", type: 13, mats: [materialItem(0, "video", SRC)], srcGroup: true },
];

for (const v of variants) {
  const taskId = "final-" + v.name.replace(/[^a-z0-9]/gi, "") + "-" + Date.now();
  const imgParam = E.buildLocalImageExportParam({
    sourceGroup: E.buildSourceGroup({ sourceFiles: [SRC] }),
    stitching: E.buildStitchingSetting({ stabilizationLevel: 1 }),
  });
  const local = E.buildLocalExtraParams({
    exportType: v.type,
    imageExportParam: v.srcGroup ? imgParam : null,
    videoExportParams: v.srcGroup ? [] : [],
  });
  const params = E.buildExportParams({
    exportHeader: header({ taskId, extra: v.mats }),
    localExtraParams: local,
  });
  try {
    const r = await E.startExporting({ port, params, timeoutMs: 120000 });
    console.log(`${v.name} -> code=${r.stateCode} err=${r.errCode} "${r.errInfo}" uuid=${r.uuid} bytes=${r.rawBytes}`);
  } catch (e) {
    console.log(`${v.name} -> EXC ${String(e.message).slice(0, 120)}`);
  }
}

// wait then diff
for (let i = 0; i < 12; i++) {
  await new Promise((r) => setTimeout(r, 10000));
  const now = fs.readdirSync(OUT).filter(f => /\.(mp4|mov)$/i.test(f));
  const added = now.filter(f => !before.has(f));
  if (added.length) { console.log(`NEW after ${(i + 1) * 10}s:`, added); break; }
}
const now = fs.readdirSync(OUT).filter(f => /\.(mp4|mov)$/i.test(f));
console.log("added:", now.filter(f => !before.has(f)));
process.exit(0);
