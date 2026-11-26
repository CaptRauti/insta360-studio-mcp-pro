/**
 * Where did the transition land?
 *
 * The recorded shape (docs/ASSET_CATALOG.md §2.2) says a clip's `transitions` array, but the project
 * Studio just saved has 0 entries there while the file grew by 15 KB — so the transition went
 * somewhere else and every assumption about the container is now suspect. This walks the whole
 * document for the word "transition" and prints the owning path of each hit, plus a diff against the
 * tool's own `.bak` so the exact new content is visible.
 *
 *   node research/find_transition.mjs <projectDir>
 */
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] ?? "D:/Dokumente/Insta360/Studio/TimelineProject/mcpKey";
const files = fs.readdirSync(dir);
const file = path.join(dir, files.find((f) => f.endsWith(".insproj") && !f.includes("_backup") && !f.endsWith(".bak")));
const bak = files.find((f) => f.endsWith(".bak"));

const raw = fs.readFileSync(file, "utf8");
const data = JSON.parse(raw);
console.log(`file: ${path.basename(file)}  ${fs.statSync(file).size} bytes  mtime ${fs.statSync(file).mtime.toISOString()}`);
console.log(`lastModifiedTime: ${data.lastModifiedTime}`);

/** Every path in the document whose key or value mentions "transition". */
const hits = [];
const walk = (node, at) => {
  if (node === null || typeof node !== "object") return;
  for (const [k, v] of Object.entries(node)) {
    const here = `${at}.${k}`;
    if (/transition/i.test(k)) hits.push({ path: here, kind: "key", value: JSON.stringify(v).slice(0, 400) });
    if (typeof v === "string" && /transition|videotransition/i.test(v)) hits.push({ path: here, kind: "string", value: v.slice(0, 300) });
    if (v && typeof v === "object") walk(v, here);
  }
};
walk(data, "");

console.log(`\n=== paths mentioning "transition": ${hits.length} ===`);
for (const h of hits) console.log(`  ${h.kind.padEnd(6)} ${h.path}\n         ${h.value}`);

// The keys at each level, so a container that is not named "transition" is still visible.
console.log(`\n=== structure ===`);
const shape = (node, at = "", depth = 0) => {
  if (depth > 2 || !node || typeof node !== "object") return;
  const keys = Array.isArray(node) ? [`[${node.length} items]`] : Object.keys(node);
  console.log(`  ${"  ".repeat(depth)}${at || "root"}: ${keys.join(", ")}`);
  if (Array.isArray(node) && node[0] && typeof node[0] === "object") shape(node[0], `${at}[0]`, depth + 1);
  else for (const k of keys) if (node[k] && typeof node[k] === "object") shape(node[k], `${at}.${k}`, depth + 1);
};
shape(data);

// What actually changed, key by key, against the tool's own backup.
if (bak) {
  const before = JSON.parse(fs.readFileSync(path.join(dir, bak), "utf8"));
  const diffs = [];
  const compare = (a, b, at = "") => {
    const keys = new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]);
    for (const k of keys) {
      const av = a?.[k];
      const bv = b?.[k];
      const sa = JSON.stringify(av);
      const sb = JSON.stringify(bv);
      if (sa === sb) continue;
      if (av && bv && typeof av === "object" && typeof bv === "object" && !Array.isArray(av)) compare(av, bv, `${at}.${k}`);
      else diffs.push(`${at}.${k}: ${String(sb).slice(0, 120)}  ->  ${String(sa).slice(0, 120)}`);
    }
  };
  compare(data, before);
  console.log(`\n=== changed vs ${bak} (${diffs.length} leaf difference(s)) ===`);
  for (const d of diffs.slice(0, 25)) console.log(`  ${d}`);
  if (diffs.length > 25) console.log(`  … ${diffs.length - 25} more`);
}
