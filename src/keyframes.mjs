/**
 * The 360 view-keyframe track, as Studio writes it.
 *
 * Measured, not guessed — the shape below comes from a project Studio wrote itself while
 * two and then three keyframes were set with the real right-drag gesture over the preview
 * (see `docs/INSPROJ_SCHEMA.md` §7 for the raw dumps and `research/keyframe_specimen.mjs`
 * for how to reproduce them):
 *
 *   { node_list: [ kf, transition, kf, transition, kf, … ] }
 *
 * A view keyframe is `node_type: 0`: pan/tilt/roll in radians, fov and distance for the
 * lens, `time`/`src_time` as frame numbers on the clip, a fresh uuid as `name`.
 * Between two adjacent keyframes sits one `node_type: 1` transition node whose `name` is
 * `"<fromUuid>-<toUuid>"` — that hyphenated name is the only thing in the track that says
 * which keyframe follows which, so it has to be maintained whenever a node is inserted or
 * removed.
 *
 * What is *not* known: the transition node carries `point1X/Y`, `point2X/Y` (all 0.5 in
 * every sample) and a `type`, and the transition *curve* names that the binary's literal
 * table and `translations/de-DE.json` list (`slip_in_slip_out`, `fade_in_fade_out`, …)
 * never appeared in a file. So an existing transition node is always **reused verbatim**
 * and never regenerated: its points may be user data, and rebuilding it from cents would
 * silently discard an edit we cannot read back. Only a pair that did not exist before gets
 * a fresh identity node.
 */
import { randomUUID } from "node:crypto";

export const VIEW_NODE = 0;
export const TRANSITION_NODE = 1;

/** Studio's own defaults for a fresh view keyframe, copied from a written file. */
export const DEFAULT_VIEW = {
  auto_fov: 0,
  distance: 0.6,
  fov: 1.3089969158172607, // 75 degrees
  is_headtrack: 0,
  node_type: VIEW_NODE,
  roll: 0,
  state: 7,
};

export const DEFAULT_TRANSITION = {
  node_type: TRANSITION_NODE,
  point1X: 0.5,
  point1Y: 0.5,
  point2X: 0.5,
  point2Y: 0.5,
  type: 1,
};

const nodes = (clip) => {
  const track = clip?.key_frame_track;
  // Absent means "no keyframes yet" (Studio writes `{}`, an edited project may omit the
  // key entirely); a *malformed* track is the only thing worth refusing.
  if (track == null) return [];
  if (typeof track !== "object") return null;
  if (track.node_list != null && !Array.isArray(track.node_list)) return null;
  return track.node_list ?? [];
};

/** True when the clip carries at least one view keyframe. */
export function hasKeyframes(clip) {
  return keyframeNodes(clip).length > 0;
}

/** Every view keyframe (node_type 0), in the order Studio keeps them: by time. */
export function keyframeNodes(clip) {
  const all = nodes(clip) ?? [];
  return all.filter((n) => n && n.node_type === VIEW_NODE).sort((a, b) => a.time - b.time);
}

/** Every transition node (node_type 1), with the names it connects. */
export function transitionNodes(clip) {
  const all = nodes(clip) ?? [];
  return all
    .filter((n) => n && n.node_type === TRANSITION_NODE)
    .map((n) => {
      const [from, to] = splitTransitionName(String(n.name ?? ""));
      return { ...n, from, to };
    });
}

/**
 * A transition name is "<fromUuid>-<toUuid>" and the uuids are themselves hyphenated, so
 * the split has to be by *length* — a plain split("-") gives five pieces. Take the first
 * 36 characters and the rest.
 */
function splitTransitionName(name) {
  if (name.length >= 73) return [name.slice(0, 36), name.slice(37)];
  return [null, null];
}

/** The keyframes as plain facts, for a reader that does not want the raw nodes. */
export function listKeyframes(clip) {
  return keyframeNodes(clip).map((n) => ({
    name: n.name,
    time: n.time,
    srcTime: n.src_time,
    pan: n.pan,
    tilt: n.tilt,
    roll: n.roll,
    fov: n.fov,
    distance: n.distance,
    degrees: { pan: (n.pan * 180) / Math.PI, tilt: (n.tilt * 180) / Math.PI, roll: (n.roll * 180) / Math.PI },
  }));
}

/**
 * Insert (or update) a view keyframe, keeping the transition nodes consistent.
 *
 * Returns a summary; the clip is mutated in place. `time` is a frame number on the clip —
 * keyframes are addressed by time, because that is the identity Studio uses in `node_list`
 * order and the only one a caller can know in advance.
 *
 * An existing keyframe at the same time is updated rather than duplicated, and every
 * transition node that already existed between a surviving pair is carried over unchanged.
 */
export function addKeyframe(clip, { time, pan, tilt, roll, fov, distance, srcTime, name } = {}) {
  if (!Number.isFinite(time)) throw new Error("addKeyframe needs a numeric time (frames)");
  if (!Number.isFinite(pan) || !Number.isFinite(tilt)) throw new Error("addKeyframe needs numeric pan and tilt (radians)");

  const all = nodes(clip);
  if (all === null) throw new Error("clip.key_frame_track is not a usable track");
  if (!clip.key_frame_track) clip.key_frame_track = {};
  if (!Array.isArray(clip.key_frame_track.node_list)) clip.key_frame_track.node_list = all ?? [];

  // Existing transitions, so a pair that survives keeps its own node (and its points).
  const kept = new Map();
  for (const n of nodes(clip) ?? []) {
    if (n?.node_type !== TRANSITION_NODE) continue;
    const [from, to] = splitTransitionName(String(n.name ?? ""));
    if (from && to) kept.set(`${from}>${to}`, n);
  }

  const views = keyframeNodes(clip);
  const existing = views.find((v) => v.time === time);
  let node;
  if (existing) {
    node = existing;
    if (Number.isFinite(roll)) existing.roll = roll;
    if (Number.isFinite(fov)) existing.fov = fov;
    if (Number.isFinite(distance)) existing.distance = distance;
    if (Number.isFinite(srcTime)) existing.src_time = srcTime;
    existing.pan = pan;
    existing.tilt = tilt;
  } else {
    node = {
      ...DEFAULT_VIEW,
      ...(Number.isFinite(fov) ? { fov } : {}),
      ...(Number.isFinite(distance) ? { distance } : {}),
      name: name ?? randomUUID(),
      pan,
      roll: Number.isFinite(roll) ? roll : DEFAULT_VIEW.roll,
      src_time: Number.isFinite(srcTime) ? srcTime : time,
      tilt,
      time,
    };
    views.push(node);
    views.sort((a, b) => a.time - b.time);
  }

  // Rebuild the list: keyframe, transition, keyframe, … — one transition per adjacent pair,
  // reusing the one that already belonged to that pair.
  const rebuilt = [];
  for (let i = 0; i < views.length; i++) {
    rebuilt.push(views[i]);
    const next = views[i + 1];
    if (!next) continue;
    const key = `${views[i].name}>${next.name}`;
    rebuilt.push(kept.get(key) ?? { ...DEFAULT_TRANSITION, name: `${views[i].name}-${next.name}` });
  }
  clip.key_frame_track.node_list = rebuilt;
  clip.enable_user_keyframe = true;
  return { added: !existing, updated: Boolean(existing), time, keyframes: views.length, transitions: rebuilt.filter((n) => n.node_type === TRANSITION_NODE).length };
}

/**
 * Drop the view keyframe at a time and any transition node that pointed at it, then give
 * the surviving neighbours a transition node of their own (reusing theirs when the pair
 * already existed, which it cannot have — a removed node means the pair is new).
 */
export function removeKeyframe(clip, { time } = {}) {
  if (!Number.isFinite(time)) throw new Error("removeKeyframe needs a numeric time (frames)");
  const all = nodes(clip);
  if (!all) return { removed: false, keyframes: 0, transitions: 0 };
  const target = keyframeNodes(clip).find((v) => v.time === time);
  if (!target) return { removed: false, keyframes: keyframeNodes(clip).length, transitions: transitionNodes(clip).length };

  const views = keyframeNodes(clip).filter((v) => v !== target);
  const kept = [];
  for (const n of all) {
    if (n?.node_type !== TRANSITION_NODE) continue;
    const [from, to] = splitTransitionName(String(n.name ?? ""));
    // Keep only transitions whose both ends are still there.
    if (views.some((v) => v.name === from) && views.some((v) => v.name === to)) kept.push(n);
  }
  const byPair = new Map();
  for (const n of kept) {
    const [from, to] = splitTransitionName(String(n.name ?? ""));
    byPair.set(`${from}>${to}`, n);
  }

  const rebuilt = [];
  for (let i = 0; i < views.length; i++) {
    rebuilt.push(views[i]);
    const next = views[i + 1];
    if (!next) continue;
    const key = `${views[i].name}>${next.name}`;
    rebuilt.push(byPair.get(key) ?? { ...DEFAULT_TRANSITION, name: `${views[i].name}-${next.name}` });
  }
  clip.key_frame_track.node_list = rebuilt;
  if (!views.length) clip.enable_user_keyframe = false;
  return { removed: true, time, keyframes: views.length, transitions: rebuilt.filter((n) => n.node_type === TRANSITION_NODE).length };
}

/** Degrees are what a caller thinks in; the file is radians. */
export const toRadians = (deg) => (deg * Math.PI) / 180;
export const toDegrees = (rad) => (rad * 180) / Math.PI;
