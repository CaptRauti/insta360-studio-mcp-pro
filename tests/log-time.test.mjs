// Absolute time out of the session directory, the time-window reader, and the
// lag-report classifier — the trio that turns decrypted logs into an answer to
// "what was Studio doing when it stalled?".
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { KEYSTREAM } from "../src/log-decrypt.mjs";
import { ENCRYPTED_HEADER, classifyLagDump, fileTimeline, readLogWindow, sessionStart } from "../src/logs.mjs";

const FRAME_MAGIC = Buffer.from("bf08ac29", "hex");

/** A container holding exactly these lines, encrypted with the shipped stream. */
function container(pid, lines) {
  const out = [ENCRYPTED_HEADER, Buffer.alloc(34, 0x5a)];
  for (const { hh, mm, ss, ms = "000", text } of lines) {
    const plain = Buffer.from(`23 ${hh}:${mm}:${ss}.${ms}]  ${pid} 70552 I ${text}\n\x00\x00\x00\x00`, "latin1");
    const payload = Buffer.alloc(plain.length);
    for (let k = 0; k < plain.length; k += 1) payload[k] = plain[k] ^ KEYSTREAM[k];
    const head = Buffer.alloc(8);
    head.writeUInt32LE(payload.length, 0);
    head.set(FRAME_MAGIC, 4);
    out.push(head, payload);
  }
  return Buffer.concat(out);
}

const tmp = mkdtempSync(path.join(os.tmpdir(), "insta360-logtime-"));
const root = path.join(tmp, "Insta360");
const env = { INSTA360_LOCAL_ROOT: root };

const LAG_SESSION = "2026_11_23_11_40_24_2508";
const LAG_LINES = [
  { hh: "11", mm: "40", ss: "24", ms: "809", text: "config_service.cpp:0211:  [FUNC:studio::ConfigService::LogSystemInfo]:  Build at: Nov 18 2026" },
  { hh: "11", mm: "41", ss: "02", ms: "100", text: "W PgaRenderThread.cc:0437:  frame render slow, cost total: 365 ms,srcTimeStampMs=0.000 ms," },
  { hh: "11", mm: "41", ss: "05", ms: "200", text: "I ui_lag_worker.cc:0164:  [FUNC:studio::LagMonitorUiWorker::HandleTimeout]:  ui lag dump enable" },
];
const SECOND_SESSION = "2026_11_23_13_49_27_29436";
const SECOND_LINES = [
  { hh: "13", mm: "49", ss: "27", text: "studio_application.cpp:0918:  [FUNC:studio::StudioApplication::CheckPrimary]:  secondary instance, exit" },
];
const MIDNIGHT_SESSION = "2026_11_23_23_59_59_1111";
const MIDNIGHT_LINES = [
  { hh: "23", mm: "59", ss: "59", ms: "900", text: "png_codec.cc:0001:  before midnight" },
  { hh: "00", mm: "00", ss: "01", ms: "100", text: "png_codec.cc:0002:  after midnight" },
];

function putSession(name, lines, pid) {
  const dir = path.join(root, "Insta360 Studio", "log", "studio", name);
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${name}.log`);
  writeFileSync(file, container(pid, lines));
  return file;
}

let dumps;
function putDump(file, at) {
  const dir = path.join(root, "Insta360 Studio", "crashes", "lag_reports");
  mkdirSync(dir, { recursive: true });
  const full = path.join(dir, file);
  writeFileSync(full, Buffer.concat([Buffer.from("MDMP"), Buffer.alloc(64, 0x20)]));
  utimesSync(full, at / 1000, at / 1000);
  return full;
}

dumps = {
  lag: putDump("aaaaaaaa-1111-2222-3333-444444444444.dmp", new Date(2026, 10, 23, 11, 41, 5).getTime()),
  secondary: putDump("bbbbbbbb-1111-2222-3333-444444444444.dmp", new Date(2026, 10, 23, 13, 49, 27).getTime()),
  orphan: putDump("cccccccc-1111-2222-3333-444444444444.dmp", new Date(2020, 0, 1, 8, 0, 0).getTime()),
};
putSession(LAG_SESSION, LAG_LINES, "2508");
putSession(SECOND_SESSION, SECOND_LINES, "29436");
putSession(MIDNIGHT_SESSION, MIDNIGHT_LINES, "1111");

test("reads the start time out of a session directory name", () => {
  const d = sessionStart("2026_11_23_11_40_24_2508");
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 10);
  assert.equal(d.getDate(), 23);
  assert.equal(d.getHours(), 11);
  assert.equal(d.getSeconds(), 24);
  assert.equal(sessionStart("not-a-session"), null);
});

test("gives every line an absolute time, and rolls the day over at midnight", async () => {
  const file = path.join(root, "Insta360 Studio", "log", "studio", MIDNIGHT_SESSION, `${MIDNIGHT_SESSION}.log`);
  const timeline = await fileTimeline(file, sessionStart(MIDNIGHT_SESSION));
  assert.equal(timeline.length, 2);
  assert.equal(timeline[0].when.getDate(), 23);
  assert.equal(timeline[1].when.getDate(), 24, "a clock jump backwards means the session crossed midnight");
  assert.equal(timeline[1].when.getHours(), 0);
});

test("returns the log lines around a moment, found from the time alone", async () => {
  const w = await readLogWindow({ env, at: "2026-11-23T11:41", minutes: 2 });
  assert.equal(w.totalLines, 3);
  assert.deepEqual(w.sessions.map((s) => s.session), [LAG_SESSION], "only the session that contributed lines is named");
  // Local 11:41 is 10:41 UTC in this timezone-less reconstruction.
  assert.match(w.lines[0].when, /^2026-11-23T10:40:24/);
  assert.match(w.lines[2].when, /^2026-11-23T10:41:05/);
  assert.match(w.lines[2].text, /ui lag dump enable/);
  assert.equal(w.truncated, false);
});

test("narrows the window, honours minutes, and can pin a session by name", async () => {
  const narrow = await readLogWindow({ env, at: "2026-11-23T11:41:04", minutes: 0.5 });
  assert.equal(narrow.totalLines, 2, "half a minute drops the line from 11:40:24");
  assert.match(narrow.lines[0].text, /frame render slow/);
  assert.match(narrow.lines[1].text, /HandleTimeout/);

  const pinned = await readLogWindow({ env, session: MIDNIGHT_SESSION, limit: 1 });
  assert.equal(pinned.totalLines, 2);
  assert.equal(pinned.returnedLines, 1);
  assert.equal(pinned.truncated, true);
});

test("refuses a window request that names neither a time nor a session", async () => {
  await assert.rejects(() => readLogWindow({ env }), /at .*or session/i);
});

test("classifies a lag report as a real UI stall, with the slow frame as evidence", async () => {
  const t = await classifyLagDump({ mtime: new Date(2026, 10, 23, 11, 41, 5).toISOString() }, env);
  assert.equal(t.kind, "ui lag");
  assert.equal(t.session, LAG_SESSION);
  assert.equal(t.slowFrame.ms, 365);
  assert.match(t.lastActivityBefore.text, /frame render slow/);
});

test("classifies the second-instance shutdown as harmless, not a hang", async () => {
  const t = await classifyLagDump({ mtime: new Date(2026, 10, 23, 13, 49, 27).toISOString() }, env);
  assert.equal(t.kind, "secondary instance exit");
  assert.match(t.detail, /not a hang/);
});

test("says so plainly when the logs have rotated away", async () => {
  const t = await classifyLagDump({ mtime: new Date(2020, 0, 1, 8, 0, 0).toISOString() }, env);
  assert.equal(t.kind, "unknown");
  assert.equal(t.correlated, false);
  assert.match(t.detail, /rotated away/);
});
