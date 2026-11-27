// Reconnaissance for B1 (`.insprj`, Media-page project file): does a specimen exist on this machine?
// Static only — reads startup.ini and walks the configured project roots. Nothing is written.
//
// Run: node research/insprj-recon.mjs
import fs from "node:fs";
import path from "node:path";

const INI = path.join(process.env.LOCALAPPDATA, "Insta360", "Insta360 Studio", "startup.ini");

function readPrefs() {
  const txt = fs.readFileSync(INI, "utf8");
  const prefs = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([a-z_]+)=(.*)$/);
    if (m) prefs[m[1]] = m[2];
  }
  return prefs;
}

const prefs = readPrefs();
const keys = [
  "project_location",
  "workspace_location",
  "footage_project_location",
  "last_visit_dir",
  "export_location",
];
console.log("--- startup.ini [preference] ---");
for (const k of keys) console.log(`  ${k} = ${prefs[k] ?? "(absent)"}`);

// Roots that could hold a Media-page project. The footage/"Media page" root is the one
// Insta360 documents for this file type; the others are checked because the naming is not strict.
const roots = [prefs.footage_project_location, prefs.project_location, prefs.workspace_location]
  .filter(Boolean)
  .map((p) => p.replace(/\\/g, "/"));

const found = { insprj: [], insproj: [], other: [] };
const unreadable = [];

function walk(dir, depth) {
  if (depth > 8) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    unreadable.push(`${dir} (${err.code})`);
    return;
  }
  for (const e of entries) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) {
      walk(p, depth + 1);
      continue;
    }
    const lower = e.name.toLowerCase();
    if (lower.endsWith(".insprj")) found.insprj.push(p);
    else if (lower.endsWith(".insproj")) found.insproj.push(p);
    else if (lower.endsWith(".json")) found.other.push(p);
  }
}

for (const r of roots) {
  console.log(`--- walk ${r} ---`);
  walk(r, 0);
}

console.log("");
console.log(`roots walked: ${roots.length}, unreadable: ${unreadable.length}`);
for (const u of unreadable) console.log(`  ! ${u}`);
for (const k of ["insprj", "insproj", "other"]) console.log(`${k}: ${found[k].length}`);

console.log("\n.insprj specimens:");
for (const p of found.insprj) {
  const st = fs.statSync(p);
  console.log(`  ${new Date(st.mtimeMs).toISOString()}  ${st.size} B  ${p}`);
}
if (!found.insprj.length) {
  console.log("  (none — B1 has no specimen to harvest from)");
  console.log("\n.json files inside a Media/footage root (a Media-page project could be one of these):");
  for (const p of found.other.slice(0, 30)) {
    const st = fs.statSync(p);
    console.log(`  ${new Date(st.mtimeMs).toISOString()}  ${st.size} B  ${p}`);
  }
}
