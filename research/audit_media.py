#!/usr/bin/env python3
"""Audit every clip reference in every project against Studio's own footage index.

Why: a project whose clips point at media Studio never imported shows
"Medium wurde nicht gefunden" / "Einige Aufnahmen wurden wegen eines geänderten
Dateipfads nicht gefunden" (studio string `footage.persistence.lost.toast`).
Studio matches footage by path, so a clip is only usable when its `url`
- exists on disk, and
- appears as a `last_saved_media_id` in FootageProject/footage_mapping_index.json.

Usage: python research/audit_media.py [studio_root]
"""
import json
import os
import sys
import glob

ROOT = sys.argv[1] if len(sys.argv) > 1 else "D:/Dokumente/Insta360/Studio"
INDEX = os.path.join(ROOT, "FootageProject", "footage_mapping_index.json")


def norm(p):
    return (p or "").replace("\\", "/").lower()


def load_index():
    ids = set()
    with open(INDEX, encoding="utf-8") as fh:
        for entry in json.load(fh).get("entries", []):
            mid = entry.get("last_saved_media_id")
            if mid:
                ids.add(norm(mid))
    return ids


def clips(path):
    with open(path, encoding="utf-8") as fh:
        data = json.load(fh)
    out = []
    for track in data.get("tracks") or []:
        for clip in track.get("clips") or []:
            out.append(clip)
    return out


def main():
    indexed = load_index()
    projects = sorted(glob.glob(os.path.join(ROOT, "TimelineProject", "*", "*.insproj"))) + sorted(
        glob.glob(os.path.join(ROOT, "MCP_Tests", "*", "*.insproj"))
    )
    print(f"Studio-Stamm: {ROOT}")
    print(f"indexierte Medien: {len(indexed)}\n")
    print(f"{'Projekt':<24}{'built':<6}{'clips':<7}{'Datei fehlt':<13}{'nicht indexiert'}")
    print("-" * 74)
    bad = 0
    for path in projects:
        if "_backup" in path:
            continue
        name = os.path.basename(os.path.dirname(path))
        built = "YES" if os.path.exists(os.path.join(os.path.dirname(path), ".mcp-built")) else "no"
        try:
            rows = [(c.get("url") or "", c.get("name") or "") for c in clips(path)]
        except Exception as exc:  # unreadable project is itself a finding
            print(f"{name:<24}{built:<6}FEHLER {exc}")
            bad += 1
            continue
        miss = [u for u, _ in rows if not os.path.exists(u)]
        unidx = [u for u, _ in rows if u and norm(u) not in indexed]
        mark = "" if (not miss and not unidx) else "   <== PROBLEM"
        if mark:
            bad += 1
        print(f"{name:<24}{built:<6}{len(rows):<7}{len(miss):<13}{len(unidx)}{mark}")
        for u in (miss or unidx)[:4]:
            tag = "FEHLT    " if u in miss else "unindexed"
            print(f"        {tag} {u}")
    print(f"\nProjekte mit Problemen: {bad}/{len([p for p in projects if '_backup' not in p])}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
