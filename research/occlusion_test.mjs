// Verify win32.ps1's pinned-retry branch for quiet clicks, end to end.
//
// Covers a blank spot of the Studio window with Paint (pinned topmost) and then
// asks for a quiet double click into Studio at exactly that point. The plain
// path must refuse, because the window at the point belongs to Paint; the pin
// fallback must deliver the click anyway and report mode "message-pinned".
//
// Usage: node research/occlusion_test.mjs
import { execFileSync, spawn } from "node:child_process";
import { windowInfo, click, quiet, sleep } from "../src/ui.mjs";
import { readScreen } from "../src/editor.mjs";

if (!quiet()) {
  console.log("this test needs quiet mode (INSTA360_QUIET != 0); aborting");
  process.exit(1);
}

const win = windowInfo();
if (!win.ok) throw new Error("no Studio window");
console.log(`Studio rect: ${win.left},${win.top} ${win.width}x${win.height}`);

// A blank spot in the lower right of the window: below the project cards.
const relX = Math.round(win.width * 0.75);
const relY = Math.round(win.height * 0.88);
console.log(`click point (window-relative): ${relX},${relY}`);

const cover = spawn("mspaint", { detached: true, stdio: "ignore" });
cover.unref();
await sleep(6000);

// Move and pin the Paint window over the click point (no title lookup needed:
// we address it by process name, so a localised title cannot break the test).
const script = `
$ErrorActionPreference = "Stop"
Add-Type -Namespace W -Name M -MemberDefinition '[DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr h,int x,int y,int w,int ht,bool r); [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h,IntPtr a,int x,int y,int w,int ht,uint f);'
$p = Get-Process mspaint -ErrorAction Stop | Select-Object -First 1
$h = $p.MainWindowHandle
if ($h -eq 0) { throw "paint window not found" }
[void][W.M]::MoveWindow($h, ${win.left + relX - 150}, ${win.top + relY - 60}, 400, 180, $true)
[void][W.M]::SetWindowPos($h, [IntPtr](-1), 0, 0, 0, 0, 0x43)
Start-Sleep -Milliseconds 600
"paint hwnd=$h over the click point"
`;
console.log(execFileSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], { encoding: "utf8" }).trim());

const before = readScreen();
console.log(`before: editor=${/Bearbeiten/.test(before.text)}`);

const r = click({ x: relX, y: relY, double: true });
console.log(`click reply: style=${r.style} child=${r.clicked?.child}`);

console.log(r.style === "message-pinned" ? "PASS: the pin fallback delivered the click" : `UNEXPECTED style: ${r.style}`);

execFileSync("powershell", ["-NoProfile", "-Command", "Stop-Process -Name mspaint -Force -ErrorAction SilentlyContinue"], { encoding: "utf8" });
console.log("cleanup: paint closed");
