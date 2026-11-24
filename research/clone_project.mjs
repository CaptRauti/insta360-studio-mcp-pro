// Clone a project file under a new name and directory, self-consistently.
//
// Purpose: isolate "is our JSON wrong?" from "does Studio tolerate a project
// that was renamed/moved?". A clone of a Studio-authored project keeps every
// field byte-identical and changes only what a rename must change (id, name,
// projectPath, timestamps) — so if the clone loads and a built project does not,
// the difference is content; if the clone also hangs on "Lade Dateien...", the
// rename/move itself is the cause.
//
// Studio names the project file after the project's internal `id`, so the clone
// needs a new id, not just a new file name.
//
// Usage: node research/clone_project.mjs --from Lamspringe --to LamspringeKlon
//        node research/clone_project.mjs --from <projectDir> --to <newName> [--same-id]

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { studioRoots } from "../src/assets.mjs";

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d;
};
const flag = (n) => argv.includes(`--${n}`);

const roots = studioRoots();

const from = arg("from");
const to = arg("to");
if (!from || !to) {
  console.error("usage: node research/clone_project.mjs --from <name|projectDir> --to <newName> [--same-id]");
  process.exit(2);
}

// Resolve the source directory: a path if it looks like one, else a library name.
let srcDir = from;
if (!fs.existsSync(srcDir)) {
  const lib = JSON.parse(fs.readFileSync(roots.library, "utf8"));
  const hit = (lib.projects ?? []).find((p) => p.name === from);
  if (!hit) {
    console.error(`kein Projekt namens "${from}" in der Bibliothek und kein Verzeichnis dieser Name`);
    process.exit(2);
  }
  srcDir = hit.projectPath.replace(/\//g, path.sep);
}

const srcFiles = fs.readdirSync(srcDir).filter((f) => f.endsWith(".insproj") && !f.endsWith("_backup.insproj"));
if (!srcFiles.length) {
  console.error(`keine .insproj in ${srcDir}`);
  process.exit(2);
}

const srcFile = path.join(srcDir, srcFiles[0]);
const project = JSON.parse(fs.readFileSync(srcFile, "utf8"));

const dstDir = path.join(path.dirname(srcDir), to);
// A faithful copy carries the project's own assets too (first_frame.jpg,
// project_album_info.data, the deep-track cache directory) — otherwise the
// rewritten paths would point at nothing and the experiment would test a
// dangling path we created ourselves rather than the rename.
fs.rmSync(dstDir, { recursive: true, force: true });
fs.cpSync(srcDir, dstDir, { recursive: true });
for (const f of fs.readdirSync(dstDir).filter((f) => f.endsWith(".insproj"))) {
  fs.rmSync(path.join(dstDir, f), { force: true });
}

// A rename must change identity; everything else stays byte-identical.
const id = flag("same-id") ? project.id : crypto.randomUUID().toUpperCase();
const now = new Date();
const stamp = (d) =>
  `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ` +
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

project.id = id;
project.name = to;
const oldPath = project.projectPath;            // captured before overwriting
project.projectPath = dstDir.replace(/\\/g, "/");
project.creationTime = stamp(now);
project.lastModifiedTime = stamp(now);

// A move rewrites every path that pointed into the old project directory
// (deep-track caches and save paths live inside the clips). Leaving them behind
// would make a hang ambiguous: "renamed" and "dangling cache path" would look
// the same.
const dstFile = path.join(dstDir, `${id}.insproj`);
let text = JSON.stringify(project, null, 4);
if (oldPath && !flag("keep-old-paths")) {
  const before = text.split(oldPath).length - 1;
  text = text.split(oldPath).join(project.projectPath);
  if (before) console.log(`  ${before} Pfadverweise auf den alten Projektordner umgeschrieben`);
}
fs.writeFileSync(dstFile, text, "utf8");
console.log(`geklont: ${srcFile}`);
console.log(`     ->  ${dstFile}`);
console.log(`  name=${to} id=${id} projectPath=${project.projectPath}`);

// Register it, copying the entry shape from a project STUDIO wrote — never from
// one of ours, or our own stale frame counts leak into the new entry.
const lib = JSON.parse(fs.readFileSync(roots.library, "utf8"));
if (!Array.isArray(lib.projects)) {
  console.error(`unerwartete Bibliotheksform in ${roots.library}`);
  process.exit(2);
}
const hasOwnMarker = (p) => {
  try {
    return fs.existsSync(path.join(p.projectPath.replace(/\//g, path.sep), ".mcp-built"));
  } catch {
    return true;
  }
};
const studioEntry = lib.projects.find((p) => !hasOwnMarker(p) && fs.existsSync(p.projectPath.replace(/\//g, path.sep)));
const model = studioEntry ?? lib.projects[0] ?? {};
if (!studioEntry) console.log("  Hinweis: kein Studio-eigener Eintrag gefunden, Hüllenform von einem eigenen kopiert");

const entry = JSON.parse(JSON.stringify(model));
entry.name = to;
entry.id = project.id;
entry.projectPath = project.projectPath;
entry.creationTime = project.creationTime;
entry.lastModifiedTime = project.lastModifiedTime;
entry.fps = project.fps;
entry.frames = project.frames;
entry.markTrimIn = project.markTrimIn ?? 0;
entry.markTrimEnd = project.markTrimEnd ?? project.frames ?? 0;
entry.markTrimVisible = false;

const existing = lib.projects.findIndex((p) => p.name === to || p.projectPath === project.projectPath);
if (existing >= 0) lib.projects[existing] = entry;
else lib.projects.push(entry);
fs.writeFileSync(roots.library, JSON.stringify(lib, null, 4), "utf8");
console.log(`  registriert (${lib.projects.length} Projekte in ${roots.library})`);
