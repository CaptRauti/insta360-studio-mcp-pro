// Reproduce an export failure and capture what Studio says about it.
//
// Studio's export log is ciphertext, so the only readable account of a failure
// is the UI itself: run the export, then read the screen (and any modal that
// appeared) with OCR.
//
// Usage: node tests/repro-export-error.mjs --name mcpAuto [--project <path.insproj>]

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { startStudio, waitForLibrary, studioProcess, stopStudio } from "../src/pipeline.mjs";
import { openProject, readScreen, looksLikeEditor } from "../src/editor.mjs";
import { runExport, sleep, capture } from "../src/ui.mjs";

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d;
};
const name = arg("name", "mcpAuto");

function dump(label, screen) {
  console.log(`\n----- ${label} -----`);
  console.log("shot:", screen.shot);
  console.log(screen.text.slice(0, 1500));
  const rows = {};
  for (const w of screen.words) (rows[Math.round(w.y / 14) * 14] ||= []).push(w);
  for (const y of Object.keys(rows).map(Number).sort((a, b) => a - b)) {
    console.log(String(y).padStart(5) + " | " + rows[y].sort((a, b) => a.x - b.x).map((w) => `${w.text}@${w.x},${w.y}`).join("  "));
  }
}

// Bring Studio up and get the project open.
if (!studioProcess()) {
  console.log("Studio läuft nicht — starte ...");
  const started = await startStudio();
  if (!started.ok) throw new Error(started.error);
}
const ready = await waitForLibrary();
console.log("Bibliothek bereit:", ready.ok);
if (!ready.ok) throw new Error(ready.error);

const opened = await openProject(name);
console.log("Projekt geöffnet:", opened.ok, opened.error ?? "");
if (!opened.ok) {
  dump("Bibliothek", readScreen());
  process.exit(2);
}
await sleep(4000);

let screen = readScreen();
dump("Nach dem Öffnen", screen);
console.log("\nEditor erkannt:", looksLikeEditor(screen.words));

// Look for anything Studio already flags as missing before the export runs.
const warnings = screen.words.filter((w) => /fehl|offline|nicht gefunden|missing|beschädigt|verloren/i.test(w.text));
if (warnings.length) console.log("Warnhinweise auf dem Schirm:", JSON.stringify(warnings));

// Now run the export and see what comes back.
const outDir = path.join(os.homedir(), "Desktop");
console.log("\n=== Export starten ===");
let result;
try {
  result = await runExport({ outDir, timeoutMs: 6 * 60 * 1000, pollMs: 2000 });
  console.log("runExport:", JSON.stringify(result, null, 1).slice(0, 2500));
} catch (err) {
  console.log("runExport warf:", err.message);
  result = { ok: false, error: err.message };
}

await sleep(1500);
screen = readScreen();
dump("Nach dem Export", screen);

// A modal that appeared on top is the actual error message.
const modal = screen.words.filter((w) => /fehler|error|fehlgeschlagen|konnte nicht|nicht möglich|ungültig/i.test(w.text));
console.log("\nFehler-Wörter:", JSON.stringify(modal));
console.log("Dateien auf dem Desktop:", fs.readdirSync(outDir).filter((f) => f.endsWith(".mp4")).length);
