/**
 * Acceptance test for the transition writer — step 1 of 2.
 *
 * Everything else is verified at the file level. What no unit test can show is whether Studio
 * *accepts* a hand-written transition: it writes the project from its own memory on save, so after
 * it has loaded and saved the file, the file is Studio's reading of our edit, not ours.
 *
 * Two changes, both unmistakable if Studio keeps them:
 *   - a new entry on the gap between clips 1 and 2 (the clip the operator added by hand)
 *   - the existing entry (clips 0-1) changed from 14 frames to 40
 *
 * This script stops Studio, writes, verifies on disk, then starts Studio again and stops. The
 * operator then opens the project by hand — a fresh Studio cannot be clicked into its project
 * library (measured) — and step 2, research/transition_readback.mjs, compares.
 *
 *   node tests/transition-acceptance.mjs <projectDir>
 */
import fs from "node:fs";
import path from "node:path";
import { readProject, writeProject } from "../src/project.mjs";
import { setTransition, transitionState } from "../src/transitions.mjs";
import { startStudio, stopStudio } from "../src/pipeline.mjs";

const dir = process.argv[2] ?? "D:/Dokumente/Insta360/Studio/TimelineProject/mcpKey";
const file = path.join(dir, fs.readdirSync(dir).find((f) => f.endsWith(".insproj") && !f.includes("_backup") && !f.endsWith(".bak")));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ASSET_A = "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092"; // "Fold change:R-L", already on the 0-1 gap
const ASSET_B = "0D4E05B5-A3E3-4C10-A081-58A920B45A15"; // "Fold change:L-R"

console.log(`project: ${path.basename(file)}`);

// 1. Studio down, so the file is ours alone.
console.log(`stopStudio: ${JSON.stringify(await stopStudio())}`);
await sleep(3000);

const data = await readProject(file);
const track = data.tracks?.[0];
if (!track) {
  console.log("no track 0");
  process.exit(1);
}
const ids = (track.clips ?? []).map((c) => c.id);
console.log(`\nclips on track 0: ${ids.length}`);
ids.forEach((id, i) => console.log(`  ${i}: ${id}`));
console.log(`\nBEFORE: ${transitionState(track).count} transition(s)`);
for (const t of transitionState(track).transitions) console.log(`  ${t.prevClip?.slice(0, 8)} -> ${t.nextClip?.slice(0, 8)}  ${t.frames}f  ${t.resourceId.slice(0, 8)}`);

if (ids.length < 3) {
  console.log("\nneed three clips on the track for this test");
  process.exit(1);
}

// 2. Our two edits.
const update = setTransition(track, { prevClip: ids[0], nextClip: ids[1], resourceId: ASSET_A, frames: 40 });
console.log(`\nupdate existing gap (0-1): ${JSON.stringify({ ok: update.ok, updated: update.updated?.slice(0, 8), frames: update.transition?.frames, changed: update.changed })}`);
const add = setTransition(track, { prevClip: ids[1], nextClip: ids[2], resourceId: ASSET_B, root: undefined });
console.log(`add on gap (1-2) with the other asset: ${JSON.stringify({ ok: add.ok, added: add.added?.slice(0, 8), frames: add.transition?.frames, error: add.error })}`);

const written = await writeProject(file, data, { backup: true });
console.log(`\nwritten: ${written.filePath}  ${written.bytes} bytes  backup=${written.backup}`);

// 3. What is on disk now, read back from the file rather than from memory.
const check = await readProject(file);
console.log(`\nON DISK AFTER OUR WRITE: ${transitionState(check.tracks[0]).count} transition(s)`);
for (const t of transitionState(check.tracks[0]).transitions) {
  console.log(`  ${t.prevClip?.slice(0, 8)} -> ${t.nextClip?.slice(0, 8)}  ${t.frames}f  ${t.resourceId.slice(0, 8)}  path ${t.pathExists ? "exists" : "MISSING"}`);
}
console.log(`file's own lastModifiedTime: ${check.lastModifiedTime}`);

// 4. Studio up so the operator can open the project.
const started = await startStudio();
console.log(`\nstartStudio: ok=${started.ok} pid=${started.pid ?? "-"}`);
console.log("\n>>> Now open 'mcpKey' in Studio by hand and leave it open.");
console.log(">>> Then run: node research/transition_readback.mjs");
