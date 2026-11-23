"""Find gRPC service registration paths and port hints in the Studio binaries."""

from studioroot import ROOT  # noqa: E402  (install dir, resolved at import)
import os
import re
import sys

BASE = ROOT
TARGETS = [
    'studio-exporter-service.exe',
    'studio-thumbnail-service.exe',
    'studio_worker.dll',
    'Insta360 Studio.exe',
]

SVC = re.compile(rb'/service\.[A-Za-z0-9_.]+/[A-Za-z0-9_]+')
PORT = re.compile(rb'(?:127\.0\.0\.1|localhost|0\.0\.0\.0):([0-9]{2,5})')


def main():
    for fn in TARGETS:
        p = os.path.join(BASE, fn)
        if not os.path.exists(p):
            continue
        d = open(p, 'rb').read()
        print('=' * 70)
        print(fn, f'{len(d):,} bytes')
        svcs = sorted(set(m.group().decode() for m in SVC.finditer(d)))
        print(f'  service paths: {len(svcs)}')
        for s in svcs:
            print('    ', s)
        ports = sorted(set(int(m.group(1)) for m in PORT.finditer(d)))
        print(f'  ip:port hints: {ports}')
        # naked port args
        for m in re.finditer(rb'--[a-z_-]*port[a-z_-]*[= ]?([0-9]{2,5})', d):
            print('    flag:', m.group().decode())
        print()


if __name__ == '__main__':
    main()
