// Runs Studio's GUI export end to end and verifies the produced file.
//
//   node tests/ui-export-video.mjs
//
// This is the path that actually writes video: the gRPC exporter refuses
// VIDEO(9)/VIDEO_CLIP(10) in every UI state, because it resolves footage from
// internal project state that neither the UI nor an .insproj populates. The
// dialog does the work, so this probe drives the dialog.
//
// Needs Studio running with the export dialog closed and a clip loaded.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { runExport, uiState } from "../src/ui.mjs";

const TITLE = "Insta360 Studio";
const OUT = path.join(os.homedir(), "Desktop");

const FFPROBE = [
  path.join(os.homedir(), "AppData", "Local", "hermes", "tools", "ffmpeg-9.0.1-win32-x64", "bin", "ffprobe.exe"),
  "ffprobe",
].find((p) => p === "ffprobe" || existsSync(p));

const before = uiState({ title: TITLE });
console.log(`vorher: dialogOpen=${before.dialogOpen} playerEmpty=${before.player.likelyEmpty}`);

const t0 = Date.now();
const res = await runExport({
  title: TITLE,
  outDir: OUT,
  stage: "full",
  timeoutMs: 12 * 60 * 1000,
  pollMs: 2000,
});
const secs = Math.round((Date.now() - t0) / 1000);

console.log(`\nAblauf: ${JSON.stringify(res.log, null, 1)}`);
console.log(`\nFertig in ${secs}s: ${res.file} (${res.size} Bytes)`);

if (FFPROBE) {
  try {
    const out = execFileSync(FFPROBE, [
      "-v", "error",
      "-show_entries", "format=duration,format_name:stream=codec_name,width,height,r_frame_rate",
      "-of", "default=noprint_wrappers=1",
      res.file,
    ], { encoding: "utf8", timeout: 120000 });
    console.log("\n--- ffprobe ---");
    console.log(out.trim());
  } catch (err) {
    console.log(`\nffprobe fehlgeschlagen: ${err.message}`);
  }
} else {
  console.log("\n(ffprobe nicht gefunden)");
}

console.log("\nOK: GUI-Export hat eine Datei geschrieben.");
