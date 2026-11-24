// Build a project from real camera media and print the clip names Studio will see.
//
// §0 needs a project this server built, from media that is NOT in the harvest
// library (the library path already produced Studio's short names — the fallback
// is what did not). Usage: node research/build_real_project.mjs [name]
import { buildProject, findTemplate, projectsRoot } from "../src/pipeline.mjs";

const name = process.argv[2] ?? "mcpNameCheck";
const sources = [
  "D:/Videos/Lamspringe26/VID_20260822_190557_049.mp4", // ingested name -> VID_049.mp4
  "F:/Luna/VID_20261112_051426_001.mp4", //                ingested name -> VID_001.mp4
];

const built = await buildProject({ name, template: findTemplate({ exclude: ["mcpEdit", "metaCheck", name] }), clips: sources.map((source) => ({ source })) });
const video = built.project.tracks.find((t) => t.type === 0);
console.log(`projects root : ${projectsRoot()}`);
console.log(`project       : ${built.project.name}  (${built.project.frames} frames @ ${built.project.fps} fps)`);
console.log(`file          : ${built.file ?? built.projectFile ?? "(see list)"}`);
for (const [i, c] of video.clips.entries()) {
  console.log(`  clip ${i}: name=${JSON.stringify(c.name)}  sourceFrames=${c.sourceFrames}  url=${c.url}`);
}
