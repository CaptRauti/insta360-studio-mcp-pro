// loadcheck.mjs <ProjectName> [...] [--no-restart] — does Studio actually load the media?
//
// The verdict comes from the player, never from the project file: a loaded project
// shows a picture (meanLuma > 20) and no "Lade Dateien" caption. On export the same
// failure surfaces as "Quelldatei fehlt", so that caption is the cheap early signal.
//
// Why each check restarts Studio: studio_project_open finds a card by reading the
// *library* view, and the editor has no way back to it (clicking the
// "Projektbibliothek" label does not leave the editor). Inside the editor the tool
// answers `not in library` for every name, and any OCR read taken there describes the
// previous project — which is exactly how a broken project can look fine.
//
// Written in Node rather than bash: the tool replies are JSON, and shell quoting
// around them cost more time than the automation saved.

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startStudio, stopStudio } from "../src/pipeline.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const callPath = path.join(root, "tests", "mcp-call.mjs");
const PROJECTS = "D:/Dokumente/Insta360/Studio/TimelineProject";

const argv = process.argv.slice(2);
const restart = !argv.includes("--no-restart");
const names = argv.filter((a) => !a.startsWith("--"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function call(tool, args = {}) {
  try {
    const out = execFileSync(process.execPath, [callPath, tool, JSON.stringify(args)], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
    return JSON.parse(out);
  } catch (e) {
    return { ok: false, error: String(e.stderr || e.message).slice(0, 200) };
  }
}

const text = () => (call("studio_ui_ocr", {}).lines ?? []).join("\n");
const luma = () => call("studio_ui_state", {}).player?.meanLuma ?? -1;

async function waitForLibrary(limitMs = 90000) {
  const end = Date.now() + limitMs;
  while (Date.now() < end) {
    if (/Projektbibliothek/i.test(text())) return true;
    await sleep(4000);
  }
  return false;
}

async function check(name) {
  if (!(await waitForLibrary())) return { name, verdict: "KEINE-BIBLIOTHEK", luma: null };
  const open = call("studio_project_open", { path: `${PROJECTS}/${name}` });
  if (!open.ok) return { name, verdict: "NICHT-GEOEFFNET", error: String(open.error ?? "").slice(0, 80) };

  let verdict = "TIMEOUT";
  let l = 0;
  for (let i = 0; i < 16; i++) {
    await sleep(5000);
    l = luma();
    if (/lade dateien/i.test(text())) {
      verdict = "LADE";
      continue;
    }
    if (l > 20) {
      verdict = "BILD";
      break;
    }
    verdict = "SCHWARZ";
  }
  return { name, verdict, luma: l };
}

for (const name of names) {
  if (restart) {
    await stopStudio();
    const r = await startStudio();
    console.log(`studio ${r.pid ?? JSON.stringify(r).slice(0, 80)}`);
    await sleep(6000);
  }
  const r = await check(name);
  console.log(`  -> ${r.name}: ${r.verdict}${r.luma === null ? "" : ` luma=${r.luma}`}${r.error ? ` (${r.error})` : ""}`);
}