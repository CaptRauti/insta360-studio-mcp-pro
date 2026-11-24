// Compare a project we wrote against the one Studio rewrote.
//
// Studio normalises what it reads: it drops fields it does not know, fills in
// defaults, and recomputes derived values. That diff is the cheapest way to
// learn the schema's real requirements — anything we got wrong shows up as a
// field Studio replaced, and anything we invented shows up as one it removed.
//
// Usage: node research/diff_project.mjs --mine <path> --theirs <path>

import fs from "node:fs";

const argv = process.argv.slice(2);
const arg = (n, d) => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};

const mine = JSON.parse(fs.readFileSync(arg("mine"), "utf8"));
const theirs = JSON.parse(fs.readFileSync(arg("theirs"), "utf8"));

const IGNORE = new Set(["id", "creationTime", "lastModifiedTime", "name", "projectPath"]);

function walk(a, b, path = "") {
  const out = [];
  const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
  for (const k of keys) {
    if (path === "" && IGNORE.has(k)) continue;
    const p = path ? `${path}.${k}` : k;
    const av = a?.[k];
    const bv = b?.[k];
    const aObj = av && typeof av === "object";
    const bObj = bv && typeof bv === "object";
    if (Array.isArray(av) || Array.isArray(bv)) {
      const la = Array.isArray(av) ? av.length : 0;
      const lb = Array.isArray(bv) ? bv.length : 0;
      if (la !== lb) out.push({ path: p, kind: "len", mine: la, theirs: lb });
      const n = Math.min(la, lb);
      for (let i = 0; i < n; i++) {
        if (av[i] && bv[i] && typeof av[i] === "object" && typeof bv[i] === "object") {
          out.push(...walk(av[i], bv[i], `${p}[${i}]`));
        } else if (JSON.stringify(av[i]) !== JSON.stringify(bv[i])) {
          out.push({ path: `${p}[${i}]`, kind: "val", mine: av[i], theirs: bv[i] });
        }
      }
    } else if (aObj && bObj) {
      out.push(...walk(av, bv, p));
    } else if (JSON.stringify(av) !== JSON.stringify(bv)) {
      out.push({ path: p, kind: av === undefined ? "added-by-studio" : bv === undefined ? "removed-by-studio" : "val", mine: av, theirs: bv });
    }
  }
  return out;
}

const diffs = walk(mine, theirs);
const byKind = {};
for (const d of diffs) (byKind[d.kind] ||= []).push(d);

console.log(`Differenzen: ${diffs.length}`);
for (const [kind, list] of Object.entries(byKind)) {
  console.log(`\n### ${kind} (${list.length})`);
  for (const d of list.slice(0, 40)) {
    const m = typeof d.mine === "object" ? JSON.stringify(d.mine).slice(0, 70) : String(d.mine);
    const t = typeof d.theirs === "object" ? JSON.stringify(d.theirs).slice(0, 70) : String(d.theirs);
    console.log(`  ${d.path}\n      meins:   ${m}\n      studio:  ${t}`);
  }
  if (list.length > 40) console.log(`  ... ${list.length - 40} weitere`);
}
