"""Catalogue every FileDescriptorProto in studio_worker.dll, parsed properly.

Earlier attempts walked the wire format by hand and mis-measured the length of
one descriptor (a 219-byte ExportModule2.proto was reported as 12675 bytes,
swallowing the neighbouring descriptors). This tool lets the protobuf library do
the parsing:

  * a descriptor is located by its own ``name`` field, i.e. the literal pattern
    ``tag(1, LEN) + length + "Name.proto"``, so no guessing backwards;
  * the end is found by walking the wire format field by field until the bytes
    stop looking like a field, then confirmed by requiring a round trip
    (``ParseFromString`` then ``SerializeToString`` reproducing the slice) —
    only the exact length satisfies that;
  * duplicates (the DLL embeds several copies) collapse on a content hash.

Run:  python research/protocat.py [--dump Export2] [--json]
"""

import hashlib
import json
import os
import re
import sys

from google.protobuf.descriptor_pb2 import FileDescriptorProto
from google.protobuf.message import DecodeError

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from studioroot import ROOT  # noqa: E402

DLL = os.path.join(ROOT, 'studio_worker.dll')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'proto_catalog.json')


def read_varint(data, pos):
    value = shift = 0
    while pos < len(data) and shift < 64:
        byte = data[pos]
        value |= (byte & 0x7F) << shift
        pos += 1
        if not byte & 0x80:
            return value, pos
        shift += 7
    return None, pos


def walk_end(data, start, limit=200000):
    """End of the message at `start`, found by walking its fields."""
    pos = start
    stop = min(len(data), start + limit)
    while pos < stop:
        tag, after_tag = read_varint(data, pos)
        if tag is None or tag == 0:
            break
        field, wire = tag >> 3, tag & 7
        if field > 512 or wire not in (0, 1, 2, 5):
            break
        if wire == 0:
            _, pos = read_varint(data, after_tag)
        elif wire == 1:
            pos = after_tag + 8
        elif wire == 5:
            pos = after_tag + 4
        else:
            length, after_len = read_varint(data, after_tag)
            if length is None or length > stop - after_len:
                break
            pos = after_len + length
        if pos > stop:
            break
    return pos


def pattern_for(name):
    raw = name.encode()
    if len(raw) < 128:
        return bytes([0x0A, len(raw)]) + raw
    varint = b''
    value = len(raw)
    while True:
        byte = value & 0x7F
        value >>= 7
        varint += bytes([byte | (0x80 if value else 0)])
        if not value:
            break
    return b'\x0A' + varint + raw


def collect(data):
    names = sorted({m.decode() for m in
                    re.findall(rb'[A-Za-z0-9_./-]{2,60}\.proto', data)})
    seen = {}
    for name in names:
        needle = pattern_for(name)
        at = data.find(needle)
        while at >= 0:
            end = walk_end(data, at)
            slice_ = data[at:end]
            fd = FileDescriptorProto()
            try:
                fd.ParseFromString(slice_)
                ok = fd.name == name and fd.SerializeToString() == slice_
            except DecodeError:
                ok = False
            if ok:
                key = hashlib.sha1(slice_).hexdigest()
                if key not in seen:
                    seen[key] = (at, len(slice_), fd)
            at = data.find(needle, at + 1)
    return seen


def describe(fd):
    out = ['Datei: %s  (Paket: %s)' % (fd.name, fd.package or '-')]
    for dep in fd.dependency:
        out.append('   import %s' % dep)
    for service in fd.service:
        out.append('   service %s' % service.name)
        for method in service.method:
            out.append('      rpc %s(%s) -> %s' % (
                method.name, method.input_type, method.output_type))
    for enum in fd.enum_type:
        out.append('   enum %s: %s' % (enum.name, ', '.join(
            '%s=%d' % (v.name, v.number) for v in enum.value)))
    for message in fd.message_type:
        out.append('   message %s' % message.name)
        for field in message.field:
            label = 'repeated ' if field.label == 3 else ''
            kind = field.type_name or str(field.type)
            out.append('      %-4d %s%-30s %s' % (
                field.number, label, field.name, kind))
    return '\n'.join(out)


def main():
    data = open(DLL, 'rb').read()
    print('DLL: %s (%d Bytes)\n' % (DLL, len(data)))
    found = collect(data)
    print('%d eindeutige FileDescriptorProtos\n' % len(found))

    total_messages = total_fields = total_services = total_enums = 0
    for _key, (at, length, fd) in sorted(found.items(), key=lambda kv: kv[1][2].name):
        total_messages += len(fd.message_type)
        total_fields += sum(len(m.field) for m in fd.message_type)
        total_services += len(fd.service)
        total_enums += len(fd.enum_type)
        svc = ', '.join('%s(%d rpc)' % (s.name, len(s.method)) for s in fd.service)
        print('%-46s %6d B @ %-10d %2d msg %2d enum  %s' % (
            fd.name, length, at, len(fd.message_type), len(fd.enum_type), svc))

    print('\nSumme: %d Dateien, %d Messages, %d Felder, %d Enums, %d Services' % (
        len(found), total_messages, total_fields, total_enums, total_services))

    if '--json' in sys.argv:
        blob = {}
        for _key, (_at, _length, fd) in found.items():
            blob[fd.name] = json.loads(
                __import__('google.protobuf.json_format', fromlist=['x'])
                .MessageToJson(fd))
        with open(OUT, 'w', encoding='utf-8') as fh:
            json.dump(blob, fh, indent=1, sort_keys=True)
        print('geschrieben:', OUT)

    if '--dump' in sys.argv:
        want = sys.argv[sys.argv.index('--dump') + 1]
        print()
        for _key, (_at, _length, fd) in sorted(
                found.items(), key=lambda kv: kv[1][2].name):
            if want in fd.name or any(want in s.name for s in fd.service):
                print('=' * 78)
                print(describe(fd))
                print()


if __name__ == '__main__':
    main()
