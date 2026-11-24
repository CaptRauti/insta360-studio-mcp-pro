// Restart Studio (deterministic way back to the start page), open one project,
// and report whether its timeline clips ever finish loading.
//
// A/B purpose: compare a Studio-authored project against a built one on the same
// footage. "Lade Dateien..." (loading files) that never resolves is the failure
// the user reported as "the project contains broken videos".
import { stopStudio, startStudio, waitForLibrary } from "../src/pipeline.mjs";
import { readScreen, openProject } from "../src/editor.mjs";
import { focusWindow } from "../src/ui.mjs";

const argv = process.argv.slice(2);
const NAME = argv.find((a) => !a.startsWith("--")) ?? "mcpE2E";
// How long to watch the timeline before calling it a hang. The failure the user
// reported is a load that never resolves — so a slow-but-finite load must be
// told apart from an endless one, and that needs a longer window than a minute.
const POLLS = Number(argv[argv.indexOf("--polls") + 1]) || 5;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log("stopStudio:", JSON.stringify(await stopStudio()));
await sleep(4000);
const started = await startStudio();
console.log("startStudio:", JSON.stringify(started));
if (!started.ok) process.exit(1);
console.log("library:", JSON.stringify(await waitForLibrary({})));

const opened = await openProject(NAME, { settleMs: 15000 });
console.log("openProject:", JSON.stringify({ ok: opened.ok, clicked: opened.clicked, offset: opened.offset, error: opened.error }));
if (!opened.ok) {
  console.log("screen:", (opened.text ?? "").slice(0, 300));
  process.exit(1);
}

for (let i = 1; i <= POLLS; i++) {
  await sleep(12000);
  focusWindow({});
  const s = readScreen();
  const text = (s.text ?? "").replace(/\s+/g, " ");
  const loading = (text.match(/Lade Dateien/gi) ?? []).length;
  console.log(`  +${i * 12}s  "Lade Dateien" x${loading} | ${text.slice(-200)}`);
}
