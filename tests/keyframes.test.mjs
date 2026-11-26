/**
 * Keyframe track tests — pure data, no Studio needed.
 *
 * The fixture is the *real* thing: a verbatim key_frame_track written by Studio while three
 * keyframes were set with the right-drag gesture over the preview of mcpKey's 360 clip
 * (playhead walked 0 → 237 → 357). Keeping the original numbers is the point — a made-up
 * fixture would test the test, not the schema.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_TRANSITION,
  TRANSITION_NODE,
  VIEW_NODE,
  addKeyframe,
  hasKeyframes,
  keyframeNodes,
  listKeyframes,
  removeKeyframe,
  toDegrees,
  toRadians,
  transitionNodes,
} from "../src/keyframes.mjs";

// Verbatim from D:/Dokumente/Insta360/Studio/TimelineProject/mcpKey (2026-11-26).
const STUDIO_TRACK = {
  node_list: [
    { auto_fov: 0, distance: 0.6000000238418579, fov: 1.3089969158172607, is_headtrack: 0, name: "2d10b3d2-13d3-4e6f-9340-7ab44ae11427", node_type: 0, pan: 5.8697829246521, roll: 0, src_time: 0, state: 7, tilt: 1.8574974536895752, time: 0 },
    { name: "2d10b3d2-13d3-4e6f-9340-7ab44ae11427-6f34bd2c-7a8c-413d-85d6-1c1310c161a7", node_type: 1, point1X: 0.5, point1Y: 0.5, point2X: 0.5, point2Y: 0.5, type: 1 },
    { auto_fov: 0, distance: 0.6000000238418579, fov: 1.3089969158172607, is_headtrack: 0, name: "6f34bd2c-7a8c-413d-85d6-1c1310c161a7", node_type: 0, pan: 6.5970001220703125, roll: 0, src_time: 237, state: 7, tilt: 1.8220000267028809, time: 237 },
    { name: "6f34bd2c-7a8c-413d-85d6-1c1310c161a7-562c4c0c-56d7-466f-9821-5940410019c2", node_type: 1, point1X: 0.5, point1Y: 0.5, point2X: 0.5, point2Y: 0.5, type: 1 },
    { auto_fov: 0, distance: 0.6000000238418579, fov: 1.3089969158172607, is_headtrack: 0, name: "562c4c0c-56d7-466f-9821-5940410019c2", node_type: 0, pan: 6.9150004386901855, roll: 0, src_time: 357, state: 7, tilt: 1.6809999942779541, time: 357 },
  ],
};
const clip = () => ({ enable_user_keyframe: true, key_frame_track: structuredClone(STUDIO_TRACK) });

test("an empty track is 'no keyframes', not an unreadable one", () => {
  assert.equal(hasKeyframes({ key_frame_track: {} }), false);
  assert.deepEqual(keyframeNodes({ key_frame_track: {} }), []);
  // Studio omits the key on a clip that never had a keyframe; that is not an error either.
  assert.equal(hasKeyframes({}), false);
  assert.equal(hasKeyframes({ key_frame_track: { node_list: [] } }), false);
});

test("the three view nodes are read back in time order with their angles", () => {
  const kf = listKeyframes(clip());
  assert.equal(kf.length, 3);
  assert.deepEqual(kf.map((k) => k.time), [0, 237, 357]);
  assert.deepEqual(kf.map((k) => k.srcTime), [0, 237, 357]);
  assert.equal(kf[0].name, "2d10b3d2-13d3-4e6f-9340-7ab44ae11427");
  // The file is radians; degrees are what a caller reads.
  assert.ok(Math.abs(toDegrees(kf[0].pan) - 336.32) < 0.1, `pan 336.32°, got ${toDegrees(kf[0].pan)}`);
  assert.ok(Math.abs(toDegrees(kf[1].tilt) - 104.4) < 0.1, `tilt 104.4°, got ${toDegrees(kf[1].tilt)}`);
  // Studio stores fov as a float32, so the value is 75° rounded — 74.99999867…, i.e. 1.3e-6°
  // off the double-precision conversion. Comparing exactly would fail on Studio's own file.
  assert.ok(Math.abs(toDegrees(kf[0].fov) - 75) < 1e-4, `fov 75°, got ${toDegrees(kf[0].fov)}`);
  assert.ok(Math.abs(toRadians(75) - kf[0].fov) < 1e-6, "75° round-trips within float32");
});

test("transition nodes are paired by their hyphenated name, not by position alone", () => {
  const t = transitionNodes(clip());
  assert.equal(t.length, 2);
  assert.deepEqual(
    t.map((x) => [x.from, x.to]),
    [
      ["2d10b3d2-13d3-4e6f-9340-7ab44ae11427", "6f34bd2c-7a8c-413d-85d6-1c1310c161a7"],
      ["6f34bd2c-7a8c-413d-85d6-1c1310c161a7", "562c4c0c-56d7-466f-9821-5940410019c2"],
    ],
  );
  // The uuids are themselves hyphenated: a correct split cannot use split("-"), which
  // yields ten pieces for two uuids joined by a hyphen (five each).
  assert.equal(t[0].name.split("-").length, 10);
  assert.equal(t[0].name.length, 73);
});

test("the list is keyframe, transition, keyframe, … — the layout Studio writes", () => {
  const c = clip();
  assert.deepEqual(
    c.key_frame_track.node_list.map((n) => n.node_type),
    [VIEW_NODE, TRANSITION_NODE, VIEW_NODE, TRANSITION_NODE, VIEW_NODE],
  );
});

test("inserting a keyframe between two splits the pair and reuses nothing that is new", () => {
  const c = clip();
  // References from *this* clip: the fixture is structuredCloned, so comparing against the
  // original object would be comparing different objects.
  const before1 = c.key_frame_track.node_list.filter((n) => n.node_type === TRANSITION_NODE);
  assert.equal(before1.length, 2);

  const out = addKeyframe(c, { time: 120, pan: 6.1, tilt: 1.84 });
  assert.equal(out.added, true);
  assert.equal(out.keyframes, 4);
  assert.equal(out.transitions, 3);
  const types = c.key_frame_track.node_list.map((n) => n.node_type);
  assert.deepEqual(types, [VIEW_NODE, TRANSITION_NODE, VIEW_NODE, TRANSITION_NODE, VIEW_NODE, TRANSITION_NODE, VIEW_NODE]);
  assert.deepEqual(keyframeNodes(c).map((k) => k.time), [0, 120, 237, 357]);

  // The old 0→237 transition is gone (that pair no longer exists); the 237→357 one is the
  // very same object, because its pair survived and its points may be user data.
  const t = transitionNodes(c);
  assert.equal(t.length, 3);
  const order = keyframeNodes(c).map((k) => k.name);
  assert.deepEqual(
    t.map((x) => [order.indexOf(x.from), order.indexOf(x.to)]),
    [
      [0, 1],
      [1, 2],
      [2, 3],
    ],
  );
  assert.ok(c.key_frame_track.node_list.includes(before1[1]), "the surviving transition keeps its identity");
  assert.ok(!c.key_frame_track.node_list.includes(before1[0]), "the split pair's transition is gone");
});

test("a new keyframe gets Studio's own defaults and a transition that follows the naming rule", () => {
  const c = { key_frame_track: {} };
  const out = addKeyframe(c, { time: 10, pan: 1.5, tilt: 1.6 });
  assert.equal(out.added, true);
  const [view] = keyframeNodes(c);
  assert.equal(view.node_type, VIEW_NODE);
  assert.equal(view.fov, 1.3089969158172607);
  assert.equal(view.distance, 0.6);
  assert.equal(view.roll, 0);
  assert.equal(view.state, 7);
  assert.equal(view.src_time, 10);
  assert.equal(c.enable_user_keyframe, true);

  addKeyframe(c, { time: 40, pan: 2.0, tilt: 1.4 });
  const [t] = transitionNodes(c);
  const [a, b] = keyframeNodes(c);
  assert.equal(t.name, `${a.name}-${b.name}`);
  assert.equal(t.node_type, TRANSITION_NODE);
  assert.deepEqual(
    { p1x: t.point1X, p1y: t.point1Y, p2x: t.point2X, p2y: t.point2Y, type: t.type },
    { p1x: DEFAULT_TRANSITION.point1X, p1y: DEFAULT_TRANSITION.point1Y, p2x: DEFAULT_TRANSITION.point2X, p2y: DEFAULT_TRANSITION.point2Y, type: 1 },
  );
});

test("a keyframe time already present is updated, never duplicated", () => {
  const c = clip();
  const before = keyframeNodes(c).length;
  const out = addKeyframe(c, { time: 237, pan: 7.5, tilt: 1.2, fov: 1.0 });
  assert.equal(out.added, false);
  assert.equal(out.updated, true);
  assert.equal(keyframeNodes(c).length, before);
  const k = keyframeNodes(c).find((x) => x.time === 237);
  assert.equal(k.pan, 7.5);
  assert.equal(k.tilt, 1.2);
  assert.equal(k.fov, 1.0);
  assert.equal(k.name, "6f34bd2c-7a8c-413d-85d6-1c1310c161a7", "the identity of an existing keyframe is kept");
});

test("removing the middle keyframe drops its two transitions and links the survivors", () => {
  const c = clip();
  const out = removeKeyframe(c, { time: 237 });
  assert.equal(out.removed, true);
  assert.equal(out.keyframes, 2);
  assert.equal(out.transitions, 1);
  const [t] = transitionNodes(c);
  const [a, b] = keyframeNodes(c);
  assert.equal(t.name, `${a.name}-${b.name}`);
  assert.deepEqual(
    c.key_frame_track.node_list.map((n) => n.node_type),
    [VIEW_NODE, TRANSITION_NODE, VIEW_NODE],
  );
});

test("removing the last keyframe leaves a usable empty track", () => {
  const c = { key_frame_track: {} };
  addKeyframe(c, { time: 5, pan: 0, tilt: 0 });
  const out = removeKeyframe(c, { time: 5 });
  assert.equal(out.removed, true);
  assert.deepEqual(c.key_frame_track.node_list, []);
  assert.equal(c.enable_user_keyframe, false);
  assert.equal(hasKeyframes(c), false);
});

test("removing a time that is not there changes nothing", () => {
  const c = clip();
  const snapshot = JSON.stringify(c.key_frame_track);
  const out = removeKeyframe(c, { time: 999 });
  assert.equal(out.removed, false);
  assert.equal(JSON.stringify(c.key_frame_track), snapshot);
});

test("nonsense input is refused instead of written", () => {
  assert.throws(() => addKeyframe(clip(), { pan: 1, tilt: 1 }), /numeric time/);
  assert.throws(() => addKeyframe(clip(), { time: 10, tilt: 1 }), /numeric pan and tilt/);
  assert.throws(() => removeKeyframe(clip(), {}), /numeric time/);
  assert.throws(() => addKeyframe({ key_frame_track: { node_list: "no" } }, { time: 1, pan: 0, tilt: 0 }), /not a usable track/);
});

test("keyframes survive a JSON round trip unchanged", () => {
  const c = clip();
  addKeyframe(c, { time: 120, pan: 6.1, tilt: 1.84 });
  const round = JSON.parse(JSON.stringify(c.key_frame_track));
  assert.deepEqual(round, c.key_frame_track);
});
