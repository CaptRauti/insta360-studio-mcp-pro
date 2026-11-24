// Open a project from Studio's project library through the GUI.
//
// The library is a CEF/HTML list, so the project is found by reading the screen
// rather than by any accessibility API. Projects are opened by double-clicking
// the entry; the "Bearbeiten" button next to the selected project does the same.
//
// Usage: node research/open_project.mjs --name mcpAuto

import { click, sleep, DEFAULT_WINDOW_TITLE } from "../src/ui.mjs";
import { readScreen } from "../src/editor.mjs";

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const name = arg("name", "mcpAuto");
const title = arg("title", DEFAULT_WINDOW_TITLE);

function findWord(words, text, { maxY = 1e9 } = {}) {
  const t = text.toLowerCase();
  return words.find((w) => w.y < maxY && w.text.toLowerCase().includes(t));
}

// 1. The project library lives behind the Medien tab; the other tabs swap in
//    tool panels (Text, Effekte, Übergänge, ...) that replace it.
let s = readScreen({ title });
const medien = findWord(s.words, "Medien", { maxY: 130 });
if (medien) {
  click({ title, x: medien.x + Math.round((medien.w ?? 0) / 2), y: medien.y + Math.round((medien.h ?? 0) / 2) });
  await sleep(2500);
  s = readScreen({ title });
}
const lib = findWord(s.words, "Projektbibliothek");
if (!lib) throw new Error("Projektbibliothek nicht gefunden");
click({ title, x: lib.x + Math.round((lib.w ?? 0) / 2), y: lib.y + Math.round((lib.h ?? 0) / 2) });
await sleep(2500);

s = readScreen({ title });
console.log("=== Projektbibliothek ===");
const rows = {};
for (const w of s.words.filter((w) => w.x < 560 && w.y > 130)) {
  (rows[Math.round(w.y / 14) * 14] ||= []).push(w);
}
for (const y of Object.keys(rows).map(Number).sort((a, b) => a - b)) {
  console.log("  " + rows[y].sort((a, b) => a.x - b.x).map((w) => `${w.text}@${w.x},${w.y}`).join("  "));
}

// 2. Find the project entry by name.
const hit = s.words.find((w) => w.text.toLowerCase().includes(name.toLowerCase()) && w.x < 560 && w.y > 130);
if (!hit) {
  console.log(`\n!! "${name}" nicht in der Bibliothek sichtbar`);
  process.exit(2);
}
console.log(`\ngefunden: "${hit.text}" @ ${hit.x},${hit.y}`);

// 3. Double-click to open.
click({ title, x: hit.x + Math.round((hit.w ?? 0) / 2), y: hit.y + Math.round((hit.h ?? 0) / 2), double: true });
await sleep(7000);

const after = readScreen({ title });
console.log("\n=== Nach dem Öffnen ===");
console.log(after.text.slice(0, 900));
