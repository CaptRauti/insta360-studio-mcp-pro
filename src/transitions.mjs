/**
 * Clip-to-clip transitions — **on the track, not on the clip**.
 *
 * The recorded spec (docs/ASSET_CATALOG.md §2.2) placed the entry in a clip's `transitions` array.
 * That is wrong: a scan of all 13 projects and 60 clips finds none there, and when the operator added
 * a transition in the editor the entry appeared at **`tracks[i].transitions[]`**. A track's keys are
 * `audible, clips, id, locked, transitions, type, visible, z`, and the file grew by 15 KB. Two earlier
 * passes looked for `clip.transitions` and a project-level `transitions` — both empty — which is how a
 * feature got written off as "never used on this machine". Reach for `track.transitions`.
 *
 * The real entry, harvested from mcpKey after that edit (12 keys, matching the recorded shape):
 *
 *   { "defaultFrames": 14, "frames": 14, "id": "45ba6275-…", "maximumFrames": 60, "minimumFrames": 6,
 *     "name": "", "nextClip": "A43D8637-…", "path": ".../<UUID>.<version>.videotransition",
 *     "prevClip": "E500ED05-…", "resourceId": "<asset uuid>", "state": 0, "type": 2 }
 *
 * `prevClip`/`nextClip` are the ids of two **adjacent clips on that track**; `frames` sits between the
 * asset's own `minimumFrames` and `maximumFrames` and starts at its `defaultFrames`; `id` is a fresh
 * uuid per instance while `resourceId` names the asset. The same edit also appended a copy of the
 * following clip to the track (2 clips -> 3), so an insert is not purely additive to one array —
 * see `setTransition`'s note.
 *
 * The assets themselves are real and present: `Download/transition/<UUID>/<version>/<UUID>/<UUID>.<version>.videotransition`
 * (an NVAP container) with a cover image, a `.lic`, an **`info.json`** — English `name`
 * ("Fold change:R-L"), `category`, `minSdkVersion`, `supportedAspectRatio`, `packageSize` — and a
 * second json that is the same asset's Chinese-localised metadata (`素材名称` = "从右到左-叠化").
 * The English one is preferred; the localised one is kept as a fallback.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export function transitionRoot(explicit) {
  return explicit ?? process.env.INSTA360_TRANSITION_DIR ?? "D:/Dokumente/Insta360/Studio/Download/transition";
}

export function transitionManifestPath(root = transitionRoot()) {
  return path.join(path.dirname(root), "info", "transition_resource_manifest.json");
}

/** UUID -> version, as Studio records what it has downloaded. */
export function readTransitionManifest(root = transitionRoot()) {
  try {
    return Object.entries(JSON.parse(fs.readFileSync(transitionManifestPath(root), "utf8"))).map(([resourceId, version]) => ({
      resourceId,
      version: String(version),
    }));
  } catch {
    return [];
  }
}

/**
 * The asset's own metadata. Two files exist and the English one is the better source, which is the
 * opposite of what this module first assumed: `info.json` carries an English `name`
 * ("Fold change:R-L"), the category, the minimum SDK version, the supported aspect ratios and the
 * package file name, while `<UUID>.json` is the same asset's Chinese-localised metadata
 * (`素材名称` = "从右到左-叠化"). Prefer `info.json`, keep the localised name as a fallback.
 */
function readAssetMetadata(versionDir) {
  const found = [];
  const walk = (dir, depth = 0) => {
    if (depth > 2) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (e.name.endsWith(".json")) found.push(p);
    }
  };
  walk(versionDir);

  const read = (p) => {
    try {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    } catch {
      return null;
    }
  };
  const infoPath = found.find((p) => path.basename(p).toLowerCase() === "info.json");
  const info = infoPath ? read(infoPath) : null;
  const localised = read(found.find((p) => path.basename(p) !== "info.json") ?? "");

  if (!info && !localised) {
    return { name: null, localizedName: null, category: null, minSdkVersion: null, supportedAspectRatio: null, packageFileName: null };
  }
  return {
    name: info?.name ?? null,
    localizedName: localised?.["素材名称"] ?? null,
    category: info?.category ?? localised?.["素材类型"] ?? null,
    minSdkVersion: info?.minSdkVersion ?? localised?.["最低支持SDK版本"] ?? null,
    supportedAspectRatio: info?.supportedAspectRatio ?? null,
    packageFileName: info?.packageFileName ?? null,
    version: info?.version ?? null,
  };
}

/**
 * Every transition asset Studio has downloaded: the payload path, the cover, and the name from the
 * asset's own metadata. `installed` reflects the manifest, which lists more than is on disk.
 */
export function scanTransitionAssets(root = transitionRoot()) {
  const out = [];
  let dirs;
  try {
    dirs = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const idDir = path.join(root, d.name);
    let versions;
    try {
      versions = fs.readdirSync(idDir, { withFileTypes: true }).filter((e) => e.isDirectory());
    } catch {
      continue;
    }
    for (const v of versions) {
      const versionDir = path.join(idDir, v.name);
      const found = [];
      const walk = (dir) => {
        let entries;
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const e of entries) {
          const p = path.join(dir, e.name);
          if (e.isDirectory()) walk(p);
          else found.push(p);
        }
      };
      walk(versionDir);
      const payload = found.find((f) => f.endsWith(".videotransition"));
      if (!payload) continue;
      const cover = found.find((f) => /\.(webp|jpg|jpeg|png)$/i.test(f));
      const meta = readAssetMetadata(versionDir);
      const st = fs.statSync(payload);
      out.push({
        resourceId: d.name,
        version: v.name,
        name: meta.name,
        localizedName: meta.localizedName,
        category: meta.category,
        supportedAspectRatio: meta.supportedAspectRatio,
        minSdkVersion: meta.minSdkVersion,
        payload: payload.replace(/\\/g, "/"),
        cover: cover ? cover.replace(/\\/g, "/") : null,
        bytes: st.size,
        hasLicense: found.some((f) => f.endsWith(".lic")),
      });
    }
  }
  return out.sort((a, b) => a.resourceId.localeCompare(b.resourceId) || a.version.localeCompare(b.version));
}

/**
 * The transitions a **track** carries, normalised. This is the container the file uses; reading a clip
 * is kept working only to show that the clip has none (see `clipTransitionsAreWrong`).
 */
export function transitionState(track) {
  const list = Array.isArray(track?.transitions) ? track.transitions : [];
  return {
    count: list.length,
    transitions: list.map((t) => ({
      id: t.id ?? null,
      resourceId: t.resourceId ?? null,
      name: t.name ?? "",
      type: t.type ?? null,
      state: t.state ?? null,
      frames: t.frames ?? null,
      minimumFrames: t.minimumFrames ?? null,
      maximumFrames: t.maximumFrames ?? null,
      defaultFrames: t.defaultFrames ?? null,
      prevClip: t.prevClip ?? null,
      nextClip: t.nextClip ?? null,
      path: t.path ?? null,
      pathExists: Boolean(t.path) && fs.existsSync(t.path),
      keys: Object.keys(t),
    })),
  };
}

/** Clip ids in timeline order, which is the order a transition's two ends must be read from. */
export function clipOrder(track) {
  return (track?.clips ?? []).map((c) => c.id);
}

/**
 * Frames limits. These are **Studio's own values as observed on the one specimen**
 * (`minimumFrames: 6, maximumFrames: 60, defaultFrames: 14`), not metadata: a transition asset's
 * `info.json` carries no frame limits at all (category, name, minSdkVersion, supportedAspectRatio,
 * packageSize, version — that is all), so a caller may override them and this module does not pretend
 * they come from the asset.
 */
export const FRAME_LIMITS = { minimumFrames: 6, maximumFrames: 60, defaultFrames: 14 };

/**
 * Add or update a transition between two adjacent clips on a track.
 *
 * `frames` defaults to `FRAME_LIMITS.defaultFrames` and must sit between the minimum and the maximum.
 * The two clip ids must be **adjacent on that track**: a transition is by definition between
 * neighbours, and Studio's own entry names them as `prevClip`/`nextClip`. An entry already between the
 * same pair is updated in place (its `id` kept), so a caller can change the length without leaving two
 * transitions on one gap.
 *
 * Note on the clip list: Studio's own edit also appended a copy of the following clip (2 clips -> 3,
 * project frames 2216 -> 2270) while inserting the transition between clips 0 and 1. That extra clip is
 * **not** referenced by the entry, so it is unclear from one observation whether the app does that or
 * the operator did — this function therefore touches `track.transitions` and *nothing else*, and says
 * so in its result rather than guessing.
 */
export function setTransition(track, { prevClip, nextClip, resourceId, frames, limits = {}, root } = {}) {
  if (!track || typeof track !== "object") throw new Error("setTransition needs a track object");
  const order = clipOrder(track);
  const pi = order.indexOf(prevClip);
  const ni = order.indexOf(nextClip);
  if (pi < 0 || ni < 0) {
    return { ok: false, error: `both clips must be on this track; it has ${order.length}: ${order.join(", ")}` };
  }
  if (ni !== pi + 1) {
    return { ok: false, error: `a transition joins adjacent clips, but ${prevClip} is at ${pi} and ${nextClip} at ${ni}` };
  }
  const asset = scanTransitionAssets(root).find((a) => a.resourceId === resourceId);
  if (!asset) {
    const known = scanTransitionAssets(root).map((a) => a.resourceId);
    return { ok: false, error: `no installed transition with resourceId ${resourceId}`, known };
  }
  const { minimumFrames: min, maximumFrames: max, defaultFrames: def } = { ...FRAME_LIMITS, ...limits };
  const wanted = frames ?? def;
  if (wanted < min || wanted > max) {
    return { ok: false, error: `frames must be between ${min} and ${max} for this asset, got ${wanted}` };
  }

  if (!Array.isArray(track.transitions)) track.transitions = [];
  const existing = track.transitions.find((t) => t.prevClip === prevClip && t.nextClip === nextClip);
  if (existing) {
    const before = JSON.stringify(existing);
    existing.frames = wanted;
    existing.resourceId = asset.resourceId;
    existing.path = asset.payload;
    return {
      ok: true,
      changed: before !== JSON.stringify(existing),
      updated: existing.id,
      transition: existing,
      clipCountChanged: false,
      note: "updated the transition already on this gap; the clip list was not touched",
    };
  }

  const entry = {
    defaultFrames: def,
    frames: wanted,
    id: crypto.randomUUID(),
    maximumFrames: max,
    minimumFrames: min,
    name: "",
    nextClip,
    path: asset.payload,
    prevClip,
    resourceId: asset.resourceId,
    state: 0,
    type: 2,
  };
  track.transitions.push(entry);
  return {
    ok: true,
    changed: true,
    added: entry.id,
    transition: entry,
    assetName: asset.name,
    clipCountChanged: false,
    note:
      "added to track.transitions only. Studio's own insert also grew the clip list by one (a copy of the " +
      "following clip); whether the app requires that is unverified, so the next step is a read-back after " +
      "Studio opens this project",
  };
}

/** Remove a transition, by id or by the clip pair it joins. */
export function removeTransition(track, { id, prevClip, nextClip } = {}) {
  if (!Array.isArray(track?.transitions)) return { ok: true, removed: 0, count: 0 };
  const before = track.transitions.length;
  track.transitions = track.transitions.filter((t) => {
    if (id) return t.id !== id;
    if (prevClip && nextClip) return !(t.prevClip === prevClip && t.nextClip === nextClip);
    return true;
  });
  return { ok: true, removed: before - track.transitions.length, count: track.transitions.length };
}
