// Verify the click/drag helper's message sequence against a window of our own.
//
// The claims to test:
//   1. a double click must arrive as WM_LBUTTONDBLCLK — Windows raises that message for
//      real mouse input only, so two DOWN/UP pairs are two single clicks and a CEF/Qt
//      widget waiting for DBLCLK does nothing at all;
//   2. a right click must arrive as WM_RBUTTONDOWN/UP, not as a left button;
//   3. a right drag must arrive as RBUTTONDOWN, then MOVEs carrying MK_RBUTTON in
//      wParam, then RBUTTONUP — Studio creates a view keyframe from exactly that gesture
//      ("Halte die rechte Maustaste gedrückt und ziehe ..."), so a right click alone is
//      not the operation and a drag without moves is not a drag.
//
// Uses the message spy from the `windows-desktop-gui-automation` skill, so no real
// application is touched.
//   node research/click_spy_probe.mjs
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { windowInfo } from "../src/ui.mjs";

const SPY = path.join(os.homedir(), "AppData/Local/hermes/skills/windows-desktop-gui-automation/scripts/click-spy.ps1");
const PS1 = path.join(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..", "src", "win32.ps1");
const TITLE = "MCP Click Spy";
const logFile = path.join(os.homedir(), "AppData/Local/Temp", "insta360-click-spy.log");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Drive the helper's -Direct path: the spy window is named explicitly, so the
 * WindowFromPoint lookup (which an always-on-top window defeats) is skipped. That is
 * exactly the variable this probe wants to hold constant — the *message sequence*.
 */
function helper(hwnd, action, args) {
  const argv = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", PS1, "-Action", action, "-Hwnd", String(hwnd), ...args, "-Quiet", "-Direct"];
  const out = execFileSync("powershell", argv, { encoding: "utf8", timeout: 60000 });
  return JSON.parse(out.trim().split(/\r?\n/).pop());
}

if (!fs.existsSync(SPY)) {
  console.log(`spy not found at ${SPY}`);
  process.exit(1);
}
fs.rmSync(logFile, { force: true });

const child = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", SPY, "-Log", logFile, "-Seconds", "120", "-Title", TITLE], { stdio: "ignore" });
console.log(`spy started (pid ${child.pid}); waiting for its window`);

let up = false;
for (let i = 0; i < 30 && !up; i++) {
  await sleep(1000);
  try {
    up = !!windowInfo(TITLE)?.ok;
  } catch {
    /* not yet */
  }
}
if (!up) {
  child.kill();
  console.log("spy window never appeared");
  process.exit(1);
}
const hwnd = windowInfo(TITLE).hwnd;
await sleep(1200);

const mark = (what) => fs.appendFileSync(logFile, `# MARK ${what}\n`);
async function phase(name, action, args, settle) {
  mark(`${name}-start`);
  const reply = helper(hwnd, action, args);
  await sleep(settle);
  mark(`${name}-end`);
  return reply;
}

const single = await phase("single", "click", ["-X", "120", "-Y", "80"], 900);
const dbl = await phase("double", "dblclick", ["-X", "120", "-Y", "80"], 1200);
const right = await phase("right", "click", ["-X", "120", "-Y", "80", "-Button", "right"], 1200);
const rdrag = await phase("rightdrag", "rightdrag", ["-X", "120", "-Y", "80", "-ToX", "260", "-ToY", "150"], 1500);

// Log lines are "<msgHex>:<wParamHex>", or a word for a UI event; slice them by marker.
const lines = fs
  .readFileSync(logFile, "utf8")
  .split(/\r?\n/)
  .filter((l) => l && !l.startsWith("# click spy") && !l.startsWith("# hwnd") && !l.startsWith("# rect"));
const slice = (name) => {
  const a = lines.indexOf(`# MARK ${name}-start`);
  const b = lines.indexOf(`# MARK ${name}-end`);
  return a < 0 || b < 0 ? [] : lines.slice(a + 1, b).filter((l) => !l.startsWith("# MARK"));
};
const msg = (l) => String(l).split(":")[0];
const wp = (l) => parseInt(String(l).split(":")[1] ?? "0", 16);
const has = (list, m) => list.some((l) => msg(l) === m);
const count = (list, m) => list.filter((l) => msg(l) === m).length;

const S = slice("single");
const D = slice("double");
const R = slice("right");
const G = slice("rightdrag");
console.log(`single    : ${S.join(" ")}`);
console.log(`double    : ${D.join(" ")}`);
console.log(`right     : ${R.join(" ")}`);
console.log(`rightdrag : ${G.join(" ")}`);

const moves = G.filter((l) => msg(l) === "0200");
const pressIdx = G.map(msg).indexOf("0204");
const heldMoves = moves.filter((l) => G.indexOf(l) > pressIdx);
const ups = G.filter((l) => msg(l) === "0205");
const checks = [
  ["single click sends WM_LBUTTONDOWN (0x0201)", has(S, "0201")],
  ["single click sends WM_LBUTTONUP (0x0202)", has(S, "0202")],
  ["single click sends NO WM_LBUTTONDBLCLK", !has(S, "0203")],
  ["double click sends WM_LBUTTONDOWN (0x0201)", has(D, "0201")],
  ["double click raises WM_LBUTTONDBLCLK (0x0203) — the fix", count(D, "0203") === 1],
  ["double click releases after the DBLCLK", D.map(msg).indexOf("0203") < D.map(msg).lastIndexOf("0202")],
  ["right click sends WM_RBUTTONDOWN (0x0204)", has(R, "0204")],
  ["right click sends WM_RBUTTONUP (0x0205)", has(R, "0205")],
  ["right click sends no left-button messages", !has(R, "0201") && !has(R, "0202")],
  ["right click is understood as a right click (WM_CONTEXTMENU 0x007B)", has(R, "007B")],
  ["right drag presses the button before any held move", pressIdx >= 0 && heldMoves.length >= 4],
  ["right drag carries the held button through the moves (wParam has MK_RBUTTON)", heldMoves.every((l) => (wp(l) & 2) === 2)],
  ["right drag ends with WM_RBUTTONUP, button no longer held", ups.length >= 1 && wp(ups[ups.length - 1]) === 0],
  ["right drag never uses the left button", !has(G, "0201")],
];
let fail = 0;
for (const [what, ok] of checks) {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) fail++;
}
// Informational: .NET's own Click/DoubleClick events do not fire for a Form whose
// message pump is a DoEvents loop from a scriptblock handler. The messages are what is
// under test — a CEF/Qt widget waits for exactly those.
console.log(`  note: toolkit events seen in log: ${["Click", "DoubleClick"].filter((e) => lines.includes(e)).join(", ") || "none (DoEvents pump does not route them)"}`);
console.log(`  reply styles: single=${single?.style} double=${dbl?.style} right=${right?.style} rightdrag=${rdrag?.style}`);

child.kill();
console.log(fail ? `\n${fail} check(s) FAILED` : "\nall checks passed");
process.exit(fail ? 1 : 0);
