// Write a real two-keyframe specimen and read the schema back.
//
// What the first runs got wrong: the Studio window sat at x=2796 on a 2048-wide desktop,
// i.e. entirely off-screen, and a drag there did nothing at all — the app only processes
// the input once the window is inside the virtual desktop. With it moved on-screen the
// same right-drag writes a keyframe immediately.
//
// The schema is the point: key_frame_track is an object with node_list, and each node is
//   { auto_fov, distance, fov, is_headtrack, name (uuid), node_type, pan, roll,
//     src_time, state, tilt, time }
// pan/tilt are the view angles in radians, time is the node's time on the clip. Two nodes
// at different times with different angles is what makes the fixture worth testing against.
//
//   node research/keyframe_specimen.mjs <projectDir>
import fs from "node:fs";
import path from "node:path";
import { readProject } from "../src/project.mjs";
import { keyMsg, redraw, rightDrag, windowInfo } from "../src/ui.mjs";

const dir = process.argv[2] ?? "D:/Dokumente/Insta360/Studio/TimelineProject/mcpKey";
const file = path.join(dir, fs.readdirSync(dir).find((f) => f.endsWith(".insproj") && !f.includes("_backup")));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const readTrack = async () => {
  const d = await readProject(file);
  const clips = (d.tracks ?? []).flatMap((t) => t.clips ?? []);
  const withTrack = clips.map((c, i) => ({ i, media: String(c.url ?? "").split(/[\\/]/).pop(), track: c.key_frame_track }));
  return { clips, withTrack, keyed: withTrack.filter((c) => c.track && Object.keys(c.track ?? {}).length) };
};

const win = windowInfo("Insta360 Studio");
console.log(`window ${win.left},${win.top} ${win.width}x${win.height} iconic=${win.iconic}`);
const desktop = { right: win.monitor?.right ?? 2048, bottom: win.monitor?.bottom ?? 1280 };
if (win.left >= desktop.right || win.top >= desktop.bottom) {
  console.log(`ABORT: the window is off the desktop (${win.left},${win.top} vs ${desktop.right}x${desktop.bottom}); input would be ignored`);
  process.exit(1);
}

const before = await readTrack();
console.log(`clips=${before.clips.length} already keyframed=${before.keyed.length}`);
for (const c of before.withTrack) console.log(`  clip ${c.i}: ${c.media} kf=${c.track && Object.keys(c.track).length ? "yes" : "no"}`);

// Keyframe 1 at the current playhead, then move the playhead well away and write a
// second one with a different view — one node alone cannot show how the track behaves.
redraw({});
rightDrag({ from: { x: 750, y: 200 }, to: { x: 980, y: 260 }, direct: true });
await sleep(3500);

// Plain keys only (a chord cannot be delivered quietly), so the playhead walks in steps.
const steps = Number(process.argv[3] ?? 240);
for (let i = 0; i < steps; i += 60) {
  keyMsg({ key: "RIGHT", repeat: Math.min(60, steps - i) });
  await sleep(300);
}
await sleep(1500);
redraw({});
rightDrag({ from: { x: 1000, y: 380 }, to: { x: 1180, y: 300 }, direct: true });
await sleep(4000);

const after = await readTrack();
console.log(`\nclips=${after.clips.length} keyframed=${after.keyed.length}`);
for (const c of after.keyed) {
  const nodes = c.track?.node_list ?? [];
  console.log(`\n=== ${c.media} : ${nodes.length} node(s) ===`);
  console.log(JSON.stringify(c.track, null, 2).slice(0, 3000));
  // Two node kinds: node_type 0 is a view keyframe (pan/tilt/roll + fov), node_type 1 is
  // the transition node between two of them and carries point1/point2, not angles. Its
  // name is "<fromUuid>-<toUuid>", which is how a track knows what follows what.
  const kf = nodes.filter((n) => n.node_type === 0);
  console.log(`  keyframe nodes: ${kf.length}  times: ${kf.map((n) => n.time).join(", ")}`);
  console.log(`  pan/tilt: ${kf.map((n) => `${n.pan.toFixed(3)}/${n.tilt.toFixed(3)}`).join("  ")}`);
  console.log(`  transition nodes: ${nodes.filter((n) => n.node_type === 1).length}`);
}
