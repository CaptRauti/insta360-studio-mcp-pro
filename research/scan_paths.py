import re, json, collections, sys

DLL = r'C:\Program Files\Insta360 Studio\studio_worker.dll'
d = open(DLL, 'rb').read()

paths = collections.Counter()
for m in re.finditer(rb'[ -~]{8,}', d):
    s = m.group().decode()
    if 'studio_src' in s and ('\\' in s or '/' in s):
        paths[s] += 1

print('unique paths', len(paths))
json.dump(dict(paths), open('research/dll_paths.json', 'w'), indent=0)

mods = collections.Counter()
for p in paths:
    q = p.replace('\\', '/')
    if '/studio_src/deps/' in q:
        mods['deps/' + q.split('/studio_src/deps/')[1].split('/')[0]] += 1
    elif '/studio_src/src/' in q:
        mods['src/' + q.split('/studio_src/src/')[1].split('/')[0]] += 1
    elif '/studio_src/external/' in q:
        mods['external/' + q.split('/studio_src/external/')[1].split('/')[0]] += 1
    elif 'studio_src-build' in q:
        mods['BUILD/.conan2'] += 1
    else:
        mods['other'] += 1

for k, v in mods.most_common(40):
    print(v, k)
