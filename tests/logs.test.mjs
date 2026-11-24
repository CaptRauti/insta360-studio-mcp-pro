// Tests for the log/dump reader.
//
// These do not touch the real machine: a fixture tree that mirrors the measured
// layout (encrypted main/export/quick_look logs, plain launcher/cef/detector/
// setup logs, lag_reports dumps) is built under the OS temp directory and the
// module is pointed at it with INSTA360_LOCAL_ROOT.
//
// The assertions that matter most are the *refusals*: an encrypted log must be
// reported as encrypted rather than decoded into mojibake, and a `file` path
// outside the Insta360 tree must be rejected outright.

import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

import {
  ENCRYPTED_HEADER,
  FRAME_MAGIC,
  classifyBuffer,
  grepLogs,
  listCrashDumps,
  listLogAreas,
  listSessions,
  logRole,
  readLogTail,
} from "../src/logs.mjs";

const HEADER = Buffer.from("cd013a985f5beca1bcc1ca036aa5d1a0", "hex");
const LAUNCHER = [
  "[2026-11-23 11:51:58.331] [basic_logger] [info] launcher start, launcher version 1.0.0, pid 41768",
  '[2026-11-23 11:51:58.331] [basic_logger] [info] launching studio: C:\\Apps\\Insta360 Studio.exe, args: "--log_dir=C:/log"',
  "[2026-11-23 11:51:58.336] [basic_logger] [info] studio started",
].join("\r\n");

let root; // <tmp>/Insta360
let env;

async function put(rel, data) {
  const file = path.join(root, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
  return file;
}

/** An opaque log: constant 16-byte header, then frame magic + high-entropy filler. */
function encrypted(payloadBytes = 256) {
  const filler = Buffer.alloc(payloadBytes);
  for (let i = 0; i < filler.length; i += 1) filler[i] = (i * 37 + 11) % 256;
  return Buffer.concat([ENCRYPTED_HEADER, Buffer.from([0x78, 0x03, 0xc5, 0x00, 0x00, 0x00]), FRAME_MAGIC, filler]);
}

before(async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), "insta360-logs-"));
  root = path.join(tmp, "Insta360");
  env = { INSTA360_LOCAL_ROOT: root };

  const sess = "2026_11_23_11_51_58_41768";
  await put(`Insta360 Studio/log/studio/${sess}/${sess}.log`, encrypted());
  await put(`Insta360 Studio/log/studio/${sess}/2026_11_23_11_51_58_launcher_41768.log`, LAUNCHER);
  await put(
    `Insta360 Studio/log/studio/${sess}/2026_11_24_09_14_51_cef_31604.log`,
    "[1124/091651.992:ERROR:gpu_init.cc(481)] Passthrough is not supported, GL is disabled, ANGLE is \n",
  );
  await put(`Insta360 Studio/log/studio/${sess}/2026_11_23_11_51_58_export_41768.log`, encrypted(64));

  // No 16-byte header here on purpose: the frame magic alone must be enough.
  await put(
    "Insta360 Studio/log/quick_look/2026_11_21_14_36_28_1848/2026_11_21_14_36_28_1848.log",
    Buffer.concat([Buffer.from([0x00, 0x00, 0x00]), FRAME_MAGIC, Buffer.alloc(96, 0x9c)]),
  );

  await put(
    "Insta360 Studio/log/detector/2026_11_22_15_39_31_39132/2026_11_22_15_39_31main_39132.log",
    [
      "[2026-11-22 15:39:32.013] [basic_logger] [info] UI language: de",
      "[2026-11-22 15:39:35.119] [basic_logger] [info] read app config success",
      "[2026-11-22 15:39:35.119] [basic_logger] [info] detector enable false",
    ].join("\r\n"),
  );

  await put(
    "Insta360 Studio/log/setup/Setup Log 2026-11-23 #001/Setup Log 2026-11-23 #001.log",
    "\uFEFF2026-11-23 11:48:50.029   Log opened. (Time zone: UTC+01:00)\r\n2026-11-23 11:48:50.030   Setup version: Inno Setup version 6.4.1\r\n",
  );

  await put("Insta360 Studio/crashes/lag_reports/9e900587-45d8-4fd0-996b-98707d5832a4.dmp", Buffer.concat([Buffer.from("MDMP"), Buffer.alloc(4096, 0x20)]));
  await put("Insta360 Studio/crashes/settings.dat", Buffer.alloc(40, 1));
  await put("Insta360 Studio/crashes/metadata", Buffer.alloc(0));
  await put("Insta360 Link Controller/crashes/settings.dat", Buffer.alloc(40, 1));
});

after(async () => {
  if (root) await rm(path.dirname(root), { recursive: true, force: true });
});

test("classifies plain, encrypted, empty and binary buffers", () => {
  assert.equal(classifyBuffer(Buffer.from("\uFEFFhello\nworld\n")), "plain");
  assert.equal(classifyBuffer(HEADER), "encrypted");
  assert.equal(classifyBuffer(encrypted()), "encrypted");
  assert.equal(classifyBuffer(Buffer.concat([Buffer.alloc(3), FRAME_MAGIC, Buffer.alloc(64, 0x9c)])), "encrypted");
  assert.equal(classifyBuffer(Buffer.alloc(0)), "empty");
  assert.equal(classifyBuffer(Buffer.from([0x4d, 0x44, 0x4d, 0x50, 0x00, 0x01, 0x02, 0x03])), "binary");
  assert.equal(classifyBuffer(Buffer.from([0xff, 0xfe, 0x41, 0x00, 0x41, 0x00])), "binary");
});

test("reads a log's role from its file name", () => {
  assert.equal(logRole("2026_11_23_11_51_58_launcher_41768.log"), "launcher");
  assert.equal(logRole("2026_11_24_09_14_51_cef_31604.log"), "cef");
  assert.equal(logRole("2026_11_23_11_51_58_export_41768.log"), "export");
  assert.equal(logRole("2026_11_23_11_51_58_thumbnail_41768.log"), "thumbnail");
  assert.equal(logRole("2026_11_23_11_51_58_41768.log"), "main");
  assert.equal(logRole("2026_11_22_15_39_31main_39132.log"), "main");
});

test("summarises every log area with its readable/encrypted split", async () => {
  const areas = await listLogAreas({ env });
  assert.equal(areas.root, path.join(root, "Insta360 Studio", "log"));
  const byName = Object.fromEntries(areas.areas.map((a) => [a.area, a]));
  assert.deepEqual(
    { files: byName.studio.files, readable: byName.studio.readable, encrypted: byName.studio.encrypted },
    { files: 4, readable: 2, encrypted: 2 },
  );
  assert.deepEqual({ files: byName.detector.files, readable: byName.detector.readable }, { files: 1, readable: 1 });
  assert.deepEqual({ files: byName.quick_look.files, encrypted: byName.quick_look.encrypted }, { files: 1, encrypted: 1 });
  assert.deepEqual({ files: byName.setup.files, readable: byName.setup.readable }, { files: 1, readable: 1 });
});

test("lists sessions newest first, naming the readable and the opaque files", async () => {
  const { found, total, sessions } = await listSessions({ env });
  assert.equal(found, true);
  assert.equal(total, 1);
  const [s] = sessions;
  assert.equal(s.session, "2026_11_23_11_51_58_41768");
  assert.equal(s.started, "2026-11-23T11:51:58");
  assert.equal(s.files.length, 4);
  assert.deepEqual(
    s.readable.sort(),
    ["2026_11_23_11_51_58_launcher_41768.log", "2026_11_24_09_14_51_cef_31604.log"],
  );
  assert.deepEqual(
    s.encrypted.sort(),
    ["2026_11_23_11_51_58_41768.log", "2026_11_23_11_51_58_export_41768.log"],
  );
  const launcher = s.files.find((f) => f.role === "launcher");
  assert.match(launcher.preview, /launcher start/);
  const main = s.files.find((f) => f.role === "main");
  assert.equal(main.readable, false);
  assert.match(main.note, /encrypted/);
  assert.equal(main.preview, undefined);
});

test("reads the tail of a plain log and refuses an encrypted one with a reason", async () => {
  const launcher = path.join(root, "Insta360 Studio", "log", "studio", "2026_11_23_11_51_58_41768", "2026_11_23_11_51_58_launcher_41768.log");
  const read = await readLogTail({ file: launcher, lines: 2, env });
  assert.equal(read.readable, true);
  assert.equal(read.lines.length, 2);
  assert.match(read.lines.at(-1), /studio started/);

  const mainLog = path.join(root, "Insta360 Studio", "log", "studio", "2026_11_23_11_51_58_41768", "2026_11_23_11_51_58_41768.log");
  const opaque = await readLogTail({ file: mainLog, env });
  assert.equal(opaque.readable, false);
  assert.equal(opaque.kind, "encrypted");
  assert.match(opaque.reason, /encrypted Studio container/);
  assert.equal(opaque.lines, undefined);

  await assert.rejects(() => readLogTail({ file: mainLog.replace(".log", "_nope.log"), env }), /no such log file/);
});

test("refuses to read outside the Insta360 tree", async () => {
  await assert.rejects(
    () => readLogTail({ file: path.join(os.tmpdir(), "definitely-not-a-log.log"), env }),
    /refusing to read outside/,
  );
  await assert.rejects(
    () => readLogTail({ file: path.join(root, "Insta360 Studio", "..", "..", "..", "win.ini"), env }),
    /refusing to read outside/,
  );
});

test("greps the readable logs and reports how many opaque files it had to skip", async () => {
  const hit = await grepLogs({ env, pattern: "launch", days: 3650 });
  assert.ok(hit.matches.length >= 1);
  assert.equal(hit.skippedEncryptedFiles, 3);
  assert.equal(hit.scannedFiles, 4);
  const first = hit.matches[0];
  assert.match(first.file, /launcher_41768\.log$/);
  assert.equal(first.line, 1);
  assert.match(first.text, /launcher start/);

  const config = await grepLogs({ env, pattern: "detector enable", days: 3650, areas: ["detector"] });
  assert.equal(config.areas.join(), "detector");
  assert.equal(config.matches.length, 1);
  assert.match(config.matches[0].text, /detector enable false/);

  // An old window excludes everything, which is how callers scope to "this run".
  const none = await grepLogs({ env, pattern: "launch", days: 0 });
  assert.equal(none.matches.length, 0);
});

test("lists crash dumps, flags the hang reports, and ignores crashpad bookkeeping", async () => {
  const dumps = await listCrashDumps({ env });
  assert.equal(dumps.found, 1);
  assert.equal(dumps.ignoredBookkeepingFiles, 3);
  const [d] = dumps.dumps;
  assert.equal(d.component, "Insta360 Studio");
  assert.equal(d.kind, "lag (hang)");
  assert.match(d.file, /\.dmp$/);
  assert.ok(d.bytes > 4096);
  assert.ok(Number.isFinite(d.ageHours));
  assert.match(dumps.note, /do not restart Studio/);
});
