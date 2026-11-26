// Open the project library card by brute force: try a grid of y offsets above the
// caption and report which one lands in the thumbnail. Answers "does the card click
// work at this window size at all", which is the question openProject leaves open.
//   node research/card_click_probe.mjs <projectName>
import { readScreen, looksLikeEditor, findWord, findLabel } from "../src/editor.mjs";
import { click } from "../src/ui.mjs";

const name = process.argv[2] ?? "mcpKey";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let screen = readScreen({});
if (!screen.ok) {
  console.log(`no screen: ${screen.error}`);
  process.exit(1);
}
const label = findLabel(screen.words, name, { yMin: 250 }) ?? findWord(screen.words, name, { exact: false, yMin: 250 });
if (!label) {
  console.log(`no label for ${name}; words: ${(screen.words ?? []).map((w) => `${Math.round(w.x)},${Math.round(w.y)}:${w.text}`).join(" | ")}`);
  process.exit(1);
}
console.log(`label ${name}: centre x=${label.x} y=${label.y} raw y=${label.raw.y} h=${label.raw.h ?? "?"}`);
const x = label.x;
for (const dy of [8, 14, 21, 28, 35, 44, 55, 70, 90]) {
  const y = Math.round(label.raw.y - dy);
  const r = click({ x, y, double: true });
  await sleep(7000);
  const s = readScreen({});
  console.log(`dy=${dy} y=${y} style=${r?.style ?? "?"} editor=${looksLikeEditor(s.words)} :: ${(s.text ?? "").replace(/\s+/g, " ").slice(0, 200)}`);
  if (looksLikeEditor(s.words)) break;
}
