// Walk the editor's tab strip and record what each tab offers.
//
// The left panel of the project editor is a tab strip — Medien, Musik, Text,
// Sticker, Effekte, Übergänge, Bewegung — and each tab swaps in a different tool
// panel. Their contents are the whole feature set of the editor, and none of it
// is exposed to UI Automation (the panel is CEF/HTML), so the only way to learn
// the options is to open each tab and read the screen.
//
// Usage: node research/walk_tabs.mjs [--tabs Medien,Musik,...] [--settle 2500]

import fs from "node:fs";
import path from "node:path";
import { click, sleep, DEFAULT_WINDOW_TITLE } from "../src/ui.mjs";
import { readScreen, EDITOR_TABS } from "../src/editor.mjs";

const argv = process.argv.slice(2);
const arg = (name, dflt) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};

const tabs = arg("tabs", EDITOR_TABS.join(",")).split(",").map((s) => s.trim()).filter(Boolean);
const settle = Number(arg("settle", "2500"));
const title = arg("title", DEFAULT_WINDOW_TITLE);

const out = [];
for (const tab of tabs) {
  const before = readScreen({ title });
  if (!before.ok) {
    console.log(`!! read failed before tab ${tab}: ${before.error}`);
    continue;
  }
  const hit = before.words.find((w) => w.text.startsWith(tab.slice(0, 4)) && w.y < 130);
  if (!hit) {
    console.log(`?? tab "${tab}" not found in tab strip`);
    out.push({ tab, ok: false, error: "tab not on screen" });
    continue;
  }
  click({ title, x: hit.x + Math.round((hit.w ?? 0) / 2), y: hit.y + Math.round((hit.h ?? 0) / 2) });
  await sleep(settle);
  const after = readScreen({ title });
  if (!after.ok) {
    console.log(`!! read failed after tab ${tab}`);
    out.push({ tab, ok: false, error: after.error });
    continue;
  }
  // The panel's own labels: everything left of the centre preview, below the tab row.
  const panel = after.words.filter((w) => w.x < 560 && w.y > 130 && w.y < 1120);
  const rows = {};
  for (const w of panel) {
    const key = Math.round(w.y / 14) * 14;
    (rows[key] ||= []).push(w);
  }
  const lines = Object.keys(rows)
    .map(Number)
    .sort((a, b) => a - b)
    .map((y) => rows[y].sort((a, b) => a.x - b.x).map((w) => `${w.text}@${w.x},${w.y}`).join("  "));

  console.log("=".repeat(76));
  console.log(`TAB ${tab}  (clicked ${hit.x},${hit.y})`);
  for (const l of lines) console.log("  " + l);
  out.push({ tab, ok: true, clicked: { x: hit.x, y: hit.y }, lines, words: panel.length });
}

const file = path.join(process.cwd(), "research", "tabs_walk.json");
fs.writeFileSync(file, JSON.stringify(out, null, 2));
console.log(`\ngeschrieben: ${file}`);
