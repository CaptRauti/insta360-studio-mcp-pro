// Studio's encrypted log containers — decrypted.
//
// Studio writes its real logs (main / export / thumbnail / quick_look) as an
// opaque container. Until now this server could only report "encrypted"; the
// signal inside was unreachable, including the lines that name what Studio was
// doing when it hung on "Lade Dateien…".
//
// The container (measured 2026-11-24, Studio 6.0.9):
//
//   [16 B header  cd013a985f5beca1bcc1ca036aa5d1a0]
//   [50 B container metadata]
//   repeated: [4 B little-endian payload length][4 B magic bf08ac29][payload]
//
// and the payload is
//
//   payload[i] = plaintext[i] XOR KEYSTREAM[i]
//
// where i counts from the start of *this frame's payload* — the stream restarts
// with every frame. The stream is not per-process random and not per-file:
// every log on this install, across every session, decrypts with one and the
// same 2102-byte keystream, because the same payload offset always yields the
// same key byte. That is what makes this tractable at all: the key can be
// recovered statistically from the ciphertext alone, and re-used forever.
//
// The payload itself is `message + "\n" + 4 trailer bytes`, padded with raw
// NULs to the container's frame length.
//
// How the keystream was recovered (see research/studio_log_decrypt.py in the
// skill insta360-log-decrypt): the crash/lag dumps next to the logs embed the
// same log lines *in clear text*, which gave ground truth for the first ~240
// bytes; the rest fell out of a unigram frequency score plus a bigram
// refinement over 200k frames. Result: 0.23 % of message bytes outside the
// text alphabet, content fully readable.
//
// The keystream is a function of the Studio build. It is therefore *verified*
// against the file name (pid + start time) on every read rather than trusted:
// if Studio updates and the schedule changes, verification fails and callers
// fall back to reporting encryption instead of printing mojibake. A log reader
// that lies is worse than one that says it cannot read.

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/**
 * Recovered keystream, base64. One byte per *payload* offset — the stream
 * restarts at every frame. Covers the offsets every observed frame reaches;
 * frames longer than this decrypt only up to the last covered offset (the tail
 * is trimmed rather than shown as garbage).
 */
export const KEYSTREAM = Buffer.from(
  readFileSync(path.join(HERE, "data", "log-keystream.b64"), "utf8").trim(),
  "base64",
);

/** Provenance of the shipped keystream — printed by the tools for honesty. */
export const KEYSTREAM_SOURCE = {
  positions: KEYSTREAM.length,
  studioVersion: "6.0.9",
  recovered: "2026-11-24",
  verifiedOn: "46 log files / 202,476 lines, sessions 2026-11-21 … 2026-11-24",
  method: "crash-dump cribs + unigram/bigram scoring (skill insta360-log-decrypt)",
};

/** Bytes between the container header and the first frame. */
const CONTAINER_HEAD_BYTES = 16;
/** Payload-length sanity window when hunting for frames. */
const MIN_FRAME = 4;
const MAX_FRAME = 1 << 20;
/** A decrypted line that looks like Studio's own format: "21 14:36:19.637]  15724 70552 I …" */
const LINE_RE = /^(\d\d) (\d\d):(\d\d):(\d\d)\.(\d\d\d)\]\s+(\d+)\s/;
/** Frame magic inside the container. */
const FRAME_MAGIC_LOCAL = Buffer.from("bf08ac29", "hex");

/**
 * Every frame payload in a container, in file order.
 * Resynchronises byte-by-byte after a bad magic or an implausible length, so a
 * stray bf08ac29 in the metadata cannot desynchronise the whole file.
 */
export function parseFrames(buf, { limit = Infinity, start = CONTAINER_HEAD_BYTES } = {}) {
  const frames = [];
  let pos = start;
  while (pos + 8 <= buf.length && frames.length < limit) {
    const len = buf.readUInt32LE(pos);
    if (!buf.subarray(pos + 4, pos + 8).equals(FRAME_MAGIC_LOCAL) || len < MIN_FRAME || len > MAX_FRAME || pos + 8 + len > buf.length) {
      pos += 1;
      continue;
    }
    frames.push({ offset: pos, payload: buf.subarray(pos + 8, pos + 8 + len) });
    pos += 8 + len;
  }
  return frames;
}

/**
 * Decrypt one frame payload.
 *
 * The payload is `message + "\n" + 4 trailer bytes`, and the container's length
 * field rounds that up, so raw NUL slack follows. The message itself therefore
 * ends at the first "\n" of the decoded body — measured on 202k frames, every
 * one of them carries exactly one, at the end of the message. Trailing NULs and
 * any tail past the last known keystream byte are dropped as well.
 */
export function decodeFrame(payload) {
  const n = Math.min(payload.length, KEYSTREAM.length);
  const out = Buffer.allocUnsafe(n);
  for (let i = 0; i < n; i += 1) out[i] = payload[i] ^ KEYSTREAM[i];
  let end = n;
  while (end > 0 && out[end - 1] === 0) end -= 1;
  let text = out.subarray(0, end).toString("latin1");
  const nl = text.indexOf("\n");
  if (nl >= 0) text = text.slice(0, nl);
  // Fallback for frames that fell outside the keystream window: keep the
  // printable body, never a binary tail.
  return text.replace(/[^\t\x20-\x7e]+$/, "");
}

/** Decrypt every frame of a container into plain lines. */
export function decryptBuffer(buf, { limit = Infinity } = {}) {
  return parseFrames(buf, limit === Infinity ? {} : { limit }).map((f) => decodeFrame(f.payload));
}

/**
 * Does the shipped keystream still match this install? Checked against
 * ground truth that does not depend on the cipher: the file name carries the
 * pid and the start time, and the decrypted first lines must repeat both.
 *
 * @param {Buffer} buf     container bytes
 * @param {string} [file]  log path (or bare name) — "…_2026_11_21_14_36_19_15724.log"
 */
export function verifyKeystream(buf, file = "") {
  const lines = decryptBuffer(buf, { limit: 12 }).filter(Boolean);
  const structured = lines.filter((l) => LINE_RE.test(l));
  // Even one structured line means the stream is doing its job — a wrong key
  // produces garbage, not the log format. The decisive check is below, where
  // the first line must repeat the pid and start time the file name states;
  // requiring more lines here would call a short (but perfectly readable) log
  // encrypted, which is the "cannot see" confusion this exists to prevent.
  if (structured.length < 1) {
    return {
      ok: false,
      reason:
        "encrypted Studio container — the recovered keystream does not reproduce Studio's log " +
        `format on this install (${structured.length}/12 lines structured), so this build's key ` +
        "schedule differs; reporting encryption instead of mojibake",
      lines: [],
    };
  }
  const first = structured[0].match(LINE_RE);
  // The name is "<yyyy>_<mm>_<dd>_<hh>_<mi>_<ss>_<pid>.log" — main, export and
  // thumbnail logs alike. Measured on this install: the first line of all 136
  // containers is written in the very second the session is named, and its pid
  // equals the pid in the name, so both are independent checks on the key.
  const name = String(file);
  const nameTs = name.match(/(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_/);
  if (!nameTs) return { ok: true, reason: null, lines, matched: "format" };
  const [, , , , hh, mm, ss] = nameTs;
  // Group 1 of LINE_RE is the day of month; 2..4 are hh:mm:ss.
  const sameSecond = first[2] === hh && first[3] === mm && first[4] === ss;
  const namePid = (name.match(/_(\d+)\.log$/i) || [])[1];
  const samePid = !namePid || first[6] === namePid;
  if (!sameSecond || !samePid) {
    return {
      ok: false,
      reason:
        "encrypted Studio container — keystream mismatch: first line reports " +
        `pid ${first[6]} at ${first[2]}:${first[3]}:${first[4]}, file name says ` +
        `pid ${namePid ?? "(none)"} at ${hh}:${mm}:${ss}`,
      lines: [],
    };
  }
  return { ok: true, reason: null, lines, matched: namePid ? "pid+timestamp" : "timestamp" };
}

/**
 * Read a container and decrypt it, or explain why not.
 * @returns {{ok: boolean, reason: string|null, lines: string[], frames: number}}
 */
export function decryptLog(buf, { file = "", limit = Infinity } = {}) {
  const check = verifyKeystream(buf, file);
  if (!check.ok) return { ok: false, reason: check.reason, lines: [], frames: 0 };
  const frames = parseFrames(buf);
  const lines = limit === Infinity ? frames.map((f) => decodeFrame(f.payload)) : frames.slice(0, limit).map((f) => decodeFrame(f.payload));
  return { ok: true, reason: null, lines, frames: frames.length };
}
