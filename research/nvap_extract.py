"""Unpack NVAP containers (streamed ZIP entries, no central directory).

Layout:
  "NVAP" | u32 version | u32 headerLen | u32 count | ...
`count` is the number of ZIP entries. Each entry is a plain local file header
(PK\\x03\\x04) followed by the payload and a 16-byte data descriptor. There is
no end-of-central-directory record, so zipfile cannot open these files — walk
the local headers instead.

Two correctness traps, both hit while writing this:
  * raw payload bytes throw many false PK\\x03\\x04 matches, so validate every
    candidate header (version 20, method 0/8, sane name length) — a false match
    truncates the walk;
  * call flush() on the decompress object, otherwise the final block is lost.

Some containers still yield short or undecompressable entries. Those payloads
are dropped instead of written, so everything in the output directory is
known-good. Pass --verbose to see which containers came out partial.
"""
import argparse
import json
import os
import re
import struct
import xml.etree.ElementTree as ET
import zlib

ROOT = r'C:\Program Files\Insta360 Studio'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'nvap')

SAFE = re.compile(r'^[A-Za-z0-9._/\-]+$')
PNG_MAGIC = b'\x89PNG\r\n\x1a\n'


def header(data):
    magic, ver, hdr_len, count = struct.unpack_from('<4sIII', data, 0)
    return {'magic': magic.decode('latin1'), 'version': ver,
            'headerLen': hdr_len, 'count': count}


def local_header(data, pos):
    if pos + 30 > len(data) or data[pos:pos + 4] != b'PK\x03\x04':
        return None
    ver, _flags, method, _t, _d, _crc, csize, usize, nlen, elen = \
        struct.unpack_from('<HHHHHIIIHH', data, pos + 4)
    if ver != 20 or method not in (0, 8) or not 0 < nlen < 300:
        return None
    if pos + 30 + nlen > len(data):
        return None
    name = data[pos + 30:pos + 30 + nlen].decode('utf-8', 'replace')
    if not SAFE.match(name):
        return None
    return {'name': name, 'method': method, 'csize': csize, 'usize': usize,
            'dataStart': pos + 30 + nlen + elen}


def payload_of(data, hdr):
    if hdr['method'] == 0:
        return data[hdr['dataStart']:hdr['dataStart'] + hdr['usize']]
    dobj = zlib.decompressobj(-15)
    out = dobj.decompress(data[hdr['dataStart']:])
    out += dobj.flush()          # without this the last block is dropped
    return out


def is_valid(name, payload, usize):
    """Only trust payloads that are self-evidently complete."""
    if not payload:
        return False
    if usize and len(payload) != usize:
        return False
    low = name.lower()
    if low.endswith('.xml'):
        try:
            ET.fromstring(payload)
        except ET.ParseError:
            return False
        return True
    if low.endswith('.png'):
        return payload.startswith(PNG_MAGIC)
    if low.endswith('.json'):
        try:
            json.loads(payload.decode('utf-8-sig'))
        except Exception:
            return False
        return True
    return True


def scan(data):
    out = []
    pos = 0
    while True:
        i = data.find(b'PK\x03\x04', pos)
        if i < 0:
            break
        hdr = local_header(data, i)
        if hdr:
            try:
                hdr['payload'] = payload_of(data, hdr)
            except zlib.error:
                hdr['payload'] = None
            out.append(hdr)
        pos = i + 4
    return out


def sanitize(name):
    parts = [p for p in name.replace('\\', '/').split('/')
             if p not in ('', '.', '..')]
    return os.path.join(*parts) if parts else 'unnamed'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--verbose', action='store_true')
    args = ap.parse_args()

    targets = []
    for dirpath, _dirnames, filenames in os.walk(ROOT):
        for fn in filenames:
            if fn.endswith('.compoundcaption') or '.animatedsticker' in fn:
                targets.append(os.path.join(dirpath, fn))
    targets.sort()

    full, partial, failed = [], [], []
    ext_counter = {}
    written = 0
    manifest = {}
    for p in targets:
        data = open(p, 'rb').read()
        hdr = header(data)
        rel = os.path.relpath(p, ROOT)
        found = scan(data)
        good = [h for h in found
                if h['payload'] and is_valid(h['name'], h['payload'], h['usize'])]

        dest = os.path.join(OUT, os.path.splitext(rel)[0].replace(os.sep, '__'))
        names = []
        for h in good:
            target = os.path.join(dest, sanitize(h['name']))
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, 'wb') as fh:
                fh.write(h['payload'])
            names.append(h['name'])
            written += 1
            ext = os.path.splitext(h['name'])[1].lower() or '(none)'
            ext_counter[ext] = ext_counter.get(ext, 0) + 1

        manifest[rel] = {'declaredEntries': hdr['count'],
                         'found': len(found), 'written': names}
        if not names:
            failed.append((rel, hdr['count']))
        elif len(names) == hdr['count']:
            full.append(rel)
        else:
            partial.append((rel, hdr['count'], len(names)))

    with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as fh:
        json.dump(manifest, fh, indent=1, ensure_ascii=False)

    print(f'Container: {len(targets)}')
    print(f'  vollstaendig : {len(full)}')
    print(f'  teilweise    : {len(partial)}')
    print(f'  nicht lesbar : {len(failed)}')
    print(f'Eintraege geschrieben: {written}')
    print('Dateitypen:')
    for ext, c in sorted(ext_counter.items(), key=lambda kv: -kv[1]):
        print(f'   {ext:14s} {c}')
    if args.verbose:
        for rel, want, got in partial:
            print(f'  TEILWEISE {want}->{got}  {rel}')
        for rel, want in failed:
            print(f'  NICHT LESBAR (count={want})  {rel}')
    print(f'-> {OUT}')


if __name__ == '__main__':
    main()
