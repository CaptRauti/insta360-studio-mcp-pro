"""Regenerate .proto text from the descriptors in the DLL.

The descriptor is the authority; the previously hand-written src/proto/export2.proto
was reconstructed from a mis-measured blob and carries wrong field numbers (it had
stitch_type at 5, the live schema has it at 10). Generating the file from
proto_catalog.json removes the guesswork.

Run:  python research/protogen.py ExportModule2.proto ExportParams.proto
"""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
CATALOG = os.path.join(HERE, 'proto_catalog.json')

SCALARS = {
    'TYPE_DOUBLE': 'double', 'TYPE_FLOAT': 'float', 'TYPE_INT64': 'int64',
    'TYPE_UINT64': 'uint64', 'TYPE_INT32': 'int32', 'TYPE_FIXED64': 'fixed64',
    'TYPE_FIXED32': 'fixed32', 'TYPE_BOOL': 'bool', 'TYPE_STRING': 'string',
    'TYPE_BYTES': 'bytes', 'TYPE_UINT32': 'uint32', 'TYPE_SFIXED32': 'sfixed32',
    'TYPE_SFIXED64': 'sfixed64', 'TYPE_SINT32': 'sint32', 'TYPE_SINT64': 'sint64',
}


def short(type_name):
    return type_name.rsplit('.', 1)[-1]


def emit_field(field, indent):
    label = ''
    if field.get('label') == 'LABEL_REPEATED':
        label = 'repeated '
    kind = field.get('type', '')
    if kind.startswith('TYPE_'):
        name = SCALARS.get(kind)
        if name is None:
            name = short(field.get('typeName', kind))
    else:
        name = short(field.get('typeName', kind))
    return '%s%s%s %s = %s;' % (indent, label, name, field['name'], field['number'])


def emit_message(message, indent=''):
    out = ['%smessage %s {' % (indent, message['name'])]
    for enum in message.get('enumType', []):
        out.append(emit_enum(enum, indent + '  '))
    for nested in message.get('nestedType', []):
        out.append(emit_message(nested, indent + '  '))
    for oneof in message.get('oneofDecl', []):
        out.append('%s  oneof %s {' % (indent, oneof['name']))
        for field in message.get('field', []):
            if field.get('oneofIndex') is not None:
                out.append(emit_field(field, indent + '    '))
        out.append('%s  }' % indent)
    for field in message.get('field', []):
        if field.get('oneofIndex') is None:
            out.append(emit_field(field, indent + '  '))
    out.append('%s}' % indent)
    return '\n'.join(out)


def emit_enum(enum, indent=''):
    out = ['%senum %s {' % (indent, enum['name'])]
    for value in enum.get('value', []):
        out.append('%s  %s = %s;' % (indent, value['name'], value['number']))
    out.append('%s}' % indent)
    return '\n'.join(out)


def main():
    wanted = [a for a in sys.argv[1:] if not a.startswith('-')]
    catalog = json.load(open(CATALOG, encoding='utf-8'))
    by_name = {name.rsplit('/', 1)[-1]: (name, fd) for name, fd in catalog.items()}

    for want in wanted:
        key = want if want in catalog else None
        if key is None:
            for name in catalog:
                if name.endswith(want):
                    key = name
                    break
        if key is None:
            print('!! %s nicht im Katalog' % want)
            continue
        fd = catalog[key]
        out = ['syntax = "proto3";', '', 'package %s;' % fd.get('package', ''),
               '']
        for dep in fd.get('dependency', []):
            out.append('import "%s";' % dep)
        out.append('')
        for enum in fd.get('enumType', []):
            out.append(emit_enum(enum))
            out.append('')
        for message in fd.get('messageType', []):
            out.append(emit_message(message))
            out.append('')
        for service in fd.get('service', []):
            out.append('service %s {' % service['name'])
            for method in service.get('method', []):
                out.append('  rpc %s(%s) returns (%s);' % (
                    method['name'], short(method['inputType']),
                    short(method['outputType'])))
            out.append('}')
            out.append('')
        text = '\n'.join(out).rstrip() + '\n'
        target = os.path.join(HERE, '..', 'src', 'proto', want)
        print('=' * 78)
        print(text)
        if '--write' in sys.argv:
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, 'w', encoding='utf-8') as fh:
                fh.write(text)
            print('-> geschrieben: %s' % os.path.normpath(target))


if __name__ == '__main__':
    main()
