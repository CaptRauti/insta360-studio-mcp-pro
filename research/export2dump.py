"""Dump the live FileDescriptorProto for the Export2 service from studio_worker.dll.

The reconstructed src/proto/export2.proto came from the 6.0.8 binary; Studio has
since updated itself to 6.0.9 with a 27 KB larger worker DLL, and every
reverse-engineering offset is version specific. If the export schema changed,
that alone explains the INTERNAL errors on StartExporting.

The descriptor is found by its own ``name`` field and its exact length is
recovered by requiring a round trip: a slice parses and re-serialises to the very
same bytes only when the length is right, because a truncation raises and a
surplus turns into unparseable trailing bytes.
"""

import os
import sys

from google.protobuf.descriptor_pb2 import FileDescriptorProto
from google.protobuf.message import DecodeError

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from studioroot import ROOT  # noqa: E402

DLL = os.path.join(ROOT, 'studio_worker.dll')
WANTED = ('ExportModule2.proto', 'ExportParams.proto', 'ExportModule.proto',
          'ThumbnailModule.proto')


def find_descriptor(data, name):
    needle = name.encode()
    at = data.find(needle)
    while at >= 0:
        # The name is field 1, so its tag sits immediately before it.
        start = at - 2 if at >= 2 and data[at - 2] == 0x0A else at - 1
        if start < 0:
            at = data.find(needle, at + 1)
            continue
        for length in range(len(needle) + 200, 40000):
            slice_ = data[start:start + length]
            fd = FileDescriptorProto()
            try:
                fd.ParseFromString(slice_)
            except DecodeError:
                continue
            if fd.name != name:
                continue
            if fd.SerializeToString() == slice_:
                return start, length, fd
        at = data.find(needle, at + 1)
    return None, None, None


def describe(fd):
    lines = ['Datei: %s' % fd.name, 'Paket: %s' % fd.package]
    for dep in fd.dependency:
        lines.append('  import %s' % dep)
    for service in fd.service:
        lines.append('  service %s' % service.name)
        for method in service.method:
            lines.append('    rpc %s(%s) -> %s' % (
                method.name, method.input_type, method.output_type))
    for enum in fd.enum_type:
        values = ', '.join('%s=%d' % (v.name, v.number) for v in enum.value)
        lines.append('  enum %s { %s }' % (enum.name, values))
    for message in fd.message_type:
        lines.append('  message %s' % message.name)
        for field in message.field:
            lines.append('    %-3d %-28s %s' % (
                field.number, field.name,
                field.type_name or field.type))
    return '\n'.join(lines)


def main():
    print('DLL: %s (%d Bytes)\n' % (DLL, os.path.getsize(DLL)))
    data = open(DLL, 'rb').read()
    for name in WANTED:
        start, length, fd = find_descriptor(data, name)
        if fd is None:
            print('### %s: nicht gefunden\n' % name)
            continue
        print('### %s @ %d, %d Bytes' % (name, start, length))
        print(describe(fd))
        print()


if __name__ == '__main__':
    main()
