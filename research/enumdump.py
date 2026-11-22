"""Dump ExportType / StitchType / StabilizationType enum values from the plaintext
FileDescriptorProto region in studio_worker.dll."""
import re

DLL = r'C:\Program Files\Insta360 Studio\studio_worker.dll'
data = open(DLL, 'rb').read()

# Locate the plaintext descriptor region containing "ExportType"
needle = b'ExportType'
idxs = [m.start() for m in re.finditer(needle, data)]
print('ExportType occurrences:', len(idxs))

# Parse a simple protobuf varint
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

for start in idxs:
    # Walk backwards to find a plausible enum-value block: sequences of
    # 0x08 <varint> 0x10 <varint len> <name>
    blob = data[start:start + 3000]
    # find "NAME" followed by 0x10 len name
    m = re.match(rb'ExportType\x10', blob)
    if not m:
        continue
    print('--- candidate at', start)
    i = m.end()
    vals = []
    try:
        while i < len(blob):
            # expect 0x08 <varint num>
            if blob[i] != 0x08:
                break
            num, i = rv(blob, i + 1)
            if blob[i] != 0x12:
                break
            ln, i = rv(blob, i + 1)
            name = blob[i:i + ln].decode('latin-1')
            i += ln
            vals.append((num, name))
    except Exception as e:
        print('parse stop', e)
    for n, nm in vals:
        print(f'  {n:3d}  {nm}')
    print('  count', len(vals))
