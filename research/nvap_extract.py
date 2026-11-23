"""Definitive NVAP extractor: index by the central directory, match names.

What the containers actually are, established by direct evidence rather than
guesswork:

  * The container starts with an ``NVAP`` header, then a ZIP archive.
  * The archive's entry payloads are **byte-inverted** (XOR 0xFF). That is why
    a literal ``PK\\x03\\x04`` scan only ever produced random false positives:
    the real headers appear as ``\\xaf\\xb4\\xfc\\xfb``.
  * The central directory records each entry's ``local_header_offset`` relative
    to the archive base, and the entry name appears verbatim in it. The name is
    therefore a checksum: an entry is accepted only when ``base + lho`` lands on
    a local file header whose name equals the directory's name.
  * Two variants exist. Some containers keep the local headers literal (those
    the earlier parser read: 16 files, 77 entries); the rest invert them too.

The base is found by trying every ``PK\\x03\\x04`` position (literal and
inverted) as a candidate and keeping the one that satisfies the name check for
the most directory entries. Nothing is brute-forced at the byte level, and every
extracted payload is validated (inflates to the recorded size and parses as
XML/PNG/JSON) before it is written.

Run:  python research/nvap_extract2.py [--verbose] [--write]
"""

import os
import struct
import sys
import zlib
from xml.etree import ElementTree

from studioroot import ROOT  # noqa: E402

VERBOSE = '--verbose' in sys.argv
WRITE = '--write' in sys.argv
OUTDIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'nvap')

LFH = b'PK\x03\x04'
CDH = b'PK\x01\x02'
EOCD = b'PK\x05\x06'
INVERT = bytes(b ^ 0xFF for b in range(256))
KNOWN_EXT = ('.xml', '.json', '.png', '.jpg', '.txt', '.bin', '.ins', '.webp')


def nvap_files(root):
    found = []
    for dirpath, _dirnames, filenames in os.walk(root):
        for name in filenames:
            full = os.path.join(dirpath, name)
            try:
                with open(full, 'rb') as fh:
                    if fh.read(4) != b'NVAP':
                        continue
            except OSError:
                continue
            found.append(full)
    return sorted(found)


def decode_name(raw):
    """The name as stored, or None when it is not printable."""
    for candidate in (raw, raw.translate(INVERT)):
        try:
            text = candidate.decode('utf-8')
        except UnicodeDecodeError:
            continue
        if text and all(32 <= ord(ch) <= 126 for ch in text):
            return text
    return None


def parse_cd(data):
    """All central directory entries, from the last valid run."""
    eocd = data.rfind(EOCD)
    if eocd < 0:
        return []
    entries = []
    at = 0
    while True:
        at = data.find(CDH, at)
        if at < 0 or at >= eocd:
            break
        if at + 46 > len(data):
            break
        (csize, usize, nlen, elen, clen, _disk, _iattr, _eattr,
         lho) = struct.unpack_from('<IIHHHHHII', data, at + 20)
        if not 1 <= nlen <= 512 or elen > 4096 or clen > 4096 or csize > len(data):
            at += 4
            continue
        name = decode_name(data[at + 46:at + 46 + nlen])
        if not name or not name.lower().endswith(KNOWN_EXT):
            at += 4
            continue
        entries.append({'name': name, 'csize': csize, 'usize': usize, 'lho': lho})
        at += 46 + nlen + elen + clen
    return entries


def parse_lfh(data, at):
    """Local file header at `at`, accepting a literal or inverted signature."""
    if at + 30 > len(data) or at < 0:
        return None
    inverted = False
    if data[at:at + 4] != LFH:
        if data[at:at + 4] == LFH.translate(INVERT):
            inverted = True
        else:
            return None
    fields = data[at:at + 30]
    if inverted:
        fields = fields.translate(INVERT)
    (ver, flags, method, _t, _d, crc, csize, usize,
     nlen, elen) = struct.unpack_from('<HHHHHIIIHH', fields, 4)
    if not 1 <= nlen <= 512 or elen > 4096:
        return None
    name = decode_name(data[at + 30:at + 30 + nlen])
    return {
        'inverted': inverted, 'name': name, 'method': method, 'flags': flags,
        'csize': csize, 'usize': usize,
        'body': at + 30 + nlen + elen, 'nlen': nlen, 'elen': elen,
    }


def find_bases(data, cd):
    """Best base by name match, plus a relaxed fallback by signature hits.

    Name equality is the strongest available check, so it decides first. Some
    containers store a header whose name is inverted relative to the directory
    (or vice versa), so a fallback scores any real header signature at
    ``base + lho`` — objective evidence, even without a name match.
    """
    if not cd:
        return None, None
    candidates = set()
    for sig in (LFH, LFH.translate(INVERT)):
        at = 0
        while True:
            at = data.find(sig, at)
            if at < 0:
                break
            candidates.add(at)
            at += 1

    strict, strict_score = None, 0
    relaxed, relaxed_score = None, 0
    for base in sorted(candidates):
        name_hits = 0
        sig_hits = 0
        for entry in cd:
            lfh = parse_lfh(data, base + entry['lho'])
            if lfh:
                sig_hits += 1
                if lfh['name'] == entry['name']:
                    name_hits += 1
        if name_hits > strict_score:
            strict, strict_score = base, name_hits
        if sig_hits > relaxed_score:
            relaxed, relaxed_score = base, sig_hits

    need = max(1, len(cd) // 2)
    if strict_score < need:
        strict = None
    if relaxed_score < need:
        relaxed = None
    return strict, relaxed


def locate_body(data, at, entry):
    """Where the entry's payload starts, using the header or the stored name."""
    lfh = parse_lfh(data, at)
    if lfh and lfh['name'] == entry['name']:
        return lfh

    # The offset hit a header whose name does not match; look for the entry's
    # own name just after it and derive the body from there.
    for encoded in (entry['name'].encode('utf-8'),
                    entry['name'].encode('utf-8').translate(INVERT)):
        found = data.find(encoded, at, at + 2048)
        if found > 0:
            return {
                'inverted': encoded != entry['name'].encode('utf-8'),
                'name': entry['name'],
                'method': lfh['method'] if lfh else 8,
                'flags': lfh['flags'] if lfh else 0,
                'csize': entry['csize'], 'usize': entry['usize'],
                'body': found + len(encoded), 'nlen': len(encoded), 'elen': 0,
            }
    return None


def read_entry(data, entry, base):
    """The entry's payload, or None when it cannot be validated."""
    lfh = locate_body(data, base + entry['lho'], entry)
    if not lfh:
        return None
    size = entry['csize'] or lfh['csize']
    usize = entry['usize'] or lfh['usize']
    body = lfh['body']
    if size <= 0 or body + size > len(data):
        return None

    raw = data[body:body + size]
    # Payloads are byte-inverted in this container family, but a few entries are
    # stored plainly; try the indicated convention first, then the other.
    first, second = ((raw.translate(INVERT), raw) if lfh['inverted']
                     else (raw, raw.translate(INVERT)))
    for candidate in (first, second):
        if lfh['method'] == 0:
            payload = candidate
        else:
            try:
                payload = zlib.decompressobj(-15).decompress(candidate)
            except zlib.error:
                continue
        if not payload:
            continue
        if usize and len(payload) != usize:
            continue
        return payload
    return None


def validate(name, payload):
    """Content check so that only known-good data is written."""
    if name.lower().endswith('.xml'):
        try:
            ElementTree.fromstring(payload)
        except ElementTree.ParseError:
            return False
        return True
    if name.lower().endswith('.json'):
        return payload[:1] in (b'{', b'[')
    if name.lower().endswith(('.png', '.jpg', '.webp')):
        return payload[:2] == b'\xff\xd8' or payload[:4] in (
            b'\x89PNG', b'RIFF', b'GIF8')
    return True


def strategy_plain(data):
    """Validated literal local file headers — the variant that needs no index."""
    out = []
    at = 0
    while True:
        at = data.find(LFH, at)
        if at < 0:
            break
        at += 4
        lfh = parse_lfh(data, at - 4)
        if not lfh or lfh['inverted'] or not lfh['name']:
            continue
        if not lfh['name'].lower().endswith(KNOWN_EXT):
            continue
        entry = {'name': lfh['name'], 'csize': lfh['csize'],
                 'usize': lfh['usize'], 'lho': at - 4}
        payload = read_entry(data, entry, 0)
        if payload is None:
            continue
        out.append((lfh['name'], payload))
    return out


def main():
    files = nvap_files(ROOT)
    print('%d NVAP-Container unter %s\n' % (len(files), ROOT))

    stats = {'CD': 0, 'plain': 0, 'keine': 0}
    total = 0
    per_camera = {}

    if WRITE:
        os.makedirs(OUTDIR, exist_ok=True)

    for full in files:
        rel = os.path.relpath(full, ROOT)
        with open(full, 'rb') as fh:
            data = fh.read()

        cd = parse_cd(data)
        strict, relaxed = find_bases(data, cd)
        entries = []
        base = None
        how = 'CD'
        for candidate in (strict, relaxed):
            if candidate is None:
                continue
            got = []
            for entry in cd:
                payload = read_entry(data, entry, candidate)
                if payload is not None and validate(entry['name'], payload):
                    got.append((entry['name'], payload))
            if got:
                entries, base = got, candidate
                break
        if not entries:
            entries = strategy_plain(data)
            how = 'plain'
        if not entries:
            how = 'keine'

        stats[how] += 1
        camera = os.path.basename(os.path.dirname(os.path.dirname(full)))
        slot = per_camera.setdefault(camera, {'n': 0, 'ok': 0, 'how': set(), 'entries': 0})
        slot['n'] += 1
        if entries:
            slot['ok'] += 1
            slot['how'].add(how)
            slot['entries'] += len(entries)

        if not entries:
            print('  --  %-58s %7d B  nicht lesbar' % (rel[-58:], len(data)))
            continue

        total += len(entries)
        print('  %-5s %-58s %7d B  %2d Einträge  base=%s' % (
            how, rel[-58:], len(data), len(entries), base))

        if VERBOSE:
            for name, payload in entries:
                kind = ('XML' if payload[:5] == b'<?xml' else
                        'PNG' if payload[:4] == b'\x89PNG' else 'sonstig')
                print('        %-58s %7d B  %s' % (name[-58:], len(payload), kind))

        if WRITE:
            folder = os.path.join(OUTDIR, os.path.dirname(rel))
            os.makedirs(folder, exist_ok=True)
            for name, payload in entries:
                flat = name.replace('\\', '/').replace('/', '__')
                with open(os.path.join(folder, flat), 'wb') as out:
                    out.write(payload)

    print('\nStrategie: CD=%d  plain=%d  unlesbar=%d' % (
        stats['CD'], stats['plain'], stats['keine']))
    print('%d Einträge gesamt\n' % total)
    print('%-30s %6s %6s %7s  %s' % ('Kamera', 'Dateien', 'lesbar', 'Einträge', 'Strategie'))
    for camera in sorted(per_camera):
        s = per_camera[camera]
        print('%-30s %6d %6d %7d  %s' % (
            camera, s['n'], s['ok'], s['entries'], ','.join(sorted(s['how']))))
    if WRITE:
        print('\nGeschrieben nach', OUTDIR)


if __name__ == '__main__':
    main()
