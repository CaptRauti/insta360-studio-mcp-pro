#!/usr/bin/env python3
"""Is the keystream shared between log files? If so, two logs crack each other.

If Studio uses ONE fixed keystream for all its logs, then for two files A, B:

    A[j] XOR B[j] = P_A[j] XOR P_B[j]

so the byte difference is ZERO wherever both files carry the same character
(same format, same literal punctuation, same '2026-11' prefix) and non-zero only
where the content differs (day, clock, logger, message). A per-file random key
would instead give a non-zero byte at ~63 of every 64 positions.

Prints, per file, the first bytes of frame 0 in hex, plus the zero-run statistics
of the first file against each other file.

Usage: python research/key_scope.py <logdir-or-file> ...
"""
import glob
import os
import struct
import sys

MAGIC = bytes.fromhex("bf08ac29")


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


def gather(args):
    files = []
    for a in args:
        if os.path.isdir(a):
            files += sorted(glob.glob(os.path.join(a, "**", "*.log"), recursive=True))
        else:
            files.append(a)
    return [f for f in files if os.path.getsize(f) > 4096]


def main():
    files = gather(sys.argv[1:])
    print(f"{len(files)} Logdateien\n")
    rows = []
    for f in files:
        try:
            fr = parse_frames(f, limit=1)
        except Exception as exc:  # noqa: BLE001
            print(f"  !! {f}: {exc}")
            continue
        if not fr:
            continue
        head = fr[0][:48]
        rows.append((f, head))
        print(f"{os.path.basename(os.path.dirname(f))[:34]:<36} {head.hex(' ')}")

    if len(rows) < 2:
        return
    print("\n=== Nullläufe C0 XOR Ci (über die ersten 40 Byte) ===")
    base = rows[0][1]
    for f, head in rows[1:]:
        diff = bytes(a ^ b for a, b in zip(base, head))
        zeros = sum(1 for d in diff if d == 0)
        print(f"  {os.path.basename(os.path.dirname(f))[:34]:<36} Nullen {zeros:>2}/40  "
              f"diff {diff[:32].hex(' ')}")


if __name__ == "__main__":
    main()
