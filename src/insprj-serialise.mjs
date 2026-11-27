// Studio's JSON writer, reproduced.
//
// A writer for a file another program owns has exactly one job beyond the edit itself: change
// nothing else. `JSON.parse` → `JSON.stringify` fails that job on Studio's `.insprj` files, and the
// reason is not indentation — measured over all 920 Studio-6 files on this machine
// (`research/insprj_format.mjs`), *no* `JSON.stringify` indent reproduces a single one of them.
//
// The difference is that Studio **explodes empty containers**: an empty array is written as
//
//     "bottom_by_category": [
//     ],
//
// where `JSON.stringify` writes `[]` on one line. That one rule accounts for the whole delta
// (14069 → 13951 bytes on the first specimen, growing with nesting depth). Beyond it, the style is
// plain: 4-space indent, a trailing newline, `": "` after a key, ASCII-safe escaping.
//
// So this module is not a formatter of our choosing — it is Studio's own layout, and the round-trip
// test asserts a byte-identity against Studio's files, not a resemblance. A change here that makes
// files come out merely *similar* is a change that reformats 300+ fields when a caller edits one.
const INDENT = "    ";

/** Serialise a parsed `.insprj` exactly as Studio lays it out on disk. */
export function serialiseStudioJson(value) {
  return write(value, 0) + "\n";
}

function write(value, depth) {
  const pad = INDENT.repeat(depth + 1);
  const padEnd = INDENT.repeat(depth);
  if (Array.isArray(value)) {
    if (value.length === 0) return `[\n${padEnd}]`;
    return `[\n${value.map((item) => pad + write(item, depth + 1)).join(",\n")}\n${padEnd}]`;
  }
  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return `{\n${padEnd}}`;
    return `{\n${keys.map((key) => `${pad}${JSON.stringify(key)}: ${write(value[key], depth + 1)}`).join(",\n")}\n${padEnd}}`;
  }
  // JSON.parse never yields undefined, so the null branch is unreachable for our input.
  return JSON.stringify(value) === undefined ? "null" : number(value, JSON.stringify(value));
}

/**
 * Studio pads an exponent to two digits where JavaScript does not: a keyframe's `tilt` is written
 * `8.149072527885437e-09` on disk and `JSON.stringify` renders the same double as `…e-9`. Measured on
 * the one file of 920 where our layout differed at all (`research/insprj_format.mjs`), so this is the
 * last rule of the format rather than a guess.
 */
function number(value, text) {
  if (typeof value !== "number" || !text.includes("e")) return text;
  return text.replace(/e([+-])(\d)$/, "e$10$2");
}

/**
 * Does this file already follow the measured layout? A writer must ask before it rewrites, because
 * a file that does *not* follow it would be reformatted wholesale — every field in the diff — and a
 * version of Studio that writes a different layout would otherwise be silently overwritten in our
 * own style.
 */
export function detectStudioFormat(raw) {
  const text = String(raw);
  if (text.includes("\r\n")) return { ok: false, reason: "CRLF line endings (the 920 measured files all use LF)" };
  let doc;
  try {
    doc = JSON.parse(text);
  } catch (err) {
    return { ok: false, reason: `not valid JSON: ${err.message}` };
  }
  const canonical = serialiseStudioJson(doc);
  if (canonical === text) return { ok: true, doc };
  const a = text.split("\n");
  const b = canonical.split("\n");
  let line = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      line = i + 1;
      break;
    }
  }
  return {
    ok: false,
    doc,
    reason: `layout differs from the measured one (first at line ${line}; ${text.length} vs ${canonical.length} bytes)`,
  };
}
