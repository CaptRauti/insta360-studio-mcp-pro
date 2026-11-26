/**
 * Run the preflight over every project on this machine.
 *
 * The unit tests prove a rule fires when it should. This proves the opposite and more important half:
 * that it does **not** fire on the projects Studio wrote itself. A preflight that cries wolf on 13
 * real projects is worse than none.
 *
 *   node research/preflight_scan.mjs [root]
 */
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { readProject } from "../src/project.mjs";
import { checkProject } from "../src/preflight.mjs";

const root = process.argv[2] ?? "D:/Dokumente/Insta360/Studio";
const files = [];
const walk = (dir, depth = 0) => {
  if (depth > 4) return;
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, depth + 1);
    else if (e.name.endsWith(".insproj") && !e.name.includes("_backup")) {
      try {
        if (statSync(p).size > 200) files.push(p);
      } catch {}
    }
  }
};
walk(root);

let withErrors = 0;
for (const f of files.sort()) {
  const data = await readProject(f);
  const r = checkProject(data, { file: f });
  const s = r.summary;
  const label = `${path.basename(path.dirname(f))}/${path.basename(f)}`;
  if (r.violations.length) withErrors += 1;
  console.log(`\n${r.ok ? "ok  " : "FAIL"} ${label.padEnd(52)} e${s.errors} w${s.warnings} clear ${s.rulesClear}/${s.rulesTotal} dormant ${s.rulesDormant}${s.rulesNeverRan.length ? ` NEVER-RAN ${s.rulesNeverRan.join(",")}` : ""}`);
  for (const v of r.violations) console.log(`     ${v.severity === "error" ? "ERR " : "warn"} [${v.rule}] ${v.where}: ${v.message}`);
}
console.log(`\n${files.length} project(s) scanned, ${withErrors} with findings`);
