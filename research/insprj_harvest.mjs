// B1 harvest: what is actually inside a Media-page project file (`.insprj`)?
//
// Reads every `.insprj` under the configured project roots and builds a key-path census:
// how many files carry a path, which values it takes, and whether those values are constant
// across the corpus (a schema constant / enum) or vary per file (a uuid, a path, a timestamp).
// The census is written to research/insprj-census.json; stdout carries the digest.
//
// Static only. Nothing is written outside the repo.
// Run: node research/insprj_harvest.mjs
import fs from "node:fs";
import path from "node:path";

const INI = path.join(process.env.LOCALAPPDATA, "Insta360", "Insta360 Studio", "startup.ini");
const OUT = path.join("research", "insprj-census.json");

function prefs() {
  const txt = fs.readFileSync(INI, "utf8");
  const p = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([a-z_]+)=(.*)$/);
    if (m) p[m[1]] = m[2];
  }
  return p;
}

/** Every `.insprj` under the roots, with a family label derived from where it sits. */
function collect(roots) {
  const files = [];
  const walk = (dir, depth) => {
    if (depth > 8) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory()) walk(p, depth + 1);
      else if (e.name.toLowerCase().endsWith(".insprj")) {
        const isFootage = p.includes("/FootageProject/");
        const base = e.name.toLowerCase();
        // A Media-page project is normally named after its media file; a bare `.insprj` is a
        // different (older?) shape and is kept as its own family so it cannot skew a census.
        const family = isFootage ? "footage" : base === ".insprj" ? "bare" : "media";
        files.push({ path: p, family });
      }
    }
  };
  for (const r of roots) walk(r, 0);
  return files;
}

/** JSON-typed value label, cheap enough to compare as a string. */
function label(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return `array[len ${v.length}]`;
  if (typeof v === "object") return "object";
  return `${typeof v}:${JSON.stringify(v)}`;
}

const p = prefs();
const roots = [p.footage_project_location, p.project_location, p.workspace_location]
  .filter(Boolean)
  .map((s) => s.replace(/\\/g, "/"));

const files = collect(roots);
const byFamily = {};
for (const f of files) byFamily[f.family] = (byFamily[f.family] ?? 0) + 1;

console.log(`--- .insprj corpus ---`);
for (const [k, v] of Object.entries(byFamily)) console.log(`  ${k}: ${v}`);
console.log(`  total: ${files.length}`);

// census[family][dotPath] = { present, values: Map(label -> count) }
const census = {};
const parseFail = [];
const shapes = {};

for (const f of files) {
  let obj;
  let raw;
  try {
    raw = fs.readFileSync(f.path, "utf8");
    obj = JSON.parse(raw);
  } catch (err) {
    parseFail.push(`${f.path}: ${err.message}`);
    continue;
  }
  const fam = (census[f.family] ??= {});
  const visit = (node, prefix) => {
    if (node === null || typeof node !== "object") {
      return;
    }
    if (Array.isArray(node)) {
      // Arrays are summarised as a unit: their element paths are not comparable file to file
      // when the length differs, and the length itself is the interesting number.
      const key = `${prefix}[]`;
      const rec = (fam[key] ??= { present: 0, values: new Map() });
      rec.present += 1;
      const l = node.length ? Object.keys(node[0] ?? {}).join(",") : "";
      rec.values.set(`${l}`, (rec.values.get(`${l}`) ?? 0) + 1);
      for (const el of node) {
        if (el && typeof el === "object") visit(el, `${prefix}[]`);
      }
      return;
    }
    for (const [k, v] of Object.entries(node)) {
      const key = prefix ? `${prefix}.${k}` : k;
      const rec = (fam[key] ??= { present: 0, values: new Map() });
      rec.present += 1;
      const l = label(v);
      rec.values.set(l, (rec.values.get(l) ?? 0) + 1);
      visit(v, key);
    }
  };
  visit(obj, "");
  const top = Object.keys(obj).sort().join(",");
  shapes[f.family] = shapes[f.family] ?? new Map();
  shapes[f.family].set(top, (shapes[f.family].get(top) ?? 0) + 1);
}

console.log(`\n--- parse failures: ${parseFail.length} ---`);
for (const s of parseFail.slice(0, 5)) console.log(`  ! ${s}`);

console.log(`\n--- top-level key sets (the file's shape) ---`);
for (const [fam, m] of Object.entries(shapes)) {
  console.log(`  ${fam}:`);
  for (const [keys, n] of [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4)) {
    console.log(`    ${n}× [${keys}]`);
  }
}

// Serialisable census: values as an array sorted by frequency.
const serialisable = {};
const digest = {};
for (const [fam, paths] of Object.entries(census)) {
  serialisable[fam] = {};
  digest[fam] = [];
  for (const [kp, rec] of Object.entries(paths)) {
    const vals = [...rec.values.entries()].sort((a, b) => b[1] - a[1]);
    serialisable[fam][kp] = { present: rec.present, distinct: vals.length, values: vals };
  }
}
fs.writeFileSync(OUT, JSON.stringify({ corpus: byFamily, census: serialisable }, null, 1));
console.log(`\ncensus written: ${OUT}`);

// The interesting half: which paths could carry the B2–B5 payloads (watermark, Stats/GPS,
// denoise, GPX) and which are merely bookkeeping. Matched case-insensitively on the key path.
const INTERESTING = [
  "watermark", "dashboard", "gps", "gpx", "denoise", "noise", "stitch", "filter", "color",
  "colour", "lut", "keyframe", "speed", "play_rate", "audio", "bgm", "fov", "aspect", "ratio",
  "ai_", "export", "resolution", "trim", "duration", "media", "url", "path", "name", "version",
  "hdr", "pure", "log", "duration_ms", "create_time", "type",
];
console.log(`\n--- digest: paths matching ${INTERESTING.length} topic words ---`);
for (const fam of Object.keys(census)) {
  const hits = Object.entries(serialisable[fam]).filter(([kp]) =>
    INTERESTING.some((w) => kp.toLowerCase().includes(w)),
  );
  console.log(`\n  [${fam}] ${hits.length} matching paths, top 40 by presence:`);
  for (const [kp, rec] of hits.sort((a, b) => b[1].present - a[1].present).slice(0, 40)) {
    const vals = rec.values
      .slice(0, 4)
      .map(([v, n]) => `${n}×${v.length > 60 ? `${v.slice(0, 57)}...` : v}`)
      .join(" | ");
    console.log(`    ${String(rec.present).padStart(4)}× ${kp}  ->  ${vals}`);
  }
}
