// Export through Studio's GUI and let the *shipped* verification decide whether the
// file carries what the dialog promised (`runExport({ verify: true })`).
//
//   node tests/ui-export-rate.mjs          # npm run probe:ui-export-rate
//
// Studio must be running with a clip loaded; the export dialog may be open or closed
// (`runExport` opens it). The expectation is taken from the dialog, not from argv, so
// this measures "what the row says" against "what the file contains" — the question
// the `Rahmen` residual could not answer until the row became readable again.
//
// Exit code 1 when a check fails, so it can gate a build.

import { runExport } from "../src/ui.mjs";

const t0 = Date.now();
const res = await runExport({
  title: "Insta360 Studio",
  stage: "full",
  verify: true,
  timeoutMs: 13 * 60 * 1000,
  pollMs: 2000,
});

const snap = res.log?.find((l) => l.step === "verify-snapshot")?.settings ?? null;
console.log("Dialog beim Start des Exports:");
for (const [k, v] of Object.entries(snap ?? {})) console.log(`  ${k.padEnd(14)} ${JSON.stringify(v)}`);
console.log(`\nExport fertig in ${Math.round((Date.now() - t0) / 1000)}s: ${res.file} (${res.size} Bytes)`);

const v = res.verify ?? {};
console.log(`\n--- Pruefung: ${v.ok === true ? "OK" : v.ok === false ? "FEHLER" : "unklar"} ---`);
for (const c of v.checks ?? []) {
  console.log(`  ${c.ok ? "ok  " : "FAIL"}  ${c.name.padEnd(12)} Dialog ${c.want}  .  Datei ${c.got}`);
}
for (const u of v.unverifiable ?? []) console.log(`  --    ${u.name.padEnd(12)} nicht pruefbar: ${u.reason}`);
if (v.info) {
  console.log(
    `\nDatei ist: ${v.info.codec}${v.info.codecTag ? ` (${v.info.codecTag})` : ""}, ` +
      `${v.info.width}x${v.info.height}, ${v.info.fps} fps, ${v.info.frames} Frames / ${v.info.duration}s, ` +
      `${v.info.bitRate ? Math.round(v.info.bitRate / 1000) + " kbit/s" : "Bitrate unbekannt"}, ` +
      `Audio ${v.info.hasAudio ? "ja" : "nein"}`,
  );
}
if (v.ok === false) process.exitCode = 1;
