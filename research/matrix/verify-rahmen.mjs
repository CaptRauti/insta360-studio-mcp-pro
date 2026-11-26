// Verify the reader fixes end-to-end against the live dialog, without restarting the
// MCP server (which still runs the pre-fix code).
//
//   node research/matrix/verify-rahmen.mjs
//
// Three questions:
//   1. does optionMatch now accept the *full* label of an elided option row?
//   2. after choosing an explicit frame rate, is the row's value readable at all —
//      or does Studio really draw an empty cell there?
//   3. can a second rate be chosen in the same dialog session (the poisoning bug)?
import { readDialog, selectOption } from "../../src/export-dialog.mjs";

const row = (tag) => {
  const { fields } = readDialog({});
  const r = fields.Rahmen ?? null;
  console.log(`${tag}: Rahmen = ${r ? JSON.stringify(r.value) + " click " + JSON.stringify(r.click) : "MISSING"}`);
  return r;
};

const pick = async (label, text) => {
  const r = await selectOption({ label, text });
  console.log(`${label} = "${text}": ok=${r.ok} ${r.ok ? "picked=" + JSON.stringify(r.picked) : "err=" + r.error}`);
  return r;
};

row("before");

// 1 + reset: the full label, which the old containment match never accepted.
await pick("Voreinstellung", "Quellauflösung übernehmen");
row("after reset");

// 2: choose a rate, then look at the row.
await pick("Rahmen", "30.00");
row("after 30.00");

// 3: and a second one in the same session (this is what used to fail).
await pick("Rahmen", "25.00");
row("after 25.00");
