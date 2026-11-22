// gRPC-Export: type 13 + mainParams mit materialList
import * as E from "./src/exporter.mjs";
import { discoverExporter, fieldString, fieldBytes, fieldInt } from "./src/grpc-client.mjs";
import fs from "node:fs";

const PROJDIR = "D:/Dokumente/Insta360/Studio/FootageProject/7a0aad0fd7fc6178798ec434cf3ea927";
const INSPRJ = PROJDIR + "/footage_project.insprj";
const INSV = "F:/X6/Camera01/VID_20261113_112549_00_001.insv";
const OUT = "C:/Users/stefa/AppData/Local/hermes/cache/scratch/grpc_out6";
fs.mkdirSync(OUT, { recursive: true });

const disc = discoverExporter();
const port = disc.port;
console.log("port:", port);

const buildCloud = ({ projectName = "", projectPath = "", materials = [] } = {}) => {
  const parts = [];
  if (projectName) parts.push(fieldString(1, projectName));
  if (projectPath) parts.push(fieldString(2, projectPath));
  for (const m of materials) parts.push(fieldString(3, m));
  return Buffer.concat(parts);
};
const buildMat = (index, type, value) => {
  const p = [fieldInt(1, index)];
  if (type) p.push(fieldString(2, type));
  if (value) p.push(fieldString(3, value));
  return Buffer.concat(p);
};

const cases = [
  ["13 main proj+insv", 13, buildCloud({ projectName: "p", projectPath: PROJDIR, materials: [INSV] }), []],
  ["13 main proj+insprj", 13, buildCloud({ projectName: "p", projectPath: PROJDIR, materials: [INSPRJ] }), []],
  ["13 main empty+insv", 13, buildCloud({ materials: [INSV] }), []],
  ["13 main proj + headerMat", 13, buildCloud({ projectName: "p", projectPath: PROJDIR }), [buildMat(0, "video", INSV)]],
  ["13 main proj+insv + headerMat", 13, buildCloud({ projectName: "p", projectPath: PROJDIR, materials: [INSV] }), [buildMat(0, "video", INSV)]],
];

for (const [name, t, main, mats] of cases) {
  try {
    const headerParts = [fieldString(1, `${name.replace(/\W/g, "_")}-${Date.now()}`), fieldString(2, name), fieldString(3, OUT)];
    for (const m of mats) headerParts.push(fieldBytes(12, m));
    const header = Buffer.concat(headerParts);
    const local = E.buildLocalExtraParams({ exportType: t, videoExportParams: [E.buildLocalVideoExportParam({ stitchType: 0 })] });
    const params = E.buildExportParams({ exportHeader: header, mainParams: main, localExtraParams: local });
    const r = await E.startExporting({ port, params, timeout: 90000 });
    console.log(`${name} -> code=${r.errCode} "${r.errInfo}" uuid=${r.uuid.slice(0,20)}`);
  } catch (e) {
    console.log(`${name} ERR ${e.message.slice(0, 150)}`);
  }
}
console.log("--- files ---", fs.readdirSync(OUT).slice(0, 10));
process.exit(0);
