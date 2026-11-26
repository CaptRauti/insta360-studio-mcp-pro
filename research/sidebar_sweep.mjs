// Which point actually switches the project library? The sidebar's page labels are
// found by OCR but a click on the label centre does nothing, so this sweeps x/y around
// the label and reports both the pixel change and whether the project card appears.
//   node research/sidebar_sweep.mjs "Projektbibliothek" ["mcpKey"]
import { readScreen } from "../src/editor.mjs";
import { click, capture, redraw } from "../src/ui.mjs";
import { readPng } from "../src/png.mjs";

const label = process.argv[2] ?? "Projektbibliothek";
const want = process.argv[3] ?? "mcpKey";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function frame() {
  redraw({});
  return readPng(capture({}).path);
}
function diff(a, b) {
  let n = 0;
  for (let i = 0; i < Math.min(a.data.length, b.data.length); i += 3) {
    if (Math.abs(a.data[i] - b.data[i]) > 24 || Math.abs(a.data[i + 1] - b.data[i + 1]) > 24 || Math.abs(a.data[i + 2] - b.data[i + 2]) > 24) n++;
  }
  return n;
}

const screen = readScreen({});
const hit = (screen.words ?? []).find((w) => w.text.toLowerCase().includes(label.toLowerCase()));
if (!hit) {
  console.log(`label not found: ${(screen.words ?? []).map((w) => `${Math.round(w.x)},${Math.round(w.y)}:${w.text}`).join(" | ").slice(0, 400)}`);
  process.exit(1);
}
const labelX = Math.round(hit.x + (hit.w ?? 0) / 2);
const labelY = Math.round(hit.y + (hit.h ?? 0) / 2);
console.log(`label ${label}: centre ${labelX},${labelY} raw ${Math.round(hit.x)},${Math.round(hit.y)} w=${Math.round(hit.w ?? 0)} h=${Math.round(hit.h ?? 0)}`);

const xs = [labelX, 30, 60, 150, 250, 400];
const ys = [labelY, labelY - 6, labelY + 6, labelY + 14];
outer: for (const y of ys) {
  for (const x of xs) {
    const before = frame();
    click({ x, y });
    await sleep(2200);
    const after = frame();
    const s = readScreen({});
    const seen = (s.text ?? "").includes(want);
    console.log(`click ${x},${y} -> changed=${String(diff(before, after)).padStart(7)}  ${want} visible=${seen}`);
    if (seen) {
      console.log(`OPENED at ${x},${y}`);
      break outer;
    }
    if (diff(before, after) > 20000) {
      // A page switch happened; re-find the label before sweeping on.
      const fresh = readScreen({});
      const again = (fresh.words ?? []).find((w) => w.text.toLowerCase().includes(label.toLowerCase()));
      if (again) {
        console.log(`  (page changed; label now at ${Math.round(again.x)},${Math.round(again.y)})`);
      }
    }
  }
}
