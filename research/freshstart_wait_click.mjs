// Start Studio, wait properly, then click the sidebar's "Projektbibliothek" and report.
// The fresh start page shows the media library; whether its project page can be reached by
// click at all decides if the keyframe acceptance test can use the UI path — or whether a
// restart with the project first in pro.insproj is the only way in.
//   INSTA360_QUIET=0 node research/freshstart_wait_click.mjs [name]
import { click, redraw, windowInfo } from "../src/ui.mjs";
import { startStudio, waitForLibrary } from "../src/pipeline.mjs";
import { readScreen } from "../src/editor.mjs";

const want = process.argv[2] ?? "mcpKey";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const started = await startStudio();
console.log(`startStudio ok=${started.ok} pid=${started.pid}`);
if (!started.ok) process.exit(1);
console.log(`waitForLibrary: ${JSON.stringify(await waitForLibrary({}))}`);

for (const wait of [10000, 20000]) {
  await sleep(wait);
  redraw({});
  const s = readScreen({});
  const e = (s.words ?? []).find((w) => String(w.text).includes("Projektbibliothek"));
  const cards = (s.words ?? []).filter((w) => String(w.text).toLowerCase().includes(want.toLowerCase()));
  console.log(`after +${wait / 1000}s: entry=${e ? `${Math.round(e.x + (e.w ?? 0) / 2)},${Math.round(e.y + (e.h ?? 0) / 2)}` : "none"} cards=${cards.length} window=${windowInfo().width}x${windowInfo().height}`);
  if (e) {
    click({ x: Math.round(e.x + (e.w ?? 0) / 2), y: Math.round(e.y + (e.h ?? 0) / 2) });
    await sleep(5000);
    redraw({});
    const s2 = readScreen({});
    const c2 = (s2.words ?? []).filter((w) => String(w.text).toLowerCase().includes(want.toLowerCase()));
    console.log(`  after click: cards=${c2.length} ${c2.length ? c2.map((c) => `${Math.round(c.y)}/${Math.round(c.x)}`).join(",") : (s2.words ?? []).filter((w) => w.y > 250 && w.x > 200).map((w) => w.text).slice(0, 12).join(" ")}`);
    if (c2.length) break;
  }
}
