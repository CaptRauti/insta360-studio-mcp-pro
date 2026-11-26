// Harvest the `key_frame_track` schema from the projects on this machine.
//
// `key_frame_track` is `{}` in every project the server has ever seen here, so the
// schema has to come out of a project Studio itself wrote with keyframes. This finds
// one, prints its keys flat (the diffable form) and dumps the raw JSON, so a
// hand-made specimen turns into a schema in one command:
//   node research/keyframe_probe.mjs
import fs from "node:fs";
import path from "node:path";
import { projectsRoot } from "../src/pipeline.mjs";

const roots = [projectsRoot(), path.join(projectsRoot(), "..")].filter((p) => fs.existsSync(p));

function walk(dir, out = [], depth = 0) {
  if (depth > 4) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out, depth + 1);
    else if (e.name.endsWith(".insproj")) out.push(p);
  }
  return out;
}

/** Flat key paths of a value, so two shapes can be compared as sets of strings. */
function flat(value, prefix = "", out = []) {
  if (Array.isArray(value)) {
    for (const v of value) flat(v, `${prefix}[]`, out);
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) flat(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out.push(`${prefix} = ${JSON.stringify(value)}`);
  }
  return out;
}

const files = [...new Set(roots.flatMap((r) => walk(r)))];
const found = [];
for (const file of files) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    continue;
  }
  for (const track of data.tracks ?? []) {
    for (const clip of track.clips ?? []) {
      const kft = clip.key_frame_track;
      if (kft && Object.keys(kft).length > 0) {
        found.push({ file, clip: clip.name ?? clip.url, kft });
      }
    }
  }
}

console.log(`projects scanned: ${files.length}`);
console.log(`clips with a non-empty key_frame_track: ${found.length}`);
if (!found.length) {
  console.log("\nNothing to harvest yet. Make a project by hand in Studio: open a 360 clip on a");
  console.log("flat-ratio project page, put the playhead somewhere, click 'Keyframe hinzufügen'");
  console.log("twice at two different times (moving the view between them), let it autosave,");
  console.log("then run this again.");
  process.exit(0);
}

for (const { file, clip, kft } of found.slice(0, 3)) {
  console.log(`\n===== ${path.basename(path.dirname(file))} / ${clip} =====`);
  console.log(`file: ${file}`);
  for (const line of flat(kft)) console.log(`  ${line}`);
  const first = JSON.stringify(kft, null, 1);
  console.log(`\nraw (${first.length} bytes):`);
  console.log(first.slice(0, 4000));
}
