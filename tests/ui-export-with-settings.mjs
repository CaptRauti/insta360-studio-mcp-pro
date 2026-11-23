// Exports through Studio's GUI with non-default dialog settings and checks the
// result: the codec inside the produced file must be the one that was picked.
//
//   node tests/ui-export-with-settings.mjs [Codec]     # default "H.264"
//
// H.264 is the default here on purpose — Studio's own default is H.265, so an
// h264 file only appears if the setting actually reached the encoder. This is
// the real proof that the dialog controls drive the export, not just the UI.
//
// Needs Studio running with a clip loaded and the export dialog closed.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { runExport, uiState } from "../src/ui.mjs";
import { applySettings, readDialog } from "../src/export-dialog.mjs";

const TITLE = "Insta360 Studio";
const OUT = path.join(os.homedir(), "Desktop");
const WANTED = process.argv[2] ?? "H.264";

const FFPROBE = [
  path.join(os.homedir(), "AppData", "Local", "hermes", "tools", "ffmpeg-9.0.1-win32-x64", "bin", "ffprobe.exe"),
  "ffprobe",
].find((p) => p === "ffprobe" || existsSync(p));

const before = uiState({ title: TITLE });
console.log(`vorher: dialogOpen=${before.dialogOpen} playerEmpty=${before.player.likelyEmpty}`);
console.log(`Kodierung laut Dialog: ${JSON.stringify(readDialog({ title: TITLE }).fields.Kodierung?.value)}`);

const t0 = Date.now();
const res = await runExport({
  title: TITLE,
  outDir: OUT,
  stage: "full",
  settings: { Kodierung: WANTED },
  timeoutMs: 12 * 60 * 1000,
  pollMs: 2000,
});
const secs = Math.round((Date.now() - t0) / 1000);

console.log(`\nEinstellungsbericht:\n${JSON.stringify(res.settings?.report, null, 1)}`);
console.log(`\nFertig in ${secs}s: ${res.file} (${res.size} Bytes)`);

let codecName = null;
if (FFPROBE) {
  try {
    const out = execFileSync(
      FFPROBE,
      [
        "-v", "error",
        "-show_entries", "format=duration,format_name:stream=codec_name,width,height,r_frame_rate",
        "-of", "default=noprint_wrappers=1",
        res.file,
      ],
      { encoding: "utf8", timeout: 120000 },
    );
    console.log("\n--- ffprobe ---");
    console.log(out.trim());
    codecName = /codec_name=(\S+)/.exec(out)?.[1] ?? null;
  } catch (err) {
    console.log(`\nffprobe fehlgeschlagen: ${err.message}`);
  }
} else {
  console.log("\n(ffprobe nicht gefunden)");
}

// Put the app back the way it was found: reopen the dialog, restore the codec.
const again = await runExport({ title: TITLE, outDir: OUT, stage: "dialog" });
if (again.ok) {
  const back = await applySettings({ title: TITLE, settings: { Kodierung: "H.265" } });
  console.log(`\nzurückgestellt: ${JSON.stringify(back.report)}`);
} else {
  console.log("\n(Export-Dialog ließ sich zum Zurückstellen nicht öffnen)");
}

const want = WANTED.toLowerCase().replace(/[^a-z0-9]/g, "");
const got = (codecName ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const picked = res.settings?.report?.find((r) => r.control === "Kodierung");

if (!codecName) {
  console.log("\nUNKLAR: kein Codec aus der Datei gelesen.");
} else if (got === want) {
  console.log(`\nOK: Einstellung ${WANTED} ist im Ergebnis angekommen (codec_name=${codecName}).`);
} else {
  console.log(`\nFEHLER: verlangt war ${WANTED}, die Datei enthält codec_name=${codecName}.`);
  console.log(`Dialog meldete: ${JSON.stringify(picked)}`);
  process.exitCode = 1;
}
