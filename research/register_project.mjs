// Register a project in Studio's project library, so Studio actually lists it.
//
// Why this is needed: passing a `.insproj` path on the command line does *not*
// make Studio open it. Measured — Studio started with
// `Insta360 Studio.exe <path>/mcpAcceptance.insproj` came up with an empty
// player and the message "Bitte importiere lokale Dateien", and left the library
// file untouched. Studio's own library lives in
// `AppData/Local/Insta360/Insta360 Studio/nle/pro.insproj` and is a plain list of
// `{ name, id, projectPath, fps, frames, ... }` entries; a project shows up there
// only after Studio itself created or imported it.
//
// So a project we build has to be announced in that list as well as written to
// disk. This module does that, keeping the entry's shape identical to what Studio
// writes (the fields it stores for a real project are copied, not invented).
//
// Usage: node research/register_project.mjs <name> <projectDir> [--unregister]

import fs from "node:fs";
import path from "node:path";
import { studioRoots } from "../src/assets.mjs";
import { BUILD_MARKER } from "../src/pipeline.mjs";

const [name, projectDir] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const unregister = process.argv.includes("--unregister");

if (!name || !projectDir) {
  console.error("usage: node research/register_project.mjs <name> <projectDir> [--unregister]");
  process.exit(2);
}

const roots = studioRoots();
const libraryFile = roots.library;
const lib = JSON.parse(fs.readFileSync(libraryFile, "utf8"));
if (!Array.isArray(lib.projects)) {
  console.error(`unexpected library shape in ${libraryFile}`);
  process.exit(2);
}

const projectPath = projectDir.replace(/\\/g, "/");
const existing = lib.projects.findIndex((p) => p.name === name || p.projectPath === projectPath);

if (unregister) {
  if (existing >= 0) {
    lib.projects.splice(existing, 1);
    fs.writeFileSync(libraryFile, JSON.stringify(lib, null, 4), "utf8");
    console.log(`entfernt: ${name}`);
  } else {
    console.log(`nicht gefunden: ${name}`);
  }
  process.exit(0);
}

// The project file itself — its id and frame count are what the entry mirrors.
const projFiles = fs.readdirSync(projectDir).filter((f) => f.endsWith(".insproj") && !f.endsWith("_backup.insproj"));
if (!projFiles.length) {
  console.error(`no .insproj in ${projectDir}`);
  process.exit(2);
}
const project = JSON.parse(fs.readFileSync(path.join(projectDir, projFiles[0]), "utf8"));

// Copy the shape from a real entry, so no field is invented. The reference must
// be a project Studio created itself — never one of ours, or our own stale frame
// counts and flags leak into the new entry. Ours are recognisable by the
// `.mcp-built` marker in their project directory.
const hasOwnMarker = (p) => {
  try {
    return fs.existsSync(path.join(p.projectPath.replace(/\//g, path.sep), BUILD_MARKER));
  } catch {
    return true;
  }
};
const studioEntry = lib.projects.find(
  (p) => !hasOwnMarker(p) && fs.existsSync(p.projectPath.replace(/\//g, path.sep))
);
const model = studioEntry ?? lib.projects[0] ?? {};
const entry = JSON.parse(JSON.stringify(model));
const now = new Date();
const stamp = (d) =>
  `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ` +
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;

entry.name = name;
entry.id = project.id;
entry.projectPath = projectPath;
entry.creationTime = project.creationTime ?? stamp(now);
entry.lastModifiedTime = project.lastModifiedTime ?? stamp(now);
entry.fps = project.fps;
entry.frames = project.frames;
entry.markTrimIn = project.markTrimIn ?? 0;
entry.markTrimEnd = project.markTrimEnd ?? project.frames ?? 0;
entry.markTrimVisible = false;

if (existing >= 0) lib.projects[existing] = entry;
else lib.projects.push(entry);

fs.writeFileSync(libraryFile, JSON.stringify(lib, null, 4), "utf8");
console.log(`registriert: ${name}`);
console.log(`  id=${entry.id} frames=${entry.frames} fps=${entry.fps}`);
console.log(`  path=${entry.projectPath}`);
console.log(`  Bibliothek: ${libraryFile} (${lib.projects.length} Projekte)`);
