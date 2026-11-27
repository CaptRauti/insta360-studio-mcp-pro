// Live probe: the Medienverarbeitung setter, exercised through the exported functions a tool
// handler calls -- set, verify the state moved, set it back, and check the "already so" path does
// not click.
//
//   node research/probe-checkbox-set.mjs
//
// Requires Studio with the export dialog open on raw dual-lens `.insv` media (else the group is
// absent). Restores the row to the state it was found in.
import assert from "node:assert/strict";
import { readDialog, setProcessingOption, parseCheckValue } from "../src/export-dialog.mjs";

const CAPTION = "Optimierung der unteren Naht";

assert.equal(parseCheckValue("an"), "checked");
assert.equal(parseCheckValue("AUS"), "unchecked");
assert.equal(parseCheckValue("H.265"), null);

const start = readDialog({}).processing;
if (!start.ok || start.rows.length === 0) {
  console.error(`no checkbox row to set: ${start.reason ?? start.note}`);
  process.exit(1);
}
const asFound = start.rows[0].state;
console.log(`as found: ${asFound} (mean ${start.rows[0].mean})`);

// The "already so" path must not click, or it would flip the box it was asked to keep.
const same = await setProcessingOption({ caption: CAPTION, value: asFound });
console.log(`set to ${asFound}: ok=${same.ok} changed=${same.changed} — ${same.note}`);
assert.equal(same.ok, true);
assert.equal(same.changed, false);

const other = asFound === "checked" ? "unchecked" : "checked";
const flip = await setProcessingOption({ caption: CAPTION, value: other });
console.log(`set to ${other}: ok=${flip.ok} before=${flip.before} after=${flip.after} mean=${flip.mean}`);
assert.equal(flip.ok, true, flip.error);
assert.equal(flip.before, asFound);
assert.equal(flip.after, other);
assert.equal(flip.changed, true);

const back = await setProcessingOption({ caption: CAPTION, value: asFound });
console.log(`set back to ${asFound}: ok=${back.ok} after=${back.after} mean=${back.mean}`);
assert.equal(back.ok, true, back.error);
assert.equal(back.after, asFound);

// An unreadable request must be refused with the accepted words, not guessed at.
const bad = await setProcessingOption({ caption: CAPTION, value: "H.265" });
console.log(`value "H.265": ok=${bad.ok} reason=${bad.reason}`);
assert.equal(bad.ok, false);
assert.equal(bad.reason, "unreadable-request");
assert.ok(bad.accepted?.checked?.length > 0);

// A caption that does not exist must list what does.
const missing = await setProcessingOption({ caption: "gibt es nicht", value: "an" });
console.log(`caption "gibt es nicht": ok=${missing.ok} reason=${missing.reason}`);
assert.equal(missing.ok, false);
assert.equal(missing.reason, "no-row");

console.log("ok: set, read back, restored, and both refusals name what they saw");
