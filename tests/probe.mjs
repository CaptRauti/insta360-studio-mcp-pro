// Live MCP handshake probe: spawns the server, initializes, lists tools, and
// calls studio_status. Exits non-zero when the handshake or tool list fails.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(here, "..", "src", "server.mjs");

const child = spawn(process.execPath, [serverPath], {
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env },
});

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
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg);
    }
  }
});

child.stderr.on("data", (d) => process.stderr.write(`[server] ${d}`));

function rpc(method, params) {
  const id = nextId++;
  const payload = { jsonrpc: "2.0", id, method, params };
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`timeout waiting for ${method}`));
    }, 30000);
    pending.set(id, {
      resolve: (msg) => {
        clearTimeout(timer);
        resolve(msg);
      },
    });
    child.stdin.write(`${JSON.stringify(payload)}\n`);
  });
}

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  child.kill();
  process.exit(1);
}

try {
  const init = await rpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "probe", version: "0.0.0" },
  });
  if (init.error) fail(`initialize error: ${JSON.stringify(init.error)}`);
  console.log("initialize OK:", init.result?.serverInfo?.name, init.result?.serverInfo?.version);

  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);

  const list = await rpc("tools/list", {});
  if (list.error) fail(`tools/list error: ${JSON.stringify(list.error)}`);
  const tools = list.result?.tools ?? [];
  console.log(`tools/list OK: ${tools.length} tools`);
  for (const t of tools) console.log(`  - ${t.name}`);

  const status = await rpc("tools/call", { name: "studio_status", arguments: {} });
  if (status.error) fail(`studio_status error: ${JSON.stringify(status.error)}`);
  const text = status.result?.content?.[0]?.text ?? "";
  const parsed = JSON.parse(text);
  console.log("studio_status OK:", JSON.stringify({
    ready: parsed.ready,
    exporter: parsed.exporter?.port ?? null,
    thumbnail: parsed.thumbnail?.port ?? null,
    studioDirExists: parsed.studioDirExists,
  }));

  const projects = await rpc("tools/call", { name: "studio_list_projects", arguments: {} });
  const ptext = projects.result?.content?.[0]?.text ?? "";
  const pj = JSON.parse(ptext);
  console.log(`studio_list_projects OK: ${pj.count} projects`);

  child.kill();
  process.exit(0);
} catch (err) {
  fail(err.message);
}
