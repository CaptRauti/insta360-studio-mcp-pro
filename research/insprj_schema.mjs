// B1 schema dump: the full shape of one Studio-6 `.insprj` (JSON), plus the value sets of the
// containers B2–B5 would write into. This is the source for docs/INSPRJ_SCHEMA.md.
//
// Run: node research/insprj_schema.mjs [path-to-insprj]
import fs from "node:fs";
import path from "node:path";

const INI = path.join(process.env.LOCALAPPDATA, "Insta360", "Insta360 Studio", "startup.ini");
const prefs = {};
for (const line of fs.readFileSync(INI, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([a-z_]+)=(.*)$/);
  if (m) prefs[m[1]] = m[2];
}
const roots = [prefs.footage_project_location, prefs.project_location]
  .filter(Boolean)
  .map((s) => s.replace(/\\/g, "/"));

function collect(dir, depth, out) {
  if (depth > 8) return out;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) collect(p, depth + 1, out);
    else if (e.name.toLowerCase().endsWith(".insprj")) out.push(p);
  }
  return out;
}

const all = roots.reduce((a, r) => collect(r, 0, a), []);
const jsonFiles = all.filter((p) => fs.readFileSync(p, "utf8").trimStart().startsWith("{"));

// Prefer a specimen that actually carries the B2-B5 containers (watermark, dashboard, audio),
// otherwise the dump documents an empty file.
let target = process.argv[2];
if (!target) {
  let best = null;
  for (const p of jsonFiles.slice(0, 400)) {
    const raw = fs.readFileSync(p, "utf8");
    if (!raw.includes("flat_logo_watermark")) continue;
    const score =
      (raw.includes("dashboard_setting") ? 4 : 0) +
      (raw.includes("audio_setting") ? 2 : 0) +
      (raw.includes("enableMultiFrameDenoise") ? 1 : 0) +
      Math.min(raw.length / 10000, 3);
    if (!best || score > best.score) best = { p, score, raw };
  }
  target = best?.p;
}
console.log(`specimen: ${target}\n`);

const obj = JSON.parse(fs.readFileSync(target, "utf8"));
const one = obj.projects[0];

/** Print a value tree compactly: scalars inline, objects expanded to `depth`, arrays summarised. */
function dump(node, label, depth, maxDepth) {
  const pad = "  ".repeat(depth);
  if (node === null) return `${pad}${label}: null`;
  if (typeof node !== "object") {
    const j = JSON.stringify(node);
    return `${pad}${label}: ${j && j.length > 90 ? `${j.slice(0, 87)}...` : j}`;
  }
  if (Array.isArray(node)) {
    const lines = [`${pad}${label}: [${node.length}]`];
    if (node.length && depth < maxDepth) {
      const el = node[0];
      if (el && typeof el === "object") {
        for (const [k, v] of Object.entries(el)) lines.push(dump(v, k, depth + 1, maxDepth));
      } else lines.push(dump(el, "[0]", depth + 1, maxDepth));
    }
    return lines.join("\n");
  }
  const lines = [`${pad}${label}: {}`];
  if (depth < maxDepth) for (const [k, v] of Object.entries(node)) lines.push(dump(v, k, depth + 1, maxDepth));
  return lines.join("\n");
}

console.log("--- document ---");
for (const [k, v] of Object.entries(obj)) {
  if (k === "projects") console.log(`projects: [${v.length}]`);
  else console.log(dump(v, k, 0, 2));
}

console.log("\n--- projects[0] (one highlight/media item) ---");
for (const [k, v] of Object.entries(one)) {
  if (k === "clip") continue;
  console.log(dump(v, k, 1, 2));
}

console.log("\n--- projects[0].clip (full, depth 3) ---");
console.log(dump(one.clip, "clip", 1, 3));

// Value sets across the corpus for the containers B2-B5 target, so a writer knows the enum it
// must satisfy rather than inventing one.
const containers = [
  "flat_logo_watermark",
  "dashboard_setting",
  "audio_setting",
  "effect_filter",
  "media_process",
  "stitching_optimization",
  "play_rate_track",
  "hdrPreviewEnabled",
  "ratio",
];
const seen = {};
for (const p of jsonFiles) {
  let o;
  try {
    o = JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    continue;
  }
  for (const pr of o.projects ?? []) {
    const c = pr.clip;
    if (!c) continue;
    for (const key of containers) {
      if (!(key in c)) continue;
      const s = (seen[key] ??= new Map());
      const j = JSON.stringify(c[key]);
      s.set(j, (s.get(j) ?? 0) + 1);
    }
  }
}
console.log(`\n--- B2-B5 containers across ${jsonFiles.length} JSON files: distinct values ---`);
for (const [key, m] of Object.entries(seen)) {
  console.log(`\n  ${key}: ${m.size} distinct value(s)`);
  for (const [j, n] of [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)) {
    const short = j.length > 320 ? `${j.slice(0, 317)}...` : j;
    console.log(`    ${String(n).padStart(5)}× ${short}`);
  }
}
