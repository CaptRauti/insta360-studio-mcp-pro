// Which point on the start page actually switches to the project library?
//
// A freshly started Studio shows the *media* library, so the project cards are not on screen
// and the project cannot be opened in the editor. The sidebar label "Projektbibliothek" is
// there, but clicking its centre changes nothing (loud clicks included), so the clickable row
// is somewhere else. This sweeps the sidebar entries and the rows under them, and reports the
// pixel change plus whether a project card appeared — a page switch is a big change, a hover
// is a small one.
//
//   INSTA360_QUIET=0 node research/sidebar_startpage.mjs [name]
import { click, capture, redraw } from "../src/ui.mjs";
import { readScreen } from "../src/editor.mjs";
import { readPng } from "../src/png.mjs";

const want = process.argv[2] ?? "mcpKey";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const diff = (a, b) => {
  let n = 0;
  for (let i = 0; i < Math.min(a.data.length, b.data.length); i += 3) if (Math.abs(a.data[i] - b.data[i]) > 24) n++;
  return n;
};
const frame = () => {
  redraw({});
  return readPng(capture({}).path);
};
const cards = (screen) => (screen.words ?? []).filter((w) => String(w.text).toLowerCase().includes(want.toLowerCase()));

const screen = readScreen({});
const sidebar = (screen.words ?? [])
  .filter((w) => w.x < 200 && w.y > 250)
  .map((w) => ({ text: String(w.text), x: Math.round(w.x + (w.w ?? 0) / 2), y: Math.round(w.y + (w.h ?? 0) / 2) }));
console.log(`sidebar candidates: ${sidebar.map((c) => `${c.text}@${c.x},${c.y}`).join(" | ")}`);

outer: for (const c of sidebar) {
  for (const dy of [0, 8, 16]) {
    const before = frame();
    click({ x: c.x, y: c.y + dy });
    await sleep(3000);
    const after = frame();
    const s = readScreen({});
    const hit = cards(s);
    const changed = diff(before, after);
    console.log(`click ${c.x},${c.y + dy} (${c.text}) -> changed=${String(changed).padStart(7)} cards=${hit.length}`);
    if (hit.length) {
      console.log(`\nFOUND "${want}" at ${hit.map((h) => `${Math.round(h.y)}/${Math.round(h.x)}`).join(", ")}`);
      console.log((s.words ?? []).filter((w) => w.y > 150).map((w) => `${Math.round(w.y)}/${Math.round(w.x)}:${w.text}`).join(" "));
      break outer;
    }
  }
}
