// Call one MCP tool on this server over stdio and print the reply.
//
//   node tests/mcp-call.mjs studio_ui_export_settings '{"control":"Kodierung","listOptions":true}'
//
// Usable as a manual probe: it exercises the real server (tool registration,
// argument schema, error handling), not just the module behind it.

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(here, "..", "src", "server.mjs");

const name = process.argv[2];
const args = process.argv[3] ? JSON.parse(process.argv[3]) : {};
if (!name) {
  console.error("usage: node tests/mcp-call.mjs <tool> ['{json args}']");
  process.exit(2);
}

const child = spawn(process.execPath, [serverPath], { stdio: ["pipe", "pipe", "pipe"], env: { ...process.env } });

let buffer = "";
const pending = new Map();
let nextId = 1;

child.stdout.on("data", (chunk) => {
  buffer += chunk.toString("utf8");
  let idx;
  while ((idx = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id).resolve(msg);
      pending.delete(msg.id);
    }
  }
});
child.stderr.on("data", (d) => process.stderr.write(`[server] ${d}`));

function call(method, params) {
  const id = nextId++;
  const payload = JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n";
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${method} timed out`)), 180000);
    pending.set(id, { resolve: (m) => { clearTimeout(timer); resolve(m); } });
    child.stdin.write(payload);
  });
}

const init = await call("initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "mcp-call", version: "1" },
});
if (init.error) {
  console.error("initialize failed:", JSON.stringify(init.error));
  process.exit(1);
}
child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");

const reply = await call("tools/call", { name, arguments: args });
if (reply.error) {
  console.error(`tools/call error: ${JSON.stringify(reply.error)}`);
  child.kill();
  process.exit(1);
}

const content = reply.result?.content ?? [];
for (const part of content) {
  if (part.type === "text") {
    try {
      console.log(JSON.stringify(JSON.parse(part.text), null, 2));
    } catch {
      console.log(part.text);
    }
  }
}
if (reply.result?.isError) {
  console.error("tool reported an error");
  child.kill();
  process.exit(1);
}

child.kill();
