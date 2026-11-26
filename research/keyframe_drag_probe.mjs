// Find the preview and write a real keyframe with a right-button drag.
//
// Studio's own guide string says the view keyframe comes from a right-drag over the
// preview ("Halte die rechte Maustaste gedrückt und ziehe, um die Ansicht mit
// Keyframes festzulegen"), but the preview has no accessible tree and, with vision
// unavailable, guessing its rectangle is the only way in. So the search is driven by
// the project file, which is the ground truth: a drag that wrote a keyframe shows up
// in key_frame_track. Points that miss are harmless — the worst case is a context
// menu, dismissed with ESC.
//
//   node research/keyframe_drag_probe.mjs <project.insproj> [name]
import fs from "node:fs";
import { rightDrag } from "../src/ui.mjs";
import { readScreen } from "../src/editor.mjs";
import { readProject } from "../src/project.mjs";

const file = process.argv[2];
const name = process.argv[3] ?? "mcpKey";
if (!file) {
  console.log("usage: keyframe_drag_probe.mjs <project.insproj> [projectName]");
  process.exit(1);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const trackOf = async () => {
  const d = await readProject(file);
  // Clips live in tracks[].clips — a top-level clips/mediaClips lookup reports 0 for every
  // project on this machine and quietly makes the whole probe meaningless.
  const clips = (d.tracks ?? []).flatMap((t) => t.clips ?? []);
  const out = [];
  for (const c of clips) {
    const t = c.key_frame_track ?? c.keyFrameTrack;
    if (t && (Array.isArray(t) ? t.length : Object.keys(t).length)) out.push(t);
  }
  // Not the file mtime: Studio autosaves continuously, so the mtime changes after every
  // drag whether or not anything was written. Only the keyframe content is evidence.
  return { clips: clips.length, tracks: out };
};

const before = await trackOf();
console.log(`before: clips=${before.clips} keyframed=${before.tracks.length}`);

// The preview of a 1384x900 editor: right of the browser panel, above the timeline.
// Sweep the plausible area; a hit is decided by the file, not by the screen.
const points = [];
for (const y of [200, 300, 400, 500]) {
  for (const x of [750, 950, 1150, 1300]) points.push({ x, y });
}

let hit = null;
for (const p of points) {
  const r = rightDrag({ from: p, to: { x: p.x + 220, y: p.y + 70 }, direct: true });
  await sleep(3500);
  const now = await trackOf();
  console.log(`drag ${p.x},${p.y} -> style=${r?.style} clips=${now.clips} keyframed=${now.tracks.length}`);
  if (now.tracks.length) {
    hit = { p, track: now.tracks[0] };
    break;
  }
}

if (hit) {
  console.log(`\nKEYFRAME WRITTEN by dragging from ${hit.p.x},${hit.p.y}`);
  console.log(JSON.stringify(hit.track, null, 2).slice(0, 2000));
} else {
  console.log("\nno keyframe from any drag point");
}
console.log(`\nscreen after: ${(readScreen({}).text ?? "").replace(/\s+/g, " ").slice(0, 220)}`);
