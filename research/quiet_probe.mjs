// Does the UI layer still work while the machine belongs to somebody else?
//
// Run: node research/quiet_probe.mjs [--click=<word>] [--back=<word>]
//
// In quiet mode, reading and clicking Studio must leave the pointer, the
// foreground window and the window rectangle exactly where they were — and must
// still see the UI (PrintWindow renders an occluded window, so the old "focus
// first or the capture is blank" rule is not needed). This measures that and,
// when given a word to click, proves the message click is actually accepted by
// the app: it clicks a harmless panel tab, diffs the capture, and clicks back, so
// the machine ends where it started.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { click, quiet, sleep, windowInfo } from "../src/ui.mjs";
import { readScreen } from "../src/editor.mjs";
import { findText } from "../src/ocr.mjs";
import { readPng } from "../src/png.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROBE = path.join(process.env.LOCALAPPDATA ?? "", "Temp", "hermes-probe", "probe_win.ps1");

const argOf = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

function desktop() {
  const out = execFileSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", PROBE], {
    encoding: "utf8",
  });
  return JSON.parse(out);
}

function show(label, d) {
  console.log(
    `${label.padEnd(24)} cursor=${d.cursor.x},${d.cursor.y}` +
      ` fg="${d.foreground.title.slice(0, 34)}" (pid ${d.foreground.pid}${d.foreground.isStudio ? ", STUDIO" : ""})`,
  );
}

function same(a, b) {
  return a.cursor.x === b.cursor.x && a.cursor.y === b.cursor.y && a.foreground.hwnd === b.foreground.hwnd;
}

/** Pixels that differ between two captures, optionally only inside a y-band. */
function diffPixels(aPath, bPath, band = null) {
  const a = readPng(aPath);
  const b = readPng(bPath);
  if (a.width !== b.width || a.height !== b.height) return { different: -1, total: a.width * a.height };
  const y0 = band ? Math.max(0, band[0]) : 0;
  const y1 = band ? Math.min(a.height, band[1]) : a.height;
  let different = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = 0; x < a.width; x++) {
      const i = (y * a.width + x) * 4;
      if (
        Math.abs(a.data[i] - b.data[i]) > 12 ||
        Math.abs(a.data[i + 1] - b.data[i + 1]) > 12 ||
        Math.abs(a.data[i + 2] - b.data[i + 2]) > 12
      ) {
        different++;
      }
    }
  }
  return { different, total: a.width * a.height };
}

console.log(`quiet mode: ${quiet()}\n`);

const start = desktop();
show("start", start);

const win = windowInfo();
console.log(
  `windowInfo             ${win.width}x${win.height} @ ${win.left},${win.top}` +
    ` monitor=${win.monitor?.primary ? "primary" : "secondary"}` +
    ` foreground=${win.foreground} iconic=${win.iconic}`,
);
const afterFind = desktop();
show("after windowInfo", afterFind);
console.log(`  pointer+foreground unchanged: ${same(start, afterFind)}`);

const shotA = readScreen();
console.log(`readScreen             ok=${shotA.ok} words=${(shotA.words ?? []).length}`);
const afterRead = desktop();
console.log(`  pointer+foreground unchanged: ${same(afterFind, afterRead)}`);

const word = argOf("click");
if (!word) {
  console.log("\n(no --click=<word> given; read-only pass)");
} else {
  const hits = findText(shotA, word);
  if (!hits.length) {
    console.log(`\nno word matching "${word}" on screen`);
  } else {
    const t = hits[0];
    console.log(`\nmessage-click "${t.text}" at window ${t.x},${t.y} (box ${t.width}x${t.height})`);
    const res = click({ x: t.x, y: t.y });
    console.log(`  style=${res.style} child=${res.clicked?.child} rel=${res.clicked?.relx},${res.clicked?.rely}`);
    await sleep(2200);
    const afterClick = desktop();
    show("after click", afterClick);
    console.log(`  pointer+foreground unchanged: ${same(afterRead, afterClick)}`);

    const shotB = readScreen();
    const band = [Math.max(0, t.y - 30), Math.min(900, t.y + 560)];
    const inBand = diffPixels(shotA.shot, shotB.shot, band);
    const whole = diffPixels(shotA.shot, shotB.shot);
    console.log(`  changed in the "${t.text}" row [${band[0]}..${band[1]}]: ${inBand.different}px`);
    console.log(`  changed in the whole window: ${whole.different}/${whole.total}px`);
    console.log(`  words after: ${(shotB.words ?? []).slice(0, 10).map((x) => x.text).join(" | ").slice(0, 130)}`);

    const back = argOf("back") ?? word;
    const backHits = findText(shotB, back);
    if (backHits.length) {
      console.log(`  clicking back on "${backHits[0].text}" at ${backHits[0].x},${backHits[0].y}`);
      click({ x: backHits[0].x, y: backHits[0].y });
      await sleep(1800);
      const shotC = readScreen();
      const reset = diffPixels(shotA.shot, shotC.shot);
      console.log(`  pixels differing from the start: ${reset.different}/${reset.total}`);
      const end = desktop();
      show("end", end);
      console.log(`  pointer+foreground unchanged vs start: ${same(start, end)}`);
    }
  }
}
