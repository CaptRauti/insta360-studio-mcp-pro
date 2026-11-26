// Open the 'mcpKey' card by hand, since openProject's own verification cannot see it happen.
//
// openProject reports failure when neither the project name appears on screen nor the project file's
// mtime moves — but Studio only rewrites a project when it saves, so a project that *did* open can
// look like a failure. This clicks the card's thumbnail and judges by the screen: the library card
// list disappearing (and the marketing text with it) means the editor came up.
//
//   INSTA360_QUIET=0 node research/click_project_card.mjs [name]
import { click } from "../src/ui.mjs";
import { readScreen } from "../src/editor.mjs";

const name = process.argv[2] ?? "mcpKey";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const state = () => {
  const s = readScreen({});
  const text = (s.words ?? []).map((w) => w.text).join(" ");
  return {
    library: /Neues Projekt/i.test(text),
    editor: /Exportieren|Zuschneiden|Zeitleiste|Verfolgung/i.test(text),
    timelineText: text.slice(0, 120),
    words: s.words ?? [],
  };
};

const before = state();
console.log(`before: library=${before.library} editor=${before.editor}`);
const label = (before.words ?? []).find((w) => String(w.text).toLowerCase().includes(name.toLowerCase()));
if (!label) {
  console.log(`${name} is not on screen`);
  process.exit(1);
}
console.log(`card label at ${Math.round(label.x)},${Math.round(label.y)} (w=${Math.round(label.w ?? 0)})`);

const x = Math.round(label.x + (label.w ?? 0) / 2);
for (const dy of [21, 30, 40, 55, 85, 120]) {
  for (const kind of ["click", "dblclick"]) {
    const y = Math.round(label.y) - dy;
    if (kind === "dblclick") click({ x, y, dbl: true });
    else click({ x, y });
    await sleep(4500);
    const now = state();
    console.log(`  ${kind} ${x},${y} -> library=${now.library} editor=${now.editor}`);
    if (!now.library) {
      console.log(`\nOPENED (the library card list is gone). Screen now: ${now.timelineText}`);
      process.exit(0);
    }
  }
}
console.log("\nnone of the clicks changed the page");
