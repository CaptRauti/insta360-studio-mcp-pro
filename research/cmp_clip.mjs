// Compare the source-metadata fields a built clip inherits from the template
// against the template's own clip, for a flat MP4 source.
import fs from "node:fs";
import path from "node:path";
import { projectsRoot, findTemplate } from "../src/pipeline.mjs";

const FIELDS = [
  "url", "name", "type", "subtype", "viewType", "online", "ratio", "aspect_ratio_info",
  "isPanoramic", "stitching_setting", "stitching_optimization", "sourceFrames",
  "source_total_frames", "fps", "supplementFrameType", "source_left_trim", "source_right_trim",
];

function pick(o) {
  const out = {};
  for (const f of FIELDS) {
    if (o[f] === undefined) continue;
    out[f] = typeof o[f] === "object" && o[f] !== null ? JSON.stringify(o[f]).slice(0, 110) : o[f];
  }
  return out;
}

function dump(label, file) {
  const d = JSON.parse(fs.readFileSync(file, "utf8"));
  const t = (d.tracks || []).find((t) => t.type === 0) || {};
  console.log(`\n### ${label}`);
  console.log(`  project: isPanoramic=${d.isPanoramic} aspectRatio=${d.aspectRatio} fps=${d.fps} frames=${d.frames} name=${d.name}`);
  (t.clips || []).forEach((c, i) => {
    console.log(`  clip[${i}] ${JSON.stringify(pick(c))}`);
  });
}

const root = projectsRoot();
const tpl = findTemplate({});
console.log("findTemplate ->", tpl);
dump("TEMPLATE", tpl);

// The same file Studio wrote itself, if any project uses it natively.
for (const dir of fs.readdirSync(root)) {
  const d = path.join(root, dir);
  if (!fs.statSync(d).isDirectory()) continue;
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith(".insproj") || f.includes("_backup")) continue;
    if (dir === "mcpE2E") continue;
    const data = JSON.parse(fs.readFileSync(path.join(d, f), "utf8"));
    const t = (data.tracks || []).find((t) => t.type === 0) || {};
    if ((t.clips || []).some((c) => String(c.url).includes("F:/Luna") || String(c.url).includes("F:\\Luna"))) {
      dump(`NATIV (Studio) ${dir}`, path.join(d, f));
    }
  }
}
