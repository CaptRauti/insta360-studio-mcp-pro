// Vollständiger Test: ExportParams mit localExtraParams.imageExportParam.sourceGroup
import * as grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import path from "node:path";
import fs from "node:fs";

const PROTO = "C:/Users/stefa/AppData/Local/hermes/insta360_studio_mcp_pro/src/proto/export2.proto";
const SRC = "D:/Videos/X6/Camera01/VID_20260917_193416_00_002.insv";
const OUT = "C:/Users/stefa/AppData/Local/hermes/cache/scratch/export_final";
fs.mkdirSync(OUT, { recursive: true });

const def = protoLoader.loadSync(PROTO, {
  keepCase: true, longs: Number, enums: Number, defaults: false, oneofs: true,
});
const proto = grpc.loadPackageDefinition(def);

const client = new proto.service.Export2.Export2(
  "127.0.0.1:4096",
  grpc.credentials.createInsecure(),
  { "grpc.max_receive_message_length": 100 * 1024 * 1024 }
);

function call(method, req) {
  return new Promise((res) => {
    const t = setTimeout(() => res({ timeout: true }), 25000);
    client[method](req, (err, r) => {
      clearTimeout(t);
      res({ err: err ? err.message : null, r });
    });
  });
}

const variants = [
  { name: "VIDEO_CLIP(10)", type: 10 },
  { name: "VIDEO(9)", type: 9 },
  { name: "MUX_TO_VIDEO(13)", type: 13 },
  { name: "PANO_VIDEO(31)", type: 31 },
];

for (const v of variants) {
  const taskId = "fin-" + Date.now() + "-" + v.type;
  const req = {
    exportHeader: {
      taskId,
      exportName: "final_" + v.type,
      savePath: OUT + "/",
      framerate: "30",
      bitrate: "0",
      width: 3840,
      height: 1920,
      videoDuration: 0,
    },
    localExtraParams: {
      exportType: v.type,
      imageExportParam: {
        sourceGroup: {
          sourceFile: [SRC],
        },
      },
    },
  };
  const out = await call("StartExporting", req);
  let info = "";
  if (out.r) {
    const b = out.r;
    info = `uuid=${b.uuid} prog=${b.export_progress} state=${b.state_code} err=${b.err_code} msg="${b.err_info}" log=${b.log_path}`;
  }
  console.log(`[${v.name}] ${out.err ? "GRPC_ERR=" + out.err : info}`);
  await new Promise((r) => setTimeout(r, 1200));
}

console.log("--- done ---");
