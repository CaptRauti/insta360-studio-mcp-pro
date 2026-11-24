// Studio's own logs and crash dumps — the only place Studio says *why* something
// went wrong, and until now nothing in this server read it.
//
// What is actually in the tree (measured 2026-11-24, Studio 6.0.9):
//
//   %LOCALAPPDATA%\Insta360\Insta360 Studio\log\
//     studio\<YYYY_MM_DD_HH_MM_SS_pid>\   one directory per Studio start
//         <ts>_<pid>.log            main log          ENCRYPTED (decrypted)
//         <ts>_launcher_<pid>.log   launch line, paths PLAIN
//         <ts>_cef_<pid>.log        Chromium/GL errors PLAIN (tiny)
//         <ts>_export_<pid>.log     exporter           ENCRYPTED (decrypted)
//         <ts>_thumbnail_<pid>.log  thumbnail service  ENCRYPTED (decrypted)
//     detector\<...>\...main_<pid>.log  detector config/GPU state   PLAIN
//     quick_look\<...>            ENCRYPTED (decrypted)
//     setup\Setup Log <date> #NNN\  Inno Setup install history     PLAIN
//
// The encrypted files share a constant 16-byte container header
// (cd013a985f5beca1bcc1ca036aa5d1a0) and carry 0xbf08ac29 frame magic. They are
// readable again: the payload is a file-offset XOR keystream, recovered and
// verified against the file name on every read — see src/log-decrypt.mjs for
// the format and the provenance of the key. Read tools decrypt transparently
// and fall back to reporting encryption if the keystream stops matching (a
// Studio update would do that); they never return mojibake.
//
// The plain siblings still matter — which install ran, what the detector
// decided, which GPU path was refused, whether the update moved Studio under
// you — and now the main log speaks too.
//
// Crash dumps (Windows minidumps) sit next to the logs:
//   Insta360 Studio\crashes\lag_reports\*.dmp   written when Studio *hangs* —
//   the "lag" monitor. A hang is exactly the "Lade Dateien…" symptom, so the
//   dump timestamps are evidence of which runs stalled. Studio's own advice:
//   do not restart the app after a crash, or the dump is lost.

import { existsSync, readdirSync, statSync } from "node:fs";
import { open, readdir, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { KEYSTREAM_SOURCE, decryptLog, verifyKeystream } from "./log-decrypt.mjs";

/** Encrypted-container header shared by every opaque Studio log. */
export const ENCRYPTED_HEADER = Buffer.from("cd013a985f5beca1bcc1ca036aa5d1a0", "hex");
/** Frame magic that appears inside those containers. */
export const FRAME_MAGIC = Buffer.from("bf08ac29", "hex");

/** Readable log areas under log\ (studio/detector/setup/quick_look). */
export const LOG_AREAS = ["studio", "detector", "quick_look", "setup"];
/** Milliseconds we inspect when deciding whether a file is text. */
const SNIFF_BYTES = 512;

/** %LOCALAPPDATA%\Insta360 — the parent of every Studio log tree. */
export function insta360LocalRoot(env = process.env) {
  if (env.INSTA360_LOCAL_ROOT) return env.INSTA360_LOCAL_ROOT;
  const local = env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local");
  return path.join(local, "Insta360");
}

/** log\ root of the Studio component. */
export function studioLogRoot(env = process.env) {
  return path.join(insta360LocalRoot(env), "Insta360 Studio", "log");
}

/** Crash directories worth knowing about, component by component. */
export function crashDirs(env = process.env) {
  const root = insta360LocalRoot(env);
  const out = [];
  let components = [];
  try {
    components = readdirSync(root, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return out;
  }
  for (const comp of components) {
    for (const sub of ["crashes", "crashes_quick_look"]) {
      const dir = path.join(root, comp, sub);
      if (existsSync(dir)) out.push({ component: comp, dir });
    }
  }
  return out;
}

/** Role of a log file, from its name. */
export function logRole(name) {
  if (/_launcher_/.test(name)) return "launcher";
  if (/_cef_/.test(name)) return "cef";
  if (/_export_/.test(name)) return "export";
  if (/_thumbnail_/.test(name)) return "thumbnail";
  if (/^updater_/.test(name)) return "updater";
  return "main";
}

/** True when a log buffer is one of Studio's encrypted containers. */
export function isEncrypted(buf) {
  if (!buf || buf.length < 16) return false;
  if (buf.subarray(0, 16).equals(ENCRYPTED_HEADER)) return true;
  return buf.subarray(0, 128).includes(FRAME_MAGIC);
}

/**
 * Classify a buffer: "empty" | "encrypted" | "plain" | "binary".
 * Encryption is checked first, because valid-looking UTF-8 can fall out of a
 * cipher by accident and *that* is how a log reader starts lying.
 */
export function classifyBuffer(buf) {
  if (!buf || buf.length === 0) return "empty";
  if (isEncrypted(buf)) return "encrypted";
  const head = buf.subarray(0, SNIFF_BYTES);
  if (head.includes(0x00)) return "binary";
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(head);
  } catch {
    return "binary";
  }
  return "plain";
}

async function readHead(file, bytes = SNIFF_BYTES) {
  const fh = await open(file, "r");
  try {
    const buf = Buffer.alloc(bytes);
    const { bytesRead } = await fh.read(buf, 0, bytes, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await fh.close();
  }
}

/** How much of a container we will verify a keystream against (a few dozen frames). */
const VERIFY_BYTES = 8192;
/** Largest container we will decrypt whole. */
export const MAX_CONTAINER_BYTES = 64 * 1024 * 1024;

/**
 * Read a file whole.
 *
 * The stream restarts with every frame payload, so any frame boundary is a
 * valid decryption entry point and a windowed read *would* work. Whole files
 * are read anyway: they are small (a heavy session is a few MB) and one code
 * path is worth more than the saved bytes.
 */
async function readWhole(file, maxBytes = MAX_CONTAINER_BYTES) {
  const st = await stat(file);
  if (st.size > maxBytes) return { buf: null, bytes: st.size, tooLarge: true };
  const fh = await open(file, "r");
  try {
    const buf = Buffer.alloc(st.size);
    if (buf.length) await fh.read(buf, 0, buf.length, 0);
    return { buf, bytes: st.size, tooLarge: false };
  } finally {
    await fh.close();
  }
}

/**
 * Decrypt a container file into plain lines, or say why not.
 * Never returns mojibake: if the keystream does not reproduce the log format
 * and the file name's pid/timestamp, the answer is `ok: false` with a reason.
 */
export async function readDecryptedLog(file, { maxBytes = MAX_CONTAINER_BYTES } = {}) {
  const { buf, bytes, tooLarge } = await readWhole(file, maxBytes);
  if (tooLarge) {
    return {
      file,
      bytes,
      ok: false,
      reason: `container exceeds the ${maxBytes} byte decrypt budget`,
      lines: [],
      frames: 0,
    };
  }
  const r = decryptLog(buf, { file: path.basename(file) });
  return { file, bytes, ok: r.ok, reason: r.reason, lines: r.lines, frames: r.frames, keystream: KEYSTREAM_SOURCE.studioVersion };
}

/** Everything worth knowing about one log file, without reading it whole. */
export async function describeLogFile(file) {
  const st = await stat(file);
  const kind = classifyBuffer(await readHead(file));
  const entry = {
    file: path.basename(file),
    path: file,
    bytes: st.size,
    mtime: st.mtime.toISOString(),
    role: logRole(path.basename(file)),
    kind,
    readable: kind === "plain",
  };
  if (kind === "plain") {
    entry.preview = await firstLine(file);
    return entry;
  }
  if (kind === "encrypted") {
    // Decrypted, and the keystream is checked against ground truth that does
    // not come from the cipher: the file name carries the pid and the start
    // time, and the first log lines must repeat both.
    const check = verifyKeystream(await readHead(file, VERIFY_BYTES), path.basename(file));
    entry.decryptable = check.ok;
    entry.readable = check.ok;
    if (check.ok) {
      entry.decrypted = true;
      entry.keystream = KEYSTREAM_SOURCE.studioVersion;
      const first = check.lines.find((l) => l.trim());
      entry.preview = first ? first.slice(0, 160) : null;
    } else {
      entry.note = `encrypted Studio container (magic bf08ac29) — ${check.reason}`;
    }
    return entry;
  }
  if (kind !== "empty") entry.note = `not a text log (${kind})`;
  return entry;
}

async function firstLine(file) {
  const fh = await open(file, "r");
  try {
    const buf = Buffer.alloc(4096);
    const { bytesRead } = await fh.read(buf, 0, buf.length, 0);
    const text = buf.subarray(0, bytesRead).toString("utf8").replace(/^\uFEFF/, "");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed) return trimmed.slice(0, 160);
    }
    return null;
  } finally {
    await fh.close();
  }
}

async function listFiles(dir) {
  const out = [];
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listFiles(full)));
    else if (e.isFile()) out.push(full);
  }
  return out;
}

/** Sessions in log\studio, newest first, each with its files described. */
export async function listSessions({ env = process.env, area = "studio", limit = 5 } = {}) {
  const root = path.join(studioLogRoot(env), area);
  let names = [];
  try {
    names = (await readdir(root, { withFileTypes: true }))
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return { area, root, found: false, sessions: [] };
  }
  const withTime = [];
  for (const name of names) {
    const dir = path.join(root, name);
    let started = null;
    try {
      // Session directories are named YYYY_MM_DD_HH_MM_SS_pid.
      const m = name.match(/^(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})/);
      if (m) started = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
      else started = (await stat(dir)).mtime.toISOString();
    } catch {
      started = null;
    }
    withTime.push({ name, dir, started });
  }
  withTime.sort((a, b) => String(b.started).localeCompare(String(a.started)));
  const sessions = [];
  for (const s of withTime.slice(0, limit)) {
    const files = [];
    for (const f of (await listFiles(s.dir)).sort()) files.push(await describeLogFile(f));
    sessions.push({
      session: s.name,
      started: s.started,
      dir: s.dir,
      files,
      readable: files.filter((f) => f.readable).map((f) => f.file),
      encrypted: files.filter((f) => f.kind === "encrypted").map((f) => f.file),
      decryptable: files.filter((f) => f.decryptable).map((f) => f.file),
    });
  }
  return { area, root, found: true, total: withTime.length, sessions };
}

/** Summary of every log area: how much is readable, how much is opaque. */
export async function listLogAreas({ env = process.env } = {}) {
  const root = studioLogRoot(env);
  const areas = [];
  for (const area of LOG_AREAS) {
    const dir = path.join(root, area);
    if (!existsSync(dir)) {
      areas.push({ area, present: false });
      continue;
    }
    const files = await listFiles(dir);
    let plain = 0;
    let encrypted = 0;
    let decryptable = 0;
    let binary = 0;
    let bytes = 0;
    let newest = null;
    for (const f of files) {
      const st = await stat(f);
      bytes += st.size;
      if (!newest || st.mtime > newest) newest = st.mtime;
      const head = await readHead(f, VERIFY_BYTES);
      const kind = classifyBuffer(head);
      if (kind === "plain") plain += 1;
      else if (kind === "encrypted") {
        encrypted += 1;
        if (verifyKeystream(head, path.basename(f)).ok) decryptable += 1;
      } else if (kind === "binary") binary += 1;
    }
    areas.push({
      area,
      present: true,
      dir,
      files: files.length,
      readable: plain,
      encrypted,
      decryptable,
      binary,
      bytes,
      newest: newest ? newest.toISOString() : null,
    });
  }
  return { root, rootExists: existsSync(root), keystream: KEYSTREAM_SOURCE, areas };
}

/**
 * Guard for every read: a log path must live inside the Insta360 root.
 * Without it, a `file` argument would turn these tools into an arbitrary
 * file reader.
 */
export function assertInsideInsta360(file, env = process.env) {
  const root = path.resolve(insta360LocalRoot(env));
  const resolved = path.resolve(file);
  const rel = path.relative(root, resolved);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`refusing to read outside ${root}: ${resolved}`);
  }
  return resolved;
}

/**
 * Read the tail of a log file.
 *
 * Encrypted containers are decrypted and the tail of the decrypted lines is
 * returned. If the keystream no longer matches this install, the refusal is
 * explicit rather than mojibake.
 */
export async function readLogTail({ file, lines = 200, maxBytes = 262144, env = process.env } = {}) {
  if (!file) throw new Error("file is required");
  file = assertInsideInsta360(file, env);
  if (!existsSync(file)) throw new Error(`no such log file: ${file}`);
  const st = await stat(file);
  const kind = classifyBuffer(await readHead(file));
  if (kind === "encrypted") {
    const r = await readDecryptedLog(file);
    if (!r.ok) {
      return {
        file,
        bytes: st.size,
        kind,
        readable: false,
        decrypted: false,
        reason: r.reason,
      };
    }
    return {
      file,
      bytes: st.size,
      kind,
      readable: true,
      decrypted: true,
      frames: r.frames,
      keystream: r.keystream,
      returnedLines: Math.min(lines, r.lines.length),
      totalLines: r.lines.length,
      truncatedHead: r.lines.length > lines,
      lines: r.lines.slice(-lines),
    };
  }
  const fh = await open(file, "r");
  try {
    const start = Math.max(0, st.size - maxBytes);
    const buf = Buffer.alloc(st.size - start);
    if (buf.length) await fh.read(buf, 0, buf.length, start);
    if (kind !== "plain") {
      return {
        file,
        bytes: st.size,
        kind,
        readable: false,
        reason: `not a text log (${kind})`,
        truncatedHead: start > 0,
      };
    }
    const text = buf.toString("utf8").replace(/^\uFEFF/, "");
    const all = text.split(/\r?\n/);
    return {
      file,
      bytes: st.size,
      kind,
      readable: true,
      returnedLines: Math.min(lines, all.length),
      totalLinesInWindow: all.length,
      truncatedHead: start > 0,
      lines: all.slice(-lines),
    };
  } finally {
    await fh.close();
  }
}

/**
 * Grep the logs, newest files first.
 *
 * Both kinds are searched: plain files as they lie on disk, encrypted
 * containers by decrypting them first (verified against the file name, skipped
 * if the keystream no longer matches). Pass `decrypt: false` to search only
 * what is readable without the keystream.
 */
export async function grepLogs({ env = process.env, pattern, days = 7, areas, limit = 100, decrypt = true, decryptBudgetBytes = 32 * 1024 * 1024 } = {}) {
  if (!pattern) throw new Error("pattern is required");
  let re;
  try {
    re = new RegExp(pattern, "i");
  } catch (err) {
    throw new Error(`pattern is not a valid regular expression: ${err.message}`);
  }
  const since = Date.now() - days * 86400000;
  const wanted = areas?.length ? areas.filter((a) => LOG_AREAS.includes(a)) : LOG_AREAS;
  const matches = [];
  let scanned = 0;
  let skippedEncrypted = 0;
  let decryptedFiles = 0;
  for (const area of wanted) {
    const dir = path.join(studioLogRoot(env), area);
    if (!existsSync(dir)) continue;
    for (const file of await listFiles(dir)) {
      const st = await stat(file);
      if (st.mtimeMs < since) continue;
      const kind = classifyBuffer(await readHead(file));
      let lines;
      let viaDecrypt = false;
      if (kind === "plain") {
        lines = (await readWholeText(file)).split(/\r?\n/);
      } else if (kind === "encrypted" && decrypt) {
        const r = await readDecryptedLog(file, { maxBytes: decryptBudgetBytes });
        if (!r.ok) {
          skippedEncrypted += 1;
          continue;
        }
        decryptedFiles += 1;
        viaDecrypt = true;
        lines = r.lines;
      } else {
        skippedEncrypted += 1;
        continue;
      }
      scanned += 1;
      lines.forEach((line, i) => {
        if (matches.length < limit && re.test(line)) {
          matches.push({ area, file, line: i + 1, text: line.trim().slice(0, 400), ...(viaDecrypt ? { decrypted: true } : {}) });
        }
      });
    }
  }
  return {
    pattern,
    days,
    areas: wanted,
    scannedFiles: scanned,
    decryptedFiles,
    skippedEncryptedFiles: skippedEncrypted,
    keystream: decrypt ? KEYSTREAM_SOURCE : null,
    matches,
    truncated: matches.length >= limit,
  };
}

async function readWholeText(file) {
  const fh = await open(file, "r");
  try {
    const st = await fh.stat();
    const buf = Buffer.alloc(Math.min(st.size, 8 * 1024 * 1024));
    if (buf.length) await fh.read(buf, 0, buf.length, 0);
    return buf.toString("utf8").replace(/^\uFEFF/, "");
  } finally {
    await fh.close();
  }
}

/**
 * Crash dumps and their timestamps. `lag_reports` are the interesting ones:
 * Studio writes them when it *hangs*, which is the failure mode we keep
 * chasing. settings.dat / metadata files are crashpad bookkeeping, not dumps.
 */
export async function listCrashDumps({ env = process.env, components, limit = 40 } = {}) {
  const dumps = [];
  let noise = 0;
  for (const { component, dir } of crashDirs(env)) {
    if (components?.length && !components.includes(component)) continue;
    for (const file of await listFiles(dir)) {
      const base = path.basename(file);
      const st = await stat(file);
      if (!/\.dmp$/i.test(base)) {
        noise += 1;
        continue;
      }
      const rel = path.relative(path.join(insta360LocalRoot(env), component), file);
      const kind = rel.split(path.sep)[1] === "lag_reports" ? "lag (hang)" : "crash report";
      dumps.push({
        component,
        kind,
        file: base,
        path: file,
        bytes: st.size,
        mtime: st.mtime.toISOString(),
        ageHours: Number(((Date.now() - st.mtimeMs) / 3600000).toFixed(1)),
      });
    }
  }
  dumps.sort((a, b) => String(b.mtime).localeCompare(String(a.mtime)));
  return {
    root: insta360LocalRoot(env),
    found: dumps.length,
    newest: dumps[0]?.mtime ?? null,
    note:
      "lag_reports are written when Studio hangs (the 'Lade Dateien…' symptom). " +
      "After a crash, do not restart Studio before copying the dump — Studio rotates them.",
    dumps: dumps.slice(0, limit),
    ignoredBookkeepingFiles: noise,
  };
}
