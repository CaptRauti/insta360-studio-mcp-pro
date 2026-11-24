// What was Studio doing around today's stall? Uses the window reader from the
// MCP server's own log module (see src/logs.mjs readLogWindow).
import { readLogWindow } from "../src/logs.mjs";

const at = process.argv[2] ?? "2026-11-24T17:17";
const w = await readLogWindow({ at, minutes: Number(process.argv[3] ?? 3), limit: 4000 });
console.log(`window ${at} ±${process.argv[3] ?? 3} min -> ${w.totalLines} lines from ${w.sessions.map((s) => s.session).join(", ")}\n`);

const interesting = /lade|load|open|media|url|album|insproj|project|fail|error|timeout|lag|slow|generation mismatch|TextureLoader|proxy|missing|not found|invalid|abort/i;
const hits = w.lines.filter((l) => interesting.test(l.text));
console.log(`--- ${hits.length} of ${w.totalLines} lines match, last 120 ---`);
for (const l of hits.slice(-120)) console.log(`${l.when.slice(11, 23)}  ${l.text.replace(/\s+/g, " ").slice(0, 165)}`);
