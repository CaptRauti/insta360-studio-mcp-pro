import json, collections, sys, re

d = json.load(open('research/dll_paths.json', encoding='utf-8'))
keys = list(d.keys())

def rel(p):
    for m in ('studio_src-build' + chr(92), 'studio_src' + chr(92)):
        i = p.find(m)
        if i >= 0:
            return p[i + len(m):]
    return p

pat = sys.argv[1] if len(sys.argv) > 1 else None
limit = int(sys.argv[2]) if len(sys.argv) > 2 else 400

mods = collections.Counter()
for p in keys:
    r = rel(p)
    parts = r.split(chr(92))
    mods[chr(92).join(parts[:2]) if len(parts) > 1 else parts[0]] += 1

if pat is None:
    for k, v in mods.most_common(60):
        print(v, k)
else:
    out = [rel(p) for p in keys if re.search(pat, rel(p), re.I)]
    out.sort()
    print('MATCHES', len(out))
    for p in out[:limit]:
        print(p)
