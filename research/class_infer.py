#!/usr/bin/env python3
"""Class inference per position: which key makes every observation a digit?

The failure mode of the plain per-position estimator is ambiguity, not wrongness.
Where the plaintext alphabet is small (a field of digits) every key that keeps the
bytes printable scores the same, so the search returns an arbitrary one. Restricting
the class breaks the tie: with ~10 evenly spread observations at a position exactly
one key maps all of them onto '0'..'9', and that key is not a guess.

So for each position, count how many keys satisfy "all observations are digits",
"all are hex", "all are letters", "all are printable" and print the decoded value
distribution under the surviving digit key. The distribution is what identifies the
field (an hour tens digit shows 0/1/2, a millisecond shows 0..9 evenly).

Usage: python research/class_infer.py "<logdir>"
"""
import collections
import glob
import os
import struct
import sys

MAGIC = bytes.fromhex("bf08ac29")


def parse(path, limit=None):
    data = open(path, "rb").read()
    out, pos = [], 16
    while pos + 8 <= len(data):
        (n,) = struct.unpack_from("<I", data, pos)
        if data[pos + 4:pos + 8] != MAGIC:
            pos += 1
            continue
        out.append(data[pos + 8:pos + 8 + n])
        if limit and len(out) >= limit:
            break
        pos += 8 + n
    return out


def main():
    root = sys.argv[1]
    samples = []
    for f in sorted(glob.glob(os.path.join(root, "**", "*.log"), recursive=True)):
        if os.path.getsize(f) < 2048:
            continue
        fr = parse(f, limit=1)
        if fr:
            samples.append(fr[0])
    length = max(len(s) for s in samples)
    print(f"{len(samples)} Frames (Frame 0 jeder Datei), max {length} Byte\n")

    digits = {ord(c) for c in "0123456789"}
    hexd = set(digits) | {ord(c) for c in "abcdefABCDEF"}
    letters = {ord(c) for c in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"}
    printable = set(range(32, 127)) | {9, 10, 13}

    print("Pos  #dist  keys(digit/hex/alpha/print)   digitale Deutung (Wert xAnzahl)"
          "                     haeufigste Bytes")
    for j in range(length):
        hist = collections.Counter(s[j] for s in samples if j < len(s))
        obs = list(hist)
        kd = [k for k in range(256) if all((b ^ k) in digits for b in obs)]
        kh = [k for k in range(256) if all((b ^ k) in hexd for b in obs)]
        ka = [k for k in range(256) if all((b ^ k) in letters for b in obs)]
        kp = sum(1 for k in range(256) if all((b ^ k) in printable for b in obs))
        lay = ""
        if len(kd) == 1:
            k = kd[0]
            vals = sorted(collections.Counter(chr(b ^ k) for b in obs if True).items(),
                          key=lambda kv: -kv[1])
            # decode with counts
            cc = collections.Counter(b ^ k for b in (s[j] for s in samples if j < len(s)))
            lay = "".join(f"{chr(v)}x{n} " for v, n in sorted(cc.items(), key=lambda kv: -kv[1])[:6])
        print(f"{j:3}  {len(hist):4}   {len(kd):2}/{len(kh):2}/{len(ka):3}/{kp:3}          "
              f"{lay:52} {' '.join(f'{b:02x}' for b, _ in hist.most_common(4))}")


if __name__ == "__main__":
    main()
