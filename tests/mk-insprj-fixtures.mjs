// Provenance for tests/fixtures/media-project-*.insprj: pick real Media-page project files from this
// machine, trim them to one item, and record where they came from. The fixtures are the *app's own*
// files, so a parser test fails when Studio's format changes rather than when a hand-written sample
// drifts. The recorded source keeps the md5(parent dir) = md5(media path) rule testable as a real
// pair instead of a synthetic one.
//
// Run: node tests/mk-insprj-fixtures.mjs
import fs from "node:fs";
import path from "node:path";
import { mediaPathHash, detectEncoding } from "../src/insprj.mjs";
import { serialiseStudioJson } from "../src/insprj-serialise.mjs";

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

const all = roots.reduce((acc, r) => collect(r, 0, acc), []);
console.log(`corpus: ${all.length} .insprj`);

/** Score a JSON specimen for the settings the test needs to see (watermark, Stats, audio, colour). */
function scoreJson(o) {
  const clip = o?.projects?.[0]?.clip ?? {};
  let s = 0;
  if (clip.flat_logo_watermark?.selectedLogoWatermarkPath) s += 8;
  if (clip.dashboard_setting?.dashboardStyle) s += 8;
  if (clip.audio_setting) s += 2;
  if (clip.media_process) s += 2;
  if (clip.play_rate_track?.play_rate_model_list?.length) s += 16;
  return s;
}

let bestJson = null; // richest settings file
let bestShift = null; // has real TimeShift segments
let bestXml = null; // legacy, small, with a scheme
for (const file of all) {
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const enc = detectEncoding(raw);
  if (enc === "json") {
    let o;
    try {
      o = JSON.parse(raw);
    } catch {
      continue;
    }
    const s = scoreJson(o);
    const shift = o?.projects?.[0]?.clip?.play_rate_track?.play_rate_model_list?.length ?? 0;
    if (!bestJson || s > bestJson.score) bestJson = { file, raw, o, score: s };
    if (shift > 0 && (!bestShift || raw.length < bestShift.raw.length)) bestShift = { file, raw, o, score: s };
  } else if (enc === "xml") {
    const sz = raw.length;
    if (!bestXml || sz < bestXml.raw.length) bestXml = { file, raw, size: sz };
  }
}

if (!bestJson || !bestXml) {
  console.error("fixtures not generated: need at least one JSON and one XML .insprj on this machine");
  process.exit(1);
}

const dir = "tests/fixtures";
fs.mkdirSync(dir, { recursive: true });
const provenance = { generatedFrom: roots, fixtures: {} };

/** Trim a JSON specimen to its first project; the clip itself is kept whole (it is the point). */
function writeJsonFixture(pick, outName) {
  const trimmed = {
    id: pick.o.id,
    selectedId: pick.o.selectedId,
    projects: pick.o.projects.slice(0, 1),
  };
  const out = `${dir}/${outName}`;
  // Written in Studio's own layout (`serialiseStudioJson`), not a pretty-print of our choosing: a
  // fixture in the app's layout is what lets the writer's round-trip test assert a byte-identity.
  const text = serialiseStudioJson(trimmed);
  fs.writeFileSync(out, text);
  provenance.fixtures[outName] = {
    source: pick.file,
    sourceBytes: pick.raw.length,
    fixtureBytes: text.length,
    layout: "Studio's own (4-space indent, empty containers exploded, trailing newline)",
    trimmed: "projects[] reduced to the first item",
    mediaId: pick.o.id,
    dirHash: path.basename(path.dirname(pick.file)),
    hashMatches: mediaPathHash(pick.o.id) === path.basename(path.dirname(pick.file)),
    itemCount: trimmed.projects.length,
  };
  console.log(`wrote ${out}  (${pick.file})`);
}

writeJsonFixture(bestJson, "media-project-json.insprj");
if (bestShift && bestShift.file !== bestJson.file) writeJsonFixture(bestShift, "media-project-timeshift.insprj");
else if (bestShift) console.log("note: the settings fixture already carries TimeShift segments");

// XML: keep the whole document, but only the first scheme (a second scheme is another edit variant).
if (bestXml) {
  const text = bestXml.raw;
  const schemeStart = text.indexOf("<scheme ");
  const secondScheme = schemeStart >= 0 ? text.indexOf("<scheme ", schemeStart + 1) : -1;
  // Cut at the element that follows the first scheme's block, not at the second <scheme> inside it.
  const cut = text.indexOf("</scheme>", schemeStart);
  const trimmed = secondScheme > 0 && cut > 0
    ? `${text.slice(0, cut + "</scheme>".length)}\n</schemes>\n</project>\n`
    : text;
  const out = `${dir}/media-project-legacy-xml.insprj`;
  fs.writeFileSync(out, trimmed);
  const fg = trimmed.match(/<file_group[^>]*>/)?.[0] ?? "";
  const cloudId = fg.match(/cloud_media_id="([^"]*)"/)?.[1] ?? "";
  provenance.fixtures["media-project-legacy-xml.insprj"] = {
    source: bestXml.file,
    sourceBytes: bestXml.raw.length,
    fixtureBytes: trimmed.length,
    trimmed: secondScheme > 0 ? "schemes reduced to the first scheme" : "not trimmed (single scheme)",
    // The XML-era hash rule is not uniform (10/371 corpus-wide), but this pair was measured to hold,
    // so the test can pin it as a real example rather than a general law.
    mediaId: cloudId,
    dirHash: path.basename(path.dirname(bestXml.file)),
    hashMatches: cloudId ? mediaPathHash(cloudId) === path.basename(path.dirname(bestXml.file)) : null,
  };
  console.log(`wrote ${out}  (${bestXml.file})`);
}

const provFile = `${dir}/insprj-fixtures.json`;
fs.writeFileSync(provFile, JSON.stringify(provenance, null, 1));
console.log(`wrote ${provFile}`);
