"""Print the JSON-key neighbourhood of a literal in studio_worker.dll.

The clip record in an `.insproj` is written as JSON by Studio's own C++ serialiser, so
each JSON key is a standalone string literal and the keys of one struct are usually
emitted into the string table close to one another. Filtering to short literals (a
JSON key, not a file path or a log sentence) and printing a small window turns the
binary into a first draft of any schema we have never seen a row of.

Usage:
  python research/jsonkey_neighbours.py key_frame_track [window]
  python research/jsonkey_neighbours.py --list key_frame       # every literal, no window
"""

import os
import re
import sys

from studioroot import ROOT  # noqa: E402

TARGET = os.path.join(ROOT, "studio_worker.dll")


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    list_only = "--list" in sys.argv
    pattern = args[0] if args else "key_frame_track"
    window = int(args[1]) if len(args) > 1 else 8
    target = TARGET
    for a in sys.argv[1:]:
        if a.startswith("--bin="):
            target = a.split("=", 1)[1]

    with open(target, "rb") as fh:
        data = fh.read()
    ss = [(m.start(), m.group().decode("latin-1")) for m in re.finditer(rb"[\x20-\x7e]{2,}", data)]

    # A JSON key is a short literal. Anything with a path separator, a space or a
    # colon is a message, not a key.
    def keyish(s):
        return 2 <= len(s) <= 40 and "\\" not in s and "/" not in s and " " not in s and ":" not in s

    hits = [i for i, (_o, s) in enumerate(ss) if pattern.lower() in s.lower()]
    print(f"# {TARGET}  {len(data):,} bytes, {len(ss):,} strings")
    print(f"# {len(hits)} literal(s) contain {pattern!r}\n")

    if list_only:
        for i in hits:
            print(f"  {ss[i][0]:#010x} {ss[i][1][:120]}")
        return

    for i in hits:
        if not keyish(ss[i][1]):
            continue
        print(f"===== #{i} {ss[i][1]!r} @ {ss[i][0]:#x} =====")
        lo, hi = max(0, i - window), min(len(ss), i + window + 1)
        for j in range(lo, hi):
            if not keyish(ss[j][1]):
                continue
            mark = ">>" if j == i else "  "
            print(f"{mark} {ss[j][0]:#010x} {ss[j][1]}")
        print()


if __name__ == "__main__":
    main()
