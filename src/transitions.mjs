/**
 * Clip-to-clip transitions.
 *
 * **There is no writer here on purpose.** The shape below is recorded from a real entry that an
 * earlier pass found in `mcpAcceptance.insproj` (docs/ASSET_CATALOG.md §2.2), but that project is
 * gone: a scan of all 13 projects / 60 clips on this machine finds **zero** transitions, so a
 * writer would be built against a doc rather than a live file — exactly the mistake that cost a
 * whole pass on `key_frame_track` ("empty in all 25 projects" turned out to be a parser looking in
 * the wrong place). To unblock it: add one transition in Studio's editor (two adjacent clips on a
 * track, click the gap), then harvest the entry.
 *
 * The recorded entry, verbatim — 13 keys, all of which a reader must carry through:
 *
 *   { "defaultFrames": 14, "frames": 60, "id": "<uuid>", "maximumFrames": 60, "minimumFrames": 6,
 *     "name": "", "nextClip": "<uuid of the following clip>", "path": ".../<UUID>.<version>.videotransition",
 *     "prevClip": "<uuid of the preceding clip>", "resourceId": "<asset uuid>", "state": 0, "type": 2 }
 *
 * The assets themselves are real and present: `Download/transition/<UUID>/<version>/<UUID>/<UUID>.<version>.videotransition`
 * (an NVAP container) with a cover image, a `.lic`, an **`info.json`** — English `name`
 * ("Fold change:R-L"), `category`, `minSdkVersion`, `supportedAspectRatio`, `packageSize` — and a
 * second json that is the same asset's Chinese-localised metadata (`素材名称` = "从右到左-叠化").
 * The English one is preferred; the localised one is kept as a fallback.
 */
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
 * The transitions a clip carries, normalised. Empty on every project here, so this is a reader
 * waiting for its first specimen — it is written to the recorded shape and says plainly whether the
 * payload it names is on disk.
 */
export function transitionState(clip) {
  const list = Array.isArray(clip?.transitions) ? clip.transitions : [];
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
