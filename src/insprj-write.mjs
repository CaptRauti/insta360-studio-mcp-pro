// Insta360 Studio's Media-page project file (`.insprj`) — write side.
//
// Design rules, each one measured (see docs/INSPRJ_SCHEMA.md and research/insprj_format.mjs):
//
//   1. **Reproduce the file, do not re-render it.** `serialiseStudioJson` is a byte-identity on all
//      920 Studio-6 files on this machine (empty containers exploded, 4-space indent, exponent
//      padded to two digits, trailing newline). Editing one field must therefore leave every other
//      field byte-for-byte where it was — a writer that reformats produces a diff on 300 fields.
//   2. **Mutate existing keys only.** A key Studio did not write in this clip is refused, not added:
//      we have no specimen for "Studio reads a key that was not there", so creating one is
//      guesswork. `allowNew` opts in explicitly.
//   3. **A gate that says no is Studio's own rule.** `supportLut`, `supportMixing`,
//      `supportSingleDenoise` … say whether the *media* can do a thing at all; enabling a feature
//      whose support flag is explicitly false is refused with that reason rather than written.
//   4. **Refuse, do not clamp.** A value outside the field's own measured bounds is an error naming
//      the bounds. Silently clamping a slider is how a caller's intent becomes a different edit.
//   5. **XML-era files are refused.** Their element names and scales do not map onto the JSON
//      fields (audio `volume` 0.5 vs `currentVolume` 100), so any write there would be invention.
//   6. **Studio running ⇒ refuse by default.** Studio keeps this file in memory and rewrites it on
//      exit, so a write while it runs is lost or fought over. `force` overrides, with the reason
//      reported either way.
import { copyFileSync, existsSync, readFileSync, statSync, writeFileSync } from "node:fs";

import { detectStudioFormat, serialiseStudioJson } from "./insprj-serialise.mjs";
import { detectEncoding, familyOf, findMediaProjects, toForwardSlashes } from "./insprj.mjs";
import { studioGuiRunning } from "./prefs.mjs";

/** The groups a caller may change, and the clip fields each one owns. */
export const WRITABLE = {
  colour: [
    "enableColorAdjust", "colorAdjustExposure", "colorAdjustContrast", "colorAdjustWarmth",
    "colorAdjustSaturation", "colorAdjustShadows", "colorAdjustHighlights", "colorAdjustVibrance",
    "colorAdjustDefinition", "colorAdjustTint", "colorAdjustBrightness", "colorAdjustBlackpoint",
    "colorAdjustBrilliance", "colorAdjustAutoadjust",
  ],
  colourPlus: ["enableColorPlus", "colorPlusStrength"],
  process: [
    "enableAe", "enableLut", "enableSingleDenoise", "enableMultiFrameDenoise", "enablePureShot",
    "enableMotionBlur", "motionBlurStrength", "motionBlurThreshold", "enableBeautyMode",
    "enableLocalToneMapping", "localToneMappingStrength", "enableHorizontalCorrect",
    "horizontalCorrectAngle", "enableUnderWaterCorrect", "underWaterStyle", "underWaterStrength",
    "enableTimeLogo", "timeLogoFormat", "timeLogoTransparency",
  ],
  watermark: ["enableFlatLogoWatermark", "selectedLogoWatermarkPath", "flatLogoWatermarkTransparency", "logoWatermarkLocationType"],
  audio: ["currentVolume", "currentFadeIn", "currentFadeOut", "currentMixingWeight", "enableMixing", "currentTracksDelay"],
  dashboard: ["enableDashboard", "dashboardSourceType", "dashboardDataId", "dashboardStyle"],
};

/** Fields whose bounds Studio stores next to the value, as `<field>Bounds`. */
const BOUNDS = {
  enableColorAdjust: null,
  colorAdjustExposure: ["colorAdjustCommonMin", "colorAdjustCommonMax"],
  colorAdjustContrast: ["colorAdjustCommonMin", "colorAdjustCommonMax"],
  colorAdjustWarmth: ["colorAdjustCommonMin", "colorAdjustCommonMax"],
  colorAdjustSaturation: ["colorAdjustCommonMin", "colorAdjustCommonMax"],
  colorAdjustShadows: ["colorAdjustCommonMin", "colorAdjustCommonMax"],
  colorAdjustHighlights: ["colorAdjustCommonMin", "colorAdjustCommonMax"],
  colorAdjustVibrance: ["colorAdjustCommonMin", "colorAdjustCommonMax"],
  colorAdjustDefinition: ["colorAdjustCommonMin", "colorAdjustCommonMax"],
  colorAdjustTint: ["colorAdjustCommonMin", "colorAdjustCommonMax"],
  colorAdjustBrightness: ["colorAdjustCommonMin", "colorAdjustCommonMax"],
  colorAdjustBlackpoint: ["colorAdjustCommonMin", "colorAdjustCommonMax"],
  colorPlusStrength: ["colorPlusStrengthMin", "colorPlusStrengthMax"],
  localToneMappingStrength: ["localToneMappingStrengthMin", "localToneMappingStrengthMax"],
  underWaterStrength: ["underWaterStrengthMin", "underWaterStrengthMax"],
  flatLogoWatermarkTransparency: ["_const:0", "_const:100"],
  timeLogoTransparency: ["_const:0", "_const:100"],
  currentVolume: ["_const:0", "_const:100"],
  currentMixingWeight: ["_const:0", "_const:100"],
  currentFadeIn: ["_const:0", "maxFadeIn"],
  currentFadeOut: ["_const:0", "maxFadeOut"],
};

/** The support flag that gates a feature (Studio's own "can this media do it" answer). */
const SUPPORT = {
  enableLut: "supportLut",
  enableSingleDenoise: "supportSingleDenoise",
  enableMultiFrameDenoise: "supportMultiFrameDenoise",
  enablePureShot: "supportPureShot",
  enableAe: "supportAe",
  enableUnderWaterCorrect: "supportUnderWaterCorrect",
  enableMixing: "supportMixing",
  enableColorAdjust: "supportColorAdjust",
  enableColorPlus: "supportColorPlus",
  enableDashboard: "supportDashboard",
};

/** Fields that are grouped in the file rather than sitting at clip level. */
const NESTED = {
  colour: "media_process",
  colourPlus: "media_process",
  process: "media_process",
  watermark: "flat_logo_watermark",
  audio: "audio_setting",
  dashboard: "dashboard_setting",
};

/** What a caller must not write yet, and why — the file's own open questions. */
export const NOT_WRITABLE = {
  play_rate_track: "`play_rate_model_list[].endTime` reads 8184 against `sourceFrames` 2046 at rate 4, so its timebase is unmeasured — writing the speed track would guess at Studio's frame arithmetic.",
  leftTrim: "no trimmed clip exists in the 920-file corpus (all trims 0), so a trim write has no specimen to compare against; it also changes the frame arithmetic every later read depends on.",
};

function within(value, min, max) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function isBool(value) {
  return typeof value === "boolean";
}

/**
 * Resolve a write target: `file` directly, or a media path/name looked up the same way the reader
 * does. `projectId`/`index` select an item when the file holds several (the corpus is one item per
 * file, so a multi-item file must be selected explicitly rather than guessed at).
 */
export function resolveTarget({ file, media, name, projectId, index, searchContent = true } = {}) {
  let target = file;
  let lookup = null;
  if (!target) {
    lookup = findMediaProjects({ media, name, searchContent });
    if (!lookup.ok) return { ok: false, note: lookup.note, lookup };
    const hashHit = lookup.matches.find((m) => m.match === "hash");
    target = (hashHit ?? lookup.matches[0]).path;
    if (lookup.matches.length > 1 && !hashHit) {
      return {
        ok: false,
        note: `${lookup.matches.length} candidate .insprj files and no exact hash match — pass \`file\` to choose`,
        lookup,
      };
    }
  }
  if (!existsSync(target)) return { ok: false, note: `no such file: ${target}`, lookup };
  const raw = readFileSync(target, "utf8");
  const encoding = detectEncoding(raw);
  if (encoding !== "json") {
    return {
      ok: false,
      file: toForwardSlashes(target),
      encoding,
      note:
        encoding === "xml"
          ? "XML-era file (Studio 5.x): its element names and scales do not map onto the JSON fields (audio `volume` 0.5 vs `currentVolume` 100), so a write here would be invention. Refused."
          : "unrecognised encoding — refused rather than guessed at.",
      lookup,
    };
  }
  const format = detectStudioFormat(raw);
  let doc = format.doc;
  if (!doc && raw) {
    try {
      doc = JSON.parse(raw);
    } catch {
      return { ok: false, file: toForwardSlashes(target), note: "not valid JSON — refused.", lookup };
    }
  }
  const count = (doc.projects ?? []).length;
  let project;
  if (projectId !== undefined) {
    project = (doc.projects ?? []).find((p) => p.id === projectId || p.name === projectId);
    if (!project) return { ok: false, file: toForwardSlashes(target), note: `no project with id/name ${JSON.stringify(projectId)} (have ${(doc.projects ?? []).map((p) => p.id).join(", ")})`, lookup };
  } else if (index !== undefined) {
    project = (doc.projects ?? [])[Number(index)];
    if (!project) return { ok: false, file: toForwardSlashes(target), note: `no project at index ${index} (have ${count})`, lookup };
  } else if (count === 1) {
    project = doc.projects[0];
  } else {
    return {
      ok: false,
      file: toForwardSlashes(target),
      note: `file holds ${count} projects — pass \`projectId\` or \`index\` (ids: ${(doc.projects ?? []).map((p) => p.id).join(", ")})`,
      lookup,
    };
  }
  return {
    ok: true,
    file: toForwardSlashes(target),
    family: familyOf(target),
    encoding,
    formatOk: format.ok,
    formatReason: format.ok ? undefined : format.reason,
    raw,
    doc,
    project,
    count,
    lookup,
  };
}

/**
 * Apply `changes` to one clip's settings and write the file back.
 *
 * Dry by default *per call*: `dryRun` returns exactly what would change, and `write` performs it.
 * Nothing is ever written when any part of the request was refused.
 */
export function writeMediaProject({ changes = {}, dryRun = false, force = false, backup = true, allowNew = false, runningCheck = studioGuiRunning, ...targetArgs } = {}) {
  const target = resolveTarget(targetArgs);
  if (!target.ok) return target;
  const { doc, project, file } = target;
  const clip = project.clip;
  if (!clip || typeof clip !== "object") {
    return { ok: false, file, note: "the selected project has no clip block — nothing to edit" };
  }

  const refusals = [];
  const plan = []; // { group, field, container, from, to }

  const groups = Object.keys(changes ?? {}).filter((g) => g !== "allowNew");
  const known = Object.keys(WRITABLE);
  const unknownGroup = groups.find((g) => !known.includes(g));
  if (unknownGroup) {
    return { ok: false, file, note: `unknown group ${JSON.stringify(unknownGroup)} — groups: ${known.join(", ")}` };
  }

  for (const group of groups) {
    const spec = changes[group];
    if (spec === null || typeof spec !== "object" || Array.isArray(spec)) {
      refusals.push({ group, note: "expected an object of fields" });
      continue;
    }
    const containerName = NESTED[group];
    const container = containerName ? clip[containerName] : clip;
    if (!container || typeof container !== "object") {
      refusals.push({ group, note: `clip has no ${containerName ?? "clip-level fields"} block` });
      continue;
    }
    for (const [field, wanted] of Object.entries(spec)) {
      // The specific reason wins over the generic one: a caller asking for the trims or the speed
      // track learns *why* those are blocked, rather than that they are simply not in the group.
      if (NOT_WRITABLE[field]) {
        refusals.push({ group, field, note: NOT_WRITABLE[field] });
        continue;
      }
      if (!WRITABLE[group].includes(field)) {
        refusals.push({ group, field, note: `not in group ${group} (allowed: ${WRITABLE[group].join(", ")})` });
        continue;
      }
      const present = field in container;
      if (!present && !allowNew) {
        refusals.push({ group, field, note: "field absent in this clip — Studio did not write it here; pass allowNew to create it" });
        continue;
      }
      // type gate
      if (field.startsWith("enable") && !isBool(wanted)) {
        refusals.push({ group, field, note: `expected a boolean, got ${JSON.stringify(wanted)}` });
        continue;
      }
      if (typeof wanted === "string" && /^(colorAdjust|colorPlus|motionBlur|localToneMapping|underWater|timeLogoTransparency|currentVolume|currentFade|currentMixing|flatLogoWatermarkTransparency)/.test(field) && field !== "logoWatermarkLocationType") {
        refusals.push({ group, field, note: `expected a number, got ${JSON.stringify(wanted)}` });
        continue;
      }
      // support gate
      const supportKey = SUPPORT[field];
      if (supportKey && wanted === true && container[supportKey] === false) {
        refusals.push({ group, field, note: `${supportKey} is false — Studio says this media cannot do it` });
        continue;
      }
      // bounds gate
      const boundKeys = BOUNDS[field];
      if (boundKeys && typeof wanted === "number") {
        const [loKey, hiKey] = boundKeys;
        const lo = loKey.startsWith("_const:") ? Number(loKey.slice(7)) : container[loKey];
        const hi = hiKey.startsWith("_const:") ? Number(hiKey.slice(7)) : container[hiKey];
        if (typeof lo === "number" && typeof hi === "number" && !within(wanted, lo, hi)) {
          refusals.push({ group, field, note: `${wanted} is outside the field's bounds ${lo}..${hi}` });
          continue;
        }
      }
      plan.push({ group, field, container, from: container[field] ?? null, to: field === "dashboardStyle" && wanted && typeof wanted === "object" ? JSON.stringify(wanted) : wanted });
    }
  }

  if (refusals.length) {
    return { ok: false, file, refused: refusals, note: `${refusals.length} field(s) refused; nothing was written` };
  }
  if (!plan.length) return { ok: false, file, note: "no changes given" };

  const changed = plan.filter((p) => p.from !== p.to);

  if (dryRun) {
    return { ok: true, dryRun: true, file, wouldChange: changed.map(({ group, field, from, to }) => ({ group, field, from, to })), unchanged: plan.length - changed.length, written: false };
  }

  if (!target.formatOk && !force) {
    return {
      ok: false,
      file,
      note: `refused: this file's layout is not the measured one (${target.formatReason}) — rewriting it would reformat every field. Pass force to write anyway.`,
    };
  }

  const guard = runningCheck();
  const running = guard.running ? guard.pids.join(", ") : null;
  if (running && !force) {
    return {
      ok: false,
      file,
      note: `refused: Insta360 Studio is running (pid ${running}) — it keeps this file in memory and rewrites it on exit, so this write would be lost or fought over. Close Studio, or pass force.`,
    };
  }

  // Apply inline (so a field keeps its position in the object and its key order is untouched), then
  // serialise with Studio's own layout.
  for (const step of plan) step.container[step.field] = step.to;
  const out = serialiseStudioJson(doc);

  const backupPath = backup ? `${file}.bak` : null;
  if (backupPath) copyFileSync(file, backupPath);
  writeFileSync(file, out, "utf8");

  return {
    ok: true,
    file,
    backup: backupPath,
    bytes: statSync(file).size,
    studioRunning: Boolean(guard.running),
    changed: changed.map(({ group, field, from, to }) => ({ group, field, from, to })),
    unchanged: plan.length - changed.length,
    note: running ? "written while Studio was running (force): Studio may overwrite it on exit" : undefined,
  };
}
