#!/usr/bin/env python3
"""Map the structure of an encrypted Insta360 Studio log container.

Container facts (measured): 16-byte header cd013a985f5beca1bcc1ca036aa5d1a0,
then frames carrying magic bf08ac29. This script prints where the magic sits,
what surrounds it, and the entropy of each region, so we can tell a length-framed
cipher (AES-CBC/CTR per frame) from a stream.

Usage: python research/log_container_map.py <logfile> [--hexdump N]
"""
import collections
import math
import sys

HEADER = bytes.fromhex("cd013a985f5beca1bcc1ca036aa5d1a0")
MAGIC = bytes.fromhex("bf08ac29")


def entropy(data):
    if not data:
        return 0.0
    counts = collections.Counter(data)
    n = len(data)
    return -sum((c / n) * math.log2(c / n) for c in counts.values())


def main():
    path = sys.argv[1]
    dump = 256
    if "--hexdump" in sys.argv:
        dump = int(sys.argv[sys.argv.index("--hexdump") + 1])
    data = open(path, "rb").read()
    print(f"Datei: {path}  {len(data)} Bytes")
    print(f"Header match : {data[:16] == HEADER}  ({data[:16].hex()})")
    print(f"Entropie gesamt: {entropy(data):.3f} bit/byte  (8.0 = verschlüsselt/komprimiert)")
    print("\n--- erste Bytes ---")
    for off in range(0, dump, 16):
        chunk = data[off:off + 16]
        printable = "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)
        print(f"{off:08x}  {chunk.hex(' '):<47}  {printable}")

    magic_offsets = []
    start = 0
    while True:
        i = data.find(MAGIC, start)
        if i < 0:
            break
        magic_offsets.append(i)
        start = i + 1
    print(f"\n--- Vorkommen von Frame-Magic bf08ac29: {len(magic_offsets)} ---")
    for off in magic_offsets[:12]:
        before = data[max(0, off - 16):off]
        after = data[off:off + 48]
        print(f"  off={off:>9} ({off:#x})")
        print(f"      davor: {before.hex(' ')}")
        print(f"      ab    : {after.hex(' ')}")
    if len(magic_offsets) > 1:
        gaps = [b - a for a, b in zip(magic_offsets, magic_offsets[1:])]
        print(f"\n  Abstände zwischen Frames: min={min(gaps)} max={max(gaps)} "
              f"median={sorted(gaps)[len(gaps) // 2]}")

    print("\n--- Entropie in 4-KiB-Blöcken (erste 20) ---")
    for i in range(0, min(len(data), 81920), 4096):
        print(f"  {i:>8}: {entropy(data[i:i + 4096]):.3f}")


if __name__ == "__main__":
    main()
