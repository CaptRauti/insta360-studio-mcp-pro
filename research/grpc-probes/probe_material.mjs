// Live probe: Export2.StartExporting with a populated ExportHeader.materialList
// Tests whether "materialList is empty" is the actual blocker.
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const PROTO = path.join(ROOT, 'src/proto/export2.proto');

const pkgDef = protoLoader.loadSync(PROTO, {
  keepCase: true, longs: String, enums: String, defaults: false, oneofs: true,
});
const proto = grpc.loadPackageDefinition(pkgDef);

const SOURCE = 'D:/Videos/X6/Camera01/VID_20260917_192757_00_001.insv';
const OUT = path.join(ROOT, 'research/grpc-probes/out_material');

function call(client, method, req) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve({ timeout: true }), 30000);
    client[method](req, (err, res) => {
      clearTimeout(t);
      if (err) resolve({ err: err.code, msg: err.details });
      else resolve({ res });
    });
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const client = new proto.service.Export2.Export2('127.0.0.1:4096',
    grpc.credentials.createInsecure());

  console.log('source exists:', fs.existsSync(SOURCE));

  const variants = [
    { label: 'VIDEO(9) + materialList', type: 9, mat: true },
    { label: 'MUX_TO_VIDEO(13) + materialList', type: 13, mat: true },
    { label: 'VIDEO_CLIP(10) + materialList', type: 10, mat: true },
  ];

  for (const v of variants) {
    const req = {
      exportHeader: {
        taskId: `probe-mat-${v.type}-${Date.now()}`,
        exportName: `probe_${v.type}`,
        savePath: OUT,
        materialList: v.mat ? [
          { index: 0, type: 'video', value: SOURCE },
        ] : [],
      },
      localExtraParams: {
        exportType: v.type,
        videoExportParam: [{
          clipIndex: 0,
          stitchType: 1,
          enableStab: true,
          stabType: 0,
        }],
      },
    };
    const r = await call(client, 'StartExporting', req);
    console.log(`\n--- ${v.label} ---`);
    console.log(JSON.stringify(r).slice(0, 900));
  }
  client.close();
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
