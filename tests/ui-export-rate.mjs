// Exports through Studio's GUI and checks the **frame rate** of the produced file
// against the `Rahmen` row's value — the one control whose effect was unverifiable
// until `rowFor` learned to re-read a short value at 4× (`references/export-dialog.md`
// → C1 residual). Without `settings`, `runExport` uses the dialog as it stands, so this
// compares "what the row says" with "what the file contains" instead of forcing a value.
//
//   node tests/ui-export-rate.mjs            # dialog open, project loaded
//
// Needs Studio running with a clip loaded. The dialog may be open or closed.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { runExport } from "../src/ui.mjs";
import { readDialog } from "../src/export-dialog.mjs";

const TITLE = "Insta360 Studio";
const OUT = path.join(os.homedir(), "Desktop");
const FFPROBE = [
  path.join(
    os.homedir(),
    "AppData",
    "Local",
    "hermes",
    "tools",
    "ffmpeg-9.0.1-win32-x64",
    "bin",
    "ffprobe.exe",
  ),
  "ffprobe",
].find((p) => p === "ffprobe" || existsSync(p));

const d0 = readDialog({ title: TITLE });
if (!d0.ok) {
  console.log("Export-Dialog ist nicht offen.");
  process.exit(2);
}
const row = d0.fields?.Rahmen ?? null;
const want = row?.value ?? null;
console.log(
  `Rahmen laut Dialog: ${JSON.stringify(want)} (${row?.zoomed ? "gezoomt nachgelesen" : "nativ gelesen"})` +
    `, Auflösung ${JSON.stringify(d0.fields?.Auflösung?.value)}, Kodierung ${JSON.stringify(d0.fields?.Kodierung?.value)}`,
);

const t0 = Date.now();
const res = await runExport({
  title: TITLE,
  outDir: OUT,
  stage: "full",
  timeoutMs: 13 * 60 * 1000,
  pollMs: 2000,
});
console.log(`\nExport fertig in ${Math.round((Date.now() - t0) / 1000)}s: ${res.file} (${res.size} Bytes)`);

let rf = null;
try {
  const out = execFileSync(
    FFPROBE,
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=r_frame_rate,avg_frame_rate,nb_frames:format=duration",
      "-of",
      "default=noprint_wrappers=1",
      res.file,
    ],
    { encoding: "utf8", timeout: 120000 },
  );
  console.log(`\n--- ffprobe ---\n${out.trim()}`);
  rf = /avg_frame_rate=(\S+)/.exec(out)?.[1] ?? null;
} catch (err) {
  console.log(`\nffprobe fehlgeschlagen: ${err.message}`);
}

const num = (f) => {
  if (!f) return null;
  const [a, b = 1] = String(f).split("/").map(Number);
  const v = b ? a / b : NaN;
  return Number.isFinite(v) ? v : null;
};
const got = num(rf);
const wantN = num(String(want ?? "").replace(",", "."));

console.log("");
if (got === null) {
  console.log(`UNKLAR: keine Bildrate aus der Datei gelesen (avg_frame_rate=${rf ?? "?"}).`);
} else if (wantN === null) {
  console.log(`UNKLAR: im Dialog steht keine Rate, sondern ${JSON.stringify(want)} — Datei: ${got.toFixed(2)} fps.`);
} else if (Math.abs(got - wantN) < 0.01) {
  console.log(`OK: die Datei läuft mit ${got.toFixed(2)} fps — die Rahmen-Einstellung ist im Ergebnis angekommen.`);
} else {
  console.log(`FEHLER: Dialog ${want} (${wantN.toFixed(2)} fps), Datei ${got.toFixed(2)} fps.`);
  process.exitCode = 1;
}
