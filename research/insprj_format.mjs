// Measures how Studio formats a Studio-6 JSON `.insprj`, so a writer can reproduce the file
// byte-for-byte apart from the fields it actually changes.
//
// The question this answers: `JSON.parse` → `JSON.stringify(doc, null, ind)` is *not* a round trip
// on Studio's files, so a writer that assumed a plain re-serialise would reformat the whole file —
// and reformatting is a diff on every field, which is exactly what a careful writer must not cause.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { mediaProjectRoots } from "../src/insprj.mjs";
import { serialiseStudioJson } from "../src/insprj-serialise.mjs";

const INDENTS = [
  ["1-space", 1],
  ["2-space", 2],
  ["4-space", 4],
  ["tab", "\t"],
];

const stats = {
  json: 0,
  byIndent: { "1-space": 0, "2-space": 0, "4-space": 0, tab: 0, none: 0 },
  trailingNewline: 0,
  crlf: 0,
  exact: 0,
  studioStyle: 0,
  examples: [],
  studioStyleExamples: [],
};

function firstDiff(raw, out) {
  const a = raw.split("\n");
  const b = out.split("\n");
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) return { line: i + 1, file: a[i], ours: b[i] };
  }
  return null;
}

function walk(dir, depth = 0) {
  if (depth > 4) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p, depth + 1);
      continue;
    }
    if (!entry.name.toLowerCase().endsWith(".insprj")) continue;
    const raw = readFileSync(p, "utf8");
    if (!raw.trimStart().startsWith("{")) continue; // XML era — separate question
    stats.json++;
    const nl = raw.endsWith("\n") ? "\n" : "";
    if (nl) stats.trailingNewline++;
    if (raw.includes("\r\n")) stats.crlf++;
    let matched = null;
    for (const [label, ind] of INDENTS) {
      const out = JSON.stringify(JSON.parse(raw), null, ind) + nl;
      if (out === raw) {
        matched = label;
        break;
      }
    }
    if (matched === null) {
      const out = JSON.stringify(JSON.parse(raw), null, 4) + nl;
      stats.byIndent.none++;
      if (stats.examples.length < 3) {
        stats.examples.push({ file: p, rawLen: raw.length, outLen: out.length, diff: firstDiff(raw, out) });
      }
    } else {
      stats.byIndent[matched]++;
      stats.exact++;
    }

    // The decisive check: our reproduction of Studio's own layout must be a byte-identity.
    if (serialiseStudioJson(JSON.parse(raw)) === raw) {
      stats.studioStyle++;
    } else if (stats.studioStyleExamples.length < 3) {
      const out = serialiseStudioJson(JSON.parse(raw));
      stats.studioStyleExamples.push({ file: p, rawLen: raw.length, outLen: out.length, diff: firstDiff(raw, out) });
    }
  }
}

for (const root of mediaProjectRoots()) walk(root.dir);

console.log(JSON.stringify(stats, null, 2));
