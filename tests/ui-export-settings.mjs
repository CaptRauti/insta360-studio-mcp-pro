// Drive the export dialog's settings and verify each change lands.
//
//   node tests/ui-export-settings.mjs
//
// Needs Studio running with the export dialog open. Reads every control, opens
// the codec list, switches to ProRes 422 LT, checks the field actually changed,
// then puts it back to H.265.

import { readDialog, openControl, selectOption } from "../src/export-dialog.mjs";

const TITLE = "Insta360 Studio";
// Optional: control label, then the values to set in order.
const CONTROL = process.argv[2] ?? "Kodierung";
const VALUES = process.argv.length > 3 ? process.argv.slice(3) : ["ProRes 422 LT", "H.265"];

const dialog = readDialog({ title: TITLE });
console.log("--- Dialog ---");
for (const [name, field] of Object.entries(dialog.fields)) {
  console.log(`  ${name.padEnd(15)} = ${JSON.stringify(field.value)}  klick @${field.click.x},${field.click.y}`);
}

const opened = await openControl({ title: TITLE, label: CONTROL });
console.log(`\n--- ${CONTROL}: ok=${opened.ok} ---`);
if (!opened.ok) {
  console.error(`  ${opened.error}`);
  process.exit(1);
}
console.log(`  Rechteck ${JSON.stringify(opened.box)}  Helligkeit zu/offen = ${opened.brightness.closed}/${opened.brightness.open}`);
console.log(`  Optionen: ${opened.options.map((o) => JSON.stringify(o)).join(", ")}`);
for (const r of opened.rows) console.log(`    y=${r.y} h=${r.h} x=${r.x}  ${JSON.stringify(r.text)}`);

for (const wanted of VALUES) {
  const res = await selectOption({ title: TITLE, label: CONTROL, text: wanted });
  console.log(`\n--- selectOption("${wanted}") ---`);
  if (!res.ok) {
    console.error(`  Fehler: ${res.error}  Optionen=${JSON.stringify(res.options)}`);
    process.exit(1);
  }
  console.log(`  gewaehlt=${JSON.stringify(res.picked)}  ${JSON.stringify(res.before)} -> ${JSON.stringify(res.after)}  changed=${res.changed}`);
  if (!res.changed) {
    console.error("  Wert hat sich nicht geaendert -- Klick ging daneben.");
    process.exit(1);
  }
}

const final = readDialog({ title: TITLE });
console.log(`\nEndstand ${CONTROL} = ${JSON.stringify(final.fields[CONTROL]?.value)}`);
