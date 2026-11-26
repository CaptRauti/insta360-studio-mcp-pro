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
import { readTransitionManifest, scanTransitionAssets, transitionState } from "../src/transitions.mjs";

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

/** The layout Studio writes, with a real Chinese metadata file and a missing payload case. */
function fixtureTree() {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), "insta360-transitions-"));
  const root = path.join(base, "transition");
  const uuid = "0D4E05B5-A3E3-4C10-A081-58A920B45A15";
  const dir = path.join(root, uuid, "1794456455000", uuid);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${uuid}.2.videotransition`), Buffer.alloc(80, 3));
  fs.writeFileSync(path.join(dir, `${uuid}.json`), JSON.stringify({ 素材名称: "从左到右-叠化", UUID: uuid, 素材类型: "转场/叠化", 素材大小: "80KB", 最低支持SDK版本: "2.13.0" }));
  fs.writeFileSync(
    path.join(dir, "info.json"),
    JSON.stringify({ category: 3, name: "Fold change:R-L", kind: 1, minSdkVersion: "2.13.0", packageFileName: `${uuid}.2.videotransition`, packageSize: 80, supportedAspectRatio: "16v9|1v1|9v16", type: 5, uuid, version: 2 }),
  );
  fs.writeFileSync(path.join(dir, "cover.webp"), Buffer.alloc(10, 1));
  fs.writeFileSync(path.join(dir, `${uuid}.2.lic`), "lic");
  fs.mkdirSync(path.join(root, "no-payload-here", "1"), { recursive: true });
  fs.mkdirSync(path.join(base, "info"), { recursive: true });
  fs.writeFileSync(path.join(base, "info", "transition_resource_manifest.json"), JSON.stringify({ [uuid]: "1794456455000", "FFFFFFFF-0000-0000-0000-000000000000": "1" }));
  return root;
}

test("a clip with no transitions reports zero, not an error", () => {
  assert.deepEqual(transitionState({}), { count: 0, transitions: [] });
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
  assert.equal(assets.length, 1, "an asset directory without a .videotransition is skipped");
  const a = assets[0];
  assert.equal(a.resourceId, "0D4E05B5-A3E3-4C10-A081-58A920B45A15");
  assert.equal(a.name, "Fold change:R-L", "info.json's English name wins");
  assert.equal(a.localizedName, "从左到右-叠化", "the Chinese metadata is kept as a fallback");
  assert.equal(a.supportedAspectRatio, "16v9|1v1|9v16");
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
