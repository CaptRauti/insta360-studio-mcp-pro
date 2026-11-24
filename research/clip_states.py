#!/usr/bin/env python3
"""List per-project clip `state` values (and source trims) to spot poisoned templates.

A clip `state` of 1 means Studio could not re-attach the footage
("Medium wurde nicht gefunden"). Because the builder harvests clip models from
existing projects, one poisoned model propagates the flag into every new build.

Usage: python research/clip_states.py [studio_root]
"""
import collections
import glob
import json
import os
import sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else "D:/Dokumente/Insta360/Studio"


def main():
    projects = sorted(glob.glob(os.path.join(ROOT, "TimelineProject", "*", "*.insproj"))) + sorted(
        glob.glob(os.path.join(ROOT, "MCP_Tests", "*", "*.insproj"))
    )
    print("Projekt".ljust(22) + "built".ljust(7) + "state".ljust(14) + "src_l_trim".ljust(12) + "src_r_trim")
    print("-" * 74)
    for path in projects:
        if "_backup" in path:
            continue
        name = os.path.basename(os.path.dirname(path))
        built = "YES" if os.path.exists(os.path.join(os.path.dirname(path), ".mcp-built")) else "no"
        try:
            with open(path, encoding="utf-8") as fh:
                data = json.load(fh)
            clips = [c for t in (data.get("tracks") or []) for c in (t.get("clips") or [])]
        except Exception as exc:
            print(name.ljust(22) + built.ljust(7) + f"FEHLER {exc}")
            continue
        states = collections.Counter(c.get("state") for c in clips)
        lt = collections.Counter(c.get("source_left_trim") for c in clips)
        rt = collections.Counter(c.get("source_right_trim") for c in clips)
        print(name.ljust(22) + built.ljust(7) + str(dict(states)).ljust(14) + str(dict(lt)).ljust(12) + str(dict(rt)))


if __name__ == "__main__":
    main()
