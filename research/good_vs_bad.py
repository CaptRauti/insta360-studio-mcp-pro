#!/usr/bin/env python3
"""Diff a working Studio project against an MCP-built one, structurally.

The load failure is not in the container and not in the media file (a Studio
project holding the very same source videos loads fine). So the difference must
be in what we write: clip fields, or the project's media/footage section.

Usage: python research/good_vs_bad.py <good.insproj> <bad.insproj>
"""
import json
import sys


def load(path):
    with open(path, "rb") as fh:
        raw = fh.read()
    return json.loads(raw.decode("utf-8", "replace"))


def shape(value):
    if isinstance(value, dict):
        return f"dict({len(value)}) {list(value)[:8]}"
    if isinstance(value, list):
        head = shape(value[0]).split(" ")[0] if value else ""
        return f"list({len(value)}) of {head}"
    if isinstance(value, str):
        return f"str({len(value)}) {value[:60]!r}"
    return repr(value)


def top(path, label):
    d = load(path)
    print(f"### {label}: {path}")
    for k, v in d.items():
        print(f"   {k:<26} {shape(v)}")
    print()
    return d


def clip_fields(d):
    """All clips of the video track, as dicts."""
    for t in d.get("tracks", []):
        if t.get("type") == 0:
            return t.get("clips", [])
    return []


def main():
    good, bad = load(sys.argv[1]), load(sys.argv[2])
    top(sys.argv[1], "GUT (Studio)")
    top(sys.argv[2], "SCHLECHT (MCP)")

    print("### Top-Level-Schlüssel-Diff")
    for k in sorted(set(good) | set(bad)):
        if k not in good:
            print(f"   + nur SCHLECHT: {k}")
        elif k not in bad:
            print(f"   + nur GUT     : {k}")
    print()

    gc, bc = clip_fields(good), clip_fields(bad)
    print(f"### Clips: GUT {len(gc)}, SCHLECHT {len(bc)}\n")
    for i, (g, b) in enumerate(zip(gc, bc)):
        print(f"--- Clip {i}")
        gk, bk = set(g), set(b)
        for k in sorted(gk | bk):
            gv, bv = g.get(k, "<fehlt>"), b.get(k, "<fehlt>")
            if gv == bv:
                continue
            flag = "  <<< NUR HIER" if (k not in gk or k not in bk) else ""
            sv = json.dumps(gv, ensure_ascii=False) if not isinstance(gv, str) else gv
            bv2 = json.dumps(bv, ensure_ascii=False) if not isinstance(bv, str) else bv
            print(f"   {k}{flag}")
            print(f"       gut: {sv[:150]}")
            print(f"       mcp: {bv2[:150]}")
        print()


if __name__ == "__main__":
    main()
