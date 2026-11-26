/**
 * Acceptance test for the transition writer — step 2 of 2: read back what Studio saved.
 *
 * Run this after the operator has opened the project in Studio (step 1 left two hand-written entries
 * in the file and started Studio). Studio writes from its own memory, so a file that now differs from
 * our write *and* carries our two entries is Studio saying it accepts them.
 *
 *   node research/transition_readback.mjs [projectDir]
 */
import fs from "node:fs";
import path from "node:path";
import { readProject } from "../src/project.mjs";
import { transitionState } from "../src/transitions.mjs";

const dir = process.argv[2] ?? "D:/Dokumente/Insta360/Studio/TimelineProject/mcpKey";
const files = fs.readdirSync(dir);
const file = path.join(dir, files.find((f) => f.endsWith(".insproj") && !f.includes("_backup") && !f.endsWith(".bak")));
const st = fs.statSync(file);
const data = await readProject(file);

console.log(`file: ${path.basename(file)}`);
console.log(`mtime: ${st.mtime.toISOString()}   size: ${st.size}`);
console.log(`file's own lastModifiedTime: ${data.lastModifiedTime}`);
console.log(`(step 1 wrote at ~16:31 with lastModifiedTime still 2026.11.26 16:23:10 — a change in both means Studio saved)`);

const track = data.tracks?.[0];
const ids = (track?.clips ?? []).map((c) => c.id);
console.log(`\nclips on track 0: ${ids.length}`);
ids.forEach((id, i) => console.log(`  ${i}: ${id}`));

const state = transitionState(track);
console.log(`\ntransitions: ${state.count}`);
for (const t of state.transitions) {
  console.log(`  ${t.prevClip?.slice(0, 8)} -> ${t.nextClip?.slice(0, 8)}  ${t.frames}f  ${t.resourceId.slice(0, 8)}  state=${t.state} type=${t.type}  path ${t.pathExists ? "exists" : "MISSING"}`);
}

// What step 1 wrote, for the comparison that matters.
const wanted = [
  { prev: ids[0], next: ids[1], frames: 40, asset: "B9AE47D4" },
  { prev: ids[1], next: ids[2], frames: 14, asset: "0D4E05B5" },
];
console.log(`\nstep 1 wrote:`);
for (const w of wanted) console.log(`  ${w.prev?.slice(0, 8)} -> ${w.next?.slice(0, 8)}  ${w.frames}f  ${w.asset}`);

const kept = wanted.map((w) => {
  const hit = state.transitions.find((t) => t.prevClip === w.prev && t.nextClip === w.next);
  return { ...w, hit, ok: Boolean(hit) && hit.frames === w.frames && hit.resourceId.startsWith(w.asset) };
});
console.log(`\nverdict:`);
for (const k of kept) console.log(`  ${k.ok ? "KEPT   " : "CHANGED"} ${k.prev.slice(0, 8)} -> ${k.next.slice(0, 8)}  ours ${k.frames}f/${k.asset}  file ${k.hit ? `${k.hit.frames}f/${k.hit.resourceId.slice(0, 8)}` : "gone"}`);
console.log(kept.every((k) => k.ok) ? "\nACCEPTED: Studio kept both hand-written transitions as written" : "\nNOT KEPT as written — see the lines above");
