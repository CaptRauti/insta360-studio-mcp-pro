// Start export (RUNNING) then keep it alive with heartbeats, poll for output.
import * as E from "./src/exporter.mjs";
import { discoverExporter } from "./src/grpc-client.mjs";
import fs from "node:fs";

const SRC = "F:/Luna/VID_20261112_051426_001.mp4";
const OUT = "C:/Users/stefa/Desktop";
const port = discoverExporter().port;
const before = new Set(fs.readdirSync(OUT).filter(f => /\.(mp4|mov)$/i.test(f)));

const taskId = "hb-" + Date.now();
const params = E.buildExportParams({
  exportHeader: E.buildExportHeader({
    taskId,
    exportName: "hb_test",
    savePath: OUT,
    width: 3840,
    height: 2160,
    framerate: "30",
  }),
  localExtraParams: E.buildLocalExtraParams({
    exportType: 13,
    imageExportParam: E.buildLocalImageExportParam({
      sourceGroup: E.buildSourceGroup({ sourceFiles: [SRC] }),
      stitching: E.buildStitchingSetting({ stabilizationLevel: 1 }),
    }),
  }),
});

const r = await E.startExporting({ port, params, timeoutMs: 60000 });
console.log("start ->", "code=" + r.stateCode, "err=" + r.errCode, JSON.stringify(r.errInfo), "uuid=" + r.uuid);

for (let i = 0; i < 18; i++) {
  await new Promise((res) => setTimeout(res, 10000));
  try {
    const hb = await E.heartbeat({ port, count: i + 1 });
    const now = fs.readdirSync(OUT).filter(f => /\.(mp4|mov)$/i.test(f));
    const added = now.filter(f => !before.has(f));
    const sizes = added.map(f => `${f}:${fs.statSync(OUT + "/" + f).size}`);
    console.log(`t=${(i + 1) * 10}s hb=${hb.count} added=${JSON.stringify(sizes)}`);
    if (added.length && sizes.every(s => !s.endsWith(":0"))) {
      // check stability
      await new Promise((res) => setTimeout(res, 5000));
      const s2 = added.map(f => fs.statSync(OUT + "/" + f).size);
      console.log("stable check:", s2);
      break;
    }
  } catch (e) {
    console.log(`t=${(i + 1) * 10}s hb ERR ${String(e.message).slice(0, 100)}`);
  }
}
const now = fs.readdirSync(OUT).filter(f => /\.(mp4|mov)$/i.test(f));
console.log("added total:", now.filter(f => !before.has(f)));
process.exit(0);
