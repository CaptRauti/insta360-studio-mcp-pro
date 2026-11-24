// Start Studio if needed, wait for the library, then dump every card label with
// its real coordinates — so openProject clicks the card instead of a guessed
// offset from its text.
import { startStudio, waitForLibrary } from "../src/pipeline.mjs";
import { readScreen } from "../src/editor.mjs";
import { focusWindow, windowInfo } from "../src/ui.mjs";

let wasRunning = true;
try {
  windowInfo();
} catch {
  wasRunning = false;
}
console.log("Studio was running:", wasRunning);

if (!wasRunning) {
  const started = await startStudio();
  console.log("startStudio:", JSON.stringify(started));
  if (!started.ok) process.exit(1);
}
const lib = await waitForLibrary({});
console.log("waitForLibrary:", JSON.stringify(lib));
if (!lib.ok) process.exit(1);

focusWindow({});
const s = readScreen();
console.log("words:", s.words.length);
const words = s.words.filter((w) => w.y > 250 && w.y < 640);
words.sort((a, b) => a.y - b.y || a.x - b.x);
for (const w of words) {
  console.log(`  y=${String(Math.round(w.y)).padStart(4)} x=${String(Math.round(w.x)).padStart(4)} w=${String(Math.round(w.w ?? 0)).padStart(3)} h=${String(Math.round(w.h ?? 0)).padStart(3)}  "${w.text}"`);
}
