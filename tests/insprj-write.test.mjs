/**
 * Media-page project file (`.insprj`) — the writer.
 *
 * The fixture is Studio's own file in Studio's own layout (see tests/mk-insprj-fixtures.mjs), which is
 * what makes the central assertion possible: after editing one field, the file must be a byte-identity
 * apart from that field. A writer that reformats produces a diff on every one of the clip's ~55 keys,
 * and that is the failure mode these tests exist to catch.
 *
 * Every test works on a copy in a temp directory; the fixture itself is never touched. `runningCheck`
 * is injected so the "Studio is up" gate is testable without Studio.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { detectStudioFormat, serialiseStudioJson } from "../src/insprj-serialise.mjs";
import { WRITABLE, writeMediaProject } from "../src/insprj-write.mjs";

const FIXTURE = "tests/fixtures/media-project-json.insprj";
const XML_FIXTURE = "tests/fixtures/media-project-legacy-xml.insprj";
const ORIGINAL = fs.readFileSync(FIXTURE, "utf8");

const noStudio = () => ({ running: false, pids: [] });
const studioUp = () => ({ running: true, pids: [4242], image: "Insta360 Studio.exe" });

/** Where each group's fields live inside the clip — the writer's own mapping, restated for the tests. */
const BLOCKS = {
  colour: "media_process",
  colourPlus: "media_process",
  process: "media_process",
  watermark: "flat_logo_watermark",
  audio: "audio_setting",
  dashboard: "dashboard_setting",
};

let counter = 0;
/** A fresh copy of the fixture, so no test can observe another's write. */
function copyFixture(text = ORIGINAL, name = "file.insprj") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `insprj-write-${counter++}-`));
  const file = path.join(dir, name);
  fs.writeFileSync(file, text);
  return file;
}

const clipOf = (file) => JSON.parse(fs.readFileSync(file, "utf8")).projects[0].clip;

/** Every path where two parsed documents differ — the instrument for "changed nothing else". */
function differingPaths(a, b, at = "", out = []) {
  if (a === b) return out;
  const both = a && b && typeof a === "object" && typeof b === "object";
  if (!both) {
    out.push(at);
    return out;
  }
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    differingPaths(a[key], b[key], at ? `${at}.${key}` : key, out);
  }
  return out;
}

// --- Studio's layout, reproduced ----------------------------------------------------------------

test("Studio's layout is a byte-identity on the app's own file", () => {
  assert.equal(serialiseStudioJson(JSON.parse(ORIGINAL)), ORIGINAL);
  assert.equal(detectStudioFormat(ORIGINAL).ok, true);
});

test("empty containers are exploded, as Studio writes them", () => {
  const doc = { a: [], b: {}, c: [{ d: [] }], e: "x" };
  const out = serialiseStudioJson(doc);
  assert.match(out, /"a": \[\n {4}\]/);
  assert.match(out, /"b": \{\n {4}\}/);
  assert.doesNotMatch(out, /\[\]|\{\}/);
});

test("an exponent keeps Studio's two-digit form", () => {
  // The one file of 920 whose layout differed at all differed exactly here.
  assert.match(serialiseStudioJson({ tilt: 8.149072527885437e-9 }), /8\.149072527885437e-09/);
});

test("a file in a different layout is reported, not silently accepted", () => {
  const reformatted = JSON.stringify(JSON.parse(ORIGINAL), null, 2);
  const check = detectStudioFormat(reformatted);
  assert.equal(check.ok, false);
  assert.match(check.reason, /layout differs/);
  assert.ok(check.doc, "the parsed document is still returned");
});

// --- the write itself ---------------------------------------------------------------------------

test("dryRun reports the change and touches nothing", () => {
  const file = copyFixture();
  const before = fs.readFileSync(file, "utf8");
  const res = writeMediaProject({
    file,
    changes: { colour: { colorAdjustExposure: 40 } },
    dryRun: true,
    runningCheck: noStudio,
  });
  assert.equal(res.ok, true);
  assert.equal(res.written, false);
  assert.deepEqual(res.wouldChange, [
    { group: "colour", field: "colorAdjustExposure", from: 23, to: 40 },
  ]);
  assert.equal(fs.readFileSync(file, "utf8"), before);
  assert.equal(fs.existsSync(`${file}.bak`), false, "a dry run leaves no backup");
});

test("a write changes exactly one field and nothing else", () => {
  const file = copyFixture();
  const res = writeMediaProject({
    file,
    changes: { colour: { colorAdjustExposure: 40 } },
    runningCheck: noStudio,
  });
  assert.equal(res.ok, true);
  assert.deepEqual(res.changed, [
    { group: "colour", field: "colorAdjustExposure", from: 23, to: 40 },
  ]);
  // The instrument: everything else must be identical, key by key.
  const paths = differingPaths(JSON.parse(ORIGINAL), JSON.parse(fs.readFileSync(file, "utf8")));
  assert.deepEqual(paths, ["projects.0.clip.media_process.colorAdjustExposure"]);
  // And the file line that carries it is the only line that moved.
  const a = ORIGINAL.split("\n");
  const b = fs.readFileSync(file, "utf8").split("\n");
  assert.equal(a.length, b.length);
  assert.equal(a.filter((line, i) => line !== b[i]).length, 1);
});

test("the backup holds the original bytes", () => {
  const file = copyFixture();
  writeMediaProject({ file, changes: { colour: { colorAdjustExposure: 40 } }, runningCheck: noStudio });
  assert.equal(fs.readFileSync(`${file}.bak`, "utf8"), ORIGINAL);
});

test("the edit survives a Studio-shaped read", () => {
  const file = copyFixture();
  writeMediaProject({
    file,
    changes: { colour: { colorAdjustContrast: -20 }, audio: { currentVolume: 75 } },
    runningCheck: noStudio,
  });
  const clip = clipOf(file);
  assert.equal(clip.media_process.colorAdjustContrast, -20);
  // Audio lives in its own nested block, not at clip level.
  assert.equal(clip.audio_setting.currentVolume, 75);
  assert.equal(clip.media_process.colorAdjustExposure, 23, "the other colour sliders are untouched");
});

test("the watermark group targets the nested flat_logo_watermark block", () => {
  const file = copyFixture();
  const res = writeMediaProject({
    file,
    changes: { watermark: { enableFlatLogoWatermark: true, flatLogoWatermarkTransparency: 26 } },
    runningCheck: noStudio,
  });
  assert.equal(res.ok, true);
  const clip = clipOf(file);
  assert.equal(clip.flat_logo_watermark.enableFlatLogoWatermark, true);
  assert.equal(clip.flat_logo_watermark.flatLogoWatermarkTransparency, 26);
  assert.equal(clip.logo_watermark.enableLogoWatermark, false, "the other watermark block is untouched");
});

test("a dashboard style object is stored as the JSON string the file expects", () => {
  const file = copyFixture();
  const style = { enableItems: [], measureUnit: "metric", positions: {} };
  const res = writeMediaProject({
    file,
    changes: { dashboard: { dashboardStyle: style } },
    runningCheck: noStudio,
  });
  assert.equal(res.ok, true);
  assert.equal(clipOf(file).dashboard_setting.dashboardStyle, JSON.stringify(style));
});

// --- refusals: nothing is written when any part of the request is refused ------------------------

const refused = (changes, extra = {}) => {
  const file = copyFixture();
  const res = writeMediaProject({ file, changes, runningCheck: noStudio, ...extra });
  assert.equal(res.ok, false, "expected a refusal");
  assert.equal(fs.readFileSync(file, "utf8"), ORIGINAL, "a refusal must not touch the file");
  assert.equal(fs.existsSync(`${file}.bak`), false);
  return res;
};

test("an unknown group is refused with the list of groups", () => {
  const res = refused({ speed: { x: 1 } });
  assert.match(res.note, /unknown group "speed"/);
  assert.match(res.note, /colour/);
});

test("a field outside its group is refused", () => {
  const res = refused({ colour: { enableLut: true } });
  assert.match(res.refused[0].note, /not in group colour/);
});

test("a value outside the field's own bounds is refused, not clamped", () => {
  const res = refused({ colour: { colorAdjustExposure: 500 } });
  assert.match(res.refused[0].note, /outside the field's bounds -100\.\.100/);
});

test("enabling a feature Studio says the media cannot do is refused", () => {
  const res = refused({ process: { enableLut: true } });
  assert.match(res.refused[0].note, /supportLut is false/);
});

test("a field Studio did not write in this clip is refused unless allowNew is given", () => {
  // The fixture is the richest file in the corpus, so the gap is made rather than hoped for: a clip
  // whose camera did not offer a slider simply does not carry the key, and writing it would add a
  // field Studio never wrote there.
  const doc = JSON.parse(ORIGINAL);
  const block = doc.projects[0].clip.media_process;
  delete block.colorAdjustDefinition;
  const file = copyFixture(serialiseStudioJson(doc));

  const res = writeMediaProject({ file, changes: { colour: { colorAdjustDefinition: 5 } }, runningCheck: noStudio });
  assert.equal(res.ok, false);
  assert.match(res.refused[0].note, /absent in this clip/);
  assert.equal(fs.readFileSync(file, "utf8"), serialiseStudioJson(doc), "the refusal must not touch the file");

  const ok = writeMediaProject({
    file,
    changes: { colour: { colorAdjustDefinition: 5 } },
    allowNew: true,
    runningCheck: noStudio,
  });
  assert.equal(ok.ok, true);
  assert.equal(clipOf(file).media_process.colorAdjustDefinition, 5);
});

test("a wrong type is refused", () => {
  const res = refused({ colour: { colorAdjustExposure: "23" } });
  assert.match(res.refused[0].note, /expected a number/);
  const res2 = refused({ process: { enableLut: 1 } });
  assert.match(res2.refused[0].note, /expected a boolean/);
});

test("the speed track and the trims are refused with the measurement that blocks them", () => {
  const res = refused({ process: { play_rate_track: [] } });
  assert.match(res.refused[0].note, /not in group process|endTime/);
  const res2 = refused({ colour: { leftTrim: 10 } });
  assert.match(res2.refused[0].note, /no trimmed clip exists/);
});

test("one bad field refuses the whole request, including the good ones", () => {
  const res = refused({ colour: { colorAdjustExposure: 40, colorAdjustContrast: 9999 } });
  assert.equal(res.refused.length, 1);
  assert.equal(res.refused[0].field, "colorAdjustContrast");
});

// --- gates --------------------------------------------------------------------------------------

test("an XML-era file is refused by name, with the reason", () => {
  const file = copyFixture(fs.readFileSync(XML_FIXTURE, "utf8"), "legacy.insprj");
  const res = writeMediaProject({ file, changes: { colour: { colorAdjustExposure: 1 } }, runningCheck: noStudio });
  assert.equal(res.ok, false);
  assert.equal(res.encoding, "xml");
  assert.match(res.note, /XML-era file/);
});

test("a file whose layout is not the measured one is refused unless forced", () => {
  const file = copyFixture(JSON.stringify(JSON.parse(ORIGINAL), null, 2));
  const res = writeMediaProject({ file, changes: { colour: { colorAdjustExposure: 40 } }, runningCheck: noStudio });
  assert.equal(res.ok, false);
  assert.match(res.note, /layout is not the measured one/);
  const forced = writeMediaProject({
    file,
    changes: { colour: { colorAdjustExposure: 40 } },
    force: true,
    runningCheck: noStudio,
  });
  assert.equal(forced.ok, true);
  assert.equal(clipOf(file).media_process.colorAdjustExposure, 40);
});

test("Studio running refuses by default and says why, unless forced", () => {
  const file = copyFixture();
  const res = writeMediaProject({
    file,
    changes: { colour: { colorAdjustExposure: 40 } },
    runningCheck: studioUp,
  });
  assert.equal(res.ok, false);
  assert.match(res.note, /Studio is running \(pid 4242\)/);
  assert.equal(fs.readFileSync(file, "utf8"), ORIGINAL);

  const forced = writeMediaProject({
    file,
    changes: { colour: { colorAdjustExposure: 40 } },
    force: true,
    runningCheck: studioUp,
  });
  assert.equal(forced.ok, true);
  assert.equal(forced.studioRunning, true);
  assert.match(forced.note, /may overwrite it on exit/);
});

// --- targeting ----------------------------------------------------------------------------------

test("a multi-project file must be addressed explicitly", () => {
  const doc = JSON.parse(ORIGINAL);
  doc.projects.push({ ...structuredClone(doc.projects[0]), id: "second-id", name: "second" });
  const file = copyFixture(serialiseStudioJson(doc));
  const ambiguous = writeMediaProject({ file, changes: { colour: { colorAdjustExposure: 1 } }, runningCheck: noStudio });
  assert.equal(ambiguous.ok, false);
  assert.match(ambiguous.note, /holds 2 projects/);

  const byId = writeMediaProject({
    file,
    changes: { colour: { colorAdjustExposure: 44 } },
    projectId: "second-id",
    runningCheck: noStudio,
  });
  assert.equal(byId.ok, true);
  const after = JSON.parse(fs.readFileSync(file, "utf8"));
  assert.equal(after.projects[0].clip.media_process.colorAdjustExposure, 23, "the first project is untouched");
  assert.equal(after.projects[1].clip.media_process.colorAdjustExposure, 44);
});

test("the media path resolves to its file by the md5 directory rule", () => {
  // The fixture records the real pairing, so this exercises the lookup end to end.
  const prov = JSON.parse(fs.readFileSync("tests/fixtures/insprj-fixtures.json", "utf8"));
  const entry = prov.fixtures["media-project-json.insprj"];
  assert.equal(entry.hashMatches, true);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "insprj-lookup-"));
  const cached = path.join(dir, entry.dirHash);
  fs.mkdirSync(cached);
  fs.writeFileSync(path.join(cached, "footage_project.insprj"), ORIGINAL);
  const res = writeMediaProject({
    media: entry.mediaId,
    changes: { colour: { colorAdjustExposure: 40 } },
    dryRun: true,
    searchContent: false,
    roots: [{ key: "test", dir: dir.replace(/\\/g, "/") }],
    runningCheck: noStudio,
  });
  assert.equal(res.ok, true, res.note);
  assert.equal(res.dryRun, true);
  assert.match(res.file, new RegExp(`${entry.dirHash}/footage_project\\.insprj$`));
});

test("every writable group maps to a block that exists in the fixture's clip", () => {
  const clip = clipOf(FIXTURE);
  for (const [group, block] of Object.entries(BLOCKS)) {
    assert.ok(clip[block], `${group} → clip.${block} is present`);
    assert.ok(WRITABLE[group].length > 0, `${group} lists fields`);
  }
});
