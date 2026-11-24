// One-shot: what is actually in the project library right now?
//
// Prints, per project directory: the .insproj mtime, the library entry's own
// frame count, and the video track's clips with their source metadata — so a
// project built by this tooling (per-file sourceFrames, one clip per file) can
// be told apart from a Studio-authored one at a glance.
//
// Usage: node research/library_state.mjs [root]

import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] ?? "D:/Dokumente/Insta360/Studio/TimelineProject";
const PRO_LIST = path.join(process.env.LOCALAPPDATA, "Insta360", "Insta360 Studio", "nle", "pro.insproj");

const library = fs.existsSync(PRO_LIST) ? JSON.parse(fs.readFileSync(PRO_LIST, "utf8")) : { projects: [] };
const byPath = new Map((library.projects ?? []).map((p) => [p.projectPath?.replace(/\\/g, "/"), p]));

console.log(`library: ${library.projects?.length ?? 0} entries`);
console.log(`root:    ${root}\n`);

for (const dir of fs.readdirSync(root).sort()) {
  const full = path.join(root, dir);
  if (!fs.statSync(full).isDirectory()) continue;
  const files = fs.readdirSync(full).filter((f) => f.endsWith(".insproj") && !f.includes("_backup"));
  const entry = byPath.get(full.replace(/\\/g, "/")) ?? null;
  console.log(`${dir}  ${entry ? "in library" : "NOT in library"}  frames=${entry?.frames ?? "-"}`);
  for (const f of files) {
    const p = path.join(full, f);
    const when = fs.statSync(p).mtime.toISOString().replace("T", " ").slice(0, 16);
    let j;
    try {
      j = JSON.parse(fs.readFileSync(p, "utf8"));
    } catch (e) {
      console.log(`   ${f}  ${when}  UNREADABLE ${e.message}`);
      continue;
    }
    const video = (j.tracks ?? []).find((t) => t.type === 0) ?? {};
    const clips = video.clips ?? [];
    console.log(`   ${f}  ${when}  ${fs.statSync(p).size}B  project.frames=${j.frames}  videoClips=${clips.length}`);
    for (const c of clips) {
      const same = clips.every((x) => x.sourceFrames === c.sourceFrames);
      console.log(
        `      ${String(c.name).padEnd(26)} src=${String(c.sourceFrames).padStart(6)} total=${String(c.source_total_frames).padStart(6)} trim=${c.leftTrim}/${c.rightTrim} start=${c.startFrame} type=${c.type}${same && clips.length > 1 ? "  <-- all clips share one length" : ""}`,
      );
    }
    const hashes = [...(j.tracks ?? [])].map((t) => `${t.type}:${(t.clips ?? []).length}`);
    console.log(`      tracks ${hashes.join(" ")}`);
  }
}
