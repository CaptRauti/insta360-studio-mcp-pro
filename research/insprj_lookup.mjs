// B1 lookup: is the parent directory name a hash of the media path? If it is, "find the Media-page
// project for this media file" is an O(1) md5 lookup instead of a directory walk.
//
// Tests a candidate set over many specimens and reports the match count per candidate, so a single
// lucky hit cannot be mistaken for a rule.
// Run: node research/insprj_lookup.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const INI = path.join(process.env.LOCALAPPDATA, "Insta360", "Insta360 Studio", "startup.ini");
const prefs = {};
for (const line of fs.readFileSync(INI, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([a-z_]+)=(.*)$/);
  if (m) prefs[m[1]] = m[2];
}

const md5 = (s) => crypto.createHash("md5").update(s).digest("hex");

function collect(dir, depth, out) {
  if (depth > 6) return out;
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

const footage = collect(prefs.footage_project_location.replace(/\\/g, "/"), 0, []);
const project = collect(prefs.project_location.replace(/\\/g, "/"), 0, []);

const candidates = {
  "raw": (s) => s,
  "fwd": (s) => s.replace(/\\/g, "/"),
  "back": (s) => s.replace(/\//g, "\\"),
  "lower": (s) => s.toLowerCase(),
  "fwdLower": (s) => s.replace(/\\/g, "/").toLowerCase(),
};
const stats = {};
const bump = (name, ok) => {
  const s = (stats[name] ??= { tried: 0, hit: 0 });
  s.tried += 1;
  if (ok) s.hit += 1;
};

// --- footage family: the JSON `id` is the media path itself ---
let footageN = 0;
for (const f of footage) {
  const raw = fs.readFileSync(f, "utf8");
  if (!raw.trimStart().startsWith("{")) continue;
  let o;
  try {
    o = JSON.parse(raw);
  } catch {
    continue;
  }
  const id = o?.id;
  if (typeof id !== "string" || !id) continue;
  const dir = path.basename(path.dirname(f));
  footageN += 1;
  for (const [name, fn] of Object.entries(candidates)) bump(`footage:${name}`, md5(fn(id)) === dir);
}
console.log(`--- footage family (JSON, id = media path): ${footageN} files ---`);
for (const [k, v] of Object.entries(stats)) console.log(`  ${k.padEnd(22)} ${v.hit}/${v.tried}`);

// --- project family: XML, so pull <file name> and file_group/@folder or @cloud_media_id ---
const xstats = {};
const xbump = (name, ok) => {
  const s = (xstats[name] ??= { tried: 0, hit: 0 });
  s.tried += 1;
  if (ok) s.hit += 1;
};
let xmlN = 0;
const samples = [];
for (const f of project) {
  const raw = fs.readFileSync(f, "utf8");
  if (!raw.trimStart().startsWith("<")) continue;
  const fg = raw.match(/<file_group[^>]*>/)?.[0] ?? "";
  const attr = (n) => fg.match(new RegExp(`${n}="([^"]*)"`))?.[1] ?? "";
  const folder = attr("folder");
  const cloudId = attr("cloud_media_id");
  const fileName = raw.match(/<file name="([^"]*)"/)?.[1] ?? "";
  const dir = path.basename(path.dirname(f));
  xmlN += 1;
  // Every candidate string is tested on its own. An earlier version of this sweep required both
  // `folder` and `<file name>` to be present before testing anything, which silently skipped every
  // bare `.insprj` (their `folder` is empty) and made the hash rule look like it did not hold.
  for (const [name, fn] of Object.entries(candidates)) {
    if (cloudId) xbump(`project:cloudId(${name})`, md5(fn(cloudId)) === dir);
    if (folder && fileName) xbump(`project:folder+name(${name})`, md5(fn(`${folder}/${fileName}`)) === dir);
    if (folder) xbump(`project:folder(${name})`, md5(fn(folder)) === dir);
  }
  if (samples.length < 3) samples.push({ f, dir, folder, fileName, cloudId });
}
console.log(`\n--- project family (XML): ${xmlN} files ---`);
for (const [k, v] of Object.entries(xstats).sort()) {
  if (v.hit) console.log(`  ${k.padEnd(28)} ${v.hit}/${v.tried}   <-- MATCH`);
}
const best = Object.entries(xstats).filter(([, v]) => v.hit).sort((a, b) => b[1].hit / b[1].tried - a[1].hit / a[1].tried)[0];
if (!best) {
  console.log("  (no candidate matched — the XML-era directory name is not md5 of any tested string)");
  console.log("  samples:");
  for (const s of samples) {
    console.log(`    dir=${s.dir}\n      folder=${s.folder}\n      file=${s.fileName}\n      cloudId=${s.cloudId}`);
  }
}
