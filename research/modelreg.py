"""Extract Insta360 Studio's AI model registry from studio_worker.dll.

The DLL embeds a JSON registry that maps numeric model ids to model files.
Each entry looks like:

    {
        "id": 8005,
        "is_encrypt": false,
        "xml_model": {
            "model": "heat57KBare_0810e5c7.xml"
        }
    }

The group key (`mnn_model`, `xml_model`, `onnx_model`, `snpe_model`,
`json_info`) says which runtime loads the file; `is_encrypt: true` entries
carry an obfuscated filename and are the encrypted variant of the same id.
This is what makes the hash-named files under `data/` meaningful: the registry
is the only place the human-readable purpose survives.
"""
import json
import os
import re

DLL = r'C:\Program Files\Insta360 Studio\studio_worker.dll'
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'model_registry.json')

GROUP_KEYS = ('mnn_model', 'xml_model', 'onnx_model', 'snpe_model',
              'coreml_model', 'tnn_model', 'json_info')

# Tolerant: whitespace and key order vary between the three copies of the table.
ENTRY = re.compile(
    r'\{\s*"id"\s*:\s*(\d+)\s*,'
    r'\s*"is_encrypt"\s*:\s*(true|false)\s*,'
    r'\s*"(' + '|'.join(GROUP_KEYS) + r')"\s*:\s*\{(.*?)\}\s*\}',
    re.S)
FIELD = re.compile(r'"(\w+)"\s*:\s*"([^"]*)"')
PLATFORM = re.compile(r'"platform"\s*:\s*\[(.*?)\]', re.S)


def main():
    data = open(DLL, 'rb').read().decode('latin1')
    entries = []
    for m in ENTRY.finditer(data):
        mid, enc, group, body = m.groups()
        fields = dict(FIELD.findall(body))
        plat = PLATFORM.search(body)
        entries.append({
            'id': int(mid),
            'group': group,
            'model': fields.get('model') or fields.get('json_file_mnn')
                     or fields.get('json_file_coreml') or fields.get('name'),
            'encrypted': enc == 'true',
            'platform': [p.strip().strip('"') for p in plat.group(1).split(',')]
                        if plat else None,
            'offset': m.start(),
        })

    # Three copies of the table exist in the DLL; keep one per (id, model).
    uniq = {}
    for e in entries:
        uniq.setdefault((e['id'], e['model']), e)
    entries = sorted(uniq.values(), key=lambda e: (e['id'], e['model'] or ''))

    by_group = {}
    for e in entries:
        by_group.setdefault(e['group'], []).append(e)

    with open(OUT, 'w', encoding='utf-8') as fh:
        json.dump(entries, fh, indent=1, ensure_ascii=False)

    print(f'{len(entries)} Modelleintraege -> {os.path.basename(OUT)}')
    print(f'(roh {len(re.findall(ENTRY, data))} Treffer, '
          f'davon {sum(1 for e in entries if e["encrypted"])} verschluesselt)')
    print()
    for group in sorted(by_group, key=lambda g: -len(by_group[g])):
        print(f'{group:12s} {len(by_group[group]):>4}')

    print('\nXML-Modelle (OpenCV, in data/*.xml):')
    for e in by_group.get('xml_model', []):
        flag = ' [enc]' if e['encrypted'] else ''
        print(f'  id={e["id"]:>6}  {e["model"]}{flag}')

    print('\nHoechste ids (On-Device-Pakete / Cloud-Modelle):')
    for e in entries[-14:]:
        print(f'  id={e["id"]:>6}  {e["group"]:12s} {e["model"]}')


if __name__ == '__main__':
    main()
