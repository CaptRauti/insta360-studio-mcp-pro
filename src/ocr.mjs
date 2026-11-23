// OCR for Insta360 Studio screenshots, using the engine built into Windows.
//
// Why this exists: Studio's Qt canvas exposes no UI Automation tree (verified —
// the whole editing surface is one opaque widget), so the MCP server could only
// find controls by their accent colour. This turns a screenshot into words with
// bounding boxes, so a caller can click "Exportieren" by name and land on
// wherever that button currently sits.
//
// Backed by src/ocr.ps1 (Windows.Media.Ocr): no API key, no network, no extra
// install. The German and English recognisers ship with Windows.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, "ocr.ps1");

const PS = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", SCRIPT];

/** Recognised words flattened out of the line structure, in reading order. */
function flatten(lines) {
  const words = [];
  for (const line of lines) {
    for (const w of line.words ?? []) words.push({ ...w, line: line.text });
  }
  return words;
}

/**
 * OCR an image file.
 * @returns {{ok: boolean, lang?: string, width?: number, height?: number,
 *            lines?: Array, words?: Array, error?: string}}
 */
export function ocrImage(file, { lang } = {}) {
  if (!file || !existsSync(file)) return { ok: false, error: `image not found: ${file}` };
  const args = [...PS, "-Image", file];
  if (lang) args.push("-Lang", lang);

  let stdout;
  try {
    stdout = execFileSync("powershell", args, {
      encoding: "utf8",
      timeout: 120000,
      windowsHide: true,
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (err) {
    return { ok: false, error: `ocr.ps1 failed: ${err.message}` };
  }

  let parsed;
  try {
    parsed = JSON.parse(stdout.trim());
  } catch {
    return { ok: false, error: `unparsable OCR output: ${stdout.slice(0, 200)}` };
  }
  if (!parsed.ok) return parsed;

  const lines = parsed.lines ?? [];
  return { ...parsed, lines, words: flatten(lines) };
}

/** Language tags the installed Windows OCR engine can read, e.g. ["de-DE","en-US"]. */
export function ocrLanguages() {
  try {
    const out = execFileSync("powershell", [...PS, "-ListLangs"], {
      encoding: "utf8",
      timeout: 30000,
      windowsHide: true,
    });
    return JSON.parse(out.trim()).available ?? [];
  } catch {
    return [];
  }
}

/**
 * Find text in an OCR result.
 *
 * A needle without spaces matches single words; a needle with spaces matches
 * whole lines first and falls back to words. Matching is case-insensitive
 * substring, because OCR mangles umlauts and the caller should not have to
 * care.
 *
 * Every hit carries the click point (box centre) as x/y plus the raw box.
 */
export function findText(result, needle) {
  const q = String(needle ?? "").trim().toLowerCase();
  if (!q || !result?.words?.length) return [];

  const hits = [];
  const push = (text, box, level) => {
    hits.push({
      text,
      x: Math.round(box.x + box.w / 2),
      y: Math.round(box.y + box.h / 2),
      left: box.x,
      top: box.y,
      width: box.w,
      height: box.h,
      level,
    });
  };

  if (q.includes(" ")) {
    for (const line of result.lines ?? []) {
      const words = line.words ?? [];
      if (!words.length || !String(line.text).toLowerCase().includes(q)) continue;
      const left = Math.min(...words.map((w) => w.x));
      const top = Math.min(...words.map((w) => w.y));
      const right = Math.max(...words.map((w) => w.x + w.w));
      const bottom = Math.max(...words.map((w) => w.y + w.h));
      push(line.text, { x: left, y: top, w: right - left, h: bottom - top }, "line");
    }
    if (hits.length) return hits;
  }

  for (const w of result.words) {
    if (String(w.text).toLowerCase().includes(q)) push(w.text, w, "word");
  }
  return hits;
}

/** Human-readable dump of everything on screen, for diagnostics. */
export function describeOcr(result, { limit = 200 } = {}) {
  if (!result?.ok) return result;
  return {
    lang: result.lang,
    size: { width: result.width, height: result.height },
    lines: (result.lines ?? []).slice(0, limit).map((l) => l.text),
  };
}
