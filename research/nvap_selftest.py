"""Selbsttest des NVAP-Parsers.

Sichert die Faelle ab, die den Parser zuletzt gebrochen haben: hybride Header
(literale Signatur, invertierte Kopffelder) und die daraus folgenden
Archivbasen. Laeuft ohne Argumente, Exit-Code 1 bei Abweichung.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import nvap_extract as N  # noqa: E402
from studioroot import ROOT  # noqa: E402

EXPECTED_BASE = {'B2': (200, 8), 'DE': (224, 9)}
failures = []


def check(label, got, want):
    ok = got == want
    print('  %-56s %s' % (label, 'ok' if ok else 'FEHLER (%r != %r)' % (got, want)))
    if not ok:
        failures.append(label)


def target(cam):
    base = os.path.join(ROOT, 'Resources', 'filters', cam)
    for dirpath, _dirs, files in os.walk(base):
        for name in files:
            if name.endswith('.compoundcaption'):
                return os.path.join(dirpath, name)
    return None


def extract_any(data):
    """Dieselbe Reihenfolge wie main(): CD-Strategien, dann plain."""
    cd = N.parse_cd(data)
    if cd:
        strict, relaxed = N.find_bases(data, cd)
        for candidate in (strict, relaxed):
            if candidate is None:
                continue
            got = []
            for entry in cd:
                payload = N.read_entry(data, entry, candidate)
                if payload is not None and N.validate(entry['name'], payload):
                    got.append((entry['name'], payload))
            if got:
                return got
    return N.strategy_plain(data)


print('1. Hybride Header: literale Signatur bei invertierten Feldern')
for cam, (base, n_cd) in EXPECTED_BASE.items():
    path = target(cam)
    if not path:
        failures.append('%s fehlt' % cam)
        continue
    data = open(path, 'rb').read()
    cd = N.parse_cd(data)
    check('%s: CD-Eintraege' % cam, len(cd), n_cd)

    # Mindestens ein Eintrag muss die hybride Form tragen: Signatur literal,
    # Felder invertiert. Genau daran ist der alte Parser gescheitert.
    hybrid = 0
    for entry in cd:
        at = base + entry['lho']
        if data[at:at + 4] == N.LFH:
            lfh = N.parse_lfh(data, at, entry['name'])
            if lfh and lfh['inverted'] and lfh['name'] == entry['name']:
                hybrid += 1
    check('%s: hybride Header gefunden' % cam, hybrid > 0, True)
    print('       (%d von %d Eintraegen hybrid)' % (hybrid, len(cd)))

    strict, relaxed = N.find_bases(data, cd)
    check('%s: Basis (strict)' % cam, strict, base)
    check('%s: Basis (relaxed)' % cam, relaxed, base)

print('2. Abdeckung aller Container')
files = N.nvap_files(ROOT)
check('Container gefunden', len(files), 44)
empty, total = [], 0
for path in files:
    got = extract_any(open(path, 'rb').read())
    if not got:
        empty.append(os.path.basename(path))
    else:
        total += len(got)
check('Container ohne Eintraege', len(empty), 0)
check('Container mit Eintraegen', len(files) - len(empty), 44)
if empty:
    print('     betroffen: %s' % empty[:5])
print('     Eintraege gesamt: %d' % total)

print()
if failures:
    print('FEHLGESCHLAGEN: %d' % len(failures))
    sys.exit(1)
print('Alle Pruefungen bestanden.')
