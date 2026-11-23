"""Recursively unpack the Qt .rcc resources of Insta360 Studio.

Earlier attempt produced a flat name list. This walks the QResource tree
properly, keeps full paths, and writes every file's bytes to disk.

Run with the interpreter that has PySide6 installed.
"""
import json
import os
import sys

from PySide6 import QtCore

RCCS = [
    r"C:\Program Files\Insta360 Studio\Resources\insta360.rcc",
    r"C:\Program Files\Insta360 Studio\Resources\resource.rcc",
]
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'rcc', 'extracted')

manifest = []


def walk(path, outdir, depth=0):
    if depth > 24:
        return
    r = QtCore.QResource(path)
    if r.isDir():
        manifest.append({'kind': 'dir', 'path': path})
        for child in r.children():
            walk(path + '/' + child, outdir, depth + 1)
    elif r.isFile():
        data = bytes(r.data())
        manifest.append({'kind': 'file', 'path': path, 'size': len(data)})
        rel = path.lstrip(':/').replace(':', '_')
        dest = os.path.join(outdir, rel)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        try:
            with open(dest, 'wb') as fh:
                fh.write(data)
        except OSError as exc:
            print('  write fail', dest, exc)


def main():
    for rcc in RCCS:
        tag = os.path.splitext(os.path.basename(rcc))[0]
        outdir = os.path.join(OUT, tag)
        os.makedirs(outdir, exist_ok=True)
        ok = QtCore.QResource.registerResource(rcc)
        print(f'### {tag}: registered={bool(ok)}')
        walk(':/', outdir)
        QtCore.QResource.unregisterResource(rcc)

    with open(os.path.join(HERE, 'rcc', 'rcc_tree.json'), 'w',
              encoding='utf-8', newline='\n') as fh:
        json.dump(manifest, fh, indent=1)

    dirs = sum(1 for m in manifest if m['kind'] == 'dir')
    files = [m for m in manifest if m['kind'] == 'file']
    print(f'\nTOTAL dirs={dirs} files={len(files)} '
          f'bytes={sum(m.get("size", 0) for m in files)}')


if __name__ == '__main__':
    main()
