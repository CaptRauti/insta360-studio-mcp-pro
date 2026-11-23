"""Locate every file under the Studio install that actually carries the NVAP
container magic, and describe its header.

Earlier notes claimed the model files shared the NVAP container. They do not —
verify instead of assuming.
"""
import os
import struct

ROOT = r'C:\Program Files\Insta360 Studio'
MAGIC = b'NVAP'

hits = []
errors = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    for fn in filenames:
        p = os.path.join(dirpath, fn)
        try:
            with open(p, 'rb') as fh:
                head = fh.read(64)
        except OSError as exc:
            errors.append((p, str(exc)[:60]))
            continue
        if head[:4] == MAGIC:
            hits.append((p, os.path.getsize(p), head))

print(f'NVAP-Dateien: {len(hits)}   (nicht lesbar: {len(errors)})')
print()
by_ext = {}
for p, size, head in hits:
    ext = os.path.splitext(p)[1].lower()
    by_ext.setdefault(ext, []).append((p, size, head))
for ext, items in sorted(by_ext.items()):
    print(f'--- {ext}  ({len(items)} Dateien) ---')
    for p, size, head in items[:4]:
        ver, hdrlen, count = struct.unpack_from('<III', head, 4)
        print(f'   {os.path.basename(p)[:52]:54s} {size:>8}  '
              f'ver={ver} hdrLen={hdrlen} n={count}')
    print()

print('Nicht lesbare Dateien (Auszug):')
for p, e in errors[:5]:
    print('  ', p.replace(ROOT, '...'), '-', e)
