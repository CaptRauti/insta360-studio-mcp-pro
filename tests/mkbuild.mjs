// mkbuild.mjs <name> <source> [...] — build a project the supported way.
//
// Uses pipeline.buildProject + writeAndRegister, i.e. the clone-a-real-project path,
// not the hand-rolled JSON that earlier probes used. Those minimal clips carried no
// `type`/`media_process`, so Studio read them as stills ("fsType kImage") and sat on
// "Lade Dateien" — measuring anything against them was measuring the wrong thing.
import { buildProject, writeAndRegister } from "../src/pipeline.mjs";

const argv = process.argv.slice(2);
const templateFlag = argv.indexOf("--template");
const template = templateFlag >= 0 ? argv[templateFlag + 1] : undefined;
const rest = argv.filter((a, i) => a !== "--template" && i !== templateFlag + 1);
const [name, ...sources] = rest;
if (!name || !sources.length) {
  console.error("usage: node tests/mkbuild.mjs <name> <source> [...] [--template <insproj>]");
  process.exit(1);
}

const built = await buildProject({
  name,
  template,
  projectPath: `D:/Dokumente/Insta360/Studio/TimelineProject/${name}`,
  clips: sources.map((source) => ({ source })),
});
const written = await writeAndRegister({ name, project: built.project });
console.log(`gebaut: ${name}`);
console.log(`  Datei:   ${written.file ?? written.projectFile ?? JSON.stringify(written).slice(0, 200)}`);
console.log(`  Clips:   ${JSON.stringify(built.report.map((r) => ({ sourceFrames: r.sourceFrames, trim: r.trim, length: r.length })))}`);
console.log(`  Timeline: ${built.summary.frames} Frames @ ${built.summary.fps} fps`);