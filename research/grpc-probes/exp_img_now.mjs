// gRPC-Export: Quelle in localExtraParams.imageExportParam.sourceGroup
import * as E from "./src/exporter.mjs";
import { discoverExporter } from "./src/grpc-client.mjs";
import fs from "node:fs";

const SRC = "F:/X6/Camera01/VID_20261113_112549_00_001.insv";
const OUT = "C:/Users/stefa/AppData/Local/hermes/cache/scratch/grpc_out3";
fs.mkdirSync(OUT, { recursive: true });

const disc = discoverExporter();
const port = disc.port;
console.log("port:", port);

const cases = [9, 10, 13, 12, 14, 25, 27];

for (const t of cases) {
  try {
    const sg = E.buildSourceGroup({ sourceFiles: [SRC] });
    const img = E.buildLocalImageExportParam({ sourceGroup: sg, stitching: E.buildStitchingSetting({ enableOpticalFlowStitching: true }) });
    const header = E.buildExportHeader({ taskId: `img-${t}-${Date.now()}`, exportName: `img_${t}`, savePath: OUT });
    const local = E.buildLocalExtraParams({ exportType: t, imageExportParam: img });
    const params = E.buildExportParams({ exportHeader: header, localExtraParams: local });
    const r = await E.startExporting({ port, params, timeout: 90000 });
    console.log(`type=${t} -> code=${r.errCode} "${r.errInfo}" uuid=${r.uuid.slice(0,20)}`);
  } catch (e) {
    console.log(`type=${t} ERR ${e.message.slice(0, 150)}`);
  }
}
console.log("--- files ---", fs.readdirSync(OUT).slice(0, 10));
process.exit(0);
