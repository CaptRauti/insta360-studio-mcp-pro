// Does Studio accept a project file we wrote ourselves?
//
// The open question behind the whole "edit without the GUI" plan. A project is
// plain JSON, but that says nothing about whether Studio honours an edit or
// silently ignores the fields it does not like. This probe answers it the only
// way that counts: build a project from a real one, change something visible,
// let Studio load it, and read the change back.
//
// Usage:
//   node research/acceptance_probe.mjs [--fps 30] [--clip 1] [--effect "HD Fireworks"]
//
// It never touches the user's own project: the template is copied into a new
// project folder under TimelineProject/, and Studio is pointed at the copy.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import {
  readProject,
  writeProject,
  summarizeProject,
  clipLength,
  timelineLayout,
  relayout,
  cloneClip,
  reId,
  setEffect,
  setMediaProcess,
  makeTransition,
} from "../src/project.mjs";
import { assetLibrary, findAsset, studioDataRoot } from "../src/assets.mjs";

const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};

const root = studioDataRoot();
const projectsRoot = path.join(root, "TimelineProject");
const TEMPLATE_PROJECT = "mcpTest";
const TARGET = "mcpAcceptance";

// The template's own project file.
const templateDir = path.join(projectsRoot, TEMPLATE_PROJECT);
const templateFiles = fs.readdirSync(templateDir).filter((f) => f.endsWith(".insproj") && !f.endsWith("_backup.insproj"));
if (!templateFiles.length) {
  console.error(`no .insproj found in ${templateDir}`);
  process.exit(2);
}
const templateFile = path.join(templateDir, templateFiles[0]);

const targetDir = path.join(projectsRoot, TARGET);
fs.mkdirSync(targetDir, { recursive: true });
const targetFile = path.join(targetDir, `${TARGET}.insproj`);

const data = await readProject(templateFile);
const before = summarizeProject(data);
console.log(`Template : ${templateFile}`);
console.log(`  ${before.clips.length} Clips, ${before.frames} Frames, ${before.fps} fps`);
for (const c of before.clips) {
  console.log(`   [${c.index}] ${c.name} start=${c.startFrame} src=${c.sourceTotalFrames} trim=${c.leftTrim}/${c.rightTrim} -> len ${clipLength(c)}`);
}
console.log("Layout laut Datei:", JSON.stringify(timelineLayout(data)));

// ---------------------------------------------------------------------------
// The edit under test: take the first clip, cut it to a known length, put an
// effect on it, and switch a colour feature on. Every one of these is visible
// from outside: the trim changes the clip's length, the effect shows in
// effect_filter, the colour switch in media_process.
// ---------------------------------------------------------------------------
const target = Number(arg("clip", "0"));
const video = data.tracks.find((t) => t.type === 0) ?? data.tracks[0];
const clip = video.clips[target];
if (!clip) {
  console.error(`no clip at index ${target}`);
  process.exit(2);
}

const wantEffectName = arg("effect", "HD Fireworks");
const fx = findAsset("filter", wantEffectName);
if (!fx.ok) {
  console.error("effect not found:", fx.error, fx.candidates);
  process.exit(2);
}
console.log(`\nEffekt: ${fx.asset.name} -> ${fx.asset.resource}`);

// A trim of a fixed number of frames off both ends — the length is then exactly
// `source_total_frames - 2*trim`, so a wrong number cannot be mistaken for a
// rounding difference.
const trim = Number(arg("trim", "30"));
const originalTotal = clip.source_total_frames ?? clip.sourceFrames;
clip.leftTrim = trim;
clip.rightTrim = trim;

setEffect(clip, {
  id: fx.asset.name,
  name: fx.asset.name,
  resourcePath: fx.asset.resource,
  opacity: 55,
});
setMediaProcess(clip, {
  enableColorAdjust: true,
  colorAdjustContrast: 25,
  colorAdjustSaturation: 20,
});

// A transition between clip 0 and clip 1, if there is a second clip.
const transitionAsset = findAsset("transition", "Portal");
if (video.clips.length >= 2 && transitionAsset.ok) {
  video.transitions = [
    makeTransition({
      resourceId: transitionAsset.asset.id,
      resourcePath: transitionAsset.asset.resource,
      prevClip: video.clips[0].id,
      nextClip: video.clips[1].id,
      frames: 30,
    }),
  ];
  console.log(`Transition: ${transitionAsset.asset.name}`);
}

data.id = "mcpAcceptance0000000000000000000000".slice(0, 36);
data.name = TARGET;
data.projectPath = targetDir.replace(/\\/g, "/");
relayout(data);

const written = await writeProject(targetFile, data, { backup: false });
console.log(`\nGeschrieben: ${written.file} (${written.bytes} B)`);
const expectedLen = originalTotal - 2 * trim;
console.log(`Erwartet: Clip ${target} hat danach ${expectedLen} Frames (Quelle ${originalTotal} - 2*${trim})`);
console.log("Layout nach Edit:", JSON.stringify(timelineLayout(data)));

// Read back and confirm the file on disk carries the edit (rules out a write
// that silently dropped fields).
const back = await readProject(targetFile);
const backClip = (back.tracks.find((t) => t.type === 0) ?? back.tracks[0]).clips[target];
console.log("\n--- Rueckgelesen von Platte ---");
console.log(`  leftTrim=${backClip.leftTrim} rightTrim=${backClip.rightTrim} -> len ${clipLength(backClip)}`);
console.log(`  effect_filter=${JSON.stringify(backClip.effect_filter)}`);
console.log(`  enableColorAdjust=${backClip.media_process?.enableColorAdjust} contrast=${backClip.media_process?.colorAdjustContrast}`);
console.log(`  transitions=${back.tracks.find((t) => t.type === 0)?.transitions?.length ?? 0}`);

fs.writeFileSync(
  path.join(os.homedir(), "AppData", "Local", "hermes", "cache", "scratch", "acceptance_expected.json"),
  JSON.stringify({ targetFile, targetDir, clipIndex: target, expectedLen, effect: fx.asset.name, trim }, null, 2)
);
console.log(`\nProjekt zum Laden bereit: ${targetFile}`);
