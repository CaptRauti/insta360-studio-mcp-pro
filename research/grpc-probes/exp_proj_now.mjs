// gRPC-Export: FootageProject-Pfad als Quelle
import * as E from "./src/exporter.mjs";
import { discoverExporter, fieldBytes, fieldString } from "./src/grpc-client.mjs";
import fs from "node:fs";

const INSPRJ = "D:/Dokumente/Insta360/Studio/FootageProject/7a0aad0fd7fc6178798ec434cf3ea927/footage_project.insprj";
const PROJDIR = "D:/Dokumente/Insta360/Studio/FootageProject/7a0aad0fd7fc6178798ec434cf3ea927";
const OUT = "C:/Users/stefa/AppData/Local/hermes/cache/scratch/grpc_out4";
fs.mkdirSync(OUT, { recursive: true });
console.log("insprj exists:", fs.existsSync(INSPRJ));

const disc = discoverExporter();
const port = disc.port;
console.log("port:", port);

const variants = [
  ["insprj-srcGroup-13", 13, INSPRJ],
  ["projdir-srcGroup-13", 13, PROJDIR],
  ["insprj-srcGroup-9", 9, INSPRJ],
  ["insprj-srcGroup-14", 14, INSPRJ],
];

for (const [name, t, src] of variants) {
  try {
    const sg = E.buildSourceGroup({ sourceFiles: [src] });
    const img = E.buildLocalImageExportParam({ sourceGroup: sg, stitching: E.buildStitchingSetting({ enableOpticalFlowStitching: true }) });
    const header = E.buildExportHeader({ taskId: `${name}-${Date.now()}`, exportName: name, savePath: OUT });
    const local = E.buildLocalExtraParams({ exportType: t, imageExportParam: img });
    const params = E.buildExportParams({ exportHeader: header, localExtraParams: local });
    const r = await E.startExporting({ port, params, timeout: 90000 });
    console.log(`${name} -> code=${r.errCode} "${r.errInfo}" uuid=${r.uuid.slice(0,24)}`);
  } catch (e) {
    console.log(`${name} ERR ${e.message.slice(0, 150)}`);
  }
}
// mainParams variant
try {
  const header = E.buildExportHeader({ taskId: `main-${Date.now()}`, exportName: "main_proj", savePath: OUT });
  const main = Buffer.concat([fieldString(1, "proj"), fieldString(2, PROJDIR)]);
  const params = E.buildExportParams({ exportHeader: header, mainParams: main });
  const r = await E.startExporting({ port, params, timeout: 90000 });
  console.log(`mainParams -> code=${r.errCode} "${r.errInfo}"`);
} catch (e) {
  console.log("mainParams ERR", e.message.slice(0, 150));
}
console.log("--- files ---", fs.readdirSync(OUT).slice(0, 10));
process.exit(0);
