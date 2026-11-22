// gRPC-Export: Quelle in ExportHeader.materialList
import * as E from "./src/exporter.mjs";
import { discoverExporter, fieldBytes, fieldInt, fieldString } from "./src/grpc-client.mjs";
import fs from "node:fs";

const SRC = "F:/X6/Camera01/VID_20261113_112549_00_001.insv";
const OUT = "C:/Users/stefa/AppData/Local/hermes/cache/scratch/grpc_out2";
fs.mkdirSync(OUT, { recursive: true });

const disc = discoverExporter();
const port = disc.port;
console.log("port:", port);

function buildMaterialItem({ index = 0, type = "", value = "" }) {
  const p = [];
  p.push(fieldInt(1, index));
  if (type) p.push(fieldString(2, type));
  if (value) p.push(fieldString(3, value));
  return Buffer.concat(p);
}

function buildExportHeaderMat({ taskId, exportName, savePath, materials = [] }) {
  const p = [];
  if (taskId) p.push(fieldString(1, taskId));
  if (exportName) p.push(fieldString(2, exportName));
  if (savePath) p.push(fieldString(3, savePath));
  for (const m of materials) p.push(fieldBytes(12, m));
  return Buffer.concat(p);
}

const matTypes = ["video", "insv", "source", "VIDEO", ""];
const types = [9, 13, 10, 31];

for (const t of types) {
  for (const mt of matTypes) {
    try {
      const mat = buildMaterialItem({ index: 0, type: mt, value: SRC });
      const header = buildExportHeaderMat({
        taskId: `mat-${t}-${mt || "none"}-${Date.now()}`,
        exportName: `mat_${t}_${mt || "none"}`,
        savePath: OUT,
        materials: [mat],
      });
      const videoParam = E.buildLocalVideoExportParam({
        stitchType: 1,
        enableStab: true,
        srcTotalDurationMs: 30000,
      });
      const local = E.buildLocalExtraParams({ exportType: t, videoExportParams: [videoParam] });
      const params = E.buildExportParams({ exportHeader: header, localExtraParams: local });
      const r = await E.startExporting({ port, params, timeout: 90000 });
      console.log(`type=${t} mat=${mt || "none"} -> code=${r.errCode} ${r.errInfo} uuid=${r.uuid}`);
      if (r.errCode === 0) {
        console.log("  SUCCESS!");
        break;
      }
    } catch (e) {
      console.log(`type=${t} mat=${mt || "none"} ERR ${e.message.slice(0, 120)}`);
    }
  }
}
console.log("--- files ---");
console.log(fs.readdirSync(OUT).slice(0, 10));
process.exit(0);
