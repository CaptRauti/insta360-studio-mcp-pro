// Why does a freshly started Studio not show the project card?
//
// The acceptance test for the keyframe writer depends on opening the project in the editor,
// because only then does Studio parse the file. After a fresh start the card is not found,
// so this prints the whole screen and the full openProject reply instead of guessing.
//
//   INSTA360_QUIET=0 node research/freshstart_library.mjs <projectDir>
import { moveWindow, redraw, windowInfo } from "../src/ui.mjs";
import { openProjectAt, startStudio, waitForLibrary } from "../src/pipeline.mjs";
import { readScreen } from "../src/editor.mjs";

const dir = process.argv[2] ?? "D:/Dokumente/Insta360/Studio/TimelineProject/mcpKey";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const started = await startStudio();
console.log(`startStudio ok=${started.ok} pid=${started.pid ?? "-"} ${started.error ?? ""}`);
if (!started.ok) process.exit(1);
console.log(`waitForLibrary: ${JSON.stringify(await waitForLibrary({}))}`);
await sleep(4000);

const win = windowInfo();
console.log(`window ${win.left},${win.top} ${win.width}x${win.height} iconic=${win.iconic} fg=${win.foreground}`);
try {
  console.log(`moveWindow: ${JSON.stringify(moveWindow({ x: 120, y: 110, width: 1384, height: 900 }))}`);
} catch (e) {
  console.log(`moveWindow refused: ${e.message}`);
}
await sleep(3000);

redraw({});
const screen = readScreen({});
console.log(`\nscreen (editor=${screen.ok}):`);
console.log((screen.words ?? []).map((w) => `${Math.round(w.y)}/${Math.round(w.x)}:${w.text}`).join(" "));

const opened = await openProjectAt(dir);
console.log(`\nopenProjectAt: ${JSON.stringify(opened).slice(0, 600)}`);
