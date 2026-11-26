// Click the sidebar's "Projektbibliothek" entry and report what the screen shows afterwards.
//   INSTA360_QUIET=0 node research/click_project_library.mjs
import { click, redraw } from "../src/ui.mjs";
import { readScreen } from "../src/editor.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const entry = () => (readScreen({}).words ?? []).find((w) => String(w.text).includes("Projektbibliothek"));

for (const y of [341, 349, 360]) {
  const e = entry();
  const x = e ? Math.round(e.x + (e.w ?? 0) / 2) : 95;
  const yy = y ?? (e ? Math.round(e.y + (e.h ?? 0) / 2) : 349);
  const r = click({ x, y: yy });
  await sleep(3500);
  redraw({});
  const s = readScreen({});
  const hasCard = (s.words ?? []).some((w) => /mcpKey|mcpFlat|Lamspringe/i.test(String(w.text)));
  console.log(`click ${x},${yy} style=${r?.style} -> card visible=${hasCard}`);
  if (hasCard) {
    console.log((s.words ?? []).filter((w) => w.y > 150).map((w) => `${Math.round(w.y)}/${Math.round(w.x)}:${w.text}`).join(" "));
    break;
  }
}
