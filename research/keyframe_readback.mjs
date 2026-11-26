/**
 * Read back the project after the operator opened it in Studio: did Studio keep the
 * hand-written keyframe?
 *
 * Studio writes a project from its own memory on autosave, so the file after it has loaded
 * the project is Studio's interpretation of our track, not ours. That is the whole point of
 * the exercise: the file-level tests cannot show whether the application accepts a track it
 * did not write, or quietly re-normalises it.
 *
 *   node research/keyframe_readback.mjs <projectDir>
 */
import fs from "node:fs";
import path from "node:path";
import { readProject } from "../src/project.mjs";
import { keyframeNodes, transitionNodes } from "../src/keyframes.mjs";
import { windowInfo } from "../src/ui.mjs";

const dir = process.argv[2] ?? "D:/Dokumente/Insta360/Studio/TimelineProject/mcpKey";
const file = path.join(dir, fs.readdirSync(dir).find((f) => f.endsWith(".insproj") && !f.includes("_backup")));
const st = fs.statSync(file);
console.log(`file: ${file}`);
console.log(`mtime: ${st.mtime.toISOString()}  size: ${st.size}`);

const config = "C:/Users/stefa/AppData/Local/Insta360/Apps/Insta360 Studio/configure.ini";
try {
  const ini = fs.readFileSync(config, "utf8");
  const find = (k) => ini.match(new RegExp(`^${k}\\s*=\\s*(.+)$`, "m"))?.[1]?.trim();
  console.log(`Studio build: current_version=${find("current_version")} new_version=${find("new_version")}`);
} catch {
  /* not fatal */
}

try {
  const win = windowInfo("Insta360 Studio");
  console.log(`window: ${win.left},${win.top} ${win.width}x${win.height} iconic=${win.iconic}`);
} catch {
  /* Studio may not be running */
}

const data = await readProject(file);
const clips = (data.tracks ?? []).flatMap((t, ti) => (t.clips ?? []).map((c) => ({ ti, c })));
console.log(`\nclips: ${clips.length}`);
for (const { ti, c } of clips) {
  const kf = keyframeNodes(c);
  const tr = transitionNodes(c);
  const media = String(c.url ?? "").split(/[\\/]/).pop();
  console.log(`  track ${ti} ${media}: ${kf.length} keyframe(s), ${tr.length} transition(s), enable_user_keyframe=${c.enable_user_keyframe ?? "-"}`);
  for (const k of kf) {
    console.log(`    t=${k.time} src_time=${k.src_time} pan=${k.pan} tilt=${k.tilt} roll=${k.roll} fov=${k.fov} distance=${k.distance} state=${k.state} name=${k.name}`);
  }
  for (const t of tr) console.log(`    trans ${t.name}  (${String(t.from).slice(0, 8)} -> ${String(t.to).slice(0, 8)}) type=${t.type} pts=${t.point1X},${t.point1Y},${t.point2X},${t.point2Y}`);
  if (!kf.length) console.log("    (no keyframes on this clip)");
}

// What our tool last wrote, for the comparison that matters.
const ours = { times: [0, 120, 237, 357], pan120: 6.108652381980153, tilt120: 1.7453292519943295 };
const target = clips.map((x) => x.c).find((c) => keyframeNodes(c).length);
const got = keyframeNodes(target ?? {}).map((k) => k.time);
const kept = ours.times.every((t) => got.includes(t));
const exact = keyframeNodes(target ?? {}).some((k) => k.time === 120 && Math.abs(k.pan - ours.pan120) < 1e-6 && Math.abs(k.tilt - ours.tilt120) < 1e-6);
console.log(`\nwe wrote times [${ours.times.join(",")}], file holds [${got.join(",")}]`);
console.log(`ACCEPTED: ${kept ? "yes — every keyframe survived Studio loading and saving the project" : "NO — a keyframe is missing"}`);
console.log(`values kept verbatim for our t=120 node: ${exact ? "yes" : "no (Studio rewrote them)"}`);
