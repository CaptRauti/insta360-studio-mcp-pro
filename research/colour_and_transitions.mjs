/**
 * What do `color_adjust_setting` and `transitions[]` actually contain?
 *
 * A2 (colour) and A3 (transitions) are next, and both are fields that may exist in every
 * project with defaults and never have been changed — in which case the shape is measurable
 * here but the *effect* of each key is not. So the survey reports three things per field:
 * how many projects/clips carry it, the union of keys with their types, and, for every key,
 * how many distinct values appear — a key that is 0 or 1.0 everywhere was never touched and
 * its range still has to come from elsewhere (a Studio UI edit, or the binary's descriptors).
 *
 *   node research/colour_and_transitions.mjs [--full]
 */
import fs from "node:fs";
import path from "node:path";
import { readProject } from "../src/project.mjs";

/** Every .insproj on this machine, not just the ones Studio has registered (5) — the
 *  "25 projects" figure came from the disk, which is where the coverage lives. */
function allProjectFiles(roots = ["D:/Dokumente/Insta360/Studio", "C:/Users/stefa/Videos"]) {
  const out = [];
  const walk = (dir, depth) => {
    if (depth > 5) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (e.name.endsWith(".insproj") && !e.name.includes("_backup") && !e.name.endsWith(".bak")) out.push(p);
    }
  };
  for (const r of roots) walk(r, 0);
  return out;
}

const full = process.argv.includes("--full");
const files = allProjectFiles();
const projects = files.map((f) => ({ name: path.basename(path.dirname(f)), projectPath: f }));
const shape = (v) => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);

const colourKeys = new Map(); // key -> { types:Set, values:Map(count), clips }
const clipKeys = new Map();
const projKeys = new Map();
const transSeen = [];
let clips = 0;
let withColour = 0;
let projectTransitions = 0;

for (const p of projects) {
  const file = p.projectPath;
  if (!fs.existsSync(file)) {
    console.log(`! ${p.name}: not readable`);
    continue;
  }
  const data = await readProject(file);
  for (const k of Object.keys(data)) projKeys.set(k, (projKeys.get(k) ?? 0) + 1);
  const pl = (data.tracks ?? []).flatMap((t) => t.clips ?? []);
  for (const c of pl) {
    clips++;
    for (const k of Object.keys(c)) clipKeys.set(k, (clipKeys.get(k) ?? 0) + 1);
    const cas = c.color_adjust_setting ?? c.colorAdjustSetting;
    if (cas && typeof cas === "object" && Object.keys(cas).length) {
      withColour++;
      for (const [k, v] of Object.entries(cas)) {
        if (!colourKeys.has(k)) colourKeys.set(k, { types: new Set(), values: new Map(), examples: [] });
        const rec = colourKeys.get(k);
        rec.types.add(shape(v));
        const s = JSON.stringify(v);
        rec.values.set(s, (rec.values.get(s) ?? 0) + 1);
        if (full && rec.examples.length < 3) rec.examples.push(`${p.name}: ${s}`);
      }
    }
  }
  const tr = data.transitions ?? data.project_transitions ?? [];
  if (Array.isArray(tr) && tr.length) {
    projectTransitions += tr.length;
    transSeen.push({ project: p.name, count: tr.length, sample: JSON.stringify(tr[0]).slice(0, 300) });
  }
}

console.log(`projects: ${projects.length}  clips: ${clips}  clips carrying color_adjust_setting: ${withColour}`);
console.log(`\n=== color_adjust_setting keys (${colourKeys.size}) ===`);
for (const [k, rec] of [...colourKeys].sort()) {
  const vals = [...rec.values.entries()].sort((a, b) => b[1] - a[1]);
  const distinct = vals.length;
  const shown = vals.slice(0, 4).map(([v, n]) => `${v}×${n}`).join("  ");
  console.log(`${k.padEnd(28)} ${[...rec.types].join("/").padEnd(8)} distinct=${String(distinct).padStart(3)}  ${distinct <= 4 ? shown : `${shown}  …`}`);
  if (full) for (const e of rec.examples) console.log(`      e.g. ${e}`);
}

console.log(`\n=== project-level transitions: ${projectTransitions} across ${transSeen.length} project(s) ===`);
for (const t of transSeen) {
  console.log(`  ${t.project}: ${t.count}`);
  console.log(`    ${t.sample}`);
}
if (!projectTransitions) console.log("  (none — no project on this machine has a clip-to-clip transition)");

// What a clip can carry at all — the colour field may simply be named something else.
console.log(`\n=== union of clip keys (${clipKeys.size}) ===`);
for (const [k, n] of [...clipKeys].sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(30)} in ${n}/${clips} clips`);
console.log(`\n=== union of project keys (${projKeys.size}) ===`);
for (const [k, n] of [...projKeys].sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(30)} in ${n}/${projects.length} projects`);

// Any clip field can be dumped whole by name: the interesting ones are not the ones the
// backlog guessed. `color_adjust_setting` was in the plan and is in 0 of 60 clips;
// `effect_filter` is in all 60 and is what the UI's filter/look panel writes.
const field = process.argv.find((a) => a.startsWith("--field="))?.slice(8);
if (field) {
  const keys = new Map();
  const values = new Map();
  let carriers = 0;
  for (const p of projects) {
    if (!fs.existsSync(p.projectPath)) continue;
    const data = await readProject(p.projectPath);
    for (const c of (data.tracks ?? []).flatMap((t) => t.clips ?? [])) {
      const v = c[field];
      if (v === undefined) continue;
      carriers++;
      const s = JSON.stringify(v);
      values.set(s, (values.get(s) ?? 0) + 1);
      if (v && typeof v === "object" && !Array.isArray(v)) for (const [k, x] of Object.entries(v)) {
        if (!keys.has(k)) keys.set(k, { types: new Set(), vals: new Map() });
        const rec = keys.get(k);
        rec.types.add(shape(x));
        const xs = JSON.stringify(x);
        rec.vals.set(xs, (rec.vals.get(xs) ?? 0) + 1);
      }
    }
  }
  console.log(`\n=== ${field}: carried by ${carriers}/${clips} clips, ${values.size} distinct whole value(s) ===`);
  const vs = [...values.entries()].sort((a, b) => b[1] - a[1]);
  for (const [v, n] of vs.slice(0, 5)) console.log(`  ${n.toString().padStart(3)}× ${v.length > 220 ? `${v.slice(0, 220)}…` : v}`);
  if (vs.length > 5) console.log(`  … ${vs.length - 5} more whole values`);
  if (keys.size) {
    console.log(`  sub-keys:`);
    for (const [k, rec] of [...keys].sort()) {
      const vals = [...rec.vals.entries()].sort((a, b) => b[1] - a[1]);
      console.log(`    ${k.padEnd(26)} ${[...rec.types].join("/").padEnd(7)} distinct=${String(vals.length).padStart(3)}  ${vals.slice(0, 3).map(([x, n]) => `${x}×${n}`).join("  ")}`);
    }
  }
}

// One whole clip's colour block, so the shape is visible rather than inferred.
for (const p of projects) {
  const file = p.projectPath;
  if (!fs.existsSync(file)) continue;
  const data = await readProject(file);
  const c = (data.tracks ?? []).flatMap((t) => t.clips ?? []).find((x) => x.color_adjust_setting && Object.keys(x.color_adjust_setting).length);
  if (c) {
    console.log(`\n=== a whole color_adjust_setting (${p.name}) ===`);
    console.log(JSON.stringify(c.color_adjust_setting, null, 2));
    break;
  }
}
