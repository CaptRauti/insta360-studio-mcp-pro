import json, sys, collections

p = json.load(open('research/dll_paths.json'))
BS = chr(92)


def norm(k):
    return k.replace(BS, '/')


def show(pref, n=40):
    items = sorted([norm(k) for k in p if pref in norm(k)])
    print('===', pref, len(items))
    for i in items[:n]:
        print('  ', i.split('studio_src/')[-1])


if __name__ == '__main__':
    pref = sys.argv[1] if len(sys.argv) > 1 else '/studio_src/src/app/'
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 60
    show(pref, n)
