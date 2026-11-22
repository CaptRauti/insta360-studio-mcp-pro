// Slow, opt-in probe: drives a real GUI export through the MCP server and
// verifies that a finished video file appears. Not part of `npm test` — it
// takes minutes and writes a multi-hundred-MB file.
//
//   node tests/ui-export-probe.mjs [outDir]
//
// Requires: Studio running with a clip loaded in the player.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(here, "..", "src", "server.mjs");
const outDir = process.argv[2] || undefined;

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

function rpc(method, params, timeoutMs = 30000) {
  const id = nextId++;
  const payload = { jsonrpc: "2.0", id, method, params };
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`timeout waiting for ${method}`));
    }, timeoutMs);
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
    clientInfo: { name: "ui-export-probe", version: "0.0.0" },
  });
  if (init.error) fail(`initialize error: ${JSON.stringify(init.error)}`);
  console.log("initialize OK:", init.result?.serverInfo?.name);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);

  const pre = await rpc("tools/call", { name: "studio_ui_state", arguments: {} });
  const preState = JSON.parse(pre.result?.content?.[0]?.text ?? "{}");
  console.log("pre-state:", JSON.stringify({
    dialogOpen: preState.dialogOpen,
    playerEmpty: preState.player?.likelyEmpty,
    toolbarExport: preState.toolbarExport ? `${preState.toolbarExport.cx},${preState.toolbarExport.cy}` : null,
  }));
  if (preState.player?.likelyEmpty) {
    fail("player looks empty — load a clip into Studio first (studio_ui_open_media)");
  }

  console.log("starting GUI export (this takes minutes)…");
  const res = await rpc(
    "tools/call",
    { name: "studio_ui_export", arguments: outDir ? { outDir } : {} },
    15 * 60 * 1000,
  );
  if (res.error) fail(`studio_ui_export rpc error: ${JSON.stringify(res.error)}`);
  const text = res.result?.content?.[0]?.text ?? "";
  if (res.result?.isError) fail(`studio_ui_export tool error: ${text}`);
  const out = JSON.parse(text);
  console.log("studio_ui_export OK:", JSON.stringify({ ok: out.ok, file: out.file, size: out.size }));

  child.kill();
  process.exit(0);
} catch (err) {
  fail(err.message);
}
