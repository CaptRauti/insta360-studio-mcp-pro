/**
 * Live acceptance test: does Studio *keep* a hand-written keyframe track?
 *
 * Everything else about A1 is verified at the file level — reading a Studio-written track,
 * inserting between two keyframes, removing one and relinking. What no unit test can show is
 * whether the application accepts a track it did not write, or re-normalises it on load. So:
 * stop Studio, write a keyframe with our own tool, start Studio, open the project in the
 * editor and let it autosave, then read the file back. Studio writes from its own memory, so
 * the file afterwards is Studio's interpretation of our track, not ours.
 *
 * Studio must not be running when this starts, and the window must be inside the desktop for
 * the editor clicks to land (`windowInfo()` against the monitor bounds).
 *
 *   node tests/keyframe-acceptance.mjs <projectDir>
 */
import fs from "node:fs";
import path from "node:path";
import { readProject } from "../src/project.mjs";
import { keyframeNodes, transitionNodes } from "../src/keyframes.mjs";
import { openProjectAt, setCurrentProject, startStudio, stopStudio, waitForLibrary } from "../src/pipeline.mjs";
import { moveWindow, windowInfo } from "../src/ui.mjs";

const dir = process.argv[2] ?? "D:/Dokumente/Insta360/Studio/TimelineProject/mcpKey";
const file = path.join(dir, fs.readdirSync(dir).find((f) => f.endsWith(".insproj") && !f.includes("_backup")));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TRACK = path.join(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..", "track");

const readState = async () => {
  const d = await readProject(file);
  const clips = (d.tracks ?? []).flatMap((t) => t.clips ?? []);
  return clips.map((c, i) => ({
    i,
    media: String(c.url ?? "").split(/[\\/]/).pop(),
    keyframes: keyframeNodes(c).map((k) => ({ time: k.time, pan: Number(k.pan.toFixed(4)), tilt: Number(k.tilt.toFixed(4)), name: k.name })),
    transitions: transitionNodes(c).map((t) => t.name),
    enableUserKeyframe: c.enable_user_keyframe ?? null,
  }));
};

console.log(`project file: ${file}`);

// 1. Studio down, so the file is ours alone.
const stop = await stopStudio();
console.log(`stopStudio: ${JSON.stringify(stop)}`);
await sleep(3000);

const before = await readState();
console.log(`\nBEFORE (file as Studio left it):`);
for (const c of before) console.log(`  clip ${c.i} ${c.media}: ${c.keyframes.length} kf [${c.keyframes.map((k) => k.time).join(",")}] ${c.transitions.length} trans`);

// 2. Write one more keyframe with the tool under test.
const { addKeyframe } = await import("../src/keyframes.mjs");
const { writeProject } = await import("../src/project.mjs");
const data = await readProject(file);
const clip = (data.tracks ?? []).flatMap((t) => t.clips ?? []).find((c) => keyframeNodes(c).length);
if (!clip) {
  console.log("no keyframed clip to extend — run research/keyframe_specimen.mjs first");
  process.exit(1);
}
const added = addKeyframe(clip, { time: 120, pan: 6.108652381980153, tilt: 1.7453292519943295 });
await writeProject(file, data, { backup: true });
const written = await readState();
const ours = written.find((c) => c.keyframes.length);
console.log(`\nWROTE with our tool: added=${added.added} -> ${ours.keyframes.length} kf [${ours.keyframes.map((k) => k.time).join(",")}]`);
console.log(`  our t=120 node: ${JSON.stringify(ours.keyframes.find((k) => k.time === 120))}`);

// 3. Studio up, project open in the editor, then let it autosave.
// Make Studio come up with *this* project loaded, by putting it first in Studio's own list.
// The start page's sidebar cannot be clicked into the project library (measured: 0 px
// changed on its "Projektbibliothek" label while the media page is showing), so a
// click-based open is not available on a fresh start — this is.
const asCurrent = setCurrentProject(path.basename(dir));
console.log(`setCurrentProject: ${JSON.stringify(asCurrent).slice(0, 200)}`);

const started = await startStudio();
console.log(`\nstartStudio: ok=${started.ok} pid=${started.pid ?? "?"}`);
if (!started.ok) {
  console.log(started.error);
  process.exit(1);
}
const lib = await waitForLibrary({});
console.log(`waitForLibrary: ok=${lib.ok}`);
const win = windowInfo();
console.log(`window: ${win.left},${win.top} ${win.width}x${win.height} iconic=${win.iconic}`);
const mon = win.monitor ?? { right: 2048, bottom: 1280 };
if (win.left >= mon.right || win.top >= mon.bottom) {
  console.log(`WARNING: the window is off the desktop (${mon.right}x${mon.bottom}) — clicks will not land`);
}
await sleep(6000);

const opened = await openProjectAt(dir);
console.log(`openProjectAt (editor already loaded?): ok=${opened.ok} ${opened.error ?? ""} verifiedBy=${opened.verifiedBy ?? "-"}`);

// Autosave is what matters: Studio writes the project from its own memory.
console.log("waiting for Studio to autosave…");
let after = written;
for (let i = 0; i < 12; i++) {
  await sleep(5000);
  after = await readState();
  if (JSON.stringify(after) !== JSON.stringify(written)) {
    console.log(`  file changed after ~${(i + 1) * 5}s`);
    break;
  }
}
await sleep(5000);
after = await readState();

console.log(`\nAFTER (file as Studio rewrote it):`);
for (const c of after) console.log(`  clip ${c.i} ${c.media}: ${c.keyframes.length} kf [${c.keyframes.map((k) => k.time).join(",")}] ${c.transitions.length} trans`);

const ourTimes = ours.keyframes.map((k) => k.time).join(",");
const afterTimes = after.find((c) => c.keyframes.length)?.keyframes.map((k) => k.time).join(",") ?? "";
const kept = after.find((c) => c.keyframes.length)?.keyframes.some((k) => k.time === 120) ?? false;
console.log(`\nRESULT: our track was [${ourTimes}], Studio's file now holds [${afterTimes}]`);
console.log(kept ? "ACCEPTED: Studio kept the hand-written keyframe" : "REJECTED or dropped: the t=120 keyframe is gone");
console.log(`(report the Studio build too — configure.ini's current_version — since offsets are build-specific)`);

// 4. Leave nothing running that the operator did not ask for.
await stopStudio();
