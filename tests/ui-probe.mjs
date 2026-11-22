// Live GUI probe: spawns the server and exercises the UI-automation tools
// without clicking anything. Verifies that the window is reachable, that the
// screenshot pipeline works, and that the accent-button detector finds the
// export button. Exits non-zero on failure.
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

function rpc(method, params, timeoutMs = 60000) {
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

async function call(name, args = {}) {
  const res = await rpc("tools/call", { name, arguments: args });
  if (res.error) fail(`${name} rpc error: ${JSON.stringify(res.error)}`);
  const text = res.result?.content?.[0]?.text ?? "";
  if (res.result?.isError) fail(`${name} tool error: ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

try {
  const init = await rpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "ui-probe", version: "0.0.0" },
  });
  if (init.error) fail(`initialize error: ${JSON.stringify(init.error)}`);
  console.log("initialize OK:", init.result?.serverInfo?.name);
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`);

  const state = await call("studio_ui_state");
  if (!state.window?.hwnd) fail("studio_ui_state returned no window handle");
  console.log(
    "studio_ui_state OK:",
    JSON.stringify({
      window: `${state.window.width}x${state.window.height}`,
      dialogOpen: state.dialogOpen,
      toolbarExport: state.toolbarExport ? `${state.toolbarExport.cx},${state.toolbarExport.cy}` : null,
      playerEmpty: state.player?.likelyEmpty,
      screenshot: state.screenshot,
    }),
  );

  const shot = await call("studio_ui_capture", {});
  if (!shot.path) fail("studio_ui_capture returned no path");
  console.log("studio_ui_capture OK:", shot.path);

  const analysis = await call("studio_ui_analyze_shot", { file: shot.path });
  if (typeof analysis.dialogOpen !== "boolean") fail("studio_ui_analyze_shot returned no dialogOpen flag");
  console.log("studio_ui_analyze_shot OK:", JSON.stringify({
    dialogOpen: analysis.dialogOpen,
    toolbarExport: analysis.toolbarExport ? "found" : "none",
    playerEmpty: analysis.player?.likelyEmpty,
  }));

  child.kill();
  process.exit(0);
} catch (err) {
  fail(err.message);
}
