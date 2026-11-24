// Create a project on disk without touching the GUI, then hand it to Studio.
//
// This is the half of the pipeline that does not need the UI: pick source
// footage, lay out a timeline, attach effects and transitions, and write a
// valid `.insproj` plus the entry in Studio's project list (`pro.insproj`).
// Studio then only has to open it — which is the part that has to be driven
// through the GUI, because the exporter resolves footage from its own project
// state and ignores anything handed to it over gRPC.
//
// Usage:
//   node research/new_project_e2e.mjs --name mcpAuto --clips 3 [--dry]

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { readProject, writeProject, newProjectFrom, summarizeProject, timelineLayout, relayout, makeTransition, setEffect, trimClip } from "../src/project.mjs";
import { assetLibrary, findAsset, librarySummary } from "../src/assets.mjs";

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d;
};
const flag = (n) => argv.includes(`--${n}`);

const TEMPLATE = "D:/Dokumente/Insta360/Studio/TimelineProject/mcpTest/2a9983c4-276b-40ff-89ad-71410aac9aad.insproj";
const PROJECTS_ROOT = "D:/Dokumente/Insta360/Studio/TimelineProject";
const PRO_LIST = path.join(os.homedir(), "AppData/Local/Insta360/Insta360 Studio/nle/pro.insproj");

const name = arg("name", "mcpAuto");
const clipCount = Number(arg("clips", "3"));

const template = await readProject(TEMPLATE);
const tsum = summarizeProject(template);
console.log("=== Vorlage ===");
console.log(`  name=${tsum.name} fps=${tsum.fps} ar=${tsum.aspectRatio} frames=${tsum.frames}`);
console.log(`  clips=${tsum.clips.length}`);
for (const c of tsum.clips) {
  console.log(`    [${c.track}/${c.index}] ${c.name}  url=${c.url}  start=${c.startFrame} len=${(c.sourceTotalFrames ?? 0) - (c.leftTrim ?? 0) - (c.rightTrim ?? 0)}`);
}

// Take the source files the template already references — they exist on disk.
const sources = [...new Set(tsum.clips.map((c) => c.url).filter(Boolean))].slice(0, clipCount);
console.log(`\n=== Quellen (${sources.length}) ===`);
for (const s of sources) console.log(`  ${s}  ${fs.existsSync(s) ? "OK" : "FEHLT"}`);

const lib = assetLibrary();
const filt = findAsset("filter", "fireworks");
const trans = findAsset("transition", lib.kinds.transition?.[0]?.name ?? "");
console.log(`\n=== Assets (Katalog: ${Object.entries(librarySummary().counts).map(([k, v]) => `${k}=${v}`).join(" ")} ) ===`);
console.log(`  Effekt: ${filt.ok ? `${filt.asset.name} -> ${filt.asset.resource}` : "nicht gefunden"}`);
console.log(`  Transition: ${trans.ok ? `${trans.asset.name} -> ${trans.asset.resource}` : "nicht gefunden"}`);

const projectDir = path.join(PROJECTS_ROOT, name);
const projectPath = projectDir.replace(/\\/g, "/");
const project = newProjectFrom(template, { name, projectPath, sources });

// Lay the clips out end to end and cut a little off each so the timeline is
// visibly not the raw footage.
const video = project.tracks.find((t) => t.type === 0);
video.clips.forEach((c, i) => {
  c.leftTrim = i * 10;
  c.rightTrim = 10;
  c.name = path.basename(sources[i]);
});
relayout(project);

// One effect and one transition, so opening the project shows something.
if (filt.ok && video.clips[0]) {
  setEffect(video.clips[0], { id: filt.asset.id, name: filt.asset.name, resourcePath: filt.asset.resource, opacity: 70 });
}
if (trans.ok && video.clips.length >= 2) {
  video.transitions.push(makeTransition({
    resourceId: trans.asset.id,
    resourcePath: trans.asset.resource,
    prevClip: video.clips[0].id,
    nextClip: video.clips[1].id,
    frames: 30,
  }));
}

const summary = summarizeProject(project);
console.log(`\n=== Neues Projekt "${name}" ===`);
console.log(`  id=${summary.id}`);
console.log(`  path=${projectPath}`);
console.log(`  fps=${summary.fps} ar=${summary.aspectRatio} frames=${summary.frames}`);
for (const c of summary.clips) {
  console.log(`    [${c.track}/${c.index}] ${c.name} start=${c.startFrame} trim=${c.leftTrim}/${c.rightTrim}`);
}
console.log("  Layout:", JSON.stringify(timelineLayout(project).map((l) => ({ start: l.actualStart, len: l.length, drift: l.drift }))));
console.log(`  Transitions: ${video.transitions.length}`);
console.log(`  Effekt auf Clip 0: ${video.clips[0]?.effect_filter?.externfilterName || "-"}`);

if (flag("dry")) {
  console.log("\n--dry: nichts geschrieben.");
  process.exit(0);
}

fs.mkdirSync(projectDir, { recursive: true });
const out = path.join(projectDir, `${summary.id}.insproj`);
const w = await writeProject(out, project, { backup: false });
console.log(`\ngeschrieben: ${w.filePath} (${w.bytes} bytes)`);

// Register in Studio's project list so it shows up in Projektbibliothek.
const list = JSON.parse(fs.readFileSync(PRO_LIST, "utf8"));
list.projects = (list.projects ?? []).filter((p) => p.name !== name);
list.projects.push({
  adsorbable: true,
  aspectRatio: project.aspectRatio ?? "16:9",
  autoFps: false,
  creationTime: project.creationTime,
  enableEffects: true,
  fps: project.fps ?? 30,
  frames: project.frames ?? 0,
  id: summary.id,
  isPanoramic: project.isPanoramic ?? false,
  lastModifiedTime: project.lastModifiedTime,
  lowQualityProxyType: -1,
  mainMagnetizable: true,
  markTrimEnd: project.markTrimEnd ?? 0,
  markTrimIn: project.markTrimIn ?? 0,
  markTrimVisible: false,
  name,
  previewable: false,
  projectMediaType: "",
  projectPath,
});
fs.writeFileSync(PRO_LIST, JSON.stringify(list, null, 4), "utf8");
console.log(`registriert in ${PRO_LIST} (${list.projects.length} Projekte)`);
