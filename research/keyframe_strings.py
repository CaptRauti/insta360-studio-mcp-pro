"""Dump the string neighbourhood of `key_frame_track` in studio_worker.dll.

The .insproj JSON is written by Studio's own C++ serialiser, so every JSON key is a
string literal in the binary and the literals of one struct sit close together. That
makes the raw string table a cheap first draft of any schema whose rows we have never
seen — `key_frame_track` is `{}` in every project on this machine.

Usage: python research/keyframe_strings.py [pattern] [window]
"""

import os
import re
import sys

from studioroot import ROOT  # noqa: E402

TARGET = os.path.join(ROOT, "studio_worker.dll")
pattern = sys.argv[1] if len(sys.argv) > 1 else "key_frame"
window = int(sys.argv[2]) if len(sys.argv) > 2 else 30


def strings_with_offsets(data, minlen=3):
    out = []
    for m in re.finditer(rb"[\x20-\x7e]{%d,}" % minlen, data):
        out.append((m.start(), m.group().decode("latin-1")))
    return out


def main():
    with open(TARGET, "rb") as fh:
        data = fh.read()
    print(f"# {TARGET}  {len(data):,} bytes")
    ss = strings_with_offsets(data)
    print(f"# {len(ss):,} strings >=3 chars")
    hits = [i for i, (_o, s) in enumerate(ss) if pattern.lower() in s.lower()]
    print(f"# {len(hits)} strings contain {pattern!r}")
    seen = set()
    for i in hits:
        lo, hi = max(0, i - window), min(len(ss), i + window + 1)
        key = (lo // 10, hi // 10)
        if key in seen:
            continue
        seen.add(key)
        print(f"\n===== around string #{i}: {ss[i][1]!r} (offset {ss[i][0]:#x}) =====")
        for j in range(lo, hi):
            mark = ">>" if j == i else "  "
            text = ss[j][1]
            print(f"{mark} {ss[j][0]:#010x} {text[:160]}")


if __name__ == "__main__":
    main()
