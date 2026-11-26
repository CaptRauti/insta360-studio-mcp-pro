"""Dump every short literal in a byte range of a binary, in offset order.

Studio's clip-serialisation key table is a dense run of short snake_case literals in
`Insta360 Studio.exe` (the worker DLL only carries them inside file-path strings). The
child keys of a struct we have never seen — `key_frame_track` — sit in the same table,
so printing the table's neighbourhood is how the schema gets drafted.

Usage: python research/dump_literals.py <bin> <start-hex> <end-hex> [maxlen]
"""

import re
import sys


def main():
    path = sys.argv[1]
    start = int(sys.argv[2], 16)
    end = int(sys.argv[3], 16)
    maxlen = int(sys.argv[4]) if len(sys.argv) > 4 else 48
    with open(path, "rb") as fh:
        data = fh.read()
    chunk = data[start:end]
    seen = set()
    for m in re.finditer(rb"[\x20-\x7e]{2,}", chunk):
        s = m.group().decode("latin-1")
        if len(s) > maxlen:
            continue
        if "\\" in s or "/" in s or ":" in s or " " in s:
            continue
        if s in seen:
            continue
        seen.add(s)
        print(f"{start + m.start():#010x} {s}")


if __name__ == "__main__":
    main()
