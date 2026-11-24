// Ad-hoc probe for §0: reconstruct absolute time from the session directory,
// then print what Studio was doing in the last minutes before each lag report.
// A lag report is written when Studio's UI stops responding — the line right
// before it is the operation it is stuck on.
import { readdirSync, statSync, readFileSync } from "node:fs";
import path from "node:path";
import { decryptBuffer } from "../src/log-decrypt.mjs";
import { studioLogRoot } from "../src/logs.mjs";

const ENC = Buffer.from("cd013a985f5beca1bcc1ca036aa5d1a0", "hex");
const MINUTES_BEFORE = +(process.env.MINUTES_BEFORE ?? 10);

function dirStart(name) {
  const m = name.match(/^(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
}

/** Decrypted lines with absolute timestamps, carrying the date from the start. */
function timeline(file, start) {
  const buf = readFileSync(file);
  if (!buf.subarray(0, 16).equals(ENC)) return null;
  const out = [];
  let dayOffset = 0;
  let prev = -1;
  for (const text of decryptBuffer(buf)) {
    const m = text.match(/^(\d\d) (\d\d):(\d\d):(\d\d)\.(\d\d\d)\]/);
    if (!m) {
      out.push({ when: null, text });
      continue;
    }
    const secs = +m[2] * 3600 + +m[3] * 60 + +m[4];
    if (prev >= 0 && secs < prev - 3600) dayOffset += 1; // midnight rollover
    prev = Math.max(prev, secs);
    const when = new Date(start.getFullYear(), start.getMonth(), start.getDate() + dayOffset, +m[2], +m[3], +m[4], +m[5]);
    out.push({ when, text });
  }
  return out;
}

const crashRoot = path.join(process.env.LOCALAPPDATA, "Insta360", "Insta360 Studio", "crashes", "lag_reports");
const dumps = readdirSync(crashRoot)
  .filter((f) => f.endsWith(".dmp"))
  .map((f) => ({ file: f, when: statSync(path.join(crashRoot, f)).mtime }))
  .sort((a, b) => a.when - b.when);

const studioDir = path.join(studioLogRoot(), "studio");
const sessions = readdirSync(studioDir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => ({ name: e.name, dir: path.join(studioDir, e.name), start: dirStart(e.name) }))
  .filter((s) => s.start)
  .sort((a, b) => a.start - b.start);

for (const d of dumps) {
  const cands = sessions.filter((s) => s.start <= d.when);
  const s = cands[cands.length - 1];
  console.log(`\n${"=".repeat(90)}\nLag-Report ${d.when.toLocaleString("de-DE")}  (${d.file.slice(0, 8)})\n  Session: ${s ? s.name : "KEINE passende Session"}`);
  if (!s) continue;
  const from = new Date(d.when - MINUTES_BEFORE * 60000);
  const all = [];
  for (const f of readdirSync(s.dir)) {
    const L = timeline(path.join(s.dir, f), s.start);
    if (!L) continue;
    for (const l of L) if (l.when && l.when >= from && l.when <= d.when) all.push({ ...l, file: f });
  }
  all.sort((a, b) => a.when - b.when);
  console.log(`  ${all.length} Logzeilen in den ${MINUTES_BEFORE} Minuten davor. Die letzten 25:`);
  for (const l of all.slice(-25)) {
    const tag = l.file.replace(/^\d{4}_\d\d_\d\d_\d\d_\d\d_\d\d_/, "").slice(0, 18).padEnd(18);
    console.log(`   ${l.when.toTimeString().slice(0, 12)} ${tag} ${l.text.replace(/^\d\d \d\d:\d\d:\d\d\.\d\d\d\]\s+/, "").slice(0, 110)}`);
  }
}
