/**
 * Transition tests.
 *
 * The clip-side fixture is the **recorded** entry from `mcpAcceptance.insproj` (docs/ASSET_CATALOG.md
 * §2.2) — that project is gone and no project on this machine carries a transition, so this is
 * deliberately not dressed up as a live specimen; it is the shape a writer will have to satisfy and
 * the shape a reader must carry through without losing keys.
 *
 * The asset side is a fixture of the real on-disk layout, because that part *is* live: 134 asset
 * directories under `Download/transition`, each holding a `.videotransition` NVAP container, a cover,
 * a `.lic`, and a Chinese-metadata `.json` whose `素材名称` is the only readable name.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { readTransitionManifest, removeTransition, scanTransitionAssets, setTransition, transitionState } from "../src/transitions.mjs";

/** Recorded verbatim from mcpAcceptance.insproj (a project that no longer exists here). */
const recordedEntry = () => ({
  defaultFrames: 14,
  frames: 60,
  id: "4db93c6b-1904-4ecb-bc92-ea16c7191cbf",
  maximumFrames: 60,
  minimumFrames: 6,
  name: "",
  nextClip: "2f242419-d096-4a83-8b48-31d740a7be51",
  path: "D:/Dokumente/Insta360/Studio/Download/transition/B9AE47D4-71E3-41F5-A5AA-E605AD3EF092/1794456470000/B9AE47D4-71E3-41F5-A5AA-E605AD3EF092/B9AE47D4-71E3-41F5-A5AA-E605AD3EF092.2.videotransition",
  prevClip: "3eaa5081-9bd9-431a-b9d8-d5abf57ee119",
  resourceId: "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092",
  state: 0,
  type: 2,
});

/** Harvested verbatim from mcpKey after a transition was added in the editor — the **real** shape. */
const harvested = () => ({
  defaultFrames: 14,
  frames: 14,
  id: "45ba6275-7b7a-4ac1-8930-a62f8b4a8a36",
  maximumFrames: 60,
  minimumFrames: 6,
  name: "",
  nextClip: "A43D8637-4AEC-4775-B23B-0F2DA94B7F20",
  path: "D:/Dokumente/Insta360/Studio/Download/transition/B9AE47D4-71E3-41F5-A5AA-E605AD3EF092/1794456470000/B9AE47D4-71E3-41F5-A5AA-E605AD3EF092/B9AE47D4-71E3-41F5-A5AA-E605AD3EF092.2.videotransition",
  prevClip: "E500ED05-3B4C-4F6F-B514-9307C45BED10",
  resourceId: "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092",
  state: 0,
  type: 2,
});

/** The track those three clips live on, in Studio's own order — verbatim ids from the file. */
const track = () => ({
  transitions: [],
  clips: [
    { id: "E500ED05-3B4C-4F6F-B514-9307C45BED10", url: "D:/Videos/X6/Camera01/VID_20260917_192757_00_001.insv" },
    { id: "A43D8637-4AEC-4775-B23B-0F2DA94B7F20", url: "D:/Videos/X6/Camera01/VID_20260917_193416_00_002.insv" },
    { id: "8ec0a88e-4b8b-45cd-b2e0-a8bffd368a9e", url: "D:/Videos/X6/Camera01/VID_20260917_193416_00_002.insv" },
  ],
});

/** The layout Studio writes, with the asset the harvested entry names. */
function fixtureTree() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "insta360-transitions-"));
  const root = path.join(base, "transition");
  for (const uuid of ["0D4E05B5-A3E3-4C10-A081-58A920B45A15", "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092"]) {
    const dir = path.join(root, uuid, "1794456455000", uuid);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${uuid}.2.videotransition`), Buffer.alloc(80, 3));
    fs.writeFileSync(path.join(dir, `${uuid}.json`), JSON.stringify({ 素材名称: "从左到右-叠化", UUID: uuid }));
    fs.writeFileSync(
      path.join(dir, "info.json"),
      JSON.stringify({ category: 3, name: uuid.startsWith("B9") ? "Fold change:R-L" : "Left to right", minSdkVersion: "2.13.0", packageFileName: `${uuid}.2.videotransition`, supportedAspectRatio: "16v9|1v1", type: 5, uuid, version: 2 }),
    );
    fs.writeFileSync(path.join(dir, "cover.webp"), Buffer.alloc(10, 1));
    fs.writeFileSync(path.join(dir, `${uuid}.2.lic`), "lic");
  }
  fs.mkdirSync(path.join(root, "no-payload-here", "1"), { recursive: true });
  fs.mkdirSync(path.join(base, "info"), { recursive: true });
  fs.writeFileSync(
    path.join(base, "info", "transition_resource_manifest.json"),
    JSON.stringify({ "0D4E05B5-A3E3-4C10-A081-58A920B45A15": "1794456455000", "FFFFFFFF-0000-0000-0000-000000000000": "1" }),
  );
  return root;
}

test("a clip with no transitions reports zero, not an error", () => {
  assert.deepEqual(transitionState({}), { count: 0, transitions: [] });
});

test("the reader looks at the track, and a clip-level array is not what the file uses", () => {
  // What Studio actually wrote: the entry is on the track. A clip carrying `transitions` is what the
  // documented spec claimed and what two earlier passes searched for in vain.
  const t = track();
  t.transitions = [harvested()];
  assert.equal(transitionState(t).count, 1);
  assert.equal(transitionState({ transitions: [harvested()] }).count, 1, "the reader follows the data it is handed");
});

test("the harvested entry carries the values Studio wrote, including frames=14 not 60", () => {
  const t = { transitions: [harvested()] };
  const one = transitionState(t).transitions[0];
  assert.equal(one.frames, 14);
  assert.equal(one.defaultFrames, 14);
  assert.equal(one.minimumFrames, 6);
  assert.equal(one.maximumFrames, 60);
  assert.equal(one.resourceId, "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092");
  assert.equal(one.prevClip, "E500ED05-3B4C-4F6F-B514-9307C45BED10");
  assert.equal(one.nextClip, "A43D8637-4AEC-4775-B23B-0F2DA94B7F20");
  assert.equal(one.keys.length, 12);
});

test("inserting a transition writes the twelve keys Studio writes", () => {
  const root = fixtureTree();
  const t = track();
  const r = setTransition(t, { prevClip: "E500ED05-3B4C-4F6F-B514-9307C45BED10", nextClip: "A43D8637-4AEC-4775-B23B-0F2DA94B7F20", resourceId: "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092", root });
  assert.equal(r.ok, true);
  assert.deepEqual(Object.keys(r.transition).sort(), Object.keys(harvested()).sort());
  assert.equal(r.transition.frames, 14, "defaultFrames when the caller names none");
  assert.equal(r.transition.name, "");
  assert.equal(r.transition.state, 0);
  assert.equal(r.transition.type, 2);
  assert.equal(r.transition.path, scanTransitionAssets(root).find((a) => a.resourceId === r.transition.resourceId).payload);
  assert.equal(r.transition.defaultFrames, 14);
  assert.equal(t.transitions.length, 1, "and nothing else on the track was touched");
  assert.equal(r.clipCountChanged, false);
});

test("a transition must join two adjacent clips", () => {
  const root = fixtureTree();
  const t = track();
  const r = setTransition(t, { prevClip: "E500ED05-3B4C-4F6F-B514-9307C45BED10", nextClip: "8ec0a88e-4b8b-45cd-b2e0-a8bffd368a9e", resourceId: "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092", root });
  assert.equal(r.ok, false);
  assert.match(r.error, /adjacent/);
  assert.equal(t.transitions.length, 0);
});

test("an id that is not on this track is refused, with the ids it does have", () => {
  const root = fixtureTree();
  const t = track();
  const r = setTransition(t, { prevClip: "nope", nextClip: "A43D8637-4AEC-4775-B23B-0F2DA94B7F20", resourceId: "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092", root });
  assert.equal(r.ok, false);
  assert.match(r.error, /must be on this track/);
});

test("an asset that is not installed is refused, with the ones that are", () => {
  const root = fixtureTree();
  const t = track();
  const r = setTransition(t, { prevClip: "E500ED05-3B4C-4F6F-B514-9307C45BED10", nextClip: "A43D8637-4AEC-4775-B23B-0F2DA94B7F20", resourceId: "FFFFFFFF-0000-0000-0000-000000000000", root });
  assert.equal(r.ok, false);
  assert.deepEqual(r.known.sort(), ["0D4E05B5-A3E3-4C10-A081-58A920B45A15", "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092"]);
});

test("frames outside Studio's 6..60 are refused, inside are honoured", () => {
  const root = fixtureTree();
  const pair = { prevClip: "E500ED05-3B4C-4F6F-B514-9307C45BED10", nextClip: "A43D8637-4AEC-4775-B23B-0F2DA94B7F20", resourceId: "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092", root };
  const t = track();
  assert.equal(setTransition(t, { ...pair, frames: 61 }).ok, false);
  assert.equal(setTransition(t, { ...pair, frames: 5 }).ok, false);
  assert.equal(t.transitions.length, 0, "a refused call must not have written anything");
  assert.equal(setTransition(t, { ...pair, frames: 60 }).ok, true);
  assert.equal(t.transitions[0].frames, 60);
});

test("inserting twice on one gap updates instead of duplicating, and keeps the id", () => {
  const root = fixtureTree();
  const t = track();
  const pair = { prevClip: "E500ED05-3B4C-4F6F-B514-9307C45BED10", nextClip: "A43D8637-4AEC-4775-B23B-0F2DA94B7F20", resourceId: "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092", root };
  const first = setTransition(t, pair);
  const second = setTransition(t, { ...pair, frames: 30 });
  assert.equal(t.transitions.length, 1);
  assert.equal(second.updated, first.added);
  assert.equal(t.transitions[0].frames, 30);
  assert.equal(second.changed, true);
  const third = setTransition(t, { ...pair, frames: 30 });
  assert.equal(third.changed, false, "a no-op update reports no change");
});

test("a different asset on the same gap replaces the resource but keeps the entry", () => {
  const root = fixtureTree();
  const t = track();
  const pair = { prevClip: "E500ED05-3B4C-4F6F-B514-9307C45BED10", nextClip: "A43D8637-4AEC-4775-B23B-0F2DA94B7F20" };
  const first = setTransition(t, { ...pair, resourceId: "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092", root });
  const other = setTransition(t, { ...pair, resourceId: "0D4E05B5-A3E3-4C10-A081-58A920B45A15", root });
  assert.equal(other.updated, first.added);
  assert.equal(t.transitions.length, 1);
  assert.equal(t.transitions[0].resourceId, "0D4E05B5-A3E3-4C10-A081-58A920B45A15");
  assert.match(t.transitions[0].path, /0D4E05B5/);
});

test("removing works by pair and by id, and a track without the array is a no-op", () => {
  const root = fixtureTree();
  const t = track();
  const pair = { prevClip: "E500ED05-3B4C-4F6F-B514-9307C45BED10", nextClip: "A43D8637-4AEC-4775-B23B-0F2DA94B7F20" };
  const made = setTransition(t, { ...pair, resourceId: "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092", root });
  assert.equal(removeTransition(t, { id: "not-this-one" }).removed, 0);
  assert.equal(removeTransition(t, pair).removed, 1);
  assert.equal(t.transitions.length, 0);
  const other = track();
  const made2 = setTransition(other, { ...pair, resourceId: "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092", root });
  assert.equal(removeTransition(other, { id: made2.added }).removed, 1);
  assert.deepEqual(removeTransition({}, { id: "x" }), { ok: true, removed: 0, count: 0 });
  assert.ok(made.added);
});

test("the recorded entry survives the reader with every value intact", () => {
  const s = transitionState({ transitions: [recordedEntry()] });
  assert.equal(s.count, 1);
  const t = s.transitions[0];
  assert.equal(t.id, "4db93c6b-1904-4ecb-bc92-ea16c7191cbf");
  assert.equal(t.resourceId, "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092");
  assert.equal(t.prevClip, "3eaa5081-9bd9-431a-b9d8-d5abf57ee119");
  assert.equal(t.nextClip, "2f242419-d096-4a83-8b48-31d740a7be51");
  assert.equal(t.frames, 60);
  assert.equal(t.minimumFrames, 6);
  assert.equal(t.maximumFrames, 60);
  assert.equal(t.defaultFrames, 14);
  assert.equal(t.type, 2);
  assert.equal(t.state, 0);
});

test("the reader reports whether the payload it names is actually on disk", () => {
  const s = transitionState({ transitions: [recordedEntry()] });
  assert.equal(s.transitions[0].pathExists, true, "this recorded asset turns out to be installed — the asset side is live even though no project uses it");
});

test("the reader lists the keys it saw, so an unknown extra field is visible", () => {
  const entry = { ...recordedEntry(), somethingNew: 1 };
  const s = transitionState({ transitions: [entry] });
  assert.ok(s.transitions[0].keys.includes("somethingNew"));
  assert.equal(s.transitions[0].keys.length, 13, "the recorded entry has 12 keys, plus the one added here");
});

test("the asset lister finds the payload, the cover, the licence and both names", () => {
  const root = fixtureTree();
  const assets = scanTransitionAssets(root);
  assert.equal(assets.length, 2, "two real assets; the directory without a .videotransition is skipped");
  const a = assets.find((x) => x.resourceId === "0D4E05B5-A3E3-4C10-A081-58A920B45A15");
  assert.equal(a.name, "Left to right", "info.json's English name wins");
  assert.equal(a.localizedName, "从左到右-叠化", "the Chinese metadata is kept as a fallback");
  assert.equal(a.supportedAspectRatio, "16v9|1v1");
  assert.match(a.payload, /\.2\.videotransition$/);
  assert.match(a.cover, /cover\.webp$/);
  assert.equal(a.hasLicense, true);
  assert.equal(a.bytes, 80);
});

test("the manifest lists more than is on disk, and says which is which", () => {
  const root = fixtureTree();
  const manifest = readTransitionManifest(root);
  assert.equal(manifest.length, 2);
  const installed = new Set(scanTransitionAssets(root).map((a) => a.resourceId));
  assert.deepEqual(
    manifest.map((m) => installed.has(m.resourceId)),
    [true, false],
    "the second entry is announced but not downloaded",
  );
});

test("a missing transition root is an empty list, not a throw", () => {
  assert.deepEqual(scanTransitionAssets(path.join(os.tmpdir(), "insta360-no-transitions-xyz")), []);
  assert.deepEqual(readTransitionManifest(path.join(os.tmpdir(), "insta360-no-transitions-xyz")), []);
});
