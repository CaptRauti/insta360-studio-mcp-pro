"""Build the camera capability matrix from the decoded .rcc FOV tables.

table1: CameraType##LensType##VideoOrPhoto##Mode[##Scale...]
        -> "DefaultFov|Fov1,Fov2,..."          (which FOV types exist)
table2: Angle##CameraType##LensType##VideoOrPhoto##Mode##ScreenRatio
        ##FrameRate##Flowstate##FileType
        -> "defaultFov,defaultDist,minFov,minDist,maxFov,maxDist"
"""
import collections
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'rcc', 'decoded', 'resource', 'resource')
OUT = os.path.join(HERE, 'camera_matrix.json')


def main():
    fov_types = collections.defaultdict(set)
    modes = collections.defaultdict(set)
    lenses = collections.defaultdict(set)
    aspects = collections.defaultdict(set)
    angles = {}
    table_info = {}

    for name in sorted(os.listdir(SRC)):
        if not name.startswith('fov_distance_table'):
            continue
        try:
            d = json.load(open(os.path.join(SRC, name), encoding='utf-8-sig'))
        except Exception as exc:
            print('skip', name, exc)
            continue
        table_info[name] = {k: d[k] for k in ('format', 'version',
                                              'lastUpdate') if k in d}
        rows = {k: v for k, v in d.items() if '##' in k}
        is_t2 = name.startswith('fov_distance_table2')

        for key, val in rows.items():
            p = key.split('##')
            if is_t2:
                fov, cam = p[0], p[1]
                lens = p[2] if len(p) > 2 else ''
                vp = p[3] if len(p) > 3 else ''
                mode = p[4] if len(p) > 4 else ''
                aspect = p[5] if len(p) > 5 else ''
                fov_types[cam].add(fov)
                modes[cam].add(mode)
                if lens:
                    lenses[cam].add(lens)
                if aspect:
                    aspects[cam].add(aspect)
                nums = str(val).split(',')
                if len(nums) == 6:
                    try:
                        angles.setdefault(cam, {})[
                            f"{fov}|{vp}|{mode}|{aspect}"] = {
                            'defaultFov': float(nums[0]),
                            'defaultDistance': float(nums[1]),
                            'minFov': float(nums[2]),
                            'minDistance': float(nums[3]),
                            'maxFov': float(nums[4]),
                            'maxDistance': float(nums[5]),
                        }
                    except ValueError:
                        pass
            else:
                cam = p[0]
                if len(p) > 1:
                    lenses[cam].add(p[1])
                if len(p) > 2:
                    modes[cam].add(p[2])
                if len(p) > 3:
                    modes[cam].add(p[3])
                if isinstance(val, str):
                    for f in val.replace('|', ',').split(','):
                        f = f.strip()
                        if f:
                            fov_types[cam].add(f)

    cams = {}
    for cam in sorted(set(list(fov_types) + list(modes))):
        cams[cam] = {
            'lenses': sorted(lenses[cam]),
            'modes': sorted(modes[cam]),
            'fovTypes': sorted(fov_types[cam]),
            'aspectRatios': sorted(aspects[cam]),
            'angleRows': len(angles.get(cam, {})),
        }

    json.dump({'tables': table_info, 'cameras': cams, 'angles': angles},
              open(OUT, 'w', encoding='utf-8', newline='\n'), indent=1)

    print(f'tables={len(table_info)}  cameras={len(cams)}  '
          f'angleRows={sum(len(v) for v in angles.values())}')
    print()
    print('Kameras:')
    for cam, c in sorted(cams.items(), key=lambda kv: -kv[1]['angleRows']):
        print(f"  {cam:12s} fov={len(c['fovTypes']):2d} modes={c['modes']} "
              f"aspects={len(c['aspectRatios'])} angles={c['angleRows']}")
    print()
    allfov = sorted({f for c in cams.values() for f in c['fovTypes']})
    print(f'ALLE FOV-Typen ({len(allfov)}): {", ".join(allfov)}')
    print()
    allasp = sorted({a for c in cams.values() for a in c['aspectRatios']})
    print(f'ALLE Seitenverhaeltnisse ({len(allasp)}): {", ".join(allasp)}')
    print()
    allmodes = sorted({m for c in cams.values() for m in c['modes']})
    print(f'ALLE Modi ({len(allmodes)}): {", ".join(allmodes)}')
    print()
    print(f'geschrieben: {OUT}')


if __name__ == '__main__':
    main()
