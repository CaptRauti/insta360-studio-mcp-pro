// Verify the click helper's message sequence against a window of our own.
//
// The claim to test: a double click must arrive as WM_LBUTTONDBLCLK, because Windows
// raises that message for real mouse input only — two DOWN/UP pairs are two single
// clicks, and a CEF/Qt widget waiting for DBLCLK then does nothing at all. Studio's
// project-library card behaved exactly that way (no offset ever opened it, while a
// single click on a tab beside it switched the page), which is why this exists.
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
 * Click through the helper's -Direct path: the spy window is named explicitly, so the
 * WindowFromPoint lookup (which an always-on-top window defeats) is skipped. That is
 * exactly the variable this probe wants to hold constant — the *message sequence*.
 */
function clickDirect(hwnd, x, y, dbl) {
  const args = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", PS1, "-Action", dbl ? "dblclick" : "click", "-Hwnd", String(hwnd), "-X", String(x), "-Y", String(y), "-Quiet", "-Direct"];
  const out = execFileSync("powershell", args, { encoding: "utf8", timeout: 60000 });
  return JSON.parse(out.trim().split(/\r?\n/).pop());
}

if (!fs.existsSync(SPY)) {
  console.log(`spy not found at ${SPY}`);
  process.exit(1);
}
fs.rmSync(logFile, { force: true });

const child = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", SPY, "-Log", logFile, "-Seconds", "75", "-Title", TITLE], { stdio: "ignore" });
console.log(`spy started (pid ${child.pid}); waiting for its window`);

let up = false;
for (let i = 0; i < 30 && !up; i++) {
  await sleep(1000);
  try {
    const info = windowInfo(TITLE);
    up = !!info?.ok;
  } catch {
    /* not yet */
  }
}
if (!up) {
  child.kill();
  console.log("spy window never appeared");
  process.exit(1);
}
console.log(`spy window up: ${JSON.stringify(windowInfo(TITLE))}`);
const hwnd = windowInfo(TITLE).hwnd;
await sleep(1200);

const single = clickDirect(hwnd, 120, 80, false);
await sleep(900);
fs.appendFileSync(logFile, "# MARK single-end\n");
const dbl = clickDirect(hwnd, 120, 80, true);
await sleep(1200);

const raw = fs.readFileSync(logFile, "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("# click spy"));
const mark = raw.indexOf("# MARK single-end");
const singleMsgs = raw.slice(0, mark);
const doubleMsgs = raw.slice(mark + 1);

console.log(`single click reply : ${JSON.stringify({ ok: single?.ok, style: single?.style, clicked: single?.clicked })}`);
console.log(`double click reply : ${JSON.stringify({ ok: dbl?.ok, style: dbl?.style, clicked: dbl?.clicked })}`);
console.log(`single messages    : ${singleMsgs.join(" ")}`);
console.log(`double messages    : ${doubleMsgs.join(" ")}`);

const count = (list, m) => list.filter((l) => l === m).length;
const checks = [
  ["single click sends WM_LBUTTONDOWN (0x0201)", count(singleMsgs, "0201") >= 1],
  ["single click sends WM_LBUTTONUP (0x0202)", count(singleMsgs, "0202") >= 1],
  ["single click sends NO WM_LBUTTONDBLCLK", count(singleMsgs, "0203") === 0],
  ["double click sends WM_LBUTTONDOWN (0x0201)", count(doubleMsgs, "0201") >= 1],
  ["double click raises WM_LBUTTONDBLCLK (0x0203) — the fix", count(doubleMsgs, "0203") === 1],
  ["double click sends WM_LBUTTONUP after the DBLCLK", doubleMsgs.indexOf("0203") < doubleMsgs.lastIndexOf("0202")],
];
let fail = 0;
for (const [what, ok] of checks) {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) fail++;
}
// Informational: .NET's own DoubleClick event does not fire for a Form whose message
// pump is a DoEvents loop from a scriptblock handler. The message is what is under
// test — a CEF/Qt widget waits for exactly WM_LBUTTONDBLCLK.
console.log(`  note: toolkit event seen in log: ${raw.includes("DoubleClick") ? "yes" : "no (DoEvents pump does not route it)"}`);

child.kill();
console.log(fail ? `\n${fail} check(s) FAILED` : "\nall checks passed");
process.exit(fail ? 1 : 0);
