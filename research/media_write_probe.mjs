// Live probe for the Media-page writer, over the real MCP stdio interface.
//
// The question a unit test cannot answer: does a write against a file *Studio actually owns* come out
// as one changed line, and does the backup restore it byte-for-byte? So this drives the tool the way
// a caller does, then checks the file against its own backup and puts the original back.
//
// Usage: node research/media_write_probe.mjs ["<media path>"]
//        With no argument it takes the media path recorded in the fixture provenance.
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, rmSync } from "node:fs";

const prov = JSON.parse(readFileSync("tests/fixtures/insprj-fixtures.json", "utf8"));
const media = process.argv[2] ?? prov.fixtures["media-project-json.insprj"].mediaId;

function call(name, args) {
  const messages = [
    { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "media-write-probe", version: "1" } } },
    { jsonrpc: "2.0", method: "notifications/initialized" },
    { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name, arguments: args } },
  ];
  const r = spawnSync("node", ["src/server.mjs"], { input: messages.map((m) => JSON.stringify(m)).join("\n") + "\n", encoding: "utf8", timeout: 120000 });
  const replies = r.stdout.split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const reply = replies.find((x) => x.id === 2);
  if (!reply) throw new Error(`no reply for ${name}: ${r.stdout.slice(0, 400)} ${r.stderr.slice(0, 400)}`);
  return JSON.parse(reply.result.content[0].text);
}

const log = (...a) => console.log(...a);
log(`media: ${media}\n`);

// 1. the lookup the caller does first
const found = call("studio_media_read", { media, findOnly: true });
// `findOnly` returns the raw lookup (`matches`); a read returns the mapped form (`candidates`).
const candidates = found.lookup?.candidates ?? found.lookup?.matches ?? [];
log("lookup:", JSON.stringify(candidates.map((c) => ({ path: c.path, match: c.match }))));
if (!candidates.length) {
  log(`no candidate found for ${media} -- pass a media path that exists on this machine.`);
  process.exit(0);
}

const file = candidates[0].path;
const before = readFileSync(file, "utf8");

// 2. a dry run must name the change and leave the file alone
const dry = call("studio_media_write", { file, changes: { colour: { colorAdjustExposure: 40 } }, dryRun: true });
log("dryRun:", JSON.stringify({ ok: dry.ok, wouldChange: dry.wouldChange, written: dry.written }));
if (readFileSync(file, "utf8") !== before) throw new Error("the dry run changed the file");

// 3. the real write
let wrote = call("studio_media_write", { file, changes: { colour: { colorAdjustExposure: 40 } } });
log("write:", JSON.stringify({ ok: wrote.ok, changed: wrote.changed, unchanged: wrote.unchanged, backup: wrote.backup, note: wrote.note }));
if (!wrote.ok && /Studio is running/.test(wrote.note ?? "")) {
  // Studio holds the file in memory, so the tool refuses -- correctly. The write path itself is then
  // exercised on a *copy* of the same real bytes in a scratch directory: same file, same layout,
  // nothing of the user's at stake.
  const { mkdtempSync, writeFileSync } = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const scratch = mkdtempSync(path.join(os.tmpdir(), "insprj-probe-"));
  const copy = path.join(scratch, "footage_project.insprj");
  writeFileSync(copy, before);
  log(`\n  → repeating on a copy of the same bytes: ${copy} (force, since the gate is about Studio, not the path)`);
  wrote = call("studio_media_write", { file: copy, changes: { colour: { colorAdjustExposure: 40 } }, force: true });
  log("write (copy):", JSON.stringify({ ok: wrote.ok, changed: wrote.changed, unchanged: wrote.unchanged, backup: wrote.backup, note: wrote.note }));
  if (!wrote.ok) process.exit(1);
  // Verify the copy, then report against the real file's path for the remaining checks.
  const copyAfter = readFileSync(copy, "utf8");
  const ca = before.split("\n");
  const cb = copyAfter.split("\n");
  const copyMoved = ca.map((line, i) => (line === cb[i] ? null : i + 1)).filter(Boolean);
  log(`  copy lines moved: ${JSON.stringify(copyMoved)} (${ca.length} lines)`);
  log(`  was: ${ca[copyMoved[0] - 1].trim()}  →  now: ${cb[copyMoved[0] - 1].trim()}`);
  if (copyMoved.length !== 1) throw new Error(`expected exactly one changed line, got ${copyMoved.length}`);
  if (readFileSync(`${copy}.bak`, "utf8") !== before) throw new Error("the backup does not hold the original bytes");
  // A second write on the copy must land without disturbing anything else.
  const twice = call("studio_media_write", { file: copy, changes: { audio: { currentVolume: 90 } }, force: true });
  log(`  second write on the copy: ${JSON.stringify({ ok: twice.ok, changed: twice.changed })}`);
  const c2 = readFileSync(copy, "utf8").split("\n");
  const moved2 = ca.map((line, i) => (line === c2[i] ? null : i + 1)).filter(Boolean);
  log(`  after both writes: ${moved2.length} line(s) differ from the original: ${JSON.stringify(moved2)}`);
  if (moved2.length !== 2) throw new Error("the two writes should have moved exactly two lines");
  log(`\nthe real file was never touched: ${readFileSync(file, "utf8") === before}`);
  process.exit(0);
}
if (!wrote.ok) {
  log("\nthe write was refused -- that is the tool's answer, not a probe failure. reason above.");
  process.exit(0);
}

// 4. the file must differ from its backup on exactly one line, and only there
const after = readFileSync(file, "utf8");
const backup = readFileSync(`${file}.bak`, "utf8");
if (backup !== before) throw new Error("the backup does not hold the original bytes");
const a = before.split("\n");
const b = after.split("\n");
const moved = a.map((line, i) => (line === b[i] ? null : i + 1)).filter(Boolean);
log(`\nlines: ${a.length} -> ${b.length}; moved: ${JSON.stringify(moved)}`);
log(`line ${moved[0]} was: ${a[moved[0] - 1].trim()}`);
log(`line ${moved[0]} now: ${b[moved[0] - 1].trim()}`);
if (moved.length !== 1) throw new Error(`expected exactly one changed line, got ${moved.length}`);

// 5. a second write must land on top of the first without disturbing anything else
const twice = call("studio_media_write", { file, changes: { audio: { currentVolume: 90 } } });
log(`second write: ${JSON.stringify({ ok: twice.ok, changed: twice.changed })}`);
const twiceAfter = readFileSync(file, "utf8");
const c = twiceAfter.split("\n");
const moved2 = a.map((line, i) => (line === c[i] ? null : i + 1)).filter(Boolean);
log(`after both writes: ${moved2.length} line(s) differ from the original: ${JSON.stringify(moved2)}`);
if (moved2.length !== 2) throw new Error("the two writes should have moved exactly two lines");

// 6. put the original back, so the probe leaves no trace
call("studio_media_write", { file, changes: { colour: { colorAdjustExposure: 23 }, audio: { currentVolume: 100 } } });
const restored = readFileSync(file, "utf8");
const same = restored === before;
log(`\nrestored to the original bytes: ${same}`);
if (same && existsSync(`${file}.bak`)) {
  rmSync(`${file}.bak`);
  log("backup removed (the file is back as it was)");
}
log(`diff vs original after restore: ${restored === before ? "none" : "STILL DIFFERENT -- inspect by hand"}`);
