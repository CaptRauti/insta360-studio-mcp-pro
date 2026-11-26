// The export dialog's own persisted state — read it instead of guessing from OCR.
//
// Studio writes `nle/video_export_preset_model.json` when the export dialog **closes**
// (measured 2026-11-26: a pick changes the panel but not the file, `{ESC}` changes the
// file). It holds one slot per export mode inside `custom_presets`, `current_presets`
// naming which slot each mode uses, and the settings as enums.
//
// The table below was **measured by picking every option and diffing the file**
// (`research/matrix/dialog-persistence.mjs`, results next to it). Two consequences worth
// remembering:
//
//   1. A pick can be checked *exactly* — the OCR readback cannot separate `ProRes 422`
//      from `ProRes 422LT` (both read back as `ProRes`) and reads `Rec.709 10bit` as
//      `Rec.709 IObit`; the file distinguishes them (2 vs 3).
//   2. It says what the *dialog* is set to, never what the encoder produced. That is the
//      exported file's job (`verify: true` → export-verify.mjs).
//
// Unknown enum values are reported as `null` plus their raw number in `unknown`, so a
// future Studio version shows up as "not measured yet" instead of silently wrong.

import { readFileSync } from "node:fs";
import path from "node:path";

/** Keys that carry an enum, with the values measured on 6.0.9. */
export const ENUMS = {
  encodeFormat: { 0: "H.264", 1: "H.265", 2: "ProRes 422", 3: "ProRes 422LT" },
  colorSetting: { 2: "Rec.709 8bit", 3: "Rec.709 10bit" },
  bitrateType: { 0: "Benutzerdefiniert", 1: "Empfohlen", 2: "Original" },
  // The rate list follows the source: a 50 fps project offers only these three, so only
  // these three codes are measured. 0 = "Quellbild-Framerate übernehmen". `5` sits in the
  // 60 fps slot of another project — observed, never picked, so it stays out of the table.
  fpsType: { 0: "Quellbild-Framerate", 3: "25.00", 7: "50.00" },
  // 1 is unmeasured (5.7K/8K never rendered on a 1080-class source).
  resolutionType: { 0: "Benutzerdefiniert", 2: "1080P", 3: "2K", 4: "4K" },
};

/** Plain numbers the dialog also stores, in the unit the panel shows. */
export const PLAIN_KEYS = ["bitrate", "resolutionShortSide"];

/** `%LOCALAPPDATA%\Insta360\Insta360 Studio\nle\video_export_preset_model.json`. */
export function presetModelFile(studioRoot) {
  if (studioRoot) return path.join(studioRoot, "nle", "video_export_preset_model.json");
  const local = process.env.LOCALAPPDATA ?? path.join(process.env.USERPROFILE ?? "", "AppData", "Local");
  return path.join(local, "Insta360", "Insta360 Studio", "nle", "video_export_preset_model.json");
}

/** The raw file, or null when it is not there yet (a Studio that never exported). */
export function readPresetModel({ file = presetModelFile() } = {}) {
  try {
    return { file, model: JSON.parse(readFileSync(file, "utf8")) };
  } catch {
    return { file, model: null };
  }
}

/**
 * Turn the raw model into names.
 *
 * @returns {{ slots: Record<string, object>, current: object, unknown: string[], videoSlot: string|null }}
 *   `slots` maps each slot id to its decoded settings — enum names where measured, the
 *   raw number plus a `null` where not. `videoSlot` is the slot the measured picks wrote
 *   (slot 1 on this install); it is a measurement, not a rule, so it can be null.
 */
export function decodePreset(model) {
  const slots = {};
  const unknown = [];
  const custom = model?.custom_presets ?? {};

  for (const [slotId, slot] of Object.entries(custom)) {
    const out = { id: slotId };
    for (const [key, value] of Object.entries(slot ?? {})) {
      const table = ENUMS[key];
      if (table) {
        const name = table[value];
        out[key] = name ?? null;
        if (name === undefined) unknown.push(`custom_presets.${slotId}.${key}=${value}`);
      } else {
        out[key] = value; // bitrate / resolutionShortSide are numbers, not codes
      }
    }
    out.presetName = model?.current_presets?.[slotId] ?? null;
    slots[slotId] = out;
  }

  return {
    slots,
    current: { ...(model?.current_presets ?? {}) },
    userPresets: model?.user_presets ?? [],
    unknown,
    videoSlot: slots["1"] ? "1" : null,
  };
}

/**
 * One line per slot, for a tool reply: what the dialog would be showing.
 */
export function describePreset(decoded) {
  return Object.values(decoded?.slots ?? {}).map((s) => ({
    slot: s.id,
    preset: s.presetName,
    codec: s.encodeFormat,
    colorSpace: s.colorSetting,
    rate: s.fpsType,
    resolution: s.resolutionType,
    resolutionShortSide: s.resolutionShortSide,
    bitrate: s.bitrate,
    bitrateMode: s.bitrateType,
  }));
}
