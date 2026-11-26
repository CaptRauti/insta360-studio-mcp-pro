import fs from 'node:fs';
const P = process.argv[2];
const raw = fs.readFileSync(P, 'utf8');
console.log('bytes:', raw.length);
let j;
try { j = JSON.parse(raw); } catch (e) { console.log('parse failed:', e.message); process.exit(1); }
const want = new Set(['stitching_optimization','stitching_setting','enableAIStitching','supportAIStitching',
  'enablePureShot','supportPureShot','enableDynamicStitching','enableImageFusionStitching','enableOpticalFlowStitching',
  'enableSingleDenoise','enableUnderWaterCorrect','enableTimeLogo','enableDolbyVision','supportDolbyVision']);
const hits = [];
(function walk(o, path) {
  if (!o || typeof o !== 'object') return;
  for (const [k, v] of Object.entries(o)) {
    const p = path ? path + '.' + k : k;
    if (want.has(k)) hits.push([p, JSON.stringify(v)]);
    if (v && typeof v === 'object') walk(v, p);
  }
})(j, '');
for (const [p, v] of hits) console.log(p, '=', v.length > 300 ? v.slice(0,300) + '…' : v);
console.log('--- hits:', hits.length);
