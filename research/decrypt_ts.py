#!/usr/bin/env python3
"""Decrypt with the timestamp crib taken from the session directory name.

Two facts make this exact rather than heuristic:

  * the keystream is GLOBAL (identical in every Studio log), so key bytes found
    in one file are valid in all of them;
  * the session directory is named YYYY_MM_DD_HH_MM_SS_<pid>, and the timestamp
    solver (header_align.py) proved that the log line opens with characters 8..18
    of that stamp, i.e. 'DD HH:MM:SS' -- the literal offset of a line's own time.

So for each file: K[j] = C_frame0[j] ^ stamp[8+j] for j = 0..10. The stamp can be
off by a second or a minute on a minority of files (the directory records the
process start, not the first log line), so every file votes and the modal byte per
position wins. Positions 12..14 are milliseconds digits, 15+ is header tail and
message; those come from the pooled character estimate.

Usage: python research/decrypt_ts.py "<logdir>" [outfile] [n_files]
"""
import collections
import glob
import os
import re
import string
import struct
import sys

MAGIC = bytes.fromhex("bf08ac29")
DIR_RE = re.compile(r"(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})")

# Flat objective: printable characters all score the same, everything else is
# penalised hard. A frequency prior is actively harmful here -- a wrong key that
# maps a repeated letter onto the high-weight space wins a frequency vote, which is
# exactly what garbled the message region on the first try. "Is this text at all"
# is what discriminates a right key from a wrong one.
WEIGHT = {chr(c): (1.0 if 32 <= c < 127 or c in (9, 10, 13) else -8.0)
          for c in range(256)}


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


def stamp(path):
    m = DIR_RE.search(os.path.basename(os.path.dirname(path)))
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)} {m.group(4)}:{m.group(5)}:{m.group(6)}" \
        if m else None


def main():
    root, out_path = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else None)
    files = [f for f in sorted(glob.glob(os.path.join(root, "**", "*.log"), recursive=True))
             if os.path.getsize(f) > 2048 and stamp(f)]
    crib_len = 11

    # 1. key bytes 0..10: every file votes from its own directory stamp
    votes = [collections.Counter() for _ in range(crib_len)]
    usable = []
    for f in files:
        fr = parse(f, limit=3)
        if not fr:
            continue
        usable.append((f, fr))
        st = stamp(f)
        crib = st[8:8 + crib_len].encode()
        if len(crib) < crib_len:
            continue
        per_file = [collections.Counter() for _ in range(crib_len)]
        for frame in fr[:3]:
            for j in range(crib_len):
                if j < len(frame):
                    per_file[j][frame[j] ^ crib[j]] += 1
        for j in range(crib_len):
            if per_file[j]:
                votes[j][per_file[j].most_common(1)[0][0]] += 1
    ks = bytearray(max(len(f) for _p, fr in usable for f in fr))
    for j in range(crib_len):
        ks[j] = votes[j].most_common(1)[0][0]

    # 2. pooled estimate for the rest, with the class of each known position
    samples = [f for _p, fr in usable for f in fr]
    length = max(len(s) for s in samples)
    cols = [collections.Counter() for _ in range(length)]
    for s in samples:
        for j, b in enumerate(s):
            cols[j][b] += 1
    classes = {11: ".", 12: "#", 13: "#", 14: "#"}
    for j in range(crib_len, length):
        hist = cols[j]
        if not hist:
            continue
        allowed = (set(string.digits) if classes.get(j) == "#"
                   else {classes[j]} if j in classes else None)
        best, bestk = None, None
        for k in range(256):
            score = 0.0
            for b, cnt in hist.items():
                c = b ^ k
                w = WEIGHT.get(chr(c), -6.0) if allowed is None \
                    else (WEIGHT.get(chr(c), -6.0) if c in [ord(x) for x in allowed] else -6.0)
                score += cnt * w
            if best is None or score > best:
                best, bestk = score, k
        ks[j] = bestk

    print(f"{len(usable)} Dateien, Keyspalte 0..10 aus {sum(sum(v.values()) for v in votes)} "
          f"Stimmen", file=sys.stderr)
    print("K[0..14] = " + ks[:15].hex(" "), file=sys.stderr)

    ruler = "".join(str(j % 10) for j in range(60))
    print("     " + ruler)
    print("     " + "".join("|" if j % 10 == 0 else " " for j in range(60)))
    for f, fr in usable[:6]:
        for i in range(min(2, len(fr))):
            line = bytes(b ^ ks[j] for j, b in enumerate(fr[i][:60])).decode("utf-8", "replace")
            print(f"{os.path.basename(os.path.dirname(f))[:20]}#{i:<2} {line}")

    if out_path:
        with open(out_path, "w", encoding="utf-8", newline="\n") as fh:
            for f, fr in usable:
                fh.write(f"########## {f}\n")
                for frame in fr:
                    fh.write(bytes(b ^ ks[j] for j, b in enumerate(frame[:len(ks)]))
                             .decode("utf-8", "replace") + "\n")
        print(f"geschrieben: {out_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
