// The keyframe schema, read from a project Studio wrote itself.
//
// Clips live in tracks[].clips -- not in a top-level clips array -- and that is why an
// earlier pass concluded "key_frame_track is empty everywhere": it looked in the wrong
// place. Lamspringe, a real edited project on this machine, carries 21 clips with real
// keyframes, so the schema is measurable without making a specimen first.
//
//   node research/keyframe_truth.mjs [projectDir] [clipIndex]
import fs from "node:fs";
import path from "node:path";
import { readProject } from "../src/project.mjs";

const dir = process.argv[2] ?? "D:/Dokumente/Insta360/Studio/TimelineProject/Lamspringe";
const file = path.join(dir, fs.readdirSync(dir).find((f) => f.endsWith(".insproj") && !f.includes("_backup")));
const project = await readProject(file);

const clips = (project.tracks ?? []).flatMap((t, ti) => (t.clips ?? []).map((c) => ({ clip: c, ti })));
console.log(`${path.basename(dir)}: tracks=${project.tracks?.length} clips=${clips.length} pano=${project.isPanoramic} fps=${project.fps} frames=${project.frames}`);

const keyed = clips.filter(({ clip }) => {
  const k = clip.key_frame_track;
  return k && (Array.isArray(k) ? k.length : Object.keys(k ?? {}).length);
});
console.log(`clips with a non-empty key_frame_track: ${keyed.length}`);

const summary = (clip) => ({
  media: String(clip.url ?? clip.name ?? "").split(/[\\/]/).pop(),
  type: clip.type,
  viewType: clip.viewType,
  enable_user_keyframe: clip.enable_user_keyframe,
  ratio: clip.ratio,
  startFrame: clip.startFrame,
  sourceFrames: clip.sourceFrames,
  kfKeys: clip.key_frame_track ? Object.keys(clip.key_frame_track) : null,
});

for (const { clip } of keyed.slice(0, 3)) console.log(JSON.stringify(summary(clip)));

const pick = keyed[Number(process.argv[3] ?? 0)] ?? keyed[0] ?? clips[0];
console.log(`\n=== full key_frame_track of ${summary(pick.clip).media} ===`);
console.log(JSON.stringify(pick.clip.key_frame_track, null, 2).slice(0, 4000));
console.log(`\n=== camera_transform ===`);
console.log(JSON.stringify(pick.clip.camera_transform, null, 2).slice(0, 1200));
console.log(`\n=== camera_movement ===`);
console.log(JSON.stringify(pick.clip.camera_movement, null, 2).slice(0, 1200));
