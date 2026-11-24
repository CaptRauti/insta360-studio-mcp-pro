// Watch the running Studio without restarting it: how long does "Lade Dateien"
// persist, is the process burning CPU while it does, and does Studio rewrite its
// media registry (i.e. is it re-scanning the media library rather than hanging)?
import { execSync } from "node:child_process";
import { readScreen } from "../src/editor.mjs";
import { focusWindow } from "../src/ui.mjs";

const argv = process.argv.slice(2);
const MINUTES = Number(argv[argv.indexOf("--minutes") + 1]) || 3;
const STEP = Number(argv[argv.indexOf("--step") + 1]) || 20;

const S = "C:/Users/stefa/AppData/Local/Insta360/Insta360 Studio";
const files = [
  `${S}/workspace/media_card/local/media_cards.json`,
  `${S}/workspace/album/local/local_media_album_info.data`,
  `${S}/workspace/view_state/footage/footage_view_state.json`,
];

const stamp = (p) => {
  try {
    const s = execSync(`powershell -NoProfile -Command "(Get-Item -LiteralPath '${p}').LastWriteTime.ToString('HH:mm:ss')"`, { encoding: "utf8" });
    return s.trim();
  } catch {
    return "?";
  }
};
const cpu = () =>
  execSync(
    `powershell -NoProfile -Command "$p=Get-Process -Name 'Insta360 Studio' -ErrorAction SilentlyContinue|Select-Object -First 1; if($p){'{0:N1} {1:N0}' -f $p.CPU,($p.WorkingSet64/1MB)}else{'gone'}"`,
    { encoding: "utf8" }
  ).trim();

focusWindow({});
const end = Date.now() + MINUTES * 60_000;
let last = null;
let n = 0;
while (Date.now() < end) {
  n++;
  const s = readScreen();
  const loading = (s.text ?? "").match(/Lade Dateien/g)?.length ?? 0;
  const tail = (s.text ?? "").replace(/\s+/g, " ").slice(-150);
  const mt = files.map((f) => `${f.split("/").pop()}@${stamp(f)}`).join(" ");
  console.log(`[${String(n).padStart(2)}] ${new Date().toLocaleTimeString("de-DE")} LadeDateien=${loading} cpu/ws=${cpu()} | ${mt}`);
  if (last === loading) console.log(`     ...unveraendert: ...${tail}`);
  else console.log(`     NEU:       ...${tail}`);
  last = loading;
  await new Promise((r) => setTimeout(r, STEP * 1000));
}
