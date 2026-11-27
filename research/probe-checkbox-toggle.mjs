// Live probe: the `Medienverarbeitung:` group's click point, exercised the way a caller would.
//
//   node research/probe-checkbox-toggle.mjs
//
// Requires Studio with the export dialog open on media whose sources are raw dual-lens `.insv`
// (otherwise the group is not there to toggle — the probe says so and exits 1). Toggles the row,
// reads the fill back, and toggles it back, so the dialog is left as it was found.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { click, redraw } from "../src/ui.mjs";
import { readDialog } from "../src/export-dialog.mjs";

const md5 = (p) => createHash("md5").update(readFileSync(p)).digest("hex").slice(0, 12);

/**
 * A click here is a message click, and a window that is not in the foreground is not composited:
 * its last presented frame lags one interaction behind. Measured on this probe's first run — the
 * capture after the click was *byte-identical* to the one before it, fill included, and the toggle
 * only showed up once the window was nudged. `redraw` is that nudge, and a click probe that skips
 * it reports "the click did not land" for a click that landed perfectly well.
 */
const readBack = async (label) => {
  redraw({});
  await new Promise((r) => setTimeout(r, 700));
  const d = readDialog({});
  return { frame: d.screenshot, row: d.processing.rows[0], window: d.window };
};

// An unchecked box reads **42.2 or 72.0** (both measured, on separate runs, both far below the
// 100 threshold). The pointer is *not* the cause: parking the real cursor on the box and then far
// away from it both read 42.2, so that dead end is closed. The cause is not established here and
// is deliberately not claimed. What matters is the margin: the threshold has to separate 72.0 from
// 141.4, and it sits at 100.
const pointerOnRow = (row, w) => {
  const c = w.cursor ?? {};
  return (
    c.x >= (w.left ?? 0) + row.box.x &&
    c.x <= (w.left ?? 0) + row.box.x + row.box.w + 14 &&
    c.y >= (w.top ?? 0) + row.box.y &&
    c.y <= (w.top ?? 0) + row.box.y + row.box.h
  );
};

let d = readDialog({});
if (!d.processing.ok || d.processing.rows.length === 0) {
  console.error(`no checkbox row to toggle: ${d.processing.reason ?? d.processing.note}`);
  process.exit(1);
}

const [row] = d.processing.rows;
console.log(`row "${row.caption}" at ${row.click.x},${row.click.y}: ${row.state} (mean ${row.mean}, pointer on row ${pointerOnRow(row, d.window)})`);
const before = { state: row.state, mean: row.mean, shot: md5(d.screenshot) };

click(row.click);
const first = await readBack("after-click-1");
console.log(
  `after one click: ${first.row.state} (mean ${first.row.mean}, pointer on row ${pointerOnRow(first.row, first.window)}), ` +
    `frame changed ${md5(first.frame) !== before.shot}`,
);
assert.notEqual(md5(first.frame), before.shot, "the click did not reach the dialog: the frame is unchanged");
assert.notEqual(first.row.state, before.state, "the click landed but the box's fill did not change");
assert.deepEqual(first.row.click, row.click, "the box moved between the two states, so the second click would miss");

// Leave the dialog as found: a probe that flips a setting and walks away changes the export.
click(first.row.click);
const back = await readBack("after-click-2");
console.log(`after the second click: ${back.row.state} (mean ${back.row.mean}, pointer on row ${pointerOnRow(back.row, back.window)})`);
assert.equal(back.row.state, before.state, "the row was not restored to the state it was found in");
// The state is the invariant, not the exact fill: an unchecked box reads 42.2 or 72.0 across runs
// (the pointer is ruled out, see `pointerOnRow` above), so the check is that the fill stays in the
// band its state implies, comfortably below the 100 threshold.
assert.ok(back.row.mean < 100, `an unchecked box must read below the threshold, got ${back.row.mean}`);
// And the measurement discriminates: the two states differ by far more than the drift within one
// (measured gaps 69.4 and 99.2, versus at most 1.2 between two captures of the same state).
assert.ok(Math.abs(first.row.mean - before.mean) > 40, `the fill barely moved: ${before.mean} -> ${first.row.mean}`);

console.log("ok: the click toggles the box, the fill reads it back, and the row was restored");
