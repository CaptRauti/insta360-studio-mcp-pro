import * as E from "./src/exporter.mjs";
import { discoverExporter } from "./src/grpc-client.mjs";
import fs from "node:fs";

const OUT = "C:/Users/stefa/AppData/Local/hermes/cache/scratch/exp_now";
fs.mkdirSync(OUT, { recursive: true });

const SRC = "D:/Videos/X6/Camera01/VID_20260917_193416_00_002.insv";
const port = discoverExporter()?.port;
console.log("exporter port:", port);

for (const t of [13, 10, 9]) {
  const taskId = "now-" + Date.now() + "-" + t;
  const params = E.buildExportParams({
    exportHeader: E.buildExportHeader({
      taskId,
      savePath: OUT + "/",
      exportName: "now_" + t,
      framerate: 30,
      bitrate: 0,
      width: 3840,
      height: 1920,
    }),
    localExtraParams: E.buildLocalExtraParams({
      exportType: t,
      imageExportParam: E.buildLocalImageExportParam({
        sourceGroup: E.buildSourceGroup({ sourceFiles: [SRC] }),
      }),
    }),
  });
  try {
    const r = await E.startExporting({ port, params, timeoutMs: 20000 });
    console.log("type", t, "->", JSON.stringify(r).slice(0, 400));
  } catch (e) {
    console.log("type", t, "ERR", e.message);
  }
}
console.log("done. files:", fs.readdirSync(OUT));
process.exit(0);
