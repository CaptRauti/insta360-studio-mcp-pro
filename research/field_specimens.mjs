// List every .insproj on this machine, and which of them carry a clip-to-clip transition or
// an applied filter. Both fields are documented (docs/ASSET_CATALOG.md §2.1, §2.2) from
// specimens an earlier pass found; this says whether those specimens are still here, because
// a tool should be built against a live file rather than a doc that may have moved on.
//
//   node research/field_specimens.mjs
import fs from "node:fs";
import path from "node:path";
import { readProject } from "../src/project.mjs";
import { keyframeNodes } from "../src/keyframes.mjs";

const roots = ["D:/Dokumente/Insta360/Studio", "C:/Users/stefa/Videos", "C:/Users/stefa/Documents"];
const files = [];
const walk = (dir, depth) => {
  if (depth > 6) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, depth + 1);
    else if (e.name.endsWith(".insproj") && !e.name.includes("_backup") && !e.name.endsWith(".bak")) files.push(p);
  }
};
for (const r of roots) walk(r, 0);

console.log(`projects: ${files.length}`);
let filters = 0;
let transitions = 0;
let keyframed = 0;
for (const f of files.sort()) {
  let data;
  try {
    data = await readProject(f);
  } catch (e) {
    console.log(`  ! ${f}: ${e.message}`);
    continue;
  }
  const clips = (data.tracks ?? []).flatMap((t) => t.clips ?? []);
  const apply = clips.filter((c) => c.effect_filter?.externfilterId);
  const tr = clips.flatMap((c) => c.transitions ?? []);
  const kf = clips.filter((c) => keyframeNodes(c).length);
  filters += apply.length;
  transitions += tr.length;
  keyframed += kf.length;
  const marks = [
    apply.length ? `filter×${apply.length} (${[...new Set(apply.map((c) => c.effect_filter.externfilterId))].join(", ")})` : "",
    tr.length ? `transitions×${tr.length}` : "",
    kf.length ? `keyframes×${kf.length}` : "",
  ].filter(Boolean);
  console.log(`  ${path.basename(path.dirname(f)).padEnd(22)} clips=${String(clips.length).padStart(3)} ${marks.join("  ") || "—"}`);
}
console.log(`\ntotals: ${filters} filter application(s), ${transitions} transition(s), ${keyframed} keyframed clip(s)`);
if (!transitions) {
  console.log("no clip-to-clip transition on disk — the shape in docs/ASSET_CATALOG.md §2.2 came from a project that is gone,");
  console.log("so a writer must be built against that recorded entry and verified by opening the result in Studio");
}
