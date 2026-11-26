// Unit tests for the export verification.
//
// Pure: settings + a synthetic probe in, checks out. No Studio, no ffprobe, no
// file. The measured values used here are the ones from the 2026-11-26 exports
// (dialog `Rahmen 50.00` -> 50/1 3604 frames, `Rahmen 25.00` -> 25/1 1803 frames
// on a 50 fps source) and from the option sweep.

import assert from "node:assert/strict";
import { test } from "node:test";

import { compareExport, expectedCodec, parseRate, parseResolution } from "../src/export-verify.mjs";

const DIALOG = {
  Dateiname: "VID 20260917 192757 OO O",
  Pfad: "C:/Users/stefa/Desktop",
  Voreinstellung: "Benutzerdefiniert",
  Auflösung: "1080P - 1080 x 1920",
  Rahmen: "25.00",
  Bitrate: "Benutzerdefiniert",
  Kodierung: "h265",
  Farbraum: "Rec.709 8bit",
};

const probe = (over = {}) => ({
  file: "C:/Users/stefa/Desktop/VID_20260917_192757_00_001.mp4",
  codec: "hevc",
  codecTag: null,
  width: 1080,
  height: 1920,
  fps: 25,
  rFps: 25,
  frames: 1803,
  duration: 72.12,
  bitRate: 88000000,
  container: "mov,mp4,m4a,3gp,3g2,mj2",
  hasAudio: true,
  ...over,
});

test("parseRate takes a bare rate and refuses a preset label that spells one out", () => {
  assert.equal(parseRate("25.00"), 25);
  assert.equal(parseRate("25,00"), 25);
  assert.equal(parseRate(" 50 fps "), 50);
  assert.equal(parseRate("50.00 fps"), 50);
  // the trap: the list header carries a rate, the row's preset value does not
  assert.equal(parseRate("Quellbild-Framerate übernehmen - 50.00"), null);
  assert.equal(parseRate("Quellbild-Framerate übernehmen"), null);
  assert.equal(parseRate("Die Bildrate des Projekts anpassen"), null);
  assert.equal(parseRate(""), null);
  assert.equal(parseRate(null), null);
  assert.equal(parseRate("0"), null, "0 fps is not a rate");
});

test("parseResolution reads the dialog's W x H, and gives up on a label without one", () => {
  assert.deepEqual(parseResolution("1080P - 1080 x 1920"), { width: 1080, height: 1920 });
  assert.deepEqual(parseResolution("4K - 3840 x 2160"), { width: 3840, height: 2160 });
  assert.deepEqual(parseResolution("5.7K - 5760 x 2880"), { width: 5760, height: 2880 });
  assert.equal(parseResolution("Benutzerdefiniert"), null);
  assert.equal(parseResolution(null), null);
});

test("expectedCodec maps the labels to codec, container and the ProRes tag", () => {
  assert.deepEqual(expectedCodec("h264"), { codec: "h264", ext: ".mp4", name: "H.264" });
  assert.deepEqual(expectedCodec("h265"), { codec: "hevc", ext: ".mp4", name: "H.265" });
  assert.deepEqual(expectedCodec("H.265"), { codec: "hevc", ext: ".mp4", name: "H.265" });
  // the two variants the panel cannot tell apart
  assert.equal(expectedCodec("ProRes 422").tag, "apcn");
  assert.equal(expectedCodec("ProRes 422LT").tag, "apcs");
  assert.equal(expectedCodec("ProRes 422LT").codec, "prores");
  assert.equal(expectedCodec("ProRes 422").ext, ".mov");
  assert.equal(expectedCodec("irgendwas"), null);
  assert.equal(expectedCodec(null), null);
});

test("a fully matching export passes every check", () => {
  const r = compareExport(DIALOG, probe());
  assert.equal(r.ok, true);
  assert.deepEqual(
    r.checks.map((c) => [c.name, c.ok]),
    [
      ["rate", true],
      ["resolution", true],
      ["codec", true],
      ["container", true],
    ],
  );
  assert.equal(r.info.frames, 1803);
  assert.equal(r.info.hasAudio, true);
});

test("the measured mismatch is caught: dialog 25.00, file 50 fps", () => {
  const r = compareExport(DIALOG, probe({ fps: 50, frames: 3604, duration: 72.08 }));
  assert.equal(r.ok, false);
  assert.deepEqual(r.checks.find((c) => c.name === "rate"), {
    name: "rate",
    want: "25 fps",
    got: "50 fps",
    ok: false,
  });
});

test("ProRes 422 vs 422LT is decided by the codec tag, not the label", () => {
  const dialog = { ...DIALOG, Kodierung: "ProRes 422LT" };
  // what the panel cannot see: the file is 422, not 422LT
  const wrong = compareExport(dialog, probe({ file: "x.mov", codec: "prores", codecTag: "apcn" }));
  assert.equal(wrong.ok, false);
  assert.equal(wrong.checks.find((c) => c.name === "codec").ok, true, "both variants are `prores`");
  assert.equal(wrong.checks.find((c) => c.name === "codec-tag").ok, false);

  const right = compareExport(dialog, probe({ file: "x.mov", codec: "prores", codecTag: "apcs" }));
  assert.equal(right.ok, true);
});

test("the container check follows the codec, not the encoder's muxer name", () => {
  // ffprobe calls .mov and .mp4 the same format, so only the extension decides
  const r = compareExport({ ...DIALOG, Kodierung: "ProRes 422" }, probe({ file: "clip.mp4", codec: "prores", codecTag: "apcn" }));
  assert.equal(r.checks.find((c) => c.name === "container").ok, false);
  assert.equal(r.checks.find((c) => c.name === "codec").ok, true);
});

test("a preset framerate is reported unverifiable, never as a pass", () => {
  const r = compareExport({ ...DIALOG, Rahmen: "Quellbild-Framerate übernehmen" }, probe({ fps: 50 }));
  assert.equal(r.checks.some((c) => c.name === "rate"), false);
  assert.equal(r.unverifiable.find((u) => u.name === "rate").reason.includes("source framerate"), true);
  assert.equal(r.ok, true, "the remaining checks still pass");
});

test("`Benutzerdefiniert` resolution and an unmapped codec are unverifiable, not passing", () => {
  const r = compareExport({ ...DIALOG, Auflösung: "Benutzerdefiniert", Kodierung: "???" }, probe());
  assert.deepEqual(r.checks.map((c) => c.name), ["rate"]);
  assert.deepEqual(
    r.unverifiable.map((u) => u.name),
    ["resolution", "codec", "bitrate"],
  );
});

test("a missing probe is an explicit unknown, not a crash", () => {
  const r = compareExport(DIALOG, null);
  assert.equal(r.ok, null);
  assert.equal(r.checks.length, 0);
  assert.equal(r.unverifiable[0].name, "probe");
});

test("every dialog setting is accounted for — as a check or as an unverifiable", () => {
  const r = compareExport(DIALOG, probe());
  const named = new Set([...r.checks.map((c) => c.name), ...r.unverifiable.map((u) => u.name)]);
  for (const key of ["Rahmen", "Auflösung", "Kodierung"]) {
    const covered =
      (key === "Rahmen" && named.has("rate")) ||
      (key === "Auflösung" && named.has("resolution")) ||
      (key === "Kodierung" && named.has("codec"));
    assert.equal(covered, true, `${key} must be either checked or declared unverifiable`);
  }
  assert.equal(named.has("bitrate"), true);
});
