#!/usr/bin/env python3
"""Solve the header layout of Studio's encrypted logs from the ciphertext alone.

The keystream is global (identical in every log file). That makes the layout
mechanically derivable, with no guessing about the timestamp format:

    if position j of frame 0 really carries character v of a file's timestamp,
    then C_j ^ v must be the SAME byte in every file -- because it IS the key K_j.

So for every position j we test which character of the caller's known timestamp
(the session directory name gives YYYY-MM-DD HH:MM:SS) makes that XOR constant
across all files. The winning character reveals both the layout and the key byte.
A position whose plaintext is identical in every file (punctuation, '2026-11')
cannot be pinned this way -- it is flagged KONSTANT and must be cribbed.

Usage: python research/header_align.py "<logdir>" [frames_per_file]
"""
import collections
import glob
import os
import re
import struct
import sys

MAGIC = bytes.fromhex("bf08ac29")
DIR_RE = re.compile(r"(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})")


def parse_first(path, n):
    data = open(path, "rb").read()
    frames, pos = [], 16
    while pos + 8 <= len(data) and len(frames) < n:
        (length,) = struct.unpack_from("<I", data, pos)
        if data[pos + 4:pos + 8] != MAGIC:
            pos += 1
            continue
        frames.append(data[pos + 8:pos + 8 + length])
        pos += 8 + length
    return frames


def stamp_of(path):
    """'YYYY-MM-DD HH:MM:SS' from the session directory name (the session start)."""
    m = DIR_RE.search(os.path.basename(os.path.dirname(path)))
    if not m:
        return None
    y, mo, d, h, mi, s = m.groups()
    return f"{y}-{mo}-{d} {h}:{mi}:{s}"


def main():
    root = sys.argv[1]
    rows = []
    for f in sorted(glob.glob(os.path.join(root, "**", "*.log"), recursive=True)):
        ts = stamp_of(f)
        if not ts or os.path.getsize(f) <= 2048:
            continue
        fr = parse_first(f, 1)
        if not fr:
            continue
        rows.append((ts, fr[0][:56]))
    print(f"{len(rows)} verschluesselte Logs mit Zeitstempel im Verzeichnisnamen\n")

    npos = max(len(h) for _t, h in rows)
    npos = min(npos, 56)
    ruler = "".join(str(j % 10) for j in range(npos))
    print(f"{'pos':>4} {'bester Kandidat':>16} {'Konstanz':>9}  {'K':>4}   Interpretation")
    print("-" * 78)
    layout = {}
    for j in range(npos):
        candidates = {}
        for i in range(19):  # the 19 characters of 'YYYY-MM-DD HH:MM:SS'
            keys = collections.Counter(h[j] ^ ord(ts[i]) for ts, h in rows if j < len(h))
            k, n = keys.most_common(1)[0]
            candidates[f"ts[{i}]={ts[i]!r}"] = (n / sum(keys.values()), k)
        # a plain constant hypothesis: the char never changes between files
        cand = collections.Counter(h[j] for _ts, h in rows if j < len(h))
        kb, nb = cand.most_common(1)[0]
        candidates["<konstant>"] = (nb / sum(cand.values()), kb)
        best, (frac, key) = max(candidates.items(), key=lambda kv: kv[1][0])
        n_distinct = len(cand)
        if n_distinct == 1 and frac < 0.999:
            note = "alle Dateien gleich -> Crib noetig"
        elif frac > 0.99:
            note = f"passt auf {best}"
            layout[j] = best
        else:
            note = f"unklar (distinkte Bytes: {n_distinct})"
        print(f"{j:>4} {best:>16} {frac:>8.1%}  {key:02x}   {note}")


if __name__ == "__main__":
    main()
