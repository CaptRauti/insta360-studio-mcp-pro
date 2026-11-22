// gRPC-Export-Test mit geladenem Video in Studio
import * as E from "./src/exporter.mjs";
import { discoverExporter } from "./src/grpc-client.mjs";
import fs from "node:fs";

const SRC = "F:/X6/Camera01/VID_20261113_112549_00_001.insv";
const OUT = "C:/Users/stefa/AppData/Local/hermes/cache/scratch/grpc_out";
fs.mkdirSync(OUT, { recursive: true });

const disc = discoverExporter();
const port = disc.port;
console.log("exporter port:", JSON.stringify(disc));

const variants = [
  { name: "e9 local video", type: E.EXPORT_TYPE.VIDEO || 9 },
  { name: "e13 mux", type: 13 },
];

for (const v of variants) {
  try {
    const header = E.buildExportHeader({ exportName: "grpc_test", savePath: OUT });
    const videoParam = E.buildLocalVideoExportParam({
      sourceFiles: [SRC],
      savePath: OUT,
      exportName: "grpc_test",
      stitchType: E.STITCH_TYPE?.OPTICAL_FLOW ?? 1,
      enableStab: true,
    });
    const local = E.buildLocalExtraParams({
      exportType: v.type,
      videoExportParam: [videoParam],
    });
    const params = E.buildExportParams({ exportHeader: header, localExtraParams: local });
    const r = await E.startExporting({ port, params, timeoutMs: 120000 });
    console.log(`[${v.name}] ->`, JSON.stringify(r).slice(0, 500));
  } catch (e) {
    console.log(`[${v.name}] ERR`, e.message.slice(0, 300));
  }
}
console.log("done. files:", fs.readdirSync(OUT));
process.exit(0);
