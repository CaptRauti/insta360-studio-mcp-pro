// gRPC-Export: type 13 + mainParams (CloudExportData project exporter)
import * as E from "./src/exporter.mjs";
import { discoverExporter, fieldString } from "./src/grpc-client.mjs";
import fs from "node:fs";

const PROJDIR = "D:/Dokumente/Insta360/Studio/FootageProject/7a0aad0fd7fc6178798ec434cf3ea927";
const INSPRJ = PROJDIR + "/footage_project.insprj";
const OUT = "C:/Users/stefa/AppData/Local/hermes/cache/scratch/grpc_out5";
fs.mkdirSync(OUT, { recursive: true });

const disc = discoverExporter();
const port = disc.port;
console.log("port:", port);

function buildCloud({ projectName = "", projectPath = "", materials = [] } = {}) {
  const parts = [];
  if (projectName) parts.push(fieldString(1, projectName));
  if (projectPath) parts.push(fieldString(2, projectPath));
  for (const m of materials) parts.push(fieldString(3, m));
  return Buffer.concat(parts);
}

const cases = [
  ["13+main projdir", 13, buildCloud({ projectName: "proj", projectPath: PROJDIR })],
  ["13+main insprj", 13, buildCloud({ projectName: "proj", projectPath: INSPRJ })],
  ["13+main projdir+mat", 13, buildCloud({ projectName: "proj", projectPath: PROJDIR, materials: [INSPRJ] })],
  ["9+main projdir", 9, buildCloud({ projectName: "proj", projectPath: PROJDIR })],
  ["14+main projdir", 14, buildCloud({ projectName: "proj", projectPath: PROJDIR })],
];

for (const [name, t, main] of cases) {
  try {
    const header = E.buildExportHeader({ taskId: `${name.replace(/\W/g, "_")}-${Date.now()}`, exportName: name, savePath: OUT });
    const local = E.buildLocalExtraParams({ exportType: t, videoExportParams: [E.buildLocalVideoExportParam({ stitchType: 0 })] });
    const params = E.buildExportParams({ exportHeader: header, mainParams: main, localExtraParams: local });
    const r = await E.startExporting({ port, params, timeout: 90000 });
    console.log(`${name} -> code=${r.errCode} "${r.errInfo}" uuid=${r.uuid.slice(0,24)}`);
  } catch (e) {
    console.log(`${name} ERR ${e.message.slice(0, 150)}`);
  }
}
console.log("--- files ---", fs.readdirSync(OUT).slice(0, 10));
process.exit(0);
