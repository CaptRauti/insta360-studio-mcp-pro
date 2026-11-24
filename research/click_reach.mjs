// Does a message click reach the app, and is the capture merely one frame behind?
//
//   node research/click_reach.mjs <wordA> <wordB>
//
// Clicks a harmless panel tab with window messages, captures without flushing,
// flushes the window's paint, captures again, then clicks back. If the new panel
// only shows up in the flushed capture, the click works and the frame lags
// behind; if it never shows up, the app ignores synthetic mouse messages.
import * as ui from "../src/ui.mjs";
import { readScreen } from "../src/editor.mjs";
import { findText } from "../src/ocr.mjs";
import { readPng } from "../src/png.mjs";

const [wordA, wordB] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function diff(a, b) {
  const x = readPng(a);
  const y = readPng(b);
  if (x.width !== y.width || x.height !== y.height) return -1;
  let n = 0;
  for (let i = 0; i < x.data.length; i += 4) {
    if (
      Math.abs(x.data[i] - y.data[i]) > 12 ||
      Math.abs(x.data[i + 1] - y.data[i + 1]) > 12 ||
      Math.abs(x.data[i + 2] - y.data[i + 2]) > 12
    ) {
      n++;
    }
  }
  return n;
}

const PANEL_A = ["projektbibliothek", "medienbibliothek", "kameramed", "cloud-medien", "vid"];
const PANEL_B = ["musik", "song", "track", "keine musik", "suche"];

const panelWords = (shot, needles) =>
  (shot.words ?? [])
    .filter((w) => needles.some((n) => String(w.text).toLowerCase().includes(n)))
    .map((w) => w.text)
    .join(",");

function report(label, shot) {
  console.log(
    `${label.padEnd(20)} words=${String((shot.words ?? []).length).padStart(3)}` +
      ` | A[${panelWords(shot, PANEL_A).slice(0, 70)}] | B[${panelWords(shot, PANEL_B).slice(0, 40)}]`,
  );
}

console.log(`quiet=${ui.quiet()}`);
const win = ui.windowInfo();
console.log(`window ${win.width}x${win.height} @ ${win.left},${win.top} monitor=${win.monitor?.primary ? "primary" : "secondary"} foreground=${win.foreground}`);

const s0 = readScreen();
report("start", s0);

const hit = findText(s0, wordA)[0];
if (!hit) throw new Error(`no word "${wordA}" on screen`);
console.log(`\nmessage-click "${hit.text}" at ${hit.x},${hit.y}`);
console.log(`  click result: ${JSON.stringify(ui.click({ x: hit.x, y: hit.y }).clicked)}`);

await sleep(2000);
const s1 = readScreen();
report("after click", s1);
console.log(`  diff start->after: ${diff(s0.shot, s1.shot)}px`);

ui.redraw();
await sleep(1200);
const s2 = readScreen();
report("after redraw", s2);
console.log(`  diff after->redraw: ${diff(s1.shot, s2.shot)}px   start->redraw: ${diff(s0.shot, s2.shot)}px`);

const back = findText(s2, wordB)[0] ?? findText(s0, wordB)[0];
console.log(`\nclicking back on "${back?.text}" at ${back?.x},${back?.y}`);
ui.click({ x: back.x, y: back.y });
await sleep(2000);
ui.redraw();
await sleep(1200);
const s3 = readScreen();
report("after back", s3);
console.log(`  diff start->end: ${diff(s0.shot, s3.shot)}px  (0 = as found)`);
