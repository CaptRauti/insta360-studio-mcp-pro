"""Build a single, readable capability catalog from proto_catalog.json.

Writes research/CATALOG.md  -  every service, message (with fields) and enum
that the reverse engineering recovered from studio_worker.dll.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'proto_catalog.json')
OUT = os.path.join(HERE, 'CATALOG.md')

WIRE = {
    'TYPE_DOUBLE': 'double', 'TYPE_FLOAT': 'float', 'TYPE_INT64': 'int64',
    'TYPE_UINT64': 'uint64', 'TYPE_INT32': 'int32', 'TYPE_FIXED64': 'fixed64',
    'TYPE_FIXED32': 'fixed32', 'TYPE_BOOL': 'bool', 'TYPE_STRING': 'string',
    'TYPE_MESSAGE': 'message', 'TYPE_BYTES': 'bytes', 'TYPE_UINT32': 'uint32',
    'TYPE_ENUM': 'enum', 'TYPE_SFIXED32': 'sfixed32',
    'TYPE_SFIXED64': 'sfixed64', 'TYPE_SINT32': 'sint32', 'TYPE_SINT64': 'sint64',
}


def fmt_type(f):
    t = WIRE.get(f.get('type', ''), f.get('type', '?'))
    tn = f.get('type_name', '')
    if tn:
        return f"{t} {tn}"
    return t


def main():
    d = json.load(open(SRC, encoding='utf-8'))
    lines = []
    a = lines.append
    a('# Insta360 Studio — recovered protobuf capability catalog')
    a('')
    a('Recovered from the FileDescriptorProto blobs embedded in '
      '`studio_worker.dll` (Studio 6.0.8).')
    a('')
    a(f"- descriptor files: **{len(d)}**")
    total_msg = sum(len(v.get('messages', [])) for v in d.values())
    total_fld = sum(len(m.get('fields', [])) for v in d.values() for m in v.get('messages', []))
    total_enum = sum(len(v.get('enums', [])) for v in d.values())
    total_val = sum(len(e.get('values', [])) for v in d.values() for e in v.get('enums', []))
    total_svc = sum(len(v.get('services', [])) for v in d.values())
    a(f"- messages: **{total_msg}**")
    a(f"- fields: **{total_fld}**")
    a(f"- enums: **{total_enum}** ({total_val} values)")
    a(f"- services: **{total_svc}**")
    a('')

    # ---- services ----
    a('## Services')
    a('')
    a('| proto | service | methods |')
    a('| --- | --- | --- |')
    for name, v in sorted(d.items()):
        for s in v.get('services', []):
            meths = ', '.join(f"`{m.get('name')}`" for m in s.get('methods', []))
            a(f"| {name} | `{s.get('name')}` | {meths} |")
    a('')
    for name, v in sorted(d.items()):
        for s in v.get('services', []):
            a(f"### {s.get('name')}  ({name})")
            a('')
            for m in s.get('methods', []):
                a(f"- `{m.get('name')}({m.get('input')}) -> {m.get('output')}`")
            a('')

    # ---- enums ----
    a('## Enums')
    a('')
    for name, v in sorted(d.items()):
        for e in v.get('enums', []):
            vals = ', '.join(f"{x.get('name')}={x.get('no')}" for x in e.get('values', []))
            a(f"### {e.get('name')}  ({name})")
            a('')
            a(vals)
            a('')

    # ---- messages ----
    a('## Messages')
    a('')
    for name, v in sorted(d.items()):
        for m in v.get('messages', []):
            a(f"### {m.get('name')}  ({name})")
            a('')
            a('| # | label | type | name |')
            a('| --- | --- | --- | --- |')
            for f in m.get('fields', []):
                lbl = f.get('label', '').replace('LABEL_', '').lower()
                a(f"| {f.get('no')} | {lbl} | {fmt_type(f)} | `{f.get('name')}` |")
            a('')

    open(OUT, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines))
    print(f"wrote {OUT}  ({len(lines)} lines, {os.path.getsize(OUT)} bytes)")


if __name__ == '__main__':
    main()
