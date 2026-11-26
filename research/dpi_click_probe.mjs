// Is a synthesized click landing where we think? On this host Studio runs at
// dpr=1.25 (screen 2048x1280 logical / 2560x1600 physical) and PowerShell is
// DPI-unaware, so a message click may be interpreted 25% off. This probe clicks a
// known tab at logical and at scaled coordinates and diffs the frame, so the answer
// is a measurement instead of a theory.
//   node research/dpi_click_probe.mjs "<label>" <x> <y>
import { readScreen } from "../src/editor.mjs";
import { capture, click, redraw, windowInfo } from "../src/ui.mjs";
import { readPng } from "../src/png.mjs";

const label = process.argv[2] ?? "Medienbibliothek";
const scale = Number(process.argv[5] ?? 1.25);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function frame() {
  redraw({});
  const shot = capture({});
  return readPng(shot.path);
}
function diff(a, b) {
  let n = 0;
  const len = Math.min(a.data.length, b.data.length);
  for (let i = 0; i < len; i += 3) {
    if (Math.abs(a.data[i] - b.data[i]) > 24 || Math.abs(a.data[i + 1] - b.data[i + 1]) > 24 || Math.abs(a.data[i + 2] - b.data[i + 2]) > 24) n++;
  }
  return n;
}

const info = windowInfo({});
console.log(`window ${info.width}x${info.height} at ${info.left},${info.top} dpr-scale=${scale}`);
const screen = readScreen({});
const hit = (screen.words ?? []).find((w) => w.text.toLowerCase().includes(label.toLowerCase()));
if (!hit) {
  console.log(`label ${label} not found; words: ${(screen.words ?? []).map((w) => `${Math.round(w.x)},${Math.round(w.y)}:${w.text}`).join(" | ")}`);
  process.exit(1);
}
const x = Math.round(hit.x + (hit.w ?? 0) / 2);
const y = Math.round(hit.y + (hit.h ?? 0) / 2);
console.log(`label ${label}: logical ${x},${y}`);

for (const [name, cx, cy] of [["logical", x, y], ["scaled", Math.round(x * scale), Math.round(y * scale)]]) {
  await sleep(1500);
  const before = frame();
  const r = click({ x: cx, y: cy });
  await sleep(3000);
  const after = frame();
  console.log(`${name.padEnd(8)} click ${cx},${cy} style=${r?.style} changed=${diff(before, after)} px`);
}
