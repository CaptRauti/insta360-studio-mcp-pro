#!/usr/bin/env python3
"""Decide whether Studio's log payload is compressed or stream-cipher encrypted.

Container: [u32le length][bf08ac29][length bytes]

Tests, in order:
  1. standard decompressors (zlib/raw-deflate/lzma/bz2/zstd if available)
  2. reused-keystream detection: XOR of same-prefix frames shows structure
  3. block alignment / length multiples -- rules ECB/CBC in or out

Usage: python research/log_payload_probe.py <logfile>
"""
import bz2
import lzma
import struct
import sys
import zlib

MAGIC = bytes.fromhex("bf08ac29")


def frames(data):
    out = []
    pos = 16  # skip container header
    while pos + 8 <= len(data):
        (length,) = struct.unpack_from("<I", data, pos)
        if data[pos + 4:pos + 8] != MAGIC:
            pos += 1
            continue
        payload = data[pos + 8:pos + 8 + length]
        if len(payload) != length:
            break
        out.append((pos, payload))
        pos += 8 + length
    return out


def try_decompress(payload):
    attempts = {
        "zlib": lambda p: zlib.decompress(p),
        "deflate-raw": lambda p: zlib.decompress(p, -15),
        "gzip": lambda p: zlib.decompress(p, 31),
        "lzma": lzma.decompress,
        "lzma-raw": lambda p: lzma.decompress(p, format=lzma.FORMAT_ALONE),
        "bz2": bz2.decompress,
    }
    for name, fn in attempts.items():
        try:
            return name, fn(payload)
        except Exception:
            continue
    return None, None


def main():
    data = open(sys.argv[1], "rb").read()
    fr = frames(data)
    print(f"Datei {len(data)} Bytes, {len(fr)} Frames sauber geparst")
    lens = [len(p) for _o, p in fr]
    print(f"Payload-Längen: min={min(lens)} max={max(lens)} "
          f"multipeln_von_16={sum(1 for n in lens if n % 16 == 0)}/{len(lens)}")
    print()

    print("--- Dekompressionsversuche (erste 10 Frames) ---")
    ok = 0
    for off, payload in fr[:10]:
        name, res = try_decompress(payload)
        if name:
            ok += 1
            print(f"  off={off}: {name} -> {len(res)} Bytes")
            print(f"      {res[:160]!r}")
        else:
            print(f"  off={off}: kein Standardformat (len={len(payload)})")
    print(f"  => {ok}/10 dekomprimierbar\n")

    print("--- Reused-Keystream-Test: XOR aufeinanderfolgender Frames ---")
    for i in range(min(6, len(fr) - 1)):
        a, b = fr[i][1], fr[i + 1][1]
        n = min(len(a), len(b))
        x = bytes(p ^ q for p, q in zip(a[:n], b[:n]))
        zeros = sum(1 for c in x if c == 0)
        longest = cur = 0
        for c in x:
            cur = cur + 1 if c == 0 else 0
            longest = max(longest, cur)
        print(f"  Frame {i} vs {i+1}: len={n} Nullbytes={zeros} längste Nullserie={longest}")
        print(f"      XOR: {x[:48].hex(' ')}")
    print("\n  (viele Nullbytes => wiederverwendeter Keystream/ECB, also Verschlüsselung)")


if __name__ == "__main__":
    main()
