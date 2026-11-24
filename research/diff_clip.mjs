// Field-by-field diff between a clip Studio wrote itself and a built clip for the
// SAME source file. Anything that differs is a field the builder fails to model.
import fs from "node:fs";
import path from "node:path";
import { projectsRoot } from "../src/pipeline.mjs";

const root = projectsRoot();

function clipsOf(dir) {
  const d = path.join(root, dir);
  const out = [];
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith(".insproj") || f.includes("_backup")) continue;
    const data = JSON.parse(fs.readFileSync(path.join(d, f), "utf8"));
    const t = (data.tracks || []).find((t) => t.type === 0) || {};
    for (const c of t.clips || []) out.push({ project: dir, file: f, clip: c, project_data: data });
  }
  return out;
}

const SOURCE = "F:/Luna/VID_20261112_051426_001.mp4";
const all = [...clipsOf("mcpTest"), ...clipsOf("mcpE2E"), ...clipsOf("mcpAcceptance")];
const ref = all.find((c) => c.project === "mcpTest" && c.clip.url === SOURCE);
const mine = all.find((c) => c.project === "mcpE2E" && c.clip.url === SOURCE);
if (!ref || !mine) {
  console.log("need both mcpTest and mcpE2E to carry", SOURCE);
  process.exit(1);
}

const keys = [...new Set([...Object.keys(ref.clip), ...Object.keys(mine.clip)])].sort();
const show = (v) => (v === undefined ? "<fehlt>" : typeof v === "object" && v !== null ? JSON.stringify(v) : String(v));

console.log(`ref  = mcpTest   (Studio-eigen)  ${ref.file}`);
console.log(`mine = mcpE2E    (gebaut)         ${mine.file}\n`);
console.log("=== CLIP-Felder ===");
let diffs = 0;
for (const k of keys) {
  const a = show(ref.clip[k]);
  const b = show(mine.clip[k]);
  if (a === b) continue;
  diffs++;
  console.log(`\n[${k}]`);
  console.log(`  ref : ${a.slice(0, 200)}`);
  console.log(`  mine: ${b.slice(0, 200)}`);
}
if (!diffs) console.log("  (keine Unterschiede)");
console.log(`\n${diffs} unterschiedliche Clip-Felder von ${keys.length}`);

console.log("\n=== PROJEKT-Felder ===");
const pkeys = [...new Set([...Object.keys(ref.project_data), ...Object.keys(mine.project_data)])].sort();
let pdiffs = 0;
for (const k of pkeys) {
  if (k === "tracks") continue;
  const a = show(ref.project_data[k]);
  const b = show(mine.project_data[k]);
  if (a === b) continue;
  pdiffs++;
  console.log(`  [${k}] ref=${a.slice(0, 90)} | mine=${b.slice(0, 90)}`);
}
if (!pdiffs) console.log("  (keine Unterschiede)");
