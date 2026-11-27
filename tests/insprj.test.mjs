/**
 * Media-page project file (`.insprj`) — the reader.
 *
 * The fixtures are Studio's own files, trimmed to one item (provenance and the real
 * md5(media path) = directory pairing live in tests/fixtures/insprj-fixtures.json, rebuilt by
 * `node tests/mk-insprj-fixtures.mjs`). So these assertions fail when the app's format changes,
 * not when a hand-written sample drifts.
 *
 * The two encodings are both here: Studio 6.x writes JSON, Studio 5.x wrote XML, same extension.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  detectEncoding,
  familyOf,
  findMediaProjects,
  mediaPathHash,
  mediaProjectRoots,
  normaliseClip,
  readMediaProject,
  summariseMediaProject,
  toForwardSlashes,
  xmlToObject,
} from "../src/insprj.mjs";

const prov = JSON.parse(fs.readFileSync("tests/fixtures/insprj-fixtures.json", "utf8"));
const JSON_FIXTURE = "tests/fixtures/media-project-json.insprj";
const XML_FIXTURE = "tests/fixtures/media-project-legacy-xml.insprj";

const jsonProject = () => readMediaProject(JSON_FIXTURE);
const xmlProject = () => readMediaProject(XML_FIXTURE);

test("the encoding is read from the content, not the extension", () => {
  assert.equal(detectEncoding('{"id":"x"}'), "json");
  assert.equal(detectEncoding('  \n<?xml version="1.0"?><project/>'), "xml");
  assert.equal(detectEncoding("<project version=\"2.0.0\">"), "xml");
  assert.equal(detectEncoding("nonsense"), "unknown");
  assert.equal(detectEncoding("\uFEFF{ }"), "json", "a BOM must not hide the JSON");
  // Both fixtures end in .insprj — the extension carries no information.
  assert.equal(path.extname(JSON_FIXTURE), ".insprj");
  assert.equal(path.extname(XML_FIXTURE), ".insprj");
});

test("the directory name is md5 of the media path — the rule the lookup relies on", () => {
  // Measured over the whole corpus: 920/920 JSON files (research/insprj_lookup.mjs).
  // The XML fixture is the one XML-era pair where the same rule happens to hold — kept as a real
  // example, with the caveat that it is *not* uniform on that side: 10/371 by cloud_media_id and
  // 46/406 by folder + file name, so a lookup on an XML-era file must not depend on it.
  for (const [name, meta] of Object.entries(prov.fixtures)) {
    if (!meta.mediaId) continue;
    assert.equal(mediaPathHash(meta.mediaId), meta.dirHash, `${name}: md5(id) should equal the directory`);
    assert.equal(meta.hashMatches, true);
  }
  assert.equal(mediaPathHash(prov.fixtures["media-project-legacy-xml.insprj"].mediaId), "3cc9e7310a8d75d2a043918a0d728407");
  // Backslashes and forward slashes are the same path.
  assert.equal(mediaPathHash("F:\\X6\\Camera01\\a.insv"), mediaPathHash("F:/X6/Camera01/a.insv"));
  assert.equal(toForwardSlashes("D:\\Videos\\x.mp4"), "D:/Videos/x.mp4");
});

test("a JSON Media-page project reads its media id, item and settings", () => {
  const p = jsonProject();
  assert.equal(p.ok, true);
  assert.equal(p.encoding, "json");
  assert.equal(p.mediaId, "F:/X6/Camera01/VID_20261116_221835_00_089.mp4");
  assert.equal(p.selectedId, p.items[0].id);
  assert.equal(p.count, 1);
  // `dirHash` describes the file as it sits on disk — for a fixture that is its own folder, which is
  // exactly the point: the hash rule is asserted against the *recorded* source, below.
  assert.equal(p.dirHash, "fixtures");
  assert.equal(mediaPathHash(p.mediaId), prov.fixtures["media-project-json.insprj"].dirHash);

  const clip = p.items[0].clip;
  assert.equal(clip.name, "VID_089.mp4", "the clip carries the camera's short display name");
  assert.equal(clip.url, p.mediaId);
  assert.equal(clip.trim.sourceFrames, 2046);
  assert.equal(clip.framing.ratio, 8);
  // The watermark *resource* is configured even though the toggle is off — a writer must not read
  // the presence of a path as "the watermark is on".
  assert.match(clip.watermark.flat.selectedLogoWatermarkPath, /insta360-X6\.png$/);
  assert.equal(clip.watermark.flat.enableFlatLogoWatermark, false);
});

test("manual colour has real specimens in this corpus — the A2 residual was wrong about that", () => {
  // A2 recorded "manual colour (exposure/WB/tone) has no specimen anywhere" from the *project page*
  // clips. The Media-page file carries it, edited: this specimen has exposure 23 and contrast -48.
  const clip = jsonProject().items[0].clip;
  assert.equal(clip.colour.enableColorAdjust, true);
  assert.equal(clip.colour.colorAdjustExposure, 23);
  assert.equal(clip.colour.colorAdjustContrast, -48);
  assert.equal(clip.colour.enableColorPlus, true);
  assert.equal(clip.process.enableMotionBlur, true, "a motion-blur edit with a specimen too");
  assert.equal(clip.process.enableMultiFrameDenoise, false);
  assert.equal(clip.audio.currentVolume, 100);
});

test("the speed track carries segments, and their timebase is not the timeline length", () => {
  const clip = jsonProject().items[0].clip;
  assert.equal(clip.speed.segments.length, 1);
  const [seg] = clip.speed.segments;
  assert.deepEqual(
    { start: seg.start, end: seg.end, min: seg.min, max: seg.max },
    { start: 0, end: 8184, min: 4, max: 4 },
  );
  assert.equal(typeof seg.id, "string", "each segment carries its own uuid");
  // 8184 = 2046 source frames × 4 — so `end` is *not* a timeline frame count. Writing this field
  // needs its timebase measured first (A5); this test pins the observation so it cannot be forgotten.
  assert.equal(clip.trim.sourceFrames * seg.max, seg.end);
  assert.notEqual(seg.end, clip.trim.sourceFrames);
  assert.equal(clip.speed.hasSetPlayRateManually, false);
});

test("an XML (Studio 5.x) file is reported as legacy, not quietly mapped onto JSON names", () => {
  const p = xmlProject();
  assert.equal(p.ok, true);
  assert.equal(p.encoding, "xml");
  assert.equal(p.formatVersion, "2.0.0");
  assert.equal(p.app, "Insta360 Studio 5.3.3");
  assert.equal(p.appVersion, "5.3.3");
  assert.equal(p.mediaId, "D:/DCIM/Camera01/IMG_20240916_164919_00_001.jpg");
  assert.equal(p.fileGroup.type, "photo_normal");
  assert.deepEqual(p.fileGroup.files, ["IMG_20240916_164919_00_001.jpg"]);
  assert.equal(p.count, 1);
  assert.ok(p.warnings.length > 0, "a legacy file must say so");
  assert.ok(p.translationNotes.length >= 3, "the name/unit differences are part of the answer");

  const item = p.items[0];
  assert.equal(item.id, "project file1");
  assert.equal(item.legacy.preference.trim_end, 15000, "milliseconds, not frames");
  assert.equal(item.legacy.preference.ratio_width, 16);
  assert.equal(item.legacy.rendering.dewarp, 15);
  assert.equal(item.legacy.rendering.projection, 64);
  assert.ok(Math.abs(item.legacy.rendering.fov - 1.3089969389957472) < 1e-9);
  // Same-looking knob, different scale: 0.5 here against 100 in the JSON schema. If a writer ever
  // copies one into the other it must convert — so assert the difference rather than assume it.
  assert.equal(item.legacy.audio.volume, 0.5);
  assert.ok(item.legacy.audio.volume <= 1);
  assert.ok("enable_logo" in item.legacy.logo, "the logo block uses its own attribute names");
  // Only dashboard_setting agrees by name.
  assert.deepEqual(item.mappedFrom, ["dashboard_setting"]);
  assert.ok("app_data_ratio" in item.unmapped, "unmodelled scheme attributes are still reported");
});

test("`play_rate` sits inside <rendering> in XML — the tree is returned so this is checkable", () => {
  const p = xmlProject();
  const scheme = p.xml.project.schemes.scheme;
  assert.ok(scheme.preference.rendering.play_rate !== undefined, "play_rate is nested, not top-level");
  assert.equal(scheme.play_rate, undefined);
});

test("xmlToObject types attribute values and collects repeated tags into arrays", () => {
  const tree = xmlToObject('<root a="1" b="true" c="x"><item name="one"/><item name="two"/></root>');
  assert.equal(tree.root.a, 1);
  assert.equal(tree.root.b, true);
  assert.equal(tree.root.c, "x");
  assert.equal(tree.root.item.length, 2);
  assert.equal(tree.root.item[1].name, "two");
  assert.equal(xmlToObject("<r><f>text</f></r>").r.f["#text"], "text");
  assert.deepEqual(xmlToObject("<r><self/></r>").r.self, {});
});

test("findMediaProjects finds the hash directory first and names how it matched", () => {
  const root = fs.mkdtempSync(path.join(process.env.TMPDIR ?? os.tmpdir(), "insprj-lookup-"));
  try {
    const media = "F:/X6/Camera01/VID_20261116_221835_00_089.mp4";
    const other = "F:/X6/Camera01/VID_20261116_221835_00_099.mp4";
    const dir = `${root}/${mediaPathHash(media)}`;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(`${dir}/footage_project.insprj`, `{"id":"${media}","projects":[]}`);
    // A file that names the other media path but sits in no matching directory: only a content match
    // can find it, which is precisely the fallback the XML-era layout needs.
    fs.mkdirSync(`${root}/decoy`, { recursive: true });
    fs.writeFileSync(`${root}/decoy/other.insprj`, `{"id":"${other}"}`);

    const found = findMediaProjects({ media, roots: [{ key: "test", dir: root }], searchContent: true });
    assert.equal(found.ok, true);
    assert.equal(found.hashMatched, true);
    assert.equal(found.hash, mediaPathHash(media));
    assert.equal(found.matches[0].match, "hash", "the hash match must sort first");
    assert.equal(found.matches[0].path, `${dir}/footage_project.insprj`);

    // A media path that has no hash directory is still found by the path inside the file.
    const byContent = findMediaProjects({ media: other, roots: [{ key: "test", dir: root }] });
    assert.equal(byContent.hashMatched, false);
    assert.deepEqual(byContent.matches.map((m) => m.match), ["content"]);
    assert.equal(byContent.matches[0].path, `${root}/decoy/other.insprj`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a format the reader does not know is refused with what it actually saw", () => {
  const root = fs.mkdtempSync(path.join(process.env.TMPDIR ?? os.tmpdir(), "insprj-bad-"));
  try {
    const bad = `${root}/broken.insprj`;
    fs.writeFileSync(bad, '{"id": "x",');
    const p = readMediaProject(bad);
    assert.equal(p.ok, false);
    assert.match(p.note, /not valid JSON/);
    assert.equal(p.encoding, "json", "the encoding is still reported so the cause is visible");

    const odd = `${root}/odd.insprj`;
    fs.writeFileSync(odd, "PK\u0003\u0004 binary");
    const q = readMediaProject(odd);
    assert.equal(q.ok, false);
    assert.equal(q.encoding, "unknown");
    assert.match(q.note, /unrecognised encoding/);

    assert.equal(readMediaProject(`${root}/missing.insprj`).ok, false);
    assert.equal(readMediaProject().ok, false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("the summary keeps the settings and drops every raw tree", () => {
  const summary = summariseMediaProject(jsonProject());
  assert.equal(summary.ok, true);
  assert.equal(summary.encoding, "json");
  assert.equal(summary.items[0].clip.colour.colorAdjustExposure, 23);
  assert.equal(summary.items[0].clip.raw, undefined, "the raw clip must not be in the summary");
  assert.ok(!JSON.stringify(summary).includes('"raw"'), "no raw tree anywhere in the payload");

  const legacy = summariseMediaProject(xmlProject());
  assert.equal(legacy.items[0].legacy.rendering.dewarp, 15, "the legacy block survives summarising");
  assert.ok(legacy.translationNotes.length >= 3);
  assert.equal(legacy.items[0].xml, undefined);
  assert.equal(legacy.xml, undefined);
});

test("familyOf distinguishes the Media-page layouts", () => {
  assert.equal(familyOf("D:/x/FootageProject/abc/footage_project.insprj"), "footage");
  assert.equal(familyOf("D:/x/Project/abc/VID_001.mp4.insprj"), "media");
  assert.equal(familyOf("D:/x/Project/abc/.insprj"), "bare");
});

test("every real .insprj on this machine is read as json or xml (corpus smoke test)", () => {
  const roots = mediaProjectRoots();
  if (!roots.length || !roots.every((r) => fs.existsSync(r.dir))) {
    console.log("skip — no Media-page project roots on this machine");
    return;
  }
  const files = [];
  const walk = (dir, depth) => {
    if (depth > 4 || files.length >= 40) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (files.length >= 40) return;
      if (e.isDirectory()) walk(`${dir}/${e.name}`, depth + 1);
      else if (e.name.toLowerCase().endsWith(".insprj")) files.push(`${dir}/${e.name}`);
    }
  };
  for (const r of roots) walk(r.dir, 0);
  assert.ok(files.length > 0, "the roots exist, so there must be files");
  const encodings = new Set();
  for (const file of files) {
    const p = readMediaProject(file);
    assert.equal(p.ok, true, `${file}: ${p.note}`);
    assert.ok(["json", "xml"].includes(p.encoding), `${file}: odd encoding ${p.encoding}`);
    encodings.add(p.encoding);
  }
  console.log(`checked ${files.length} real .insprj, encodings seen: ${[...encodings].join(", ")}`);
});

test("normaliseClip is defensive about a missing clip", () => {
  assert.equal(normaliseClip(null), null);
  assert.equal(normaliseClip(undefined), null);
  assert.equal(normaliseClip({}).speed.segments.length, 0);
  assert.equal(normaliseClip({ name: "x" }).name, "x");
});
