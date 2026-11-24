// Structural differential between two .insproj files.
//
//   node research/proj_diff.mjs <reference.insproj> <candidate.insproj> [maxRows]
//
// §0 of the backlog asks why a project this server builds will not export while
// one Studio wrote does. The two files are JSON, so the honest instrument is a
// field-by-field walk: which paths exist on only one side, and which differ.
import { readFileSync } from "node:fs";

const [refPath, candPath, maxRows = "120"] = process.argv.slice(2);
if (!refPath || !candPath) {
  console.error("usage: node research/proj_diff.mjs <reference.insproj> <candidate.insproj> [maxRows]");
  process.exit(2);
}

const flatten = (value, prefix = "", out = new Map()) => {
  if (Array.isArray(value)) {
    out.set(`${prefix}[]`, `array(${value.length})`);
    // Arrays of objects are aligned by index, which is how Studio's own
    // project files (clips, segments) are laid out.
    value.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
  } else if (value && typeof value === "object") {
    if (prefix) out.set(prefix, `object(${Object.keys(value).length})`);
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else {
    out.set(prefix, value);
  }
  return out;
};

const load = (p) => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    console.error(`cannot parse ${p}: ${e.message}`);
    process.exit(2);
  }
};

const ref = flatten(load(refPath));
const cand = flatten(load(candPath));

const onlyRef = [...ref.keys()].filter((k) => !cand.has(k));
const onlyCand = [...cand.keys()].filter((k) => !ref.has(k));
const shared = [...ref.keys()].filter((k) => cand.has(k));
const differ = shared.filter((k) => JSON.stringify(ref.get(k)) !== JSON.stringify(cand.get(k)));

const short = (v) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s === undefined ? "-" : s.length > 90 ? `${s.slice(0, 87)}...` : s;
};
const show = (title, keys, side) => {
  const n = Number(maxRows);
  console.log(`\n## ${title}: ${keys.length}`);
  keys.slice(0, n).forEach((k) => {
    const v = side === "ref" ? ref.get(k) : side === "cand" ? cand.get(k) : null;
    console.log(`  ${k}  =  ${short(v)}`);
  });
  if (keys.length > n) console.log(`  ... ${keys.length - n} more`);
};

console.log(`reference: ${refPath}  (${ref.size} leaf paths)`);
console.log(`candidate: ${candPath}  (${cand.size} leaf paths)`);

show("only in reference", onlyRef, "ref");
show("only in candidate", onlyCand, "cand");

console.log(`\n## differing values: ${differ.length} of ${shared.length} shared paths`);
const n = Number(maxRows);
differ.slice(0, n).forEach((k) => {
  console.log(`  ${k}`);
  console.log(`      ref : ${short(ref.get(k))}`);
  console.log(`      cand: ${short(cand.get(k))}`);
});
if (differ.length > n) console.log(`  ... ${differ.length - n} more`);
