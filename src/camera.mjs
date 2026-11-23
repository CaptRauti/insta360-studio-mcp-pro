/**
 * Camera capability lookups, backed by the FOV/distance tables recovered from
 * Insta360 Studio's Qt resource file (Resources/resource.rcc).
 *
 * Those tables are the same data the Studio UI uses to decide which FOV modes
 * a clip offers and how far the reframe angle may be pushed, so validating
 * against them avoids setting values the app would silently reject.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const DATA = JSON.parse(
  readFileSync(path.join(here, "data", "camera_matrix.json"), "utf8"),
);

export const CAMERAS = DATA.cameras;
export const ANGLES = DATA.angles;

/** All known camera names, e.g. "X6", "X4", "Ace Pro 2". */
export function listCameras() {
  return Object.keys(CAMERAS).sort();
}

/** Capability summary for one camera (or null when unknown). */
export function cameraCaps(camera) {
  const cam = CAMERAS[camera];
  if (!cam) return null;
  return { camera, ...cam };
}

/**
 * Angle rules for one camera. Every entry is keyed
 * "<fov>|<videoOrPhoto>|<mode>|<aspect>" and carries the default/min/max
 * FOV angle plus distance bounds.
 */
export function cameraAngles(camera, { fov, videoPhoto, mode, aspect } = {}) {
  const rows = ANGLES[camera];
  if (!rows) return [];
  return Object.entries(rows)
    .map(([key, value]) => {
      const [kFov, kVp, kMode, kAspect] = key.split("|");
      return { fov: kFov, videoPhoto: kVp, mode: kMode, aspect: kAspect, ...value };
    })
    .filter((r) => (fov ? r.fov.toLowerCase() === String(fov).toLowerCase() : true))
    .filter((r) => (videoPhoto ? r.videoPhoto.toLowerCase() === String(videoPhoto).toLowerCase() : true))
    .filter((r) => (mode ? r.mode.toLowerCase() === String(mode).toLowerCase() : true))
    .filter((r) => (aspect ? r.aspect === String(aspect) : true));
}

/**
 * Check a reframe request against the table.
 * Returns { valid, reason?, rule? } — `valid` false means Studio would clamp
 * or refuse the value.
 */
export function validateFov(camera, { fov, videoPhoto, mode, aspect, angle }) {
  const caps = CAMERAS[camera];
  if (!caps) return { valid: false, reason: `unknown camera "${camera}"` };
  if (fov && !caps.fovTypes.some((f) => f.toLowerCase() === String(fov).toLowerCase())) {
    return { valid: false, reason: `camera ${camera} has no FOV type "${fov}"`, supported: caps.fovTypes };
  }
  if (aspect && caps.aspectRatios.length && !caps.aspectRatios.includes(String(aspect))) {
    return { valid: false, reason: `camera ${camera} does not list aspect "${aspect}"`, supported: caps.aspectRatios };
  }
  const rules = cameraAngles(camera, { fov, videoPhoto, mode, aspect });
  if (!rules.length) {
    return { valid: false, reason: "no angle rule matches that combination", matched: 0 };
  }
  if (angle == null) return { valid: true, rule: rules[0], rules: rules.length };
  const a = Number(angle);
  const inRange = rules.filter((r) => a >= r.minFov && a <= r.maxFov);
  if (!inRange.length) {
    const r = rules[0];
    return {
      valid: false,
      reason: `angle ${a} outside ${r.minFov}..${r.maxFov} for ${fov}/${mode}/${aspect}`,
      rule: r,
    };
  }
  return { valid: true, rule: inRange[0], matched: inRange.length };
}

/** Human-readable one-liner for a camera. */
export function describeCamera(camera) {
  const c = CAMERAS[camera];
  if (!c) return `unknown camera "${camera}"`;
  return [
    `${camera}: FOV ${c.fovTypes.join(", ")}`,
    `modes ${c.modes.join(", ")}`,
    `aspects ${c.aspectRatios.join(", ")}`,
    `${c.angleRows} angle rules`,
  ].join(" | ");
}
