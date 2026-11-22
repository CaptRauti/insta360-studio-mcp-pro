// gRPC client for the Insta360 Studio exporter/thumbnail services.
//
// The services are discovered at runtime: Studio launches
// studio-exporter-service.exe and studio-thumbnail-service.exe as child
// processes, each listening on a dynamically assigned localhost port. We find
// those ports by matching the owning PID to the process image name, so no
// hardcoded port is needed.
//
// The wire format is hand-rolled protobuf (see proto/export2.proto for the
// field map recovered from the binary's FileDescriptorProto blobs). We talk to
// the server without generated stubs so the package stays dependency-light and
// works against whatever Studio build is installed.

import { execFileSync } from "node:child_process";
import net from "node:net";

const WIN = process.platform === "win32";
const EXPORTER_IMAGE = "studio-exporter-service.exe";
const THUMBNAIL_IMAGE = "studio-thumbnail-service.exe";

// ---------------------------------------------------------------------------
// protobuf wire helpers
// ---------------------------------------------------------------------------
export function varint(n) {
  const out = [];
  let v = BigInt(n);
  while (v > 0x7fn) {
    out.push(Number(v & 0x7fn) | 0x80);
    v >>= 7n;
  }
  out.push(Number(v));
  return Buffer.from(out);
}

export function fieldString(fieldNo, value) {
  const b = Buffer.isBuffer(value) ? value : Buffer.from(String(value), "utf8");
  return Buffer.concat([varint((fieldNo << 3) | 2), varint(b.length), b]);
}

export function fieldInt(fieldNo, value) {
  return Buffer.concat([varint((fieldNo << 3) | 0), varint(value)]);
}

/** bool field — encoded as varint 1/0 (proto3 default false is omitted) */
export function fieldBool(fieldNo, value) {
  return fieldInt(fieldNo, value ? 1 : 0);
}

/** length-delimited sub-message or raw bytes (wire type 2) */
export function fieldBytes(fieldNo, value) {
  return fieldString(fieldNo, value);
}

export function fieldFloat(fieldNo, value) {
  const b = Buffer.alloc(4);
  b.writeFloatLE(value, 0);
  return Buffer.concat([varint((fieldNo << 3) | 5), b]);
}

export function fieldDouble(fieldNo, value) {
  const b = Buffer.alloc(8);
  b.writeDoubleLE(value, 0);
  return Buffer.concat([varint((fieldNo << 3) | 1), b]);
}

/** Decode a protobuf message into { fieldNo: value | [values] }. */
export function decodeMessage(buf) {
  const out = {};
  let i = 0;
  const push = (n, v) => {
    if (out[n] === undefined) out[n] = v;
    else if (Array.isArray(out[n])) out[n].push(v);
    else out[n] = [out[n], v];
  };
  while (i < buf.length) {
    let key = 0;
    let shift = 0;
    let byte;
    do {
      if (i >= buf.length) return out;
      byte = buf[i++];
      key |= (byte & 0x7f) << shift;
      shift += 7;
    } while (byte & 0x80);
    const fieldNo = key >>> 3;
    const wireType = key & 7;
    if (wireType === 0) {
      let v = 0n;
      let s = 0n;
      do {
        if (i >= buf.length) return out;
        byte = buf[i++];
        v |= BigInt(byte & 0x7f) << s;
        s += 7n;
      } while (byte & 0x80);
      push(fieldNo, Number(v));
    } else if (wireType === 2) {
      let len = 0;
      let s = 0;
      do {
        if (i >= buf.length) return out;
        byte = buf[i++];
        len |= (byte & 0x7f) << s;
        s += 7;
      } while (byte & 0x80);
      const slice = buf.subarray(i, i + len);
      i += len;
      push(fieldNo, slice);
    } else if (wireType === 5) {
      if (i + 4 > buf.length) return out;
      push(fieldNo, buf.readFloatLE(i));
      i += 4;
    } else if (wireType === 1) {
      if (i + 8 > buf.length) return out;
      push(fieldNo, buf.readDoubleLE(i));
      i += 8;
    } else {
      // Unsupported wire type (groups); stop rather than guess.
      return out;
    }
  }
  return out;
}

/** Best-effort string extraction from a decoded field. */
export function asString(v) {
  if (v === undefined || v === null) return "";
  if (Buffer.isBuffer(v)) return v.toString("utf8");
  return String(v);
}

export function asNumber(v, fallback = 0) {
  if (v === undefined || v === null) return fallback;
  if (Array.isArray(v)) return asNumber(v[0], fallback);
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ---------------------------------------------------------------------------
// gRPC framing (HTTP/2 over a raw socket is not needed: grpc-js speaks it)
// ---------------------------------------------------------------------------
// We deliberately avoid grpc-js here so the server runs with zero native
// dependencies. A unary gRPC call is an HTTP/2 POST with a 5-byte prefixed
// message; we implement the minimal client below.

import http2 from "node:http2";

export class GrpcError extends Error {
  constructor(message, code, details) {
    super(message);
    this.name = "GrpcError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Perform a unary gRPC call over HTTP/2.
 * @param {object} opts
 * @param {number} opts.port localhost port
 * @param {string} opts.path e.g. "/service.Export2.Export2/StartExporting"
 * @param {Buffer} opts.payload serialized protobuf request
 * @param {number} [opts.timeoutMs]
 * @returns {Promise<Buffer>} serialized protobuf response
 */
export function unaryCall({ port, path, payload, timeoutMs = 180000 }) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (fn, arg) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(arg);
    };

    const client = http2.connect(`http://127.0.0.1:${port}`);
    const timer = setTimeout(() => {
      try {
        client.close();
      } catch {}
      done(reject, new GrpcError(`gRPC call to ${path} timed out after ${timeoutMs} ms`, "DEADLINE_EXCEEDED"));
    }, timeoutMs);

    client.on("error", (err) => {
      done(reject, new GrpcError(`gRPC connection error: ${err.message}`, "UNAVAILABLE"));
    });

    const req = client.request({
      ":method": "POST",
      ":path": path,
      "content-type": "application/grpc",
      te: "trailers",
      "grpc-accept-encoding": "identity",
      "grpc-timeout": `${Math.max(1, Math.floor(timeoutMs / 1000))}S`,
    });

    const chunks = [];
    let grpcStatus = null;
    let grpcMessage = null;

    req.on("response", (headers) => {
      if (headers["grpc-status"] !== undefined) grpcStatus = Number(headers["grpc-status"]);
      if (headers["grpc-message"] !== undefined) grpcMessage = String(headers["grpc-message"]);
    });

    req.on("trailers", (trailers) => {
      if (trailers["grpc-status"] !== undefined) grpcStatus = Number(trailers["grpc-status"]);
      if (trailers["grpc-message"] !== undefined) grpcMessage = String(trailers["grpc-message"]);
    });

    req.on("data", (chunk) => chunks.push(chunk));

    req.on("error", (err) => {
      try {
        client.close();
      } catch {}
      done(reject, new GrpcError(`gRPC request error: ${err.message}`, "UNAVAILABLE"));
    });

    req.on("end", () => {
      try {
        client.close();
      } catch {}
      const body = Buffer.concat(chunks);
      // gRPC frame: 1 byte compressed flag + 4 byte big-endian length + message
      if (body.length >= 5) {
        const compressed = body[0];
        const len = body.readUInt32BE(1);
        const msg = body.subarray(5, 5 + len);
        if (compressed !== 0) {
          done(reject, new GrpcError("compressed gRPC responses are not supported", "UNIMPLEMENTED"));
          return;
        }
        if (grpcStatus !== null && grpcStatus !== 0) {
          done(
            reject,
            new GrpcError(
              `gRPC ${path} failed: status=${grpcStatus} ${grpcMessage ?? ""}`.trim(),
              grpcStatus,
              grpcMessage,
            ),
          );
          return;
        }
        done(resolve, msg);
        return;
      }
      if (grpcStatus !== null && grpcStatus !== 0) {
        done(
          reject,
          new GrpcError(
            `gRPC ${path} failed: status=${grpcStatus} ${grpcMessage ?? ""}`.trim(),
            grpcStatus,
            grpcMessage,
          ),
        );
        return;
      }
      done(resolve, Buffer.alloc(0));
    });

    req.end(Buffer.concat([Buffer.from([0]), u32be(payload.length), payload]));
  });
}

function u32be(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n >>> 0, 0);
  return b;
}

// ---------------------------------------------------------------------------
// Service discovery
// ---------------------------------------------------------------------------
// Port lookup uses Get-NetTCPConnection rather than netstat: netstat's output is
// localized AND its non-ASCII bytes are emitted in the OEM code page, which
// corrupts the whole stream when read as UTF-8 (matching then silently fails).
// Get-NetTCPConnection returns structured objects, so no text parsing is needed.
function pidToPorts(pid) {
  if (!WIN) return [];
  try {
    const out = execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        `Get-NetTCPConnection -State Listen -OwningProcess ${pid} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty LocalPort`,
      ],
      { encoding: "utf8", windowsHide: true, timeout: 15000 },
    );
    const ports = [];
    for (const line of out.split(/\r?\n/)) {
      const port = Number(line.trim());
      if (Number.isInteger(port) && port > 0) ports.push(port);
    }
    return ports;
  } catch {
    return [];
  }
}

function findPids(imageName) {
  if (!WIN) return [];
  try {
    const out = execFileSync(
      "tasklist",
      ["/FI", `IMAGENAME eq ${imageName}`, "/FO", "CSV", "/NH"],
      { encoding: "utf8", windowsHide: true },
    );
    const pids = [];
    for (const line of out.split(/\r?\n/)) {
      const cols = line.split('","');
      if (cols.length < 2) continue;
      const id = Number(cols[1].replace(/"/g, "").trim());
      if (Number.isInteger(id) && id > 0) pids.push(id);
    }
    return pids;
  } catch {
    return [];
  }
}

/** Find the localhost port a Studio helper service listens on. */
export function discoverPort(imageName) {
  for (const pid of findPids(imageName)) {
    const ports = pidToPorts(pid);
    if (ports.length) return { pid, port: ports[0], ports };
  }
  return null;
}

export function discoverExporter() {
  return discoverPort(EXPORTER_IMAGE);
}

export function discoverThumbnail() {
  return discoverPort(THUMBNAIL_IMAGE);
}

/** TCP reachability check used by the health tools. */
export function portOpen(port, host = "127.0.0.1", timeoutMs = 1500) {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host });
    const done = (ok) => {
      sock.destroy();
      resolve(ok);
    };
    sock.setTimeout(timeoutMs);
    sock.once("connect", () => done(true));
    sock.once("timeout", () => done(false));
    sock.once("error", () => done(false));
  });
}
