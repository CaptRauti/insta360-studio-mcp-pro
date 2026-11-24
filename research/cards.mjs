// Dump the project library's cards with coordinates, to find where a card
// actually is rather than guessing an offset from its label.
import { readScreen } from "../src/editor.mjs";
import { focusWindow, windowInfo } from "../src/ui.mjs";

try {
  focusWindow({});
} catch (e) {
  console.log("focus failed:", e.message);
}
const info = windowInfo();
console.log("window:", JSON.stringify(info));

const s = readScreen();
console.log("ok:", s.ok, "| words:", s.words.length);
if (!s.ok) process.exit(1);

const words = s.words.filter((w) => w.y > 250 && w.y < 620);
words.sort((a, b) => a.y - b.y || a.x - b.x);
for (const w of words) {
  console.log(`  y=${String(Math.round(w.y)).padStart(4)} x=${String(Math.round(w.x)).padStart(4)} w=${String(Math.round(w.w ?? 0)).padStart(3)} h=${String(Math.round(w.h ?? 0)).padStart(3)}  "${w.text}"`);
}
