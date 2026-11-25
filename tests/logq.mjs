// logq.mjs <ISO> <minutes> [regex] — pull Studio's decrypted log around a point in time.
//
// Studio's .log files are frame-encrypted; the server decrypts them (src/log-decrypt.mjs),
// so this only has to ask for a window and filter. Line objects look like
// { time, pid, tid, level, text } — filter on the joined text so both layouts work.
import { execFileSync } from "node:child_process";

const [at, minutes = "5", pattern = ".", ...rest] = process.argv.slice(2);
const re = new RegExp(pattern, rest.includes("--case") ? "" : "i");
const out = execFileSync(
  process.execPath,
  ["tests/mcp-call.mjs", "studio_logs", JSON.stringify({ action: "window", at, minutes: Number(minutes) })],
  { cwd: new URL("..", import.meta.url), encoding: "utf8", maxBuffer: 128 * 1024 * 1024 },
);
const d = JSON.parse(out);
const lines = d.lines ?? [];
console.log(`# ${at} +${minutes}min | ${d.sessions?.length ?? 0} Sessions, ${lines.length}/${d.totalLines} Zeilen`);
for (const l of lines) {
  if (typeof l === "string") {
    if (re.test(l)) console.log(l);
    continue;
  }
  const text = l.text ?? l.line ?? JSON.stringify(l);
  if (re.test(text)) console.log(`${l.time ?? ""} ${l.level ?? ""} ${text}`);
}