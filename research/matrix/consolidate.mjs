// Consolidates the C1/C3/C4 export-matrix measurements collected in research/matrix/.
// Reads the raw per-control files and emits research/matrix/export-matrix.json + a console summary.
// Run: node research/matrix/consolidate.mjs   (no Studio interaction, pure file work)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => (existsSync(join(here, f)) ? JSON.parse(readFileSync(join(here, f), "utf8")) : null);

// --- C1: the option inventory per control (measured by opening each list box) ---
const CONTROLS = ["Auflösung", "Rahmen", "Bitrate", "Kodierung", "Farbraum"];
const inventory = {};
for (const c of CONTROLS) {
  const raw = read(`lam360-opt-${c}.json`);
  if (!raw) continue;
  inventory[c] = {
    value_when_measured: raw.value,
    click: raw.click,
    options: raw.options,
    listbox: raw.listBox?.box ?? null,
    // OCR traps proven on this strip: "IObit" is 10bit, "6000" is 60.00, "V Empfohlen" is a tick + Empfohlen
  };
}

// --- C1/C3: preset side effects (one preset rewrites several controls at once) ---
const presetMatrix = read("lam360-preset-matrix.json") ?? [];
const presets = presetMatrix.map((r) => ({
  preset: r.preset,
  selected: r.ok,
  error: r.error,
  // readback is what the panel shows AFTER choosing the preset.
  // Only trust it when the selection itself succeeded: on a failed selection the
  // reader has been observed to return the NEIGHBOURING row's values (row-shift trap),
  // which would turn OCR noise into a fake finding.
  forces:
    r.ok && r.readback
      ? {
          Kodierung: r.readback.Kodierung,
          Farbraum: r.readback.Farbraum,
          Rahmen: r.readback.Rahmen,
          Auflösung: r.readback.Auflösung,
        }
      : null,
  unmeasured_reason: r.ok ? null : (r.error ?? "selection failed; readback not trustworthy"),
}));

// --- C1: option -> effect on the panel (Exportmodus + Auflösung so far) ---
const effects = read("option-effects.json")?.effects ?? [];

const out = {
  collected_at: new Date().toISOString(),
  project: "LamspringeKlon (2:1 3600 Panorama, 60fps)",
  inventory,
  presets,
  option_effects: effects,
  ocr_traps: {
    "Rec.709 IObit": "Rec.709 10bit",
    "Die Bildrate des Projekts anpassen - 6000": "… - 60.00",
    "V Empfohlen": "✓ Empfohlen (tick glyph read as V)",
    "Exportmod": "Exportmodus (label truncated by the column width)",
  },
  residual: [
    "Auflösung 5.7K / 8K: option list measured, effect not — the panel stopped accepting input after the 4K selection (see notes/*)",
    "Rahmen individual values (24/25/29.97/30/50/59.94): list measured, per-value effect not",
    "Bitrate 'Empfohlen' vs 'Benutzerdefiniert': list measured; the custom Mb/s field was not read",
    "Kodierung H.265 / ProRes: list measured, effect on Farbraum/Bitrate not",
  ],
};

writeFileSync(join(here, "export-matrix.json"), JSON.stringify(out, null, 1));

// --- summary (printed, not guessed) ---
console.log("== C1 option inventory ==");
for (const [c, v] of Object.entries(inventory)) {
  console.log(`  ${c.padEnd(12)} @${v.click.x},${v.click.y}  ${v.options.length} opts: ${v.options.join(" | ")}`);
}
console.log("== C3 presets (forced Kodierung/Farbraum/Rahmen) ==");
for (const p of presets) {
  const f = p.forces;
  console.log(`  ${String(p.preset).padEnd(26)} ${p.selected ? "ok " : "FAIL"} ${f ? `kode=${f.Kodierung} farbe=${f.Farbraum} rahmen=${f.Rahmen} auf=${f.Auflösung}` : p.error}`);
}
console.log(`== option effects measured: ${effects.length} controls, ${effects.reduce((n, e) => n + e.options.length, 0)} options ==`);
console.log("written: research/matrix/export-matrix.json");
