"""Dump every enum from the proto catalogue, grouped by file, with values."""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CAT = os.path.join(HERE, 'proto_catalog.json')


def main():
    needle = sys.argv[1].lower() if len(sys.argv) > 1 else None
    with open(CAT, encoding='utf-8') as fh:
        cat = json.load(fh)

    total = 0
    for fname, spec in sorted(cat.items()):
        enums = spec.get('enums') or []
        if not enums:
            continue
        if needle and needle not in fname.lower():
            continue
        print('=' * 78)
        print(fname, '|', spec.get('package'))
        for en in enums:
            total += 1
            vals = en.get('values') or []
            print(f"  enum {en['name']}  ({len(vals)} values)")
            for v in vals:
                print(f"      {v['name']:42s} = {v['no']}")
    print()
    print(f'total enums dumped: {total}')


if __name__ == '__main__':
    main()
