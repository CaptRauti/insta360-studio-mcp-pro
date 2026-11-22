# Research notes

Scratch material from reverse-engineering Studio's gRPC API. Kept because it
documents how the schema in `src/proto/export2.proto` was recovered — none of
this is needed to run the server.

## `grpc-probes/`

Standalone Node scripts that hit the live Exporter2 service directly. They test
different request shapes against a running Studio instance: source file in
`ExportHeader.materialList`, in `localExtraParams.imageExportParam.sourceGroup`,
in `mainParams`, with various `ExportType` enum values.

Every one of them gets a valid parse and a `RUNNING` reply, and none of them
produces an output file. That's the evidence behind the claim in the README that
the gRPC export path is broken.

## `proto-drafts/`

Earlier reconstructions of the exporter schema, plus the older
`service.Export` descriptor found in the same DLL. The live service is
`service.Export2.Export2`; the older one is a decoy that returns
`UNIMPLEMENTED`.

## How the schema was recovered

Studio's protobuf descriptors are compiled into `studio_worker.dll` as plain-text
`FileDescriptorProto` blobs. To find them:

1. Scan the DLL for `.proto` name strings (e.g. `ExportModule2.proto`).
2. Walk backwards for the varint length prefix, then forward to find the
   descriptor end.
3. Parse the bytes as `google.protobuf.descriptor_pb2.FileDescriptorProto`.

`ExportModule2.proto` sits at file offset ~113528384 (length ~12675), package
`service.Export2`, method `StartExporting` with input type
`.service.Export2.ExportParams`. `ExportParams.proto` and
`ins_cloud_export_data.proto` are separate descriptors in the same DLL.
