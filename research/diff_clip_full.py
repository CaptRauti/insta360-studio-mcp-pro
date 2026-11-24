#!/usr/bin/env python3
"""Recursive diff of two clip objects from two .insproj files.

Use it to compare a clip that Studio loads against one it rejects
("Medium wurde nicht gefunden" / clip stuck on "Lade Dateien…") for the
*identical* source file. Any field that differs is a candidate for why Studio
cannot re-attach the footage.

Usage: python research/diff_clip_full.py <projectA.insproj> <projectB.insproj> [url-substring]
"""
import json
import sys


def clips(path, needle=None):
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    out = []
    for track in data.get("tracks") or []:
        for clip in track.get("clips") or []:
            url = (clip.get("url") or "").replace("\\", "/")
            if needle is None or needle.lower() in url.lower():
                out.append(clip)
    return out


def flat(obj, prefix=""):
    if isinstance(obj, dict):
        for k in obj:
            yield from flat(obj[k], f"{prefix}.{k}" if prefix else str(k))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from flat(v, f"{prefix}[{i}]")
    else:
        yield prefix, obj


def main():
    a_path, b_path = sys.argv[1], sys.argv[2]
    needle = sys.argv[3] if len(sys.argv) > 3 else None
    a_list, b_list = clips(a_path, needle), clips(b_path, needle)
    if not a_list or not b_list:
        print(f"kein passender Clip A={len(a_list)} B={len(b_list)}")
        return 1
    a, b = a_list[0], b_list[0]
    print(f"A (soll laden) {a.get('name')} -- {a.get('url')}")
    print(f"B (kaputt)      {b.get('name')} -- {b.get('url')}")
    print(f"fps A={a.get('fps')} B={b.get('fps')}   sourceFrames A={a.get('sourceFrames')} B={b.get('sourceFrames')}")
    print()
    fa, fb = dict(flat(a)), dict(flat(b))
    only_a = [k for k in fa if k not in fb]
    only_b = [k for k in fb if k not in fa]
    diff = [k for k in fa if k in fb and fa[k] != fb[k]]
    print(f"nur in A ({len(only_a)}): {only_a}")
    print(f"nur in B ({len(only_b)}): {only_b}")
    print(f"\nunterschiedliche Werte ({len(diff)}):")
    for k in diff:
        print(f"  {k}\n    A = {str(fa[k])[:120]}\n    B = {str(fb[k])[:120]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
