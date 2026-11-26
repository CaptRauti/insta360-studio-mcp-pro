// Unit tests for the export dialog's persisted state. Pure: JSON in, names out.
//
// The fixture is the shape measured on 6.0.9 (`nle/video_export_preset_model.json`
// during the 2026-11-26 pick sweep, see research/matrix/dialog-persistence.json), with
// the enum values that sweep produced.

import assert from "node:assert/strict";
import { test } from "node:test";
import path from "node:path";

import { ENUMS, decodePreset, describePreset, presetModelFile, readPresetModel } from "../src/export-model.mjs";

const slot = (over = {}) => ({
  bitrate: 88,
  bitrateType: 0,
  colorSetting: 2,
  encodeFormat: 1,
  fpsType: 3,
  resolutionShortSide: 1072,
  resolutionType: 0,
  ...over,
});

const MODEL = {
  current_presets: { 1: "Custom", 3: "Custom", 4: "Custom" },
  custom_presets: {
    1: slot(),
    3: slot({ encodeFormat: 0, fpsType: 7, resolutionShortSide: 1920, resolutionType: 2 }),
    4: slot({ bitrate: 91, encodeFormat: 0, resolutionShortSide: 1920 }),
  },
  user_presets: [],
};

test("the measured enums cover what the sweep picked", () => {
  assert.equal(ENUMS.encodeFormat[2], "ProRes 422");
  assert.equal(ENUMS.encodeFormat[3], "ProRes 422LT");
  assert.equal(ENUMS.colorSetting[3], "Rec.709 10bit");
  assert.equal(ENUMS.bitrateType[1], "Empfohlen");
  assert.equal(ENUMS.bitrateType[2], "Original");
  assert.equal(ENUMS.fpsType[0], "Quellbild-Framerate");
  assert.equal(ENUMS.resolutionType[2], "1080P");
});

test("decodePreset names the settings of every slot", () => {
  const d = decodePreset(MODEL);
  assert.deepEqual(Object.keys(d.slots).sort(), ["1", "3", "4"]);
  const one = d.slots["1"];
  assert.equal(one.codec === undefined, true, "no invented key");
  assert.equal(one.encodeFormat, "H.265");
  assert.equal(one.colorSetting, "Rec.709 8bit");
  assert.equal(one.fpsType, "25.00");
  assert.equal(one.resolutionType, "Benutzerdefiniert");
  assert.equal(one.bitrateType, "Benutzerdefiniert");
  assert.equal(one.resolutionShortSide, 1072, "plain numbers stay numbers");
  assert.equal(one.bitrate, 88);
  assert.equal(one.presetName, "Custom");
  assert.equal(d.slots["3"].encodeFormat, "H.264");
  assert.equal(d.slots["3"].fpsType, "50.00");
  assert.equal(d.slots["3"].resolutionType, "1080P");
});

test("the two ProRes variants are distinguishable — the whole point", () => {
  const a = decodePreset({ custom_presets: { 1: slot({ encodeFormat: 2, colorSetting: 3 }) } });
  const b = decodePreset({ custom_presets: { 1: slot({ encodeFormat: 3, colorSetting: 3 }) } });
  assert.equal(a.slots["1"].encodeFormat, "ProRes 422");
  assert.equal(b.slots["1"].encodeFormat, "ProRes 422LT");
  assert.notEqual(a.slots["1"].encodeFormat, b.slots["1"].encodeFormat);
});

test("an unmeasured code is reported as unknown, not guessed", () => {
  // 5.7K/8K never rendered on a 1080-class source, so its code is not in the table.
  const d = decodePreset({ custom_presets: { 1: slot({ resolutionType: 1 }) } });
  assert.equal(d.slots["1"].resolutionType, null);
  assert.deepEqual(d.unknown, ["custom_presets.1.resolutionType=1"]);
});

test("decodePreset survives an empty or absent model", () => {
  for (const input of [null, {}, { custom_presets: {} }]) {
    const d = decodePreset(input);
    assert.deepEqual(d.slots, {});
    assert.deepEqual(d.unknown, []);
    assert.equal(d.videoSlot, null);
    assert.deepEqual(describePreset(d), []);
  }
});

test("the current preset name is read from current_presets", () => {
  const d = decodePreset(MODEL);
  assert.deepEqual(d.current, { 1: "Custom", 3: "Custom", 4: "Custom" });
  assert.equal(d.videoSlot, "1");
});

test("describePreset gives one flat row per slot", () => {
  const rows = describePreset(decodePreset(MODEL));
  assert.equal(rows.length, 3);
  const one = rows.find((r) => r.slot === "1");
  assert.deepEqual(Object.keys(one).sort(), [
    "bitrate",
    "bitrateMode",
    "codec",
    "colorSpace",
    "preset",
    "rate",
    "resolution",
    "resolutionShortSide",
    "slot",
  ]);
  assert.equal(one.codec, "H.265");
});

test("the file path follows the Studio root, and readPresetModel never throws", () => {
  assert.equal(
    presetModelFile("C:\\root").endsWith(path.join("nle", "video_export_preset_model.json")),
    true,
  );
  const missing = readPresetModel({ file: "C:\\nope\\does\\not\\exist.json" });
  assert.equal(missing.model, null);
  assert.equal(missing.file, "C:\\nope\\does\\not\\exist.json");
});
