// Return to the start page, then open a project, then report the timeline state.
// Used to A/B a Studio-authored project against a built one on the same footage.
import { readScreen, findWord, openProject } from "../src/editor.mjs";
import { focusWindow, click, sleep } from "../src/ui.mjs";

const NAME = process.argv[2] ?? "mcpTest";

focusWindow({});
let s = readScreen();
if (!s.ok) {
  console.log("no screen");
  process.exit(1);
}

// In the editor the left sidebar carries "Projektbibliothek"; clicking it goes
// back to the start page. On the start page it is already the active page.
const nav = findWord(s.words, "Projektbibliothek", { exact: false });
if (nav && !findWord(s.words, "Erstelle ein Video", { exact: false })) {
  console.log("back to start page via", JSON.stringify({ x: nav.x, y: nav.y }));
  click({ x: nav.x, y: nav.y });
  await sleep(6000);
  s = readScreen();
  console.log("start page words:", s.ok ? s.words.length : "none");
  console.log("has library:", s.ok ? Boolean(findWord(s.words, "Meine", { exact: false })) : false);
}

const opened = await openProject(NAME, { settleMs: 15000 });
console.log("openProject:", JSON.stringify(opened));
if (!opened.ok) {
  console.log("screen:", s.ok ? s.text.slice(0, 300) : "none");
  process.exit(1);
}

// Give the media time to actually load, then read the timeline state.
for (const wait of [10, 20, 30]) {
  await sleep(wait * 1000);
  focusWindow({});
  const after = readScreen();
  const loading = /Lade Dateien/i.test(after.text ?? "");
  console.log(`  +${wait}s  Lade Dateien: ${loading}  | ${(after.text ?? "").replace(/\s+/g, " ").slice(-260)}`);
}
