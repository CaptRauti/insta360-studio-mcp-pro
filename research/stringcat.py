"""Build a structured feature catalogue from the Studio translation files.

The JSON translation files are the authoritative catalogue of every UI string
the application can display. Grouping them by key prefix yields the complete
feature surface (panels, dialogs, settings, export options, error codes).
"""

from studioroot import ROOT  # noqa: E402  (install dir, resolved at import)
import json
import os
import re
import sys
from collections import Counter, defaultdict

TR = ROOT + r'\translations'
OUT = 'research/feature_catalog.json'

lang = sys.argv[1] if len(sys.argv) > 1 else 'de-DE'
path = os.path.join(TR, lang + '.json')
raw = json.load(open(path, encoding='utf-8'))
print(f'{lang}: {len(raw)} keys')

# Every translation file has the same key set; keep key -> value for the chosen lang.
flat = {}
for k, v in raw.items():
    if isinstance(v, str):
        flat[k] = v
    elif isinstance(v, dict):
        for k2, v2 in v.items():
            if isinstance(v2, str):
                flat[f'{k}.{k2}'] = v2
            else:
                flat[f'{k}.{k2}'] = json.dumps(v2, ensure_ascii=False)[:200]
print(f'flattened: {len(flat)}')

groups = defaultdict(list)
for k in sorted(flat):
    prefix = k.split('.')[0] if '.' in k else '(flat)'
    groups[prefix].append(k)

summary = {p: len(v) for p, v in sorted(groups.items(), key=lambda x: -len(x[1]))}
print('groups:', len(groups))
for p, n in list(summary.items())[:60]:
    print(f'  {n:5}  {p}')

cat = {
    'language': lang,
    'total_keys': len(flat),
    'groups': {p: {'count': len(v), 'keys': v} for p, v in groups.items()},
    'strings': flat,
}
with open(OUT, 'w', encoding='utf-8') as fh:
    json.dump(cat, fh, indent=1, ensure_ascii=False)
print(f'wrote {OUT} ({os.path.getsize(OUT)} bytes)')
