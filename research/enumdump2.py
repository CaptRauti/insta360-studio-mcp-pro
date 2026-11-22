"""Dump all protobuf enums from the plaintext FileDescriptorProto regions in
studio_worker.dll. Enums are stored as:
  * <len> \n <len> <EnumName>  ( 0x12 <len> \n <len> <VALUE> 0x10 <varint> )*
"""
import re, sys

DLL = r'C:\Program Files\Insta360 Studio\studio_worker.dll'
data = open(DLL, 'rb').read()


def rv(b, i):
    r = 0
    s = 0
    while True:
        c = b[i]
        i += 1
        r |= (c & 0x7f) << s
        if not (c & 0x80):
            break
        s += 7
    return r, i


def try_enum(b, i):
    if b[i] != 0x0a:
        return None
    ln, j = rv(b, i + 1)
    end = j + ln
    if end > len(b) or ln < 2 or ln > 200:
        return None
    name = b[j:end].decode('latin-1', 'replace')
    if not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*', name):
        return None
    vals = []
    p = end
    while p < len(b) and b[p] == 0x12:
        vl, p = rv(b, p + 1)
        vend = p + vl
        if vend > len(b) or vl < 2:
            break
        vn = None
        vnum = None
        q = p
        while q < vend:
            f = b[q]
            if f == 0x0a:
                nl, q = rv(b, q + 1)
                vn = b[q:q + nl].decode('latin-1', 'replace')
                q += nl
            elif f == 0x10:
                vnum, q = rv(b, q + 1)
            else:
                break
        if vn is None or vnum is None:
            break
        vals.append((vnum, vn))
        p = vend
    if not vals:
        return None
    return name, vals, p


def main():
    pat = sys.argv[1] if len(sys.argv) > 1 else None
    seen = {}
    for m in re.finditer(rb'\x0a[\x02-\x28][A-Za-z_][A-Za-z0-9_]{1,40}\x12[\x04-\x40]', data):
        r = try_enum(data, m.start())
        if not r:
            continue
        name, vals, end = r
        if len(vals) < 2:
            continue
        if name in seen and len(seen[name][1]) >= len(vals):
            continue
        seen[name] = (m.start(), vals)
    print('ENUMS', len(seen))
    for name, (off, vals) in sorted(seen.items()):
        if pat and not re.search(pat, name, re.I):
            continue
        print(f'=== {name}  (@{off}, {len(vals)} values)')
        for n, v in vals:
            print(f'   {n:4d}  {v}')


if __name__ == '__main__':
    main()
