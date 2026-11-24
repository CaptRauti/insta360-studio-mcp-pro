#!/usr/bin/env python3
"""Locate Studio's log-container constants inside its own binaries.

Goal: find the code/constant that writes the 16-byte container header
(cd013a985f5beca1bcc1ca036aa5d1a0) and the bf08ac29 frame magic, so the AES-like
key/IV for the payload can be recovered from the surrounding data.

Usage: python research/find_log_crypto.py [studio_dir]
"""
import os
import sys

DEFAULT_DIR = os.path.expandvars(
    r"%LOCALAPPDATA%\Insta360\Apps\Insta360 Studio\current"
)
HEADER = bytes.fromhex("cd013a985f5beca1bcc1ca036aa5d1a0")
MAGIC = bytes.fromhex("bf08ac29")
EXT = (".exe", ".dll", ".so", ".node", ".js", ".py", ".dylib")
MAX_MB = 400


def hx(b):
    return b.hex(" ")


def printable(b):
    return "".join(chr(c) if 32 <= c < 127 else "." for c in b)


def scan(path, needles):
    try:
        size = os.path.getsize(path)
    except OSError:
        return []
    if size > MAX_MB * 1024 * 1024:
        return []
    hits = []
    try:
        with open(path, "rb") as fh:
            data = fh.read()
    except OSError:
        return []
    for label, needle in needles:
        start = 0
        while True:
            i = data.find(needle, start)
            if i < 0:
                break
            hits.append((label, i, data[max(0, i - 48):i + 64]))
            start = i + 1
            if len(hits) > 40:
                return hits
    return hits


def main():
    root = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_DIR
    print(f"Suche in: {root}\n")
    total = 0
    for dirpath, _dirs, files in os.walk(root):
        for name in files:
            if not name.lower().endswith(EXT):
                continue
            path = os.path.join(dirpath, name)
            hits = scan(path, [("HEADER", HEADER), ("MAGIC", MAGIC)])
            if not hits:
                continue
            total += len(hits)
            print(f"=== {path}")
            for label, off, ctx in hits:
                print(f"  [{label}] off={off} ({off:#x})")
                print(f"     {hx(ctx)}")
                print(f"     {printable(ctx)}")
    print(f"\nTreffer gesamt: {total}")


if __name__ == "__main__":
    main()
