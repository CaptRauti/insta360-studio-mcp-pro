// What is actually in each project on this machine: clip count, whether it holds a
// 360 source, and whether anything already carries a keyframe track. The keyframe
// work needs a project with a real 360 clip *on the timeline*, and the specimen built
// by our own tools turned out to have none, so this is the inventory that decides
// which project to harvest from.
//   node research/project_inventory.mjs
import fs from "node:fs";
import path from "node:path";
import { readProject } from "../src/project.mjs";

const root = process.argv[2] ?? "D:/Dokumente/Insta360/Studio/TimelineProject";
const rows = [];

for (const dirName of fs.readdirSync(root)) {
  const dir = path.join(root, dirName);
  let st;
  try {
    st = fs.statSync(dir);
  } catch {
    continue;
  }
  if (!st.isDirectory()) continue;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".insproj") && !f.includes("_backup"))) {
    try {
      const j = await readProject(path.join(dir, f));
      // Clips live in tracks[].clips. A top-level clips/mediaClips lookup reports 0 for
      // every project on this machine, which is how an earlier pass "found" no keyframes
      // anywhere; the tracks path is the real one.
      const list = (j.tracks ?? []).flatMap((t) => t.clips ?? []);
      const sources = list.map((c) => String(c.url ?? c.name ?? "").split(/[\\/]/).pop()).filter(Boolean);
      const panor = list.filter((c) => c.type === 1 || /\.insv$/i.test(String(c.url ?? "")));
      const keyed = list.filter((c) => {
        const k = c.key_frame_track;
        return k && (Array.isArray(k) ? k.length : Object.keys(k ?? {}).length);
      });
      rows.push({
        project: dirName,
        clips: list.length,
        pano: panor.length,
        keyframed: keyed.length,
        keyframeKeys: (JSON.stringify(j).match(/key_frame_track/g) ?? []).length,
        sources: sources.slice(0, 4),
        bytes: fs.statSync(path.join(dir, f)).size,
      });
    } catch (e) {
      rows.push({ project: dirName, error: e.message.slice(0, 60) });
    }
  }
}

rows.sort((a, b) => (b.keyframed ?? 0) - (a.keyframed ?? 0) || (b.clips ?? 0) - (a.clips ?? 0));
for (const r of rows) {
  if (r.error) {
    console.log(`${r.project.padEnd(18)} ERROR ${r.error}`);
    continue;
  }
  console.log(
    `${r.project.padEnd(18)} clips=${String(r.clips).padStart(3)} panoClips=${r.pano} keyframed=${r.keyframed} bytes=${r.bytes}`,
  );
  if (r.sources.length) console.log(`   sources: ${r.sources.join(", ").slice(0, 150)}`);
}
