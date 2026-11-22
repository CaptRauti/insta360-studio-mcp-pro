// Minimal, dependency-free PNG reader.
//
// The server has to look at its own screenshots to find Studio's accent-coloured
// primary buttons. Pulling in a native image library for that is overkill: a PNG
// is just zlib-compressed scanlines, and Node ships zlib. Supports the two
// formats System.Drawing actually writes (8-bit RGB and 8-bit RGBA).

import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Read an 8-bit RGB/RGBA PNG into { width, height, data } with data as RGB triples. */
export function readPng(file) {
  const buf = readFileSync(file);
  if (!buf.subarray(0, 8).equals(PNG_SIG)) throw new Error(`${file}: not a PNG`);

  let off = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idat = [];

  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const body = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      bitDepth = body[8];
      colorType = body[9];
      interlace = body[12];
    } else if (type === "IDAT") {
      idat.push(body);
    } else if (type === "IEND") {
      break;
    }
    off += 12 + len;
  }

  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`);
  if (interlace !== 0) throw new Error("interlaced PNG not supported");
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!channels) throw new Error(`unsupported colour type ${colorType}`);

  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(width * height * 3);
  const prev = Buffer.alloc(stride);
  const line = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const base = y * (stride + 1);
    const filter = raw[base];
    raw.copy(line, 0, base + 1, base + 1 + stride);
    unfilter(filter, line, prev, channels, stride);
    for (let x = 0; x < width; x++) {
      const s = x * channels;
      const d = (y * width + x) * 3;
      out[d] = line[s];
      out[d + 1] = line[s + 1];
      out[d + 2] = line[s + 2];
    }
    line.copy(prev);
  }

  return { width, height, data: out };
}

function unfilter(filter, line, prev, channels, stride) {
  const bpp = channels;
  switch (filter) {
    case 0:
      return;
    case 1:
      for (let i = bpp; i < stride; i++) line[i] = (line[i] + line[i - bpp]) & 0xff;
      return;
    case 2:
      for (let i = 0; i < stride; i++) line[i] = (line[i] + prev[i]) & 0xff;
      return;
    case 3:
      for (let i = 0; i < stride; i++) {
        const left = i >= bpp ? line[i - bpp] : 0;
        line[i] = (line[i] + ((left + prev[i]) >> 1)) & 0xff;
      }
      return;
    case 4:
      for (let i = 0; i < stride; i++) {
        const a = i >= bpp ? line[i - bpp] : 0;
        const b = prev[i];
        const c = i >= bpp ? prev[i - bpp] : 0;
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        line[i] = (line[i] + pr) & 0xff;
      }
      return;
    default:
      throw new Error(`unknown PNG filter ${filter}`);
  }
}

/**
 * Find contiguous runs of "accent" pixels (Studio's primary action colour) and
 * return the bounding boxes, largest first. Studio fills its primary buttons
 * with a solid #FFD200, so a colour match plus a size floor is enough to tell a
 * real button from an icon.
 */
export function findAccentBoxes(img, opts = {}) {
  const {
    r = 255,
    g = 210,
    b = 0,
    tol = 26,
    minW = 40,
    minH = 12,
    maxBoxes = 8,
    region = null, // { x0, y0, x1, y1 } in image pixels
  } = opts;
  const { width, height, data } = img;
  const x0 = region?.x0 ?? 0;
  const y0 = region?.y0 ?? 0;
  const x1 = region?.x1 ?? width;
  const y1 = region?.y1 ?? height;

  const mask = new Uint8Array(width * height);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 3;
      if (
        Math.abs(data[i] - r) <= tol &&
        Math.abs(data[i + 1] - g) <= tol &&
        Math.abs(data[i + 2] - b) <= tol
      ) {
        mask[y * width + x] = 1;
      }
    }
  }

  // Connected components via an explicit stack (no recursion: a full-width
  // button is thousands of pixels deep).
  const seen = new Uint8Array(width * height);
  const boxes = [];
  const stack = [];
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const start = y * width + x;
      if (!mask[start] || seen[start]) continue;
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let count = 0;
      stack.length = 0;
      stack.push(start);
      seen[start] = 1;
      while (stack.length) {
        const p = stack.pop();
        const px = p % width;
        const py = (p - px) / width;
        count++;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
        const nbrs = [p - 1, p + 1, p - width, p + width];
        for (const n of nbrs) {
          if (n < 0 || n >= mask.length) continue;
          const nx = n % width;
          if (Math.abs(nx - px) > 1) continue; // wrapped across a row
          if (mask[n] && !seen[n]) {
            seen[n] = 1;
            stack.push(n);
          }
        }
      }
      const w = maxX - minX + 1;
      const h = maxY - minY + 1;
      if (w >= minW && h >= minH) {
        boxes.push({ x: minX, y: minY, w, h, count, cx: Math.round((minX + maxX) / 2), cy: Math.round((minY + maxY) / 2) });
      }
    }
  }
  boxes.sort((a, b2) => b2.count - a.count);
  return boxes.slice(0, maxBoxes);
}
