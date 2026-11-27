// Field inventory for `docs/INSPRJ_SCHEMA.md`: what is actually in the Media-page project files on
// this machine, so the doc's tables are measured rather than remembered.
//
// Run: node research/insprj_inventory.mjs [maxDistinctValues]
import fs from "node:fs";
import path from "node:path";
import { detectEncoding } from "../src/insprj.mjs";

const INI = path.join(process.env.LOCALAPPDATA, "Insta360", "Insta360 Studio", "startup.ini");
const prefs = {};
for (const line of fs.readFileSync(INI, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([a-z_]+)=(.*)$/);
  if (m) prefs[m[1]] = m[2];
}
const roots = [prefs.footage_project_location, prefs.project_location]
  .filter(Boolean)
  .map((s) => s.replace(/\\/g, "/"));

function collect(dir, depth, out = []) {
  if (depth > 5) return out;
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

const files = roots.reduce((acc, r) => collect(r, 0, acc), []);
const jsonClips = [];
const xmlSchemes = [];
const encodings = { json: 0, xml: 0, unknown: 0 };
let jsonItems = 0;

for (const file of files) {
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const enc = detectEncoding(raw);
  encodings[enc] += 1;
  if (enc === "json") {
    try {
      const doc = JSON.parse(raw);
      for (const p of doc.projects ?? []) {
        jsonItems += 1;
        if (p.clip) jsonClips.push(p.clip);
      }
    } catch {
      /* counted as json by its first character; the reader reports the parse failure */
    }
  } else if (enc === "xml") {
    for (const m of raw.matchAll(/<scheme\b[^>]*>/g)) xmlSchemes.push(m[0]);
  }
}

const limit = Number(process.argv[2] ?? 12);
function inventory(objects, { nested = false } = {}) {
  const seen = new Map();
  for (const o of objects) {
    for (const [k, v] of Object.entries(o ?? {})) {
      if (k === "id" || k === "name" || k === "url") continue; // per-file identifiers, not settings
      const entry = seen.get(k) ?? { present: 0, types: new Set(), values: new Set() };
      entry.present += 1;
      entry.types.add(Array.isArray(v) ? "array" : v === null ? "null" : typeof v);
      if (typeof v === "string") entry.values.add(v.length > 40 ? `${v.slice(0, 37)}…` : v);
      else if (typeof v === "number" || typeof v === "boolean") entry.values.add(String(v));
      seen.set(k, entry);
    }
  }
  const rows = [...seen.entries()]
    .map(([k, v]) => ({
      field: k,
      present: `${v.present}/${objects.length}`,
      types: [...v.types].join("|"),
      distinct: v.values.size,
      sample: [...v.values].slice(0, 4).join(", ").slice(0, 66),
    }))
    .sort((a, b) => a.field.localeCompare(b.field));
  for (const r of rows) {
    console.log(`| \`${r.field}\` | ${r.present} | ${r.types} | ${r.distinct} | ${r.sample.replace(/\|/g, "\\|")} |`);
  }
}

console.log(`# ${files.length} .insprj — json ${encodings.json}, xml ${encodings.xml}, unknown ${encodings.unknown}`);
console.log(`# JSON Media-page clips: ${jsonItems} delivered, ${jsonClips.length} with a clip object`);
console.log(`# XML schemes: ${xmlSchemes.length}\n`);
console.log("--- clip fields (top level) ---");
console.log("| field | present | type | distinct | sample values |");
console.log("|---|---|---|---|---|");
inventory(jsonClips);
console.log("\n--- clip.media_process ---");
console.log("| field | present | type | distinct | sample values |");
console.log("|---|---|---|---|---|");
inventory(jsonClips.map((c) => c.media_process ?? {}));
console.log("\n--- clip.dashboard_setting ---");
console.log("| field | present | type | distinct | sample values |");
console.log("|---|---|---|---|---|");
inventory(jsonClips.map((c) => c.dashboard_setting ?? {}));
console.log("\n--- clip.flat_logo_watermark ---");
console.log("| field | present | type | distinct | sample values |");
console.log("|---|---|---|---|---|");
inventory(jsonClips.map((c) => c.flat_logo_watermark ?? {}));
console.log("\n--- clip.play_rate_track ---");
console.log("| field | present | type | distinct | sample values |");
console.log("|---|---|---|---|---|");
inventory(jsonClips.map((c) => c.play_rate_track ?? {}));
console.log("\n--- clip.audio_setting ---");
console.log("| field | present | type | distinct | sample values |");
console.log("|---|---|---|---|---|");
inventory(jsonClips.map((c) => c.audio_setting ?? {}));
console.log(`\n--- the XML <scheme> attribute names (first ${limit} of ${xmlSchemes.length}) ---`);
const attrs = new Map();
for (const tag of xmlSchemes) {
  for (const m of tag.matchAll(/([\w.:-]+)="([^"]*)"/g)) {
    const e = attrs.get(m[1]) ?? { n: 0, values: new Set() };
    e.n += 1;
    e.values.add(m[2].length > 30 ? `${m[2].slice(0, 27)}…` : m[2]);
    attrs.set(m[1], e);
  }
}
for (const [k, v] of [...attrs.entries()].sort()) {
  console.log(`| \`${k}\` | ${v.n} | ${v.values.size} | ${[...v.values].slice(0, 3).join(", ")} |`);
}
