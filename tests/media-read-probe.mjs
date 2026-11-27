// Live probe for studio_media_read: starts the real MCP server over stdio, lists the tools, then
// reads a Media-page project by *media path* so the whole chain runs — lookup, hash match, parse,
// summary. Read-only: it calls nothing that changes state.
//
// Run: node tests/media-read-probe.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "node:fs";
import path from "node:path";

const prov = JSON.parse(fs.readFileSync("tests/fixtures/insprj-fixtures.json", "utf8"));
const jsonMeta = prov.fixtures["media-project-json.insprj"];
const xmlMeta = prov.fixtures["media-project-legacy-xml.insprj"];

const client = new Client({ name: "media-read-probe", version: "1.0.0" });
const transport = new StdioClientTransport({ command: "node", args: ["src/server.mjs"], stderr: "inherit" });
await client.connect(transport);

const { tools } = await client.listTools();
const names = tools.map((t) => t.name);
console.log(`tools registered: ${names.length}`);
console.log(`studio_media_read present: ${names.includes("studio_media_read")}`);
const schema = tools.find((t) => t.name === "studio_media_read");
console.log(`schema keys: ${Object.keys(schema.inputSchema.properties ?? {}).join(", ")}`);
console.log(`\n--- call 1: a JSON-era media path, looked up from scratch ---`);
console.log(`    media = ${jsonMeta.mediaId}`);
const one = await client.callTool({ name: "studio_media_read", arguments: { media: jsonMeta.mediaId } });
const oneOut = JSON.parse(one.content[0].text);
console.log(`ok=${oneOut.ok} encoding=${oneOut.encoding} family=${oneOut.family} count=${oneOut.count}`);
console.log(`readFrom=${oneOut.readFrom}`);
console.log(`hashMatched=${oneOut.lookup?.hashMatched} candidates=${oneOut.lookup?.candidates?.length ?? 0}`);
console.log(`watermark path=${oneOut.items?.[0]?.clip?.watermark?.flat?.selectedLogoWatermarkPath}`);
console.log(`colour exposure=${oneOut.items?.[0]?.clip?.colour?.colorAdjustExposure} contrast=${oneOut.items?.[0]?.clip?.colour?.colorAdjustContrast}`);
console.log(`speed segments=${JSON.stringify(oneOut.items?.[0]?.clip?.speed?.segments)}`);
console.log(`note=${oneOut.note}`);

console.log(`\n--- call 2: the 5.x XML file by path ---`);
const two = await client.callTool({ name: "studio_media_read", arguments: { file: path.resolve("tests/fixtures/media-project-legacy-xml.insprj") } });
const twoOut = JSON.parse(two.content[0].text);
console.log(`ok=${twoOut.ok} encoding=${twoOut.encoding} app=${twoOut.app} mediaId=${twoOut.mediaId}`);
console.log(`legacy trim_end=${twoOut.items?.[0]?.legacy?.preference?.trim_end} volume=${twoOut.items?.[0]?.legacy?.audio?.volume}`);
console.log(`translationNotes=${twoOut.translationNotes?.length} warnings=${twoOut.warnings?.length}`);
console.log(`mappedFrom=${JSON.stringify(twoOut.items?.[0]?.mappedFrom)}`);

console.log(`\n--- call 3: a path with no project (must fail honestly) ---`);
const three = await client.callTool({ name: "studio_media_read", arguments: { media: "F:/nope/VID_00000000_000000_00_000.mp4" } });
const threeOut = JSON.parse(three.content[0].text);
console.log(`ok=${threeOut.ok} note=${threeOut.note}`);

console.log(`\n--- call 4: look the XML-era project up from its media path, not by path ---`);
console.log(`    media = ${xmlMeta.mediaId}  (a bare Project/<hash>/.insprj on disk)`);
const four = await client.callTool({ name: "studio_media_read", arguments: { media: xmlMeta.mediaId } });
const fourOut = JSON.parse(four.content[0].text);
console.log(`ok=${fourOut.ok} encoding=${fourOut.encoding} readFrom=${fourOut.readFrom}`);
console.log(`hashMatched=${fourOut.lookup?.hashMatched}`);
console.log(`candidates=${JSON.stringify(fourOut.lookup?.candidates?.map((m) => ({ match: m.match, family: m.family })))}`);
if (fourOut.ambiguous) console.log(`ambiguous: ${fourOut.note}`);

console.log(`\n--- call 5: findOnly, no read ---`);
const five = await client.callTool({ name: "studio_media_read", arguments: { media: xmlMeta.mediaId, findOnly: true } });
const fiveOut = JSON.parse(five.content[0].text);
console.log(`ok=${fiveOut.ok} lookup.hashMatched=${fiveOut.lookup?.hashMatched} note=${fiveOut.note}`);

await client.close();
console.log(`\nprobe complete`);
