// §0's last measurement: a project this server built, short enough to export in a
// minute. One 360 clip, 1.8 s, the same file a GUI export has already been proven on.
// buildProject() only builds in memory — writeProject() is what puts it on disk,
// and the folder Studio expects is <projectsRoot>/<name>/<project-id>.insproj. The
// script asserts the file is really there: a build that silently wrote nothing
// looks exactly like a successful one until the open fails.
import { existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { buildProject, findTemplate, projectsRoot } from "../src/pipeline.mjs";
import { writeProject } from "../src/project.mjs";

const name = process.argv[2] ?? "mcpExportLive";
const source = process.argv[3] ?? "D:/Videos/X6/Camera01/VID_20260917_193416_00_002.insv";
const frames = Number(process.argv[4] ?? 0); // 0 = whole clip
const dir = join(projectsRoot(), name);
const projectPath = dir.replaceAll("\\", "/");

const built = await buildProject({
  name,
  projectPath,
  template: findTemplate({ exclude: ["mcpEdit", "metaCheck", name] }),
  clips: [frames > 0 ? { source, start: 0, end: frames } : { source }],
});
built.project.projectPath = projectPath;

const file = join(dir, `${built.project.id}.insproj`);
mkdirSync(dir, { recursive: true });
await writeProject(file, built.project);
if (!existsSync(file)) throw new Error(`writeProject reported success but ${file} is not there`);

const video = built.project.tracks.find((t) => t.type === 0);
console.log(`projects root : ${projectsRoot()}`);
console.log(`project       : ${built.project.name}  id=${built.project.id}  (${built.project.frames} frames @ ${built.project.fps} fps)`);
console.log(`file          : ${file}  (${statSync(file).size} bytes)`);
for (const [i, c] of video.clips.entries()) {
  console.log(`  clip ${i}: name=${JSON.stringify(c.name)}  sourceFrames=${c.sourceFrames}  trim=${c.leftTrim}/${c.rightTrim}  url=${c.url}`);
}