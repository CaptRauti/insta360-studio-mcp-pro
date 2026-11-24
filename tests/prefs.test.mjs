// Settings file (`startup.ini`) parsing and in-place writing.
//
// Everything here runs against a fixture, never against the machine's real
// startup.ini: a test that wrote to it would change how Studio behaves for the
// person using this computer.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getPref, parseIni, readPaths, readPrefs, setPref, studioGuiRunning, typedValue } from "../src/prefs.mjs";

let pass = 0;
let fail = 0;
function check(name, fn) {
  try {
    fn();
    pass += 1;
    console.log(`  ok  ${name}`);
  } catch (err) {
    fail += 1;
    console.log(`FAIL  ${name}\n      ${err.message}`);
  }
}

const dir = mkdtempSync(join(tmpdir(), "insta-prefs-"));
const file = join(dir, "startup.ini");
const FIXTURE = [
  "[General]",
  "version=6.0.9",
  "",
  "[ui]",
  "theme=0",
  "first_run=false",
  "",
  "[preference]",
  "lang=de",
  "workspace_location=" + join(dir, "TimelineProject"),
  "footage_project_location=" + join(dir, "FootageProject"),
  "project_location=" + join(dir, "Project"),
  "export_location=" + join(dir, "Desktop"),
  "last_visit_dir=" + join(dir, "gone"),
  "survey_url=https://example.invalid/vm/PzzxG8Y.aspx?s=1&t=2",
  "",
  "[codec]",
  "hardware_decoding_preview=true",
  "cuda_accel=true",
  "hardaware_model=NVIDIA GeForce RTX 3070 Laptop GPU/PCIe/SSE2",
  "",
  "[colors]",
  "0=#FFFFFF",
  "39=#FF381D",
  "",
].join("\r\n");
writeFileSync(file, FIXTURE, "utf8");
// every location exists except last_visit_dir, which is the point of the check
for (const d of ["TimelineProject", "FootageProject", "Project", "Desktop"]) mkdirSync(join(dir, d), { recursive: true });

check("parseIni keeps sections, blanks nothing, and does not split on '=' in a value", () => {
  const s = parseIni(FIXTURE);
  assert.deepEqual(Object.keys(s), ["General", "ui", "preference", "codec", "colors"]);
  assert.equal(s.General.version, "6.0.9");
  assert.equal(s.preference.survey_url, "https://example.invalid/vm/PzzxG8Y.aspx?s=1&t=2");
  assert.equal(s.codec.hardaware_model, "NVIDIA GeForce RTX 3070 Laptop GPU/PCIe/SSE2");
  assert.equal(s.colors["39"], "#FF381D");
});

check("typedValue reads what the strings mean", () => {
  assert.equal(typedValue("true"), true);
  assert.equal(typedValue("false"), false);
  assert.equal(typedValue("0"), 0);
  assert.equal(typedValue("de"), "de");
  assert.equal(typedValue(undefined), undefined);
});

check("getPref finds a key and says which section it came from", () => {
  assert.deepEqual(getPref("cuda_accel", { file }), { key: "cuda_accel", section: "codec", raw: "true", value: true });
  assert.equal(getPref("lang", { file }).section, "preference");
  assert.equal(getPref("nope", { file }).missing, true);
  assert.equal(getPref("theme", { file, section: "ui" }).value, 0);
});

check("readPrefs answers for one section only", () => {
  assert.deepEqual(Object.keys(readPrefs({ file, section: "codec" }).sections), ["codec"]);
  assert.equal(readPrefs({ file, section: "missing" }).sectionMissing, true);
  assert.ok(readPrefs({ file }).ageSeconds >= 0);
});

check("readPaths names the directories that are not there", () => {
  const p = readPaths({ file });
  assert.equal(p.exists, true);
  assert.equal(p.paths.workspace_location, join(dir, "TimelineProject"));
  assert.deepEqual(p.missingDirectories, ["last_visit_dir"]);
});

check("setPref rewrites one line and leaves every other byte alone", () => {
  const res = setPref("cuda_accel", "false", { file, section: "codec", isRunning: { running: false } });
  assert.equal(res.before, "cuda_accel=true");
  const after = readFileSync(file, "utf8");
  assert.ok(after.includes("cuda_accel=false"));
  assert.ok(after.includes("0=#FFFFFF") && after.includes("39=#FF381D"), "colour table was touched");
  assert.ok(after.includes("survey_url=https://example.invalid/vm/PzzxG8Y.aspx?s=1&t=2"));
  assert.ok(after.includes("\r\n"), "line endings changed");
  assert.ok(existsSync(`${file}.bak`), "no backup written");
  assert.equal(getPref("cuda_accel", { file }).value, false);
});

check("setPref adds an unknown key to its section, not to the end of the file", () => {
  setPref("hardware_encoding_av1_export", "true", { file, section: "codec", isRunning: { running: false } });
  const s = parseIni(readFileSync(file, "utf8"));
  assert.equal(s.codec.hardware_encoding_av1_export, "true");
  assert.ok(s.codec.hardware_decoding_preview, "the new key landed outside [codec]");
  assert.ok(!Object.keys(s).includes("hardware_encoding_av1_export"));
});

check("setPref creates a section that does not exist yet", () => {
  setPref("speed_up_deep_track_enabled", "true", { file, section: "dashboard", isRunning: { running: false } });
  assert.equal(parseIni(readFileSync(file, "utf8")).dashboard.speed_up_deep_track_enabled, "true");
});

check("setPref refuses while Studio is running, and force overrides it", () => {
  const running = { running: true, pids: [1234] };
  assert.throws(() => setPref("lang", "en", { file, section: "preference", isRunning: running }), /running/i);
  assert.equal(readPrefs({ file }).sections.preference.lang, "de", "the value changed despite the refusal");
  setPref("lang", "en", { file, section: "preference", isRunning: running, force: true });
  assert.equal(readPrefs({ file }).sections.preference.lang, "en");
});

check("studioGuiRunning answers with a shape, whatever this machine is doing", () => {
  const r = studioGuiRunning();
  assert.equal(typeof r.running, "boolean");
  assert.ok(Array.isArray(r.pids));
});

rmSync(dir, { recursive: true, force: true });
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
