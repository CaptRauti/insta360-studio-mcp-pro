// B1 analysis: classify the whole `.insprj` corpus — family × encoding — and answer the two
// questions a reader/writer design depends on:
//   1. which encodings exist (the harvest found plain JSON *and* XML under the same extension),
//   2. whether the B2–B5 payloads (watermark, Stats/GPS, denoise, GPX) exist in any specimen.
//
// Run: node research/insprj_analyze.mjs
import fs from "node:fs";
import path from "node:path";

const INI = path.join(process.env.LOCALAPPDATA, "Insta360", "Insta360 Studio", "startup.ini");
const prefs = {};
for (const line of fs.readFileSync(INI, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([a-z_]+)=(.*)$/);
  if (m) prefs[m[1]] = m[2];
}
const roots = [prefs.footage_project_location, prefs.project_location, prefs.workspace_location]
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
    else if (e.name.toLowerCase().endsWith(".insprj")) {
      const family = p.includes("/FootageProject/") ? "footage" : e.name === ".insprj" ? "bare" : "media";
      out.push({ path: p, family });
    }
  }
  return out;
}

const files = roots.reduce((acc, r) => collect(r, 0, acc), []);
const buckets = {};
const samples = {};

for (const f of files) {
  const raw = fs.readFileSync(f.path, "utf8");
  const st = fs.statSync(f.path);
  const enc = raw.trimStart().startsWith("{") ? "json" : raw.trimStart().startsWith("<") ? "xml" : "other";
  const key = `${f.family}/${enc}`;
  const b = (buckets[key] ??= { n: 0, min: Infinity, max: 0, minT: Infinity, maxT: 0 });
  b.n += 1;
  b.min = Math.min(b.min, st.size);
  b.max = Math.max(b.max, st.size);
  b.minT = Math.min(b.minT, st.mtimeMs);
  b.maxT = Math.max(b.maxT, st.mtimeMs);
  samples[key] ??= { path: f.path, raw };
}

console.log("--- corpus by family/encoding ---");
for (const [k, b] of Object.entries(buckets).sort()) {
  console.log(
    `  ${k.padEnd(14)} n=${String(b.n).padStart(4)}  size ${b.min}..${b.max} B  mtime ${new Date(b.minT).toISOString().slice(0, 10)}..${new Date(b.maxT).toISOString().slice(0, 10)}`,
  );
}

// --- JSON side: top-level keys per family, and the presence of the B2-B5 payload words ---
const censusFile = path.join("research", "insprj-census.json");
if (fs.existsSync(censusFile)) {
  const cen = JSON.parse(fs.readFileSync(censusFile, "utf8")).census;
  const WORDS = ["watermark", "dashboard", "gps", "gpx", "denoise", "noise", "audio", "bgm", "filtersetting", "filter", "log", "pureshot", "hdr", "stitch", "speed", "playrate"];
  console.log("\n--- B2-B5 payload words in the JSON census ---");
  for (const [fam, paths] of Object.entries(cen)) {
    const all = Object.entries(paths);
    console.log(`  [${fam}] ${all.length} paths total`);
    for (const w of WORDS) {
      const hits = all.filter(([kp]) => kp.toLowerCase().includes(w));
      if (hits.length) {
        const top = hits.sort((a, b) => b[1].present - a[1].present)[0];
        console.log(`    ${w.padEnd(14)} ${String(hits.length).padStart(3)} paths, most present: ${top[0]} (${top[1].present}×)`);
      } else {
        console.log(`    ${w.padEnd(14)}   —  no path`);
      }
    }
  }
}

// --- XML side: what is the document? Print the tag census of one sample per family ---
const decode = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d));

for (const [key, s] of Object.entries(samples)) {
  if (!key.endsWith("/xml")) continue;
  const body = decode(s.raw);
  const tags = [...body.matchAll(/<([A-Za-z_][\w.:-]*)/g)].map((m) => m[1]);
  const counts = new Map();
  for (const t of tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  console.log(`\n--- XML document (${key}), ${s.path} ---`);
  console.log(body.split("\n").slice(0, 12).join("\n"));
  console.log(`  ... ${body.length} chars, ${tags.length} elements, ${new Set(tags).size} distinct tags:`);
  for (const [t, n] of [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)) {
    console.log(`    ${String(n).padStart(4)}× <${t}>`);
  }
}

// --- one full specimen per JSON family, keys only, depth 2 ---
for (const [key, s] of Object.entries(samples)) {
  if (!key.endsWith("/json")) continue;
  let obj;
  try {
    obj = JSON.parse(s.raw);
  } catch {
    continue;
  }
  console.log(`\n--- JSON specimen (${key}) keys, depth 2 ---`);
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      console.log(`  ${k}: { ${Object.keys(v).slice(0, 40).join(", ")} }`);
    } else if (Array.isArray(v)) {
      console.log(`  ${k}: [ ${v.length} × ${v.length && typeof v[0] === "object" ? `{ ${Object.keys(v[0]).slice(0, 30).join(", ")} }` : typeof v[0]} ]`);
    } else {
      const j = JSON.stringify(v);
      console.log(`  ${k}: ${j && j.length > 80 ? `${j.slice(0, 77)}...` : j}`);
    }
  }
}
