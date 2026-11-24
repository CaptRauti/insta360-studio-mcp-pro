// Dump what makes one clip different from another in a real project.
//
// Purpose: find the fields that identify the SOURCE FILE, as opposed to per-clip
// editing state. Cloning a template clip and repointing only `url` produced
// projects Studio loads but refuses to export ("Materialdatei verloren
// gegangen"), so some file-identifying field is not being updated.
//
// Usage: node research/clip_fields.mjs [project.insproj]

import fs from "node:fs";
import { readProject } from "../src/project.mjs";

const P = process.argv[2] || "D:/Dokumente/Insta360/Studio/TimelineProject/mcpTest/2a9983c4-276b-40ff-89ad-71410aac9aad.insproj";

const d = await readProject(P);
const v = d.tracks.find((t) => t.type === 0);
const c0 = v.clips[0];
const c1 = v.clips[1] ?? v.clips[0];

console.log("Projekt:", P);
console.log("clip0 url:", c0.url);
console.log("clip1 url:", c1.url);

const keys = new Set([...Object.keys(c0), ...Object.keys(c1)]);

console.log("\n=== Felder, die sich zwischen zwei Clips mit VERSCHIEDENEN Dateien unterscheiden ===");
for (const k of [...keys].sort()) {
  const a = JSON.stringify(c0[k]);
  const b = JSON.stringify(c1[k]);
  if (a !== b) {
    console.log(`  ${k}`);
    console.log(`      c0: ${String(a).slice(0, 160)}`);
    console.log(`      c1: ${String(b).slice(0, 160)}`);
  }
}

console.log("\n=== Alle Clip-Felder ===");
console.log([...keys].sort().join(", "));

console.log("\n=== Skalare von clip0 (Datei-Identität liegt hier) ===");
for (const k of [...keys].sort()) {
  const val = c0[k];
  if (val === null || typeof val !== "object") console.log(`  ${k} = ${JSON.stringify(val)}`);
}
