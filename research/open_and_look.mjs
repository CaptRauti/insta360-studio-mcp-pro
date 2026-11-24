// Start Studio, open the built project, and report what the UI actually shows.
import { startStudio, waitForLibrary } from "../src/pipeline.mjs";
import { readScreen, openProject } from "../src/editor.mjs";
import { focusWindow, windowInfo } from "../src/ui.mjs";

const NAME = process.argv[2] ?? "mcpE2E";

let running = true;
try {
  windowInfo();
} catch {
  running = false;
}
if (!running) {
  const s = await startStudio();
  console.log("startStudio:", JSON.stringify(s));
  if (!s.ok) process.exit(1);
}
const lib = await waitForLibrary({});
console.log("library:", JSON.stringify(lib));

const opened = await openProject(NAME);
console.log("openProject:", JSON.stringify(opened));

focusWindow({});
await new Promise((r) => setTimeout(r, 3000));
const s = readScreen();
console.log("\n=== SCREEN ===");
console.log(s.ok ? s.text : "no screen");
