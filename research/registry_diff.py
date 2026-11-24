#!/usr/bin/env python3
"""Compare pro.insproj registry entries: Studio-authored vs MCP-built.

The library card Studio shows is driven by the registry entry, not the .insproj
itself -- so a wrong entry (previewable, autoFps, projectMediaType, ...) explains
a stuck "Lade Dateien..." or a missing preview even when the project is fine.

Usage: python research/registry_diff.py [pro.insproj]
"""
import json
import os
import sys

DEFAULT = os.path.expandvars(
    r"%LOCALAPPDATA%\Insta360\Insta360 Studio\nle\pro.insproj"
)
CUSTOM_PREFIX = "mcp"

FIELDS = [
    "name", "projectPath", "previewable", "lowQualityProxyType", "projectMediaType",
    "autoFps", "fps", "frames", "aspectRatio", "isPanoramic", "adsorbable",
    "enableEffects", "mainMagnetizable", "markTrimIn", "markTrimEnd",
    "markTrimVisible", "id",
]


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT
    raw = open(path, encoding="utf-8").read()
    data = json.loads(raw)
    entries = data.get("projects") or data.get("projectList") or data
    if isinstance(entries, dict):
        entries = list(entries.values())

    print(f"{path}: {len(entries)} Einträge\n")
    ours = [e for e in entries if str(e.get("name", "")).startswith(CUSTOM_PREFIX)]
    studio = [e for e in entries if not str(e.get("name", "")).startswith(CUSTOM_PREFIX)]

    print(f"Studio-Projekte: {[e.get('name') for e in studio]}")
    print(f"MCP-Projekte   : {[e.get('name') for e in ours]}\n")

    def show(entry, label):
        print(f"--- {label}: {entry.get('name')}")
        for f in FIELDS:
            if f in entry:
                v = entry[f]
                print(f"      {f:<22} {v!r}")

    for e in studio:
        show(e, "STUDIO")
    print()
    for e in ours[:3]:
        show(e, "MCP")

    if studio and ours:
        print("\n=== Feld-Diff (Studio-Eintrag vs MCP-Eintrag) ===")
        s, o = studio[0], ours[0]
        keys = sorted(set(s) | set(o))
        for k in keys:
            sv, ov = s.get(k, "<fehlt>"), o.get(k, "<fehlt>")
            flag = "" if sv == ov else "   <-- ABWEICHUNG"
            print(f"  {k:<24} studio={sv!r:<34} mcp={ov!r}{flag}")


if __name__ == "__main__":
    main()
