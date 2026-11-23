"""Decompress the zlib/zstd payloads inside the extracted .rcc resources.

Qt6 rcc stores flagged entries compressed; QResource.data() hands back the
still-compressed blob, so every text resource needs a pass through zlib
(or zstd) before it is readable.
"""
import json
import os
import sys
import zlib

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'rcc', 'extracted')
OUT = os.path.join(HERE, 'rcc', 'decoded')

TEXT_EXT = {'.json', '.txt', '.qss', '.conf', '.svg', '.frag', '.vert',
            '.pem', '.html', '.js', '.xml'}

try:
    import zstandard
except ImportError:
    zstandard = None


def try_decompress(blob):
    """Return (data, how) or (None, None)."""
    for off in range(0, min(8, len(blob))):
        for name, fn in (('zlib', lambda b: zlib.decompress(b)),
                         ('deflate', lambda b: zlib.decompress(b, -15)),
                         ('gzip', lambda b: zlib.decompress(b, 47))):
            try:
                return fn(blob[off:]), f'{name}+{off}'
            except Exception:
                pass
    if zstandard is not None:
        for off in range(0, min(8, len(blob))):
            try:
                d = zstandard.ZstdDecompressor().decompressobj()
                return d.decompress(blob[off:]), f'zstd+{off}'
            except Exception:
                pass
    return None, None


def looks_like_text(b):
    if not b:
        return False
    sample = b[:4000]
    bad = sum(1 for c in sample if c < 9 or (13 < c < 32))
    return bad / len(sample) < 0.02


def main():
    stats = {'ok': 0, 'raw': 0, 'fail': 0}
    report = []
    for root, _dirs, files in os.walk(SRC):
        for name in files:
            src = os.path.join(root, name)
            rel = os.path.relpath(src, SRC)
            ext = os.path.splitext(name)[1].lower()
            blob = open(src, 'rb').read()
            if ext in TEXT_EXT or ext == '':
                data, how = try_decompress(blob)
                if data is not None and looks_like_text(data):
                    dest = os.path.join(OUT, rel)
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    open(dest, 'wb').write(data)
                    stats['ok'] += 1
                    report.append({'path': rel, 'how': how,
                                   'raw': len(blob), 'out': len(data)})
                    continue
                if looks_like_text(blob):
                    dest = os.path.join(OUT, rel)
                    os.makedirs(os.path.dirname(dest), exist_ok=True)
                    open(dest, 'wb').write(blob)
                    stats['raw'] += 1
                    continue
            stats['fail'] += 1

    with open(os.path.join(HERE, 'rcc', 'decode_report.json'), 'w',
              encoding='utf-8', newline='\n') as fh:
        json.dump(report, fh, indent=1)
    print(json.dumps(stats))
    print(f'decoded files: {stats["ok"]}, plain text: {stats["raw"]}, '
          f'skipped(binary): {stats["fail"]}')


if __name__ == '__main__':
    main()
