#!/usr/bin/env python3
"""Which log-line positions are recoverable at all, measured without the key.

XOR by a constant is a permutation, so the number of DISTINCT ciphertext bytes at
a position is invariant to the key: it equals the number of distinct plaintext
characters there. That makes this a key-free measurement of what a reused-key
attack can and cannot recover:

    1 distinct value  -> plaintext constant -> ALL 256 keys tie -> crib only
    >=2 distinct      -> recoverable by scoring against a character prior

The first ~48 characters are the `[timestamp] [logger] [level] ` header, so
this table says exactly which header positions need a crib and which the solver
gets for free.

Usage: python research/prefix_probe.py <logfile> [n_positions] [n_frames]
"""
import collections
import struct
import sys

MAGIC = bytes.fromhex("bf08ac29")


def parse_frames(path):
    data = open(path, "rb").read()
    frames, pos = [], 16
    while pos + 8 <= len(data):
        (length,) = struct.unpack_from("<I", data, pos)
        if data[pos + 4:pos + 8] != MAGIC:
            pos += 1
            continue
        frames.append(data[pos + 8:pos + 8 + length])
        pos += 8 + length
    return frames


def main():
    path = sys.argv[1]
    npos = int(sys.argv[2]) if len(sys.argv) > 2 else 60
    nframes = int(sys.argv[3]) if len(sys.argv) > 3 else 400
    frames = parse_frames(path)[:nframes]
    print(f"{len(frames)} Frames\n")

    print(f"{'pos':>4} {'distinkt':>9} {'häufigste Ciphertext-Bytes (hex:anzahl)':<44} Liste")
    print("-" * 96)
    for j in range(npos):
        col = collections.Counter(f[j] for f in frames if j < len(f))
        top = col.most_common(4)
        shown = "  ".join(f"{b:02x}:{n}" for b, n in top)
        lst = ",".join(f"{b:02x}" for b, _ in col.most_common(8)) if len(col) <= 8 else ""
        dup = "  <== KONSTANT" if len(col) == 1 else ""
        print(f"{j:>4} {len(col):>9} {shown:<44} {lst}{dup}")


if __name__ == "__main__":
    main()
