"""Summarise the source-path map extracted from studio_worker.dll."""
import json, collections, sys

d = json.load(open('research/dll_paths.json', encoding='utf-8'))
PRE = 'C:\\jenkins\\workspace\\Studio_Win\\build\\studio_src'
SEP = chr(92)  # backslash

rows = []
for p in d:
    rel = p.replace(PRE, '').lstrip(SEP).replace(SEP, '/')
    rows.append(rel)

depth = int(sys.argv[1]) if len(sys.argv) > 1 else 2
mod = collections.Counter()
for rel in rows:
    parts = rel.split('/')
    mod['/'.join(parts[:depth])] += 1

print('TOTAL', len(rows))
for k, v in mod.most_common(60):
    print(f'{v:5d}  {k}')

if len(sys.argv) > 2:
    pat = sys.argv[2]
    import re
    print('--- matching paths ---')
    for rel in sorted(rows):
        if re.search(pat, rel, re.I):
            print(' ', rel)
