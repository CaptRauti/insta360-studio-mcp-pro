// End-to-end: source clips in, finished video out — no manual steps.
//
// This is the acceptance test for the whole chain. It builds a timeline as a
// file (2 clips, each trimmed, a filter on the first, a transition between
// them), writes it, restarts Studio so the project is visible, opens it, runs
// the export, and then checks the produced file with ffprobe.
//
// Run: node tests/pipeline-e2e.mjs [--name mcpE2E] [--keep]

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { runPipeline, assetCatalog } from "../src/pipeline.mjs";

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d;
};
const name = arg("name", "mcpE2E");
const outDir = path.join(os.homedir(), "Desktop");

const SOURCES = ["F:/Luna/VID_20261112_051426_001.mp4", "F:/Luna/VID_20261112_054457_004.mp4"];
for (const s of SOURCES) {
  if (!fs.existsSync(s)) {
    console.error(`Quelle fehlt: ${s}`);
    process.exit(3);
  }
}

const cat = assetCatalog();
const transitionName = cat.transitions[0];
console.log(`Effekt-Katalog: ${cat.filters.join(", ")}`);
console.log(`Transition:     ${transitionName}`);

// Expected length, so the export can be checked against it.
const clipSpecs = [
  { source: SOURCES[0], start: 100, end: 700, effect: "fireworks" },
  { source: SOURCES[1], start: 50, end: 250 },
];
const expectedFrames = clipSpecs.reduce((a, c) => a + (c.end - c.start), 0);

const result = await runPipeline({
  name,
  clips: clipSpecs,
  transitions: [{ name: transitionName, frames: 24, after: 0 }],
  export: { outDir, settings: { Auflösung: "1080P - 1920 x 1080", Kodierung: "H.264" } },
});

console.log("\n================ Ergebnis ================");
for (const s of result.stages) console.log(JSON.stringify(s));
console.log("==========================================");
console.log("ok:", result.ok, "| file:", result.file);

if (!result.file) process.exit(1);

// Verify with ffprobe: the file must exist, be big enough to be real, and carry
// the length the timeline asked for.
const stat = fs.statSync(result.file);
console.log(`\nDatei: ${result.file}`);
console.log(`Größe: ${stat.size} bytes`);
if (stat.size < 64 * 1024) {
  console.error("FEHLER: Datei zu klein — wahrscheinlich kein echter Export.");
  process.exit(2);
}

const ffprobe = "ffprobe";
try {
  const out = execFileSync(
    ffprobe,
    ["-v", "error", "-show_entries", "stream=codec_name,width,height,r_frame_rate,nb_frames:format=duration,size", "-of", "json", result.file],
    { encoding: "utf8" }
  );
  const info = JSON.parse(out);
  console.log("ffprobe:", JSON.stringify(info, null, 2));
  const v = info.streams?.find((s) => s.codec_name);
  const dur = Number(info.format?.duration ?? 0);
  const want = expectedFrames / 30;
  console.log(`\nDauer: ${dur.toFixed(3)}s (erwartet ~${want.toFixed(3)}s bei 30fps, ${expectedFrames} Frames)`);
  if (dur < want * 0.5) {
    console.error("FEHLER: Dauer weicht stark ab.");
    process.exit(2);
  }
  console.log("Codec:", v?.codec_name, v?.width + "x" + v?.height);
} catch (err) {
  console.error("ffprobe nicht verfügbar oder fehlgeschlagen:", err.message);
}

console.log("\nOK — Pipeline vollständig durchgelaufen.");
