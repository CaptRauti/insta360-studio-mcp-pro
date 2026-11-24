#!/usr/bin/env python3
"""Decrypt Insta360 Studio's logs by reusing ONE keystream across ALL log files.

Findings behind this tool (measured 2026-11-24, Studio 6.0.9):

1. Container: 16-byte file header cd013a985f5beca1bcc1ca036aa5d1a0, then
   [u32le length][bf08ac29][length bytes] frames.
2. Every frame of a file is XORed with the SAME keystream -> C_i[j] = P_i[j]^K[j].
3. The keystream is IDENTICAL in every Studio log file. Across 126 files spanning
   2026-11-21..24 the columns at the literal header characters are byte-identical
   (4a ?? ae 54 ?? c0 ?? ?? 15 ?? ?? 87 ?? ?? ?? b3 46 8c ...), while the columns
   holding date/clock digits differ. A per-file key would differ everywhere.
4. So all files feed one estimate. Pooling turns the header's digit columns from
   "constant within a file" (256-way ambiguous -- the reason naive attempts stall)
   into a solvable problem, because different sessions differ there.

The line format comes from the PLAIN sibling logs, which share the logger prefix
(log/detector/*/main_*.log, log/studio/*/*_launcher_*.log):

    [2026-11-22 15:39:32.013] [basic_logger] [info] cur locale area: %s

Positions whose plaintext is identical in every file (punctuation, '2026-11')
cannot be recovered from ciphertext -- no reused-key attack can -- so pass them as
a template.  # = digit, ? = word char, ~ = any printable, anything else literal.

Usage:
    # see the header layout, pooling every log
    python research/studio_log_global.py --pool "<logdir>" --ruler 44

    # decrypt a file into text
    python research/studio_log_global.py <log> --pool "<logdir>" \
        --template "[2026-11-24 17:##:##.###] [basic_logger] [info] " -o out.txt
"""
import argparse
import collections
import glob
import os
import re
import string
import struct
import sys

MAGIC = bytes.fromhex("bf08ac29")
LINE_RE = re.compile(
    r"^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}\] \[[A-Za-z0-9_]+\] \[[a-z]+\] "
)

WEIGHT = {}
for _c in string.ascii_lowercase:
    WEIGHT[ord(_c)] = 2.6
for _c in string.ascii_uppercase:
    WEIGHT[ord(_c)] = 2.3
for _c in "etaoinshrdlu":
    WEIGHT[ord(_c)] = 3.0
for _c in string.digits:
    WEIGHT[ord(_c)] = 2.0
for _c in "012":
    WEIGHT[ord(_c)] = 2.2
WEIGHT[0x20] = 3.2
WEIGHT[0x0A] = 1.2
WEIGHT[0x0D] = 0.9
WEIGHT[0x09] = 0.9
for _c in ".,:;_-/\\=+[](){}'\"|<>*%#@!?$&^~`":
    WEIGHT[ord(_c)] = 1.0
for _c in range(32, 127):
    WEIGHT.setdefault(_c, 0.15)
for _c in range(256):
    WEIGHT.setdefault(_c, -6.0)
WEIGHT[0x00] = -9.0

WORD_CHARS = set(string.ascii_letters + string.digits + "_")


def parse_frames(path, limit=None):
    data = open(path, "rb").read()
    frames, pos = [], 16
    while pos + 8 <= len(data):
        (length,) = struct.unpack_from("<I", data, pos)
        if data[pos + 4:pos + 8] != MAGIC:
            pos += 1
            continue
        frames.append(data[pos + 8:pos + 8 + length])
        if limit and len(frames) >= limit:
            break
        pos += 8 + length
    return frames


def allowed_chars(spec):
    if spec == "#":
        return set(ord(c) for c in string.digits)
    if spec == "?":
        return set(ord(c) for c in WORD_CHARS)
    if spec == "~":
        return set(range(0x20, 0x7F))
    return {ord(spec)}


def estimate(frames, length, template=""):
    """One keystream byte per position, from all pooled frames at once."""
    cols = [collections.Counter() for _ in range(length)]
    for f in frames:
        for j, b in enumerate(f[:length]):
            cols[j][b] += 1
    ks = bytearray(length)
    for j, hist in enumerate(cols):
        if not hist:
            continue
        allowed = allowed_chars(template[j]) if j < len(template) \
            else set(range(0x20, 0x7F))
        best_k, best = None, None
        for k in range(256):
            score = 0.0
            for b, cnt in hist.items():
                c = b ^ k
                score += cnt * (WEIGHT[c] if c in allowed else -6.0)
            if best is None or score > best:
                best_k, best = k, score
        ks[j] = best_k
    return bytes(ks)


def decode(frame, ks):
    return bytes(b ^ ks[j] for j, b in enumerate(frame[: len(ks)])).decode("utf-8", "replace")


def gather(args):
    out = []
    for a in args:
        if os.path.isdir(a):
            out += sorted(glob.glob(os.path.join(a, "**", "*.log"), recursive=True))
        else:
            out.append(a)
    return [f for f in out if os.path.isfile(f) and os.path.getsize(f) > 2048]


def ruler_view(files, ks, npos, rows):
    print("     " + "".join(str(j % 10) for j in range(npos)))
    print("     " + "".join("|" if j % 10 == 0 else " " for j in range(npos)))
    for path in files:
        for i, f in enumerate(parse_frames(path, limit=rows)):
            tag = f"{os.path.basename(os.path.dirname(path))[:24]}#{i}"
            print(f"{tag:<27} {decode(f, ks)[:npos]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("logfile", nargs="*", help="Datei(en), die ausgegeben werden")
    ap.add_argument("--pool", nargs="+", default=[],
                    help="Dateien/Verzeichnisse fuer den globalen Key")
    ap.add_argument("-o", "--out")
    ap.add_argument("--template", default="")
    ap.add_argument("--ruler", type=int, default=0)
    ap.add_argument("--frames", type=int, default=150, help="Frames je Datei beim Poolen")
    ap.add_argument("--show", type=int, default=20)
    args = ap.parse_args()

    pool = gather(args.pool or args.logfile)
    if not pool:
        sys.exit("keine Logdateien gefunden")
    samples = []
    for p in pool:
        samples += parse_frames(p, limit=args.frames)
    maxlen = max(len(f) for f in samples)
    print(f"Pool: {len(pool)} Dateien, {len(samples)} Frames, max {maxlen} Byte",
          file=sys.stderr)
    ks = estimate(samples, maxlen, args.template)
    if args.template:
        print(f"Template: {args.template!r}", file=sys.stderr)

    if args.ruler:
        ruler_view(pool[:8], ks, args.ruler, 3)
        return

    targets = gather(args.logfile) or pool
    out = []
    for path in targets:
        frames = parse_frames(path)
        lines = [decode(f, ks) for f in frames]
        hits = sum(1 for ln in lines if LINE_RE.match(ln))
        print(f"  {os.path.basename(os.path.dirname(path))[:32]:<34} {len(lines):>5} Zeilen, "
              f"{hits/max(1,len(lines)):>6.1%} mit Log-Kopfformat", file=sys.stderr)
        out.append(f"########## {path}")
        out += lines
    text = "\n".join(out)
    if args.out:
        with open(args.out, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
        print(f"geschrieben: {args.out}", file=sys.stderr)
    else:
        print("\n".join(out[: args.show]))


if __name__ == "__main__":
    main()
