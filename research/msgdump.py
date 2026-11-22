"""Dump one message (and its nested message tree) from the proto catalogue.

Usage: python msgdump.py <File.proto> [MessageName]
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CAT = os.path.join(HERE, 'proto_catalog.json')


def dump_msg(m, indent='  '):
    print(f"{indent}message {m['name']}  ({len(m['fields'])} fields)")
    for f in m['fields']:
        tn = f" -> {f['type_name']}" if f.get('type_name') else ''
        print(f"{indent}  {f['no']:>3}  {f['label'].replace('LABEL_',''):12s} "
              f"{f['type'].replace('TYPE_',''):9s} {f['name']}{tn}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    fname = sys.argv[1]
    want = sys.argv[2] if len(sys.argv) > 2 else None
    with open(CAT, encoding='utf-8') as fh:
        cat = json.load(fh)
    # allow fuzzy match
    keys = [k for k in cat if k == fname] or [k for k in cat if fname.lower() in k.lower()]
    if not keys:
        print('no such file. known:', *sorted(cat)[:40], sep='\n  ')
        return
    for k in keys:
        spec = cat[k]
        print('=' * 78)
        print(k, '|', spec.get('package'), '| syntax', spec.get('syntax'))
        if spec.get('deps'):
            print('deps:', ', '.join(spec['deps']))
        for m in spec['messages']:
            if want and want.lower() not in m['name'].lower():
                continue
            dump_msg(m)
        for en in spec.get('enums') or []:
            if want and want.lower() not in en['name'].lower():
                continue
            print(f"  enum {en['name']}")
            for v in en['values']:
                print(f"      {v['name']:42s} = {v['no']}")
        for s in spec.get('services') or []:
            print(f"  service {s['name']}")
            for meth in s['methods']:
                print(f"      {meth['name']}({meth['input']}) -> {meth['output']}")


if __name__ == '__main__':
    main()
