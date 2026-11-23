"""Extract QML singleton / type registrations and QML URI strings from Studio.exe."""

from studioroot import ROOT  # noqa: E402  (install dir, resolved at import)
import re
import sys

EXE = ROOT + r'\Insta360 Studio.exe'

# RegisterQmlSingleton / RegisterQtType / RegisterQmlType call sites leave the
# registered name as a plain C string nearby. Pull the whole RegisterQml* region.
PATTERNS = {
    'qml_uri': re.compile(rb'qrc:/[A-Za-z0-9_./-]+'),
    'singleton': re.compile(rb'studio::[A-Za-z0-9_:]+::Register[A-Za-z]+'),
    'uri': re.compile(rb'\b(?:Insta|Ins|Common|Studio|Cloud|Task)[A-Za-z0-9_]*\.[A-Za-z0-9_.]+'),
    'com_insta': re.compile(rb'com\.insta360\.[A-Za-z0-9_.]+'),
}


def main():
    with open(EXE, 'rb') as fh:
        d = fh.read()
    print(f'loaded {len(d):,} bytes', flush=True)
    for name, pat in PATTERNS.items():
        hits = sorted({m.group().decode('latin-1') for m in pat.finditer(d)})
        print(f'=== {name}: {len(hits)} unique')
        for h in hits[:80]:
            print('   ', h)
        print()


if __name__ == '__main__':
    main()
