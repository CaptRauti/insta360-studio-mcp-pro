"""Warum scheitern B2, DE und eine Sticker-Datei? Signatur-Vergleich aller NVAP-Container.

Druckt pro Datei die NVAP-Kopffelder und welche ZIP-Signaturen vorkommen --
literal oder 0xFF-invertiert. Damit laesst sich sehen, ob den drei
Ausreissern eine Struktur fehlt (z. B. ein Central Directory) oder ob sie
einer anderen Konvention folgen.
"""

import os
import struct
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from studioroot import ROOT  # noqa: E402

MAGIC = b'NVAP'
SIGS = {
    'LFH_lit': b'PK\x03\x04',
    'LFH_inv': b'\xaf\xb4\xfc\xfb',
    'CD_lit': b'PK\x01\x02',
    'CD_inv': b'\xaf\xb4\xfe\xfd',
    'EOCD_lit': b'PK\x05\x06',
    'EOCD_inv': b'\xaf\xb4\xfa\xf9',
}


def find_nvap():
    out = []
    base = os.path.join(ROOT, 'Resources')
    for dirpath, _dirs, files in os.walk(base):
        for name in files:
            path = os.path.join(dirpath, name)
            try:
                with open(path, 'rb') as fh:
                    if fh.read(4) == MAGIC:
                        out.append(path)
            except OSError:
                pass
    return sorted(out)


def describe(path):
    with open(path, 'rb') as fh:
        data = fh.read()
    version, header_len, count = struct.unpack_from('<III', data, 4)
    u64_16, u64_24 = struct.unpack_from('<QQ', data, 16)
    row = {
        'name': os.path.basename(path),
        'rel': os.path.relpath(path, ROOT),
        'size': len(data),
        'version': version,
        'header_len': header_len,
        'count': count,
        'u64_16': u64_16,
        'u64_24': u64_24,
    }
    for key, sig in SIGS.items():
        row[key] = data.count(sig)
    # erste Position jeder Signatur, um die Archivbasis zu erkennen
    for key, sig in SIGS.items():
        pos = data.find(sig)
        row[key + '_at'] = pos if pos >= 0 else -1
    return row


def main():
    files = find_nvap()
    print('NVAP-Dateien:', len(files))
    rows = [describe(p) for p in files]

    # Ausreisser zuerst: keine lesbaren Eintraege laut Extraktor
    broken = [r for r in rows if r['CD_lit'] + r['CD_inv'] == 0]
    ok = [r for r in rows if r not in broken]

    print('\n=== Dateien ohne Central Directory (%d) ===' % len(broken))
    for r in broken:
        print('  %-46s %9d B  v=%d hlen=%d count=%d  u64@16=%d u64@24=%d' % (
            r['name'][:46], r['size'], r['version'], r['header_len'], r['count'],
            r['u64_16'], r['u64_24']))
        print('     LFH lit=%d inv=%d (at %d/%d)  EOCD lit=%d inv=%d' % (
            r['LFH_lit'], r['LFH_inv'], r['LFH_lit_at'], r['LFH_inv_at'],
            r['EOCD_lit'], r['EOCD_inv']))

    print('\n=== Vergleich: funktionierende Dateien (Auswahl) ===')
    seen = set()
    for r in ok:
        cam = r['rel'].split(os.sep)[1] if len(r['rel'].split(os.sep)) > 1 else '?'
        if cam in seen:
            continue
        seen.add(cam)
        print('  %-46s %9d B  count=%d  CD lit=%d inv=%d (at %d)  LFH lit=%d inv=%d' % (
            r['name'][:46], r['size'], r['count'], r['CD_lit'], r['CD_inv'],
            r['CD_lit_at'] if r['CD_lit_at'] >= 0 else r['CD_inv_at'],
            r['LFH_lit'], r['LFH_inv']))
        if len(seen) >= 6:
            break

    # Sticker: welche hat kein CD?
    print('\n=== Sticker-Dateien ohne CD ===')
    for r in broken:
        if 'sticker' in r['rel'].lower():
            print('  ', r['rel'])


if __name__ == '__main__':
    main()
