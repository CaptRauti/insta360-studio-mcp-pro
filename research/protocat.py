"""Extract every FileDescriptorProto from studio_worker.dll and dump the full
schema catalogue (messages, fields, enums, services) as JSON + Markdown.

Method: scan the DLL for the protobuf serialized FileDescriptorProto blobs.
Each blob starts with 0x0a <len> "<name>.proto" and carries a package name.
We walk the whole file, attempt a parse at every candidate start, and keep the
largest valid descriptor per file name.
"""
import json
import re
import sys

from google.protobuf import descriptor_pb2

DLL = r'C:\Program Files\Insta360 Studio\studio_worker.dll'
OUT_JSON = 'research/proto_catalog.json'
OUT_MD = 'research/PROTO_CATALOG.md'

data = open(DLL, 'rb').read()
N = len(data)
print(f'loaded {N} bytes', flush=True)


def rv(b, i):
    """Read a base-128 varint."""
    shift = 0
    val = 0
    while True:
        if i >= len(b):
            raise ValueError('eof')
        c = b[i]
        i += 1
        val |= (c & 0x7F) << shift
        if not c & 0x80:
            return val, i
        shift += 7
        if shift > 63:
            raise ValueError('varint too long')


def walk_end(b, start):
    """Walk top-level wire fields from start; return the end offset.

    FileDescriptorProto only uses length-delimited (wt=2) and varint (wt=0)
    top-level fields. Stop as soon as a tag is not a plausible field tag.
    """
    i = start
    while i < len(b):
        tag = b[i]
        wt = tag & 7
        fn = tag >> 3
        if fn == 0 or fn > 200 or wt not in (0, 2):
            return i
        j = i + 1
        try:
            ln, j = rv(b, j)
        except ValueError:
            return i
        if wt == 2:
            if j + ln > len(b):
                return i
            i = j + ln
        else:
            i = j
    return i


def try_parse(start):
    """Try to parse a FileDescriptorProto at start. Return (fd, end) or None."""
    end = walk_end(data, start)
    if end <= start:
        return None
    blob = data[start:end]
    fd = descriptor_pb2.FileDescriptorProto()
    try:
        fd.ParseFromString(blob)
    except Exception:
        return None
    if not fd.name.endswith('.proto'):
        return None
    return fd, end


def main():
    # Candidate starts: every occurrence of a plausible name field.
    cands = set()
    for m in re.finditer(rb'\x0a[\x10-\x50][A-Za-z0-9_./\-]{3,60}\.proto', data):
        cands.add(m.start())
    print(f'candidates: {len(cands)}', flush=True)

    best = {}
    for k, st in enumerate(sorted(cands)):
        r = try_parse(st)
        if not r:
            continue
        fd, end = r
        prev = best.get(fd.name)
        if prev is None or len(fd.SerializeToString()) > len(prev.SerializeToString()):
            best[fd.name] = fd
    print(f'parsed unique descriptors: {len(best)}', flush=True)

    # ---- build catalogue ----
    cat = {}
    for name, fd in sorted(best.items()):
        entry = {
            'file': name,
            'package': fd.package,
            'deps': list(fd.dependency),
            'syntax': fd.syntax,
            'messages': [],
            'enums': [],
            'services': [],
        }
        for mt in fd.message_type:
            msg = {'name': mt.name, 'fields': [], 'nested': []}
            for f in mt.field:
                msg['fields'].append({
                    'no': f.number,
                    'name': f.name,
                    'type': descriptor_pb2.FieldDescriptorProto.Type.Name(f.type),
                    'type_name': f.type_name.lstrip('.') if f.type_name else '',
                    'label': descriptor_pb2.FieldDescriptorProto.Label.Name(f.label),
                })
            for nt in mt.nested_type:
                msg['nested'].append(nt.name)
            entry['messages'].append(msg)
        for en in fd.enum_type:
            entry['enums'].append({
                'name': en.name,
                'values': [{'no': v.number, 'name': v.name} for v in en.value],
            })
        for sv in fd.service:
            svc = {'name': sv.name, 'methods': []}
            for m in sv.method:
                svc['methods'].append({
                    'name': m.name,
                    'input': m.input_type.lstrip('.'),
                    'output': m.output_type.lstrip('.'),
                })
            entry['services'].append(svc)
        cat[name] = entry

    with open(OUT_JSON, 'w', encoding='utf-8') as fh:
        json.dump(cat, fh, indent=1, ensure_ascii=False)
    print(f'wrote {OUT_JSON}', flush=True)

    # ---- markdown ----
    lines = ['# Protobuf-Schema-Katalog (aus studio_worker.dll)', '']
    lines.append(f'{len(cat)} Descriptor-Dateien, extrahiert aus den eingebetteten '
                 'FileDescriptorProto-Blobs.')
    lines.append('')
    tot_msg = sum(len(v['messages']) for v in cat.values())
    tot_enum = sum(len(v['enums']) for v in cat.values())
    tot_svc = sum(len(v['services']) for v in cat.values())
    lines.append(f'**Summe:** {tot_msg} Messages, {tot_enum} Enums, {tot_svc} Services')
    lines.append('')
    for name, e in cat.items():
        lines.append(f'## `{name}`')
        lines.append(f'package `{e["package"]}` · syntax `{e["syntax"] or "proto2"}`')
        if e['deps']:
            lines.append('deps: ' + ', '.join(f'`{d}`' for d in e['deps']))
        lines.append('')
        for sv in e['services']:
            lines.append(f'### Service `{sv["name"]}`')
            for m in sv['methods']:
                lines.append(f'- `{m["name"]}`({m["input"]}) → {m["output"]}')
            lines.append('')
        for msg in e['messages']:
            lines.append(f'### Message `{msg["name"]}`')
            for f in msg['fields']:
                tn = f' ({f["type_name"]})' if f['type_name'] else ''
                lines.append(f'- {f["no"]}: `{f["name"]}` {f["type"]}{tn} [{f["label"]}]')
            if msg['nested']:
                lines.append(f'- nested: {", ".join(msg["nested"])}')
            lines.append('')
        for en in e['enums']:
            lines.append(f'### Enum `{en["name"]}`')
            for v in en['values']:
                lines.append(f'- {v["no"]} = `{v["name"]}`')
            lines.append('')
    with open(OUT_MD, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines))
    print(f'wrote {OUT_MD}', flush=True)


if __name__ == '__main__':
    main()
