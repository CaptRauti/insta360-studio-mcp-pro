#!/usr/bin/env python3
"""Inventory every clip in every project: is the load failure traceable to a field?

Prints one row per video-track clip so state / sourceFrames / fps can be compared
across projects, and marks which projects are MCP-built (*.mcp-built present).

Usage: python research/clip_inventory.py [projects_root]
"""
import json
import os
import sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else r"D:/Dokumente/Insta360/Studio"
NAME_FMT = r"%LOCALAPPDATA%\Insta360\Insta360 Studio\nle\pro.insproj"


def registered():
    p = os.path.expandvars(NAME_FMT)
    try:
        d = json.load(open(p, encoding="utf-8"))
    except OSError:
        return set()
    e = d.get("projects") or d.get("projectList") or d
    if isinstance(e, dict):
        e = list(e.values())
    return {x.get("name") for x in e}


def main():
    reg = registered()
    print(f"registriert ({len(reg)}): {sorted(reg)}\n")
    hdr = f"{'Projekt':<18}{'reg':<4}{'cl':<3}{'datei':<34}{'srcFrm':>7}{'fps':>4}{'state':>6}{'lT':>4}{'rT':>4}  marker"
    print(hdr)
    print("-" * len(hdr))
    for dirpath, dirnames, filenames in os.walk(ROOT):
        if not any(f.endswith(".insproj") and not f.endswith("_backup.insproj") for f in filenames):
            continue
        built = os.path.exists(os.path.join(dirpath, ".mcp-built"))
        for f in filenames:
            if not f.endswith(".insproj") or f.endswith("_backup.insproj"):
                continue
            path = os.path.join(dirpath, f)
            try:
                d = json.load(open(path, encoding="utf-8", errors="replace"))
            except (OSError, ValueError) as exc:
                print(f"{os.path.basename(dirpath):<18} UNLESBAR: {exc}")
                continue
            name = d.get("name", os.path.basename(dirpath))
            for t in d.get("tracks", []):
                if t.get("type") != 0:
                    continue
                for i, c in enumerate(t.get("clips", [])):
                    print(f"{name[:17]:<18}{'ja' if name in reg else '-':<4}{i:<3}"
                          f"{os.path.basename(str(c.get('url', '')))[:33]:<34}"
                          f"{c.get('sourceFrames', '?'):>7}{c.get('fps', '?'):>4}"
                          f"{c.get('state', '?'):>6}{c.get('leftTrim', '?'):>4}"
                          f"{c.get('rightTrim', '?'):>4}  {'MCP' if built else 'studio'}")
                # non-video tracks that still hold clips are suspicious
                break
            for t in d.get("tracks", []):
                if t.get("type") != 0 and t.get("clips"):
                    print(f"{'  ^ extra track':<18}{'':<4}{'-':<3}type={t.get('type')} "
                          f"clips={len(t['clips'])} in {name}")


if __name__ == "__main__":
    main()
