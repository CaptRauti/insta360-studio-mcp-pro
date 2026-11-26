// Build a flat (16:9) project around a real 360 clip, so the project page offers
// the keyframe control and Studio will write a `key_frame_track` we can read.
//
// `key_frame_track` is `{}` in all 25 projects on this machine, so the keyframe
// schema has to come from a project Studio itself wrote. Usage:
//   node research/build_key_project.mjs [name]
import { buildProject, findTemplate, projectsRoot, writeAndRegister } from "../src/pipeline.mjs";

const name = process.argv[2] ?? "mcpKey";
// 360 footage: keyframes are 360 reframing, and the project page wants a flat ratio.
const sources = [
  { source: "D:/Videos/X6/Camera01/VID_20260917_192757_00_001.insv" },
  { source: "D:/Videos/X6/Camera01/VID_20260917_193416_00_002.insv" },
];

const built = await buildProject({
  name,
  template: findTemplate({ exclude: [name] }),
  fps: 30,
  aspectRatio: "16:9",
  clips: sources,
});
const registered = await writeAndRegister({ name, project: built.project, overwrite: true });
const video = built.project.tracks.find((t) => t.type === 0);
console.log(`projects root : ${projectsRoot()}`);
console.log(`project       : ${built.project.name}  (${built.project.frames} frames @ ${built.project.fps} fps, ${built.project.aspectRatio})`);
console.log(`dir           : ${registered.dir ?? registered.projectPath ?? "(see register reply)"}`);
console.log(JSON.stringify(registered, null, 1).slice(0, 800));
for (const [i, c] of video.clips.entries()) {
  console.log(`  clip ${i}: name=${JSON.stringify(c.name)}  sourceFrames=${c.sourceFrames}  fps=${c.fps}  url=${c.url}`);
}
