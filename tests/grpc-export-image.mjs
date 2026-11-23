// Which ExportType accepts a directly named source file?
//
// Export2 has exactly one source-file field — SourceGroup.sourceFile — and it
// hangs off LocalImageExportParam. Video clips carry only a clipIndex, so the
// exporter must resolve their media from the loaded project. This sweeps every
// ExportType with the same explicit source and reports the reply, so the set of
// types that can be driven without a loaded project becomes known rather than
// guessed. (Earlier sweeps never reached the service: they passed the whole
// discoverExporter() object as the port, which produced "Invalid URL".)
//
// Usage: node tests/grpc-export-image.mjs [sourceFile]

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import { discoverExporter, unaryCall } from "../src/grpc-client.mjs";
import {
  buildExportParams,
  buildExportHeader,
  buildLocalExtraParams,
  buildLocalImageExportParam,
  buildSourceGroup,
  decodeExportReply,
} from "../src/exporter.mjs";

const CANDIDATES = [
  "C:/Users/stefa/Desktop/Nightsky Luna.jpg",
];

const source = process.argv[2] || CANDIDATES.find((p) => fs.existsSync(p));
if (!source) {
  console.log("keine Bildquelle gefunden");
  process.exit(1);
}

const outDir = path.join(os.homedir(), "Desktop", "mcp-export-test");
fs.mkdirSync(outDir, { recursive: true });

const { port } = await discoverExporter();
console.log("Exporter-Port:", port);
console.log("Quelle:", source);
console.log();

const results = [];
for (let exportType = 0; exportType <= 33; exportType += 1) {
  const taskId = `mcp-img-${exportType}-${Date.now()}`;
  const savePath = path.join(outDir, `${taskId}.jpg`);

  const exportHeader = buildExportHeader({
    taskId,
    exportName: path.basename(savePath),
    savePath,
  });
  const localExtraParams = buildLocalExtraParams({
    exportType,
    imageExportParam: buildLocalImageExportParam({
      sourceGroup: buildSourceGroup({ sourceFiles: [source] }),
    }),
  });

  let reply;
  try {
    const raw = await unaryCall({
      port,
      path: "/service.Export2.Export2/StartExporting",
      payload: buildExportParams({ exportHeader, localExtraParams }),
      timeoutMs: 20000,
    });
    reply = decodeExportReply(raw);
  } catch (err) {
    results.push({ exportType, note: `Fehler: ${err.message}` });
    continue;
  }

  const entry = {
    exportType,
    errCode: reply.errCode,
    err: reply.err,
    errInfo: (reply.errInfo || "").slice(0, 60),
  };
  results.push(entry);
  if (reply.errCode !== 1026) {
    console.log(`exportType ${String(exportType).padStart(2)} -> errCode ${reply.errCode} (${reply.err}) ${entry.errInfo}`);
  }
}

console.log("Antwortverteilung:");
const buckets = new Map();
for (const r of results) {
  const key = r.note || `errCode ${r.errCode} (${r.err})`;
  buckets.set(key, (buckets.get(key) || 0) + 1);
}
for (const [key, count] of [...buckets].sort((a, b) => b[1] - a[1])) {
  console.log(`   ${count.toString().padStart(2)}x  ${key}`);
}

console.log();
console.log("Erzeugte Dateien:");
let any = false;
for (const name of fs.readdirSync(outDir)) {
  const full = path.join(outDir, name);
  console.log(`   ${name}  ${(fs.statSync(full).size / 1024).toFixed(0)} KB`);
  any = true;
}
if (!any) console.log("   (keine)");
