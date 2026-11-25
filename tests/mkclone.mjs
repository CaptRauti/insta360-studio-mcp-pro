// mkclone.mjs <name> <template.insproj> <source> [...] — build without harvesting.
//
// buildProject harvests clips from every project on disk and prefers a harvested
// clip as the model for a file. That is right in principle (it carries Studio's own
// metadata for that file) but it also means a bad model can be picked. This variant
// clones the template clip only, so the result differs from a working project in as
// few fields as possible — the baseline for A/B runs.
import { readProject, newProjectFrom, writeProject, BUILD_MARKER } from "../src/project.mjs";
import { writeAndRegister } from "../src/pipeline.mjs";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const [name, templateFile, ...sources] = process.argv.slice(2);
if (!name || !templateFile || !sources.length) {
  console.error("usage: node tests/mkclone.mjs <name> <template.insproj> <source> [...]");
  process.exit(1);
}

const template = await readProject(templateFile);
const dir = `D:/Dokumente/Insta360/Studio/TimelineProject/${name}`;
const project = newProjectFrom(template, { name, projectPath: dir, sources, clipModels: new Map() });

mkdirSync(dir, { recursive: true });
writeFileSync(path.join(dir, BUILD_MARKER), JSON.stringify({ project: name, at: new Date().toISOString() }));
const written = await writeAndRegister({ name, project });
console.log(`geklont: ${name} -> ${written.file}`);