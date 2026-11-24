// Unit tests for the quiet-mode key translation.
//
// The point of these is the *refusal* boundary: only a single key with no
// modifier may be read out of a SendKeys string, because a partial reading of a
// chord would turn Ctrl+E into a plain "e" typed into the operator's foreground
// window. No Studio and no Windows needed here -- this is a pure function.

import assert from "node:assert/strict";
import { test } from "node:test";

import { plainKey } from "../src/ui.mjs";

test("plain keys are read, in both spellings", () => {
  assert.equal(plainKey("{ESC}"), "ESCAPE");
  assert.equal(plainKey("{escape}"), "ESCAPE");
  assert.equal(plainKey("ESC"), "ESCAPE");
  assert.equal(plainKey("{ENTER}"), "ENTER");
  assert.equal(plainKey("ENTER"), "ENTER");
  assert.equal(plainKey("{TAB}"), "TAB");
  assert.equal(plainKey("{BACKSPACE}"), "BACKSPACE");
  assert.equal(plainKey("{DEL}"), "DELETE");
  assert.equal(plainKey("{PGDN}"), "PAGEDOWN");
  assert.equal(plainKey("  {HOME}  "), "HOME");
});

test("anything with a modifier, a repeat or a second key is not a plain key", () => {
  assert.equal(plainKey("^e"), null);
  assert.equal(plainKey("^{s}"), null);
  assert.equal(plainKey("%{F4}"), null);
  assert.equal(plainKey("+{TAB}"), null);
  assert.equal(plainKey("{F5}"), null);
  assert.equal(plainKey("{ESC 2}"), null);
  assert.equal(plainKey("a{ENTER}b"), null);
  assert.equal(plainKey("{ENTER}{ENTER}"), null);
  assert.equal(plainKey(""), null);
  assert.equal(plainKey(undefined), null);
});
