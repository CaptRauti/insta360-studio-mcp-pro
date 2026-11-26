/**
 * Verify an export against the export dialog's readback.
 *
 * The readback alone is not evidence. Measured on 6.0.9: a row can read `25.00`
 * while the encoder would have written 50 (that is exactly the `Rahmen` trap), and
 * the two ProRes variants are indistinguishable in the panel — `ProRes 422` reads
 * the same as `ProRes 422LT`. The produced file is the only witness, so
 * `runExport({ verify: true })` probes it with ffprobe and compares.
 *
 * `compareExport` and the two label parsers are pure (settings + probe in, checks
 * out), so the logic is unit tested without Studio, ffprobe or a file on disk.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const RATE_TOLERANCE = 0.02;

/**
 * The bundled ffprobe, so a probe does not depend on the server process's PATH.
 * Falls back to the PATH entry (both were 9.0.1 here — measured).
 */
const DEFAULT_FFPROBE = [
  path.join(os.homedir(), "AppData", "Local", "hermes", "tools", "ffmpeg-9.0.1-win32-x64", "bin", "ffprobe.exe"),
  "ffprobe",
].find((p) => p === "ffprobe" || existsSync(p));

/**
 * The row's value -> a rate, or null.
 *
 * Deliberately strict: only a bare number counts ("25.00", "25,00", "50 fps").
 * A preset label must NOT yield a rate even when it spells one out — the list
 * header reads `Quellbild-Framerate übernehmen - 50.00`, and treating that as a
 * promise of 50 fps would turn "the file is 25 fps" into a passing check on a
 * 50 fps source. A preset means "whatever the source was", which is reported as
 * unverifiable instead.
 */
export function parseRate(label) {
  if (label === null || label === undefined) return null;
  const m = String(label).trim().match(/^(\d+(?:[.,]\d+)?)\s*(?:fps)?$/i);
  if (!m) return null;
  const v = Number(m[1].replace(",", "."));
  return Number.isFinite(v) && v > 0 ? v : null;
}

/**
 * "1080P - 1080 x 1920" -> { width: 1080, height: 1920 }
 *
 * `Benutzerdefiniert` (and any label without a "W x H") returns null: the dialog
 * does not say which resolution that is, so there is nothing to compare.
 */
export function parseResolution(label) {
  const m = String(label ?? "").match(/(\d{2,5})\s*[x×]\s*(\d{2,5})/);
  if (!m) return null;
  return { width: Number(m[1]), height: Number(m[2]) };
}

/**
 * The dialog's `Kodierung` -> what the file must show.
 *
 * The ProRes tag is the reason this module exists: `ProRes 422` and `ProRes 422LT`
 * both render as `ProRes` in the panel, but the file's codec tag separates them
 * (`apcn` vs `apcs`) — which is how the sweep's "the panel cannot tell the two
 * variants apart" got a second witness.
 */
export function expectedCodec(label) {
  const s = String(label ?? "").trim();
  if (!s) return null;
  if (/h\.?\s*265|hevc/i.test(s)) return { codec: "hevc", ext: ".mp4", name: "H.265" };
  if (/h\.?\s*264/i.test(s)) return { codec: "h264", ext: ".mp4", name: "H.264" };
  if (/prores/i.test(s)) {
    const tag = /lt/i.test(s) ? "apcs" : "apcn";
    return { codec: "prores", tag, ext: ".mov", name: /lt/i.test(s) ? "ProRes 422LT" : "ProRes 422" };
  }
  return null;
}

/**
 * Compare a dialog readback with an ffprobe of the produced file.
 *
 * Returns `checks` (things the dialog promised and the file must show),
 * `unverifiable` (things the dialog does not promise in comparable form — say
 * so instead of passing them) and `info` (what the file actually is).
 */
export function compareExport(settings, probe) {
  const s = settings ?? {};
  const checks = [];
  const unverifiable = [];
  if (!probe) {
    return {
      ok: null,
      checks: [],
      unverifiable: [{ name: "probe", reason: "the file could not be probed — nothing to compare" }],
      info: null,
    };
  }

  const rate = parseRate(s.Rahmen);
  if (rate === null) {
    unverifiable.push({
      name: "rate",
      want: s.Rahmen ?? null,
      reason: "the dialog follows the source framerate — the file's rate is whatever the source was",
    });
  } else {
    const got = probe.fps;
    checks.push({
      name: "rate",
      want: `${rate} fps`,
      got: got === null || got === undefined ? null : `${got} fps`,
      ok: got !== null && got !== undefined && Math.abs(got - rate) < RATE_TOLERANCE,
    });
  }

  const res = parseResolution(s.Auflösung);
  if (!res) {
    unverifiable.push({
      name: "resolution",
      want: s.Auflösung ?? null,
      reason: "the dialog does not name a pixel size here (a preset or Benutzerdefiniert)",
    });
  } else {
    checks.push({
      name: "resolution",
      want: `${res.width}x${res.height}`,
      got: `${probe.width}x${probe.height}`,
      ok: probe.width === res.width && probe.height === res.height,
    });
  }

  const want = expectedCodec(s.Kodierung);
  if (!want) {
    unverifiable.push({ name: "codec", want: s.Kodierung ?? null, reason: "no mapping from this label to a codec" });
  } else {
    checks.push({
      name: "codec",
      want: want.name,
      got: probe.codec ?? null,
      ok: probe.codec === want.codec,
    });
    if (want.tag) {
      checks.push({
        name: "codec-tag",
        want: `${want.name} (${want.tag})`,
        got: probe.codecTag ?? null,
        ok: probe.codecTag === want.tag,
      });
    }
    const ext = path.extname(probe.file ?? "").toLowerCase();
    checks.push({
      name: "container",
      want: want.ext,
      got: ext || "(no extension)",
      ok: ext === want.ext,
    });
  }

  unverifiable.push({
    name: "bitrate",
    want: s.Bitrate ?? null,
    reason: "the row offers no number to compare against (a custom rate would need its own field)",
  });

  return {
    ok: checks.length ? checks.every((c) => c.ok) : null,
    checks,
    unverifiable,
    info: {
      file: probe.file,
      codec: probe.codec,
      codecTag: probe.codecTag,
      width: probe.width,
      height: probe.height,
      fps: probe.fps,
      frames: probe.frames,
      duration: probe.duration,
      bitRate: probe.bitRate,
      hasAudio: probe.hasAudio,
    },
  };
}

const EMPTY_PROBE = {
  file: null,
  codec: null,
  codecTag: null,
  width: null,
  height: null,
  fps: null,
  rFps: null,
  frames: null,
  duration: null,
  bitRate: null,
  container: null,
  hasAudio: false,
};

/**
 * ffprobe a produced file into the shape `compareExport` wants.
 *
 * `retries` because a file whose *size* stopped growing can still be held open by
 * the muxer for a moment — the first attempt there fails on a lock, not on the
 * file. Returns null (never throws) when the file cannot be read at all, since a
 * missing probe is a reported unknown, not a crash.
 */
export function probeMedia(file, { ffprobe = DEFAULT_FFPROBE, retries = 2, sleepMs = 700 } = {}) {
  if (!file || !existsSync(file)) return null;
  for (let attempt = 0; ; attempt++) {
    try {
      const raw = execFileSync(
        ffprobe,
        [
          "-v",
          "error",
          "-show_entries",
          "stream=codec_type,codec_name,codec_tag_string,width,height,r_frame_rate,avg_frame_rate,nb_frames,duration,bit_rate",
          "-show_entries",
          "format=format_name,duration,bit_rate",
          "-of",
          "json",
          file,
        ],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], windowsHide: true, timeout: 120000 },
      );
      const info = JSON.parse(raw);
      const streams = info.streams ?? [];
      const v = streams.find((x) => x.codec_type === "video") ?? streams[0];
      if (!v) return { ...EMPTY_PROBE, file };
      const ratio = (r) => {
        const [num, den] = String(r ?? "0/1").split("/").map(Number);
        const val = den ? num / den : NaN;
        return Number.isFinite(val) && val > 0 ? val : null;
      };
      const avg = ratio(v.avg_frame_rate);
      const rFps = ratio(v.r_frame_rate);
      const duration = Number(v.duration ?? info.format?.duration ?? 0) || null;
      const fps = avg ?? rFps;
      // Studio's own frame count tracks duration*fps; fall back to the container's.
      const frames =
        (duration && fps ? Math.round(duration * fps) : null) ?? (v.nb_frames ? Number(v.nb_frames) : null);
      return {
        file,
        codec: v.codec_name ?? null,
        codecTag: v.codec_tag_string && v.codec_tag_string !== "[0][0][0][0]" ? v.codec_tag_string : null,
        width: v.width ?? null,
        height: v.height ?? null,
        fps,
        rFps,
        frames,
        duration,
        bitRate: Number(v.bit_rate ?? info.format?.bit_rate ?? 0) || null,
        container: info.format?.format_name ?? null,
        hasAudio: streams.some((x) => x.codec_type === "audio"),
      };
    } catch {
      if (attempt >= retries) return null;
      // Sync pause (no busy-wait, no async here): the muxer may still hold the file.
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, sleepMs);
    }
  }
}
