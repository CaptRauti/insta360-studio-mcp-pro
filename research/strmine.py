"""Mine ASCII strings from studio_worker.dll (and friends) for option/param keys."""
import re, sys, os, json

TARGET = r'C:\Program Files\Insta360 Studio\studio_worker.dll'

def load(path):
    with open(path, 'rb') as f:
        return f.read()

def strings(data, minlen=4):
    return re.findall(rb'[\x20-\x7e]{%d,}' % minlen, data)

if __name__ == '__main__':
    pat = sys.argv[1] if len(sys.argv) > 1 else '.'
    minlen = int(sys.argv[2]) if len(sys.argv) > 2 else 4
    limit = int(sys.argv[3]) if len(sys.argv) > 3 else 200
    d = load(TARGET)
    ss = [s.decode('latin-1') for s in strings(d, minlen)]
    rx = re.compile(pat, re.I)
    hits = []
    seen = set()
    for s in ss:
        if s in seen:
            continue
        seen.add(s)
        if rx.search(s):
            hits.append(s)
    print('TOTAL_STRINGS', len(ss), 'UNIQUE', len(seen), 'MATCHES', len(hits))
    for h in hits[:limit]:
        print(h)
