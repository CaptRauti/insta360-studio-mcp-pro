/**
 * Colour filters ("looks"): the `effect_filter` block on a clip.
 *
 * A clip's filter is a downloaded **binary 3D LUT** — `Download/filter/<id>/<version>/<id>.cube.binary`,
 * a 64³ RGB cube (see docs/ASSET_CATALOG.md §2.1). The clip records four keys, measured across 60
 * clips and 13 projects: 59 carry the empty form below and one carries an applied filter, so both
 * ends of the range are real:
 *
 *   { "externfilterId": "", "externfilterName": "", "externfilterOpacity": 70, "externfilterResourcePath": "" }
 *   { "externfilterId": "HD Fireworks", "externfilterName": "Fireworks I", "externfilterOpacity": 70,
 *     "externfilterResourcePath": "D:/Dokumente/.../Download/filter/HD Fireworks/1765962688000/HD Fireworks.cube.binary" }
 *
 * Two rules the files insist on:
 *
 * - "No filter" is the **empty string form, not an absent key** — every clip of every project carries
 *   `effect_filter`, so clearing must restore those four values rather than delete the block.
 * - `externfilterName` is a display string, and it is **not reliably derivable**: the downloaded
 *   catalog (`Download/info/filter_resource_manifest.json`, 206 entries, name → "<dir>/<version>")
 *   gives a name for each installed filter, but the one applied specimen in the corpus carries
 *   "Fireworks I" while both its directory and its catalog entry say "HD Fireworks". So the name is
 *   passed in, defaulting to the catalog name and then to the id, and a caller should not treat it
 *   as identity — the id and the LUT path are what identify the filter.
 *
 * `enableEffects` is a project-level boolean and the docs point at it as the switch for effects; it is
 * `true` in all 13 projects here, including the one with the applied filter, so this module reports it
 * but never changes it behind the caller's back.
 */
import fs from "node:fs";
import path from "node:path";

export const FILTER_FIELDS = {
  id: "externfilterId",
  name: "externfilterName",
  opacity: "externfilterOpacity",
  resourcePath: "externfilterResourcePath",
};

/** Studio's own empty form, verbatim from the 59 untouched clips. */
export const EMPTY_FILTER = {
  externfilterId: "",
  externfilterName: "",
  externfilterOpacity: 70,
  externfilterResourcePath: "",
};

/** Default download root; overridable per call or with INSTA360_FILTER_DIR. */
export function filterRoot(explicit) {
  return explicit ?? process.env.INSTA360_FILTER_DIR ?? "D:/Dokumente/Insta360/Studio/Download/filter";
}

/** The downloaded-resource manifest, one level up from the filter tree: name → "<id>/<version>". */
export function filterManifestPath(root = filterRoot()) {
  return path.join(path.dirname(root), "info", "filter_resource_manifest.json");
}

/**
 * Studio's downloaded-filter catalog. 206 entries here, only 4 of which are actually on disk — so
 * this says what could be used, `scanInstalledFilters` says what can be.
 */
export function readFilterManifest(root = filterRoot()) {
  try {
    const raw = JSON.parse(fs.readFileSync(filterManifestPath(root), "utf8"));
    return Object.entries(raw).map(([name, target]) => {
      const [id, version] = String(target).split("/");
      return { name, id, version, installed: fs.existsSync(path.join(root, id, version)) };
    });
  } catch {
    return [];
  }
}

/** Studio writes forward slashes into the project file, so normalise to that. */
function projectPathStyle(p) {
  return typeof p === "string" ? p.replace(/\\/g, "/") : p;
}

/** Read a clip's filter: the four values, whether one is applied, whether its LUT is on disk. */
export function filterState(clip) {
  const block = clip?.effect_filter;
  const read = (key, fallback) => (block && typeof block === "object" && block[key] !== undefined ? block[key] : fallback);
  const id = read(FILTER_FIELDS.id, "");
  const resourcePath = read(FILTER_FIELDS.resourcePath, "");
  return {
    present: Boolean(block && typeof block === "object"),
    applied: Boolean(id),
    id,
    name: read(FILTER_FIELDS.name, ""),
    opacity: read(FILTER_FIELDS.opacity, EMPTY_FILTER.externfilterOpacity),
    resourcePath,
    resourceExists: Boolean(resourcePath) && fs.existsSync(resourcePath),
  };
}

/**
 * Apply a filter, or clear it with `id: ""`.
 *
 * The existing block is mutated in place when there is one, so the key order stays Studio's. A
 * missing block is created with Studio's four keys in Studio's order.
 */
export function setFilter(clip, { id = "", name, opacity, resourcePath, root } = {}) {
  if (!clip || typeof clip !== "object") throw new Error("setFilter needs a clip object");
  const before = filterState(clip);
  const catalog = readFilterManifest(root);
  const named = catalog.find((c) => c.id === id)?.name;
  const wanted = {
    [FILTER_FIELDS.id]: id ?? "",
    [FILTER_FIELDS.name]: id ? (name ?? named ?? id) : "",
    [FILTER_FIELDS.opacity]: opacity ?? EMPTY_FILTER.externfilterOpacity,
    [FILTER_FIELDS.resourcePath]: id ? projectPathStyle(resourcePath ?? "") : "",
  };
  if (id && !wanted[FILTER_FIELDS.resourcePath]) {
    const found = scanInstalledFilters(root).find((f) => f.id === id);
    if (found) wanted[FILTER_FIELDS.resourcePath] = found.path;
  }
  if (!clip.effect_filter || typeof clip.effect_filter !== "object") {
    clip.effect_filter = { ...EMPTY_FILTER };
  }
  for (const key of Object.keys(EMPTY_FILTER)) {
    if (key in wanted) clip.effect_filter[key] = wanted[key];
  }
  const after = filterState(clip);
  const changed = JSON.stringify(before) !== JSON.stringify(after);
  return {
    changed,
    before,
    after,
    resourceExists: after.resourceExists,
    keyOrder: Object.keys(clip.effect_filter),
    warning: after.applied && !after.resourceExists ? `the LUT file does not exist: ${after.resourcePath || "(none given)"}` : undefined,
  };
}

export function clearFilter(clip) {
  return setFilter(clip, { id: "" });
}

/**
 * Every filter installed on this machine, from Studio's own download tree:
 * `filter/<id>/<version>/<id>.cube.binary`, with the catalog name attached when the manifest has one.
 */
export function scanInstalledFilters(root = filterRoot()) {
  const out = [];
  const byTarget = new Map(readFilterManifest(root).map((c) => [`${c.id}/${c.version}`, c.name]));
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
      versions = fs.readdirSync(idDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const v of versions) {
      if (!v.isDirectory()) continue;
      const vDir = path.join(idDir, v.name);
      let lut = null;
      try {
        lut = fs.readdirSync(vDir).find((f) => f.endsWith(".cube.binary"));
      } catch {
        /* unreadable */
      }
      if (!lut) continue;
      const full = path.join(vDir, lut);
      const st = fs.statSync(full);
      out.push({
        id: d.name,
        name: byTarget.get(`${d.name}/${v.name}`) ?? null,
        version: v.name,
        path: projectPathStyle(full),
        bytes: st.size,
        modified: st.mtime.toISOString(),
      });
    }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id) || a.version.localeCompare(b.version));
}
