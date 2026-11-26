// Why does the project-library card not open? The card click is the one thing that
// stands between a built project and the editor, so this probe clicks the mcpKey
// card at a run of offsets and, after each one, reads the *newest Studio log tail*
// — ground truth that does not depend on whether a background window's frame is
// fresh. It switches back to the project library first.
//   node research/card_click_trace.mjs [projectName]
import fs from "node:fs";
import path from "node:path";
import { readScreen, findWord, findLabel } from "../src/editor.mjs";
import { click } from "../src/ui.mjs";
import { studioLogRoot, readLogTail } from "../src/logs.mjs";

const name = process.argv[2] ?? "mcpKey";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function newestMainLog() {
  const base = studioLogRoot();
  const root = fs.existsSync(path.join(base, "studio")) ? path.join(base, "studio") : base;
  const dirs = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(root, d.name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  for (const dir of dirs) {
    const main = fs.readdirSync(dir).find((f) => /^\d{4}_\d\d_\d\d.*\.log$/.test(f) && !/_(cef|export|thumbnail)/.test(f));
    if (main) return path.join(dir, main);
  }
  return null;
}

/** Lines the owner cares about: a project load, an attach verdict, or a refusal. */
const INTERESTING = /mcpKey|insproj|album|VideoSampleGroup|fsType|add.*clip|fail|error|Fehler|lost|verloren|Medium/i;

async function logDigest(file, fromLine) {
  const tail = await readLogTail({ file, lines: 4000 });
  const lines = (tail.lines ?? []).filter((l) => INTERESTING.test(l));
  return { total: (tail.lines ?? []).length, picked: lines.slice(-6) };
}

const log = newestMainLog();
console.log(`log: ${log}`);
const before = await readLogTail({ file: log, lines: 1 });
console.log(`log currently has ${before.totalLines} lines`);

// Back to the project library.
let screen = readScreen({});
const tab = findWord(screen.words, "Projektbibliothek", { exact: false });
if (tab) {
  console.log(`clicking tab Projektbibliothek at ${tab.x},${tab.y}`);
  click({ x: tab.x, y: tab.y });
  await sleep(3000);
}

screen = readScreen({});
const label = findLabel(screen.words, name, { yMin: 150 }) ?? findWord(screen.words, name, { exact: false, yMin: 150 });
if (!label) {
  console.log(`no card label for ${name}: ${(screen.words ?? []).map((w) => `${Math.round(w.x)},${Math.round(w.y)}:${w.text}`).join(" | ")}`);
  process.exit(1);
}
console.log(`card label ${name}: centre ${label.x},${label.y} raw y=${label.raw.y}`);

for (const dy of [14, 21, 30, 40, 55]) {
  const y = Math.round(label.raw.y - dy);
  click({ x: label.x, y, double: true });
  await sleep(9000);
  const after = await readLogTail({ file: log, lines: 60 });
  const fresh = (after.lines ?? []).filter((l) => INTERESTING.test(l));
  const s = readScreen({});
  console.log(`\n--- dy=${dy} click ${label.x},${y}  (log now ${after.totalLines} lines)`);
  for (const l of fresh.slice(-5)) console.log(`    LOG ${l.slice(0, 150)}`);
  console.log(`    UI  ${(s.text ?? "").replace(/\s+/g, " ").slice(0, 180)}`);
}
