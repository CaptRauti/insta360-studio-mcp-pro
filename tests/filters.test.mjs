/**
 * Filter tests, against the two shapes the project corpus actually contains.
 *
 * The fixtures are *real* blocks, copied verbatim out of the files: the applied one from mcpTest
 * (opacity 70, "Fireworks I") and the empty one from the other 59 clips. A made-up fixture would
 * only test this file's idea of the schema, which is exactly the trap `studio_clip_keyframes`
 * fell into — the empty form being `""` rather than an absent key is the kind of detail a
 * handwritten fixture gets wrong.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { EMPTY_FILTER, FILTER_FIELDS, clearFilter, filterState, readFilterManifest, scanInstalledFilters, setFilter } from "../src/filters.mjs";

/** Verbatim from TimelineProject/mcpTest, clip VID_20261112_054457_004.mp4. */
const applied = () => ({
  effect_filter: {
    externfilterId: "HD Fireworks",
    externfilterName: "Fireworks I",
    externfilterOpacity: 70,
    externfilterResourcePath:
      "D:/Dokumente/Insta360/Studio/Download/filter/HD Fireworks/1765962688000/HD Fireworks.cube.binary",
  },
});

/** Verbatim empty form, as 59 of the 60 clips carry it. */
const empty = () => ({
  effect_filter: { externfilterId: "", externfilterName: "", externfilterOpacity: 70, externfilterResourcePath: "" },
});

/** A real downloaded filter tree, so the lister runs on the layout Studio writes.
 *  The root sits inside its own temporary base, because the catalog lives one level up from the
 *  filter tree — a shared parent would let two fixtures see each other's manifest. */
function fixtureTree() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "insta360-filters-"));
  const root = path.join(base, "filter");
  for (const [id, version, size] of [
    ["HD Fireworks", "1765962688000", 8],
    ["00sLook", "1793348936000", 4],
    ["Nostalgic", "1793348341000", 6],
  ]) {
    const dir = path.join(root, id, version);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${id}.cube.binary`), Buffer.alloc(size, 7));
  }
  fs.mkdirSync(path.join(root, "cover", "x"), { recursive: true }); // no LUT: must be skipped
  // The catalog Studio keeps one level up: name -> "<id>/<version>". Two of the three installed
  // filters are named there, the third is not — both cases occur on this machine.
  const info = path.join(base, "info");
  fs.mkdirSync(info, { recursive: true });
  fs.writeFileSync(
    path.join(info, "filter_resource_manifest.json"),
    JSON.stringify({
      "HD Fireworks": "HD Fireworks/1765962688000",
      "Old Look": "00sLook/1793348936000",
      "Some Filter Never Downloaded": "Missing/1",
    }),
  );
  return root;
}

test("reads the applied specimen the way Studio wrote it", () => {
  const s = filterState(applied());
  assert.equal(s.present, true);
  assert.equal(s.applied, true);
  assert.equal(s.id, "HD Fireworks");
  assert.equal(s.name, "Fireworks I", "the display name is not the id — the specimen proves it");
  assert.equal(s.opacity, 70);
  assert.match(s.resourcePath, /HD Fireworks\.cube\.binary$/);
});

test("reads the empty form as no filter, not as a missing block", () => {
  const s = filterState(empty());
  assert.equal(s.present, true);
  assert.equal(s.applied, false);
  assert.equal(s.opacity, 70);
});

test("a clip with no effect_filter at all is reported as absent", () => {
  const s = filterState({});
  assert.equal(s.present, false);
  assert.equal(s.applied, false);
  assert.equal(s.opacity, EMPTY_FILTER.externfilterOpacity);
});

test("applying a filter keeps Studio's key order", () => {
  const clip = empty();
  const before = Object.keys(clip.effect_filter);
  const r = setFilter(clip, { id: "Nostalgic", resourcePath: "/tmp/Nostalgic.cube.binary" });
  assert.equal(r.changed, true);
  assert.deepEqual(Object.keys(clip.effect_filter), before, "the block is mutated in place, not rebuilt");
  assert.equal(clip.effect_filter[FILTER_FIELDS.id], "Nostalgic");
});

test("the resource path is resolved from the installed tree when only an id is given", () => {
  const root = fixtureTree();
  const clip = empty();
  const r = setFilter(clip, { id: "HD Fireworks", root });
  assert.equal(r.changed, true);
  assert.equal(clip.effect_filter.externfilterResourcePath, `${root.replace(/\\/g, "/")}/HD Fireworks/1765962688000/HD Fireworks.cube.binary`);
  assert.equal(r.resourceExists, true);
  assert.equal(r.warning, undefined);
});

test("an unknown id leaves the path empty and says so", () => {
  const root = fixtureTree();
  const clip = empty();
  const r = setFilter(clip, { id: "Not Downloaded", root });
  assert.equal(clip.effect_filter.externfilterResourcePath, "");
  assert.equal(r.resourceExists, false);
  assert.match(r.warning, /does not exist/);
});

test("clearing restores Studio's empty form exactly, not a deleted key", () => {
  const clip = applied();
  const r = clearFilter(clip);
  assert.equal(r.changed, true);
  assert.deepEqual(clip.effect_filter, EMPTY_FILTER);
  assert.equal("effect_filter" in clip, true, "the block stays; every clip in the corpus has one");
});

test("clearing a clip that never had a block creates the empty form", () => {
  const clip = {};
  const r = clearFilter(clip);
  assert.deepEqual(clip.effect_filter, EMPTY_FILTER);
  assert.equal(r.changed, true);
  assert.equal(r.after.applied, false);
});

test("setting the same values twice reports no change", () => {
  const clip = applied();
  const again = setFilter(clip, {
    id: "HD Fireworks",
    name: "Fireworks I",
    opacity: 70,
    resourcePath: "D:/Dokumente/Insta360/Studio/Download/filter/HD Fireworks/1765962688000/HD Fireworks.cube.binary",
  });
  assert.equal(again.changed, false, "a no-op write should be visible as one");
});

test("backslashes become forward slashes, the style the project file uses", () => {
  const clip = empty();
  setFilter(clip, { id: "X", resourcePath: "D:\\Luts\\X.cube.binary" });
  assert.equal(clip.effect_filter.externfilterResourcePath, "D:/Luts/X.cube.binary");
});

test("opacity defaults to Studio's 70 and an explicit value wins", () => {
  const a = empty();
  setFilter(a, { id: "X" });
  assert.equal(a.effect_filter.externfilterOpacity, 70);
  const b = empty();
  setFilter(b, { id: "X", opacity: 40 });
  assert.equal(b.effect_filter.externfilterOpacity, 40);
});

test("the lister finds every installed LUT and skips directories without one", () => {
  const root = fixtureTree();
  const found = scanInstalledFilters(root);
  assert.deepEqual(
    found.map((f) => f.id),
    ["00sLook", "HD Fireworks", "Nostalgic"],
    "sorted by id",
  );
  assert.equal(found.length, 3, "the cover directory has no .cube.binary and must not appear");
  assert.equal(found.find((f) => f.id === "Nostalgic").bytes, 6);
  assert.equal(found.find((f) => f.id === "HD Fireworks").version, "1765962688000");
});

test("the lister returns an empty list for a directory that does not exist", () => {
  assert.deepEqual(scanInstalledFilters(path.join(os.tmpdir(), "insta360-does-not-exist-xyz")), []);
});

test("the lister attaches the catalog name and leaves it null when the catalog has none", () => {
  const root = fixtureTree();
  const found = scanInstalledFilters(root);
  assert.equal(found.find((f) => f.id === "HD Fireworks").name, "HD Fireworks");
  assert.equal(found.find((f) => f.id === "00sLook").name, "Old Look", "the catalog name can differ from the directory");
  assert.equal(found.find((f) => f.id === "Nostalgic").name, null, "Nostalgic is on disk but not in the catalog");
});

test("applying by id takes the name from the catalog when the caller gives none", () => {
  const root = fixtureTree();
  const clip = empty();
  setFilter(clip, { id: "00sLook", root });
  assert.equal(clip.effect_filter.externfilterName, "Old Look");
  const other = empty();
  setFilter(other, { id: "Nostalgic", root });
  assert.equal(other.effect_filter.externfilterName, "Nostalgic", "falls back to the id");
});

test("an explicit name always wins over the catalog", () => {
  const root = fixtureTree();
  const clip = empty();
  setFilter(clip, { id: "00sLook", name: "Fireworks I", root });
  assert.equal(clip.effect_filter.externfilterName, "Fireworks I");
});

test("the catalog says what is downloaded and what is only offered", () => {
  const root = fixtureTree();
  const catalog = readFilterManifest(root);
  assert.equal(catalog.length, 3);
  assert.deepEqual(catalog.filter((c) => c.installed).map((c) => c.name).sort(), ["HD Fireworks", "Old Look"]);
  assert.deepEqual(catalog.filter((c) => !c.installed).map((c) => c.name), ["Some Filter Never Downloaded"]);
});

test("a missing catalog is not an error, just an empty list", () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "insta360-nocatalog-"));
  const root = path.join(base, "filter");
  fs.mkdirSync(root, { recursive: true });
  assert.deepEqual(readFilterManifest(root), []);
  assert.equal(scanInstalledFilters(root).length, 0);
});
