// The encrypted-log decode, tested against containers built from the shipped
// keystream itself. No fixture files and no real logs needed: the cipher is
// deterministic, so a synthetic container exercises exactly the paths a real
// one does — and if the keystream ever changes, these tests fail loudly.
import test from "node:test";
import assert from "node:assert/strict";
import { KEYSTREAM, KEYSTREAM_SOURCE, decodeFrame, decryptBuffer, decryptLog, parseFrames, verifyKeystream } from "../src/log-decrypt.mjs";
import { ENCRYPTED_HEADER, classifyBuffer, describeLogFile, readLogTail } from "../src/logs.mjs";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const FRAME_MAGIC = Buffer.from("bf08ac29", "hex");

/** Build a container the way Studio lays one out: header, prologue, frames. */
function buildContainer({ pid = "1234", yy = "26", hh = "14", mm = "36", ss = "19", messages = [], prologueJunk = 0, trailer = true, framePad = 0 }) {
  const out = [ENCRYPTED_HEADER, Buffer.alloc(50 - 16, 0x5a)];
  // Optionally plant a false magic in the prologue: the parser must resync.
  if (prologueJunk) out.push(Buffer.concat([Buffer.alloc(prologueJunk, 0x11), FRAME_MAGIC, Buffer.alloc(2, 0x22)]));
  let offset = out.reduce((n, b) => n + b.length, 0);
  for (const [i, msg] of messages.entries()) {
    const body = `${yy} ${hh}:${mm}:${ss}.${String(i).padStart(3, "0")}]  ${pid} 70552 I png_codec.cc:0123:  ${msg}\n`;
    const plain = Buffer.from(body + (trailer ? "\x00\x00\x00\x00" : "") + "\0".repeat(framePad), "latin1");
    const payload = Buffer.alloc(plain.length);
    // The stream restarts with every frame payload: index by payload offset.
    for (let k = 0; k < plain.length; k += 1) payload[k] = plain[k] ^ KEYSTREAM[k];
    const head = Buffer.alloc(8);
    head.writeUInt32LE(payload.length, 0);
    head.set(FRAME_MAGIC, 4);
    out.push(head, payload);
    offset += 8 + payload.length;
  }
  return Buffer.concat(out);
}

const NAME = "2026_11_21_14_36_19_1234.log";
const MSGS = [
  "open F:/Luna/LRV_20261112_051426_001.lrv",
  "PwWorker::ProcessCommands state=2",
  "export job 7 queued",
  "clip 0 report state 1",
];

test("the shipped keystream covers the offsets every observed frame reaches", () => {
  assert.ok(KEYSTREAM.length >= 2102, `keystream too short: ${KEYSTREAM.length}`);
  assert.equal(KEYSTREAM_SOURCE.positions, KEYSTREAM.length);
  assert.match(KEYSTREAM_SOURCE.studioVersion, /^\d+\.\d+\.\d+$/);
});

test("parses frames and ignores a stray magic in the container prologue", () => {
  const buf = buildContainer({ messages: MSGS, prologueJunk: 12 });
  const frames = parseFrames(buf);
  assert.equal(frames.length, MSGS.length);
  for (const f of frames) assert.ok(f.payload.length > 0);
});

test("decodes frames into the exact log lines, dropping the trailer", () => {
  const buf = buildContainer({ messages: MSGS });
  const lines = decryptBuffer(buf);
  assert.equal(lines.length, MSGS.length);
  for (const [i, msg] of MSGS.entries()) {
    assert.equal(lines[i], `26 14:36:19.${String(i).padStart(3, "0")}]  1234 70552 I png_codec.cc:0123:  ${msg}`);
  }
  for (const l of lines) assert.ok(!l.includes("\u0000"), "NUL padding leaked into the line");
});

test("verifies the keystream against pid and start time from the file name", () => {
  const buf = buildContainer({ messages: MSGS });
  assert.equal(verifyKeystream(buf, NAME).ok, true);
  assert.equal(verifyKeystream(buf, NAME).matched, "pid+timestamp");
});

test("refuses a keystream mismatch instead of printing mojibake", () => {
  const buf = buildContainer({ messages: MSGS });
  // Same ciphertext, file name claims another pid and another second.
  const wrongName = verifyKeystream(buf, "2026_11_21_09_00_01_9999.log");
  assert.equal(wrongName.ok, false);
  assert.match(wrongName.reason, /keystream mismatch/);
  assert.match(wrongName.reason, /9999/);
  assert.deepEqual(wrongName.lines, []);
});

test("refuses random bytes: no keystream can invent a log format", () => {
  const junk = Buffer.concat([ENCRYPTED_HEADER, Buffer.alloc(400).map(() => Math.floor(Math.random() * 256))]);
  const r = verifyKeystream(junk, NAME);
  assert.equal(r.ok, false);
  assert.match(r.reason, /does not reproduce Studio's log format/);
});

test("decryptLog reports how many frames it decoded", () => {
  const buf = buildContainer({ messages: MSGS });
  const r = decryptLog(buf, { file: NAME });
  assert.equal(r.ok, true);
  assert.equal(r.frames, MSGS.length);
  assert.equal(r.lines[0].includes("open F:/Luna/LRV_20261112_051426_001.lrv"), true);
});

test("describeLogFile decrypts a container and previews its first real line", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "studio-logs-"));
  const file = path.join(dir, NAME);
  writeFileSync(file, buildContainer({ messages: MSGS }));
  const entry = await describeLogFile(file);
  assert.equal(entry.kind, "encrypted");
  assert.equal(entry.decryptable, true);
  assert.equal(entry.readable, true);
  assert.equal(entry.decrypted, true);
  assert.match(entry.preview, /open F:\/Luna\/LRV_20261112_051426_001\.lrv$/);
});

test("readLogTail returns the decrypted tail, and the plain path is untouched", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "studio-logs-"));
  process.env.INSTA360_LOCAL_ROOT = dir;
  try {
    // assertInsideInsta360 requires the file to live under the Insta360 root.
    const nested = path.join(dir, "Insta360 Studio", "log", "studio", "2026_11_21_14_36_19_1234");
    mkdirSync(nested, { recursive: true });
    const f = path.join(nested, NAME);
    writeFileSync(f, buildContainer({ messages: [...MSGS, ...MSGS] }));
    const tail = await readLogTail({ file: f, lines: 3 });
    assert.equal(tail.kind, "encrypted");
    assert.equal(tail.decrypted, true);
    assert.equal(tail.lines.length, 3);
    assert.equal(tail.totalLines, 8);
    for (const l of tail.lines) assert.match(l, /^\d\d \d\d:\d\d:\d\d\.\d\d\d\]\s+1234\s/);

    const plain = path.join(nested, "2026_11_21_14_36_19_1234.log_plain.log");
    writeFileSync(plain, "hello\nworld");
    const t2 = await readLogTail({ file: plain, lines: 1 });
    assert.equal(t2.decrypted, undefined);
    assert.deepEqual(t2.lines, ["world"]);
  } finally {
    delete process.env.INSTA360_LOCAL_ROOT;
  }
});

test("classifyBuffer still reports the container as encrypted bytes", () => {
  assert.equal(classifyBuffer(buildContainer({ messages: MSGS })), "encrypted");
});
