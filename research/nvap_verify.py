"""Prueft alle extrahierten NVAP-Dateien: XML wohlgeformt, JSON parst, Bilder gueltig."""

import glob
import json
import os
import sys
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'research', 'nvap')

bad = []
counts = {'xml': 0, 'json': 0, 'png': 0, 'jpg': 0, 'other': 0}

for path in glob.glob(os.path.join(OUT, '**', '*'), recursive=True):
    if not os.path.isfile(path):
        continue
    name = os.path.basename(path).lower()
    data = open(path, 'rb').read()
    if name.endswith('.xml'):
        counts['xml'] += 1
        try:
            ET.fromstring(data)
        except ET.ParseError as exc:
            bad.append((path, 'XML: %s' % exc))
    elif name.endswith('.json'):
        counts['json'] += 1
        try:
            json.loads(data.decode('utf-8'))
        except Exception as exc:
            bad.append((path, 'JSON: %s' % exc))
    elif name.endswith('.png'):
        counts['png'] += 1
        if data[:4] != b'\x89PNG':
            bad.append((path, 'PNG-Signatur fehlt: %r' % data[:8]))
    elif name.endswith(('.jpg', '.jpeg')):
        counts['jpg'] += 1
        if data[:2] != b'\xff\xd8':
            bad.append((path, 'JPEG-Signatur fehlt: %r' % data[:8]))
    else:
        counts['other'] += 1
        bad.append((path, 'unbekannter Typ'))

total = sum(counts.values())
print('Dateien gesamt: %d  %s' % (total, counts))
print('Fehlerhaft:     %d' % len(bad))
for path, why in bad[:20]:
    print('  %s  -> %s' % (os.path.relpath(path, OUT), why))
