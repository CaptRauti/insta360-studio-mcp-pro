// Driving the project editor: creating a project, importing media, cutting.
//
// Findings this file is built on (all measured against Studio 6.0.9):
//
//  * A `.insproj` passed on the command line is ignored — Studio starts empty.
//  * The project library `nle/pro.insproj` cannot be seeded from outside: Studio
//    rewrites it on start and **drops every entry it did not create itself**.
//    Measured: 5 entries before launch (one added by us), 4 after.
//  * A project therefore has to be created the way the GUI does it:
//    `Neues Projekt` → media imported → project saved by Studio itself.
//  * Once created, the project file is plain JSON on disk and Studio *does* read
//    edits back — opening the card again picks up the changed timeline.
//
// So the working order is: create/import through the GUI (cheap, one-time), then
// edit the JSON (fast, exact, no clicking) for everything that is timeline
// structure — trims, order, effects, transitions, colour.

import { click, sendKeys, capture, sleep, windowInfo, DEFAULT_WINDOW_TITLE } from "./ui.mjs";
import { ocrImage } from "./ocr.mjs";
import { readScreen, findWord, findAll, EDITOR_TABS } from "./editor.mjs";

/**
 * Create a new project through the GUI.
 *
 * `Neues Projekt` sits at the top of the project library. Studio then shows an
 * empty project; media is imported separately.
 */
export async function newProject({ title = DEFAULT_WINDOW_TITLE, settleMs = 6000 } = {}) {
  let screen = readScreen({ title });
  if (!screen.ok) return { ok: false, error: screen.error };

  const hit = findWord(screen.words, "Neues", { exact: false, yMin: 200 });
  if (!hit) return { ok: false, error: "no 'Neues Projekt' button on screen" };
  click({ title, x: hit.x, y: hit.y });
  await sleep(settleMs);

  screen = readScreen({ title });
  return { ok: true, clicked: hit, text: screen.ok ? screen.text.slice(0, 300) : null };
}

/**
 * Import media files into the open project.
 *
 * Studio's import opens a native Windows file dialog, which is not a child of
 * Studio's window and is not in the UI Automation tree — the same wall the
 * export path hit with the folder picker. The reliable route is the keyboard:
 * the dialog is a standard file picker, so typing a full path into its
 * filename field and pressing Enter selects the file without ever needing to see
 * the dialog.
 *
 * `paths` may be several files; the picker accepts a quoted, space-separated list
 * in its filename field, which is how Explorer itself handles multi-select.
 */
export async function importMedia(paths, { title = DEFAULT_WINDOW_TITLE, settleMs = 9000, openImport = true } = {}) {
  const list = Array.isArray(paths) ? paths : [paths];
  if (!list.length) return { ok: false, error: "no paths given" };

  if (openImport) {
    const screen = readScreen({ title });
    if (!screen.ok) return { ok: false, error: screen.error };
    const hit = findWord(screen.words, "Importieren", { exact: false });
    if (!hit) return { ok: false, error: "no 'Importieren' button on screen" };
    click({ title, x: hit.x, y: hit.y });
    await sleep(3500);
  }

  // The picker's filename field has focus when it opens, so the path can be
  // typed straight in. Quotes are required for paths containing spaces.
  const text = list.map((p) => `"${p.replace(/\//g, "\\")}"`).join(" ");
  sendKeys({ title, keys: text });
  await sleep(700);
  sendKeys({ title, keys: "{ENTER}" });
  await sleep(settleMs);

  const after = readScreen({ title });
  return { ok: true, imported: list, text: after.ok ? after.text.slice(0, 400) : null };
}

/**
 * Add the currently imported media to the timeline.
 *
 * In the editor, imported items sit in the Medien tab; Studio offers a way to
 * append them ("Zur Zeitleiste hinzufügen" / drag). The button's label is read
 * from the screen rather than assumed, and the result is reported so the caller
 * can see what was actually clicked.
 */
export async function addToTimeline({ title = DEFAULT_WINDOW_TITLE, settleMs = 4000, which = "alle" } = {}) {
  const screen = readScreen({ title });
  if (!screen.ok) return { ok: false, error: screen.error };

  const candidates = ["Zur Zeitleiste hinzufügen", "Hinzufügen", "Zeitleiste", "Alle hinzufügen"];
  for (const label of candidates) {
    const hit = findWord(screen.words, label, { exact: false });
    if (hit) {
      click({ title, x: hit.x, y: hit.y });
      await sleep(settleMs);
      const after = readScreen({ title });
      return { ok: true, label, clicked: hit, text: after.ok ? after.text.slice(0, 300) : null };
    }
  }
  return { ok: false, error: "no add-to-timeline control found", visible: screen.words.map((w) => w.text).slice(0, 60) };
}

/**
 * Put the timeline in a known state and let Studio write the project file.
 *
 * This is the hand-off point between GUI work and JSON work: once Studio has
 * saved a project with the right clips, everything after that is file editing.
 * The project file is identified by the newest `.insproj` under the project dir.
 */
export async function saveProject({ title = DEFAULT_WINDOW_TITLE, settleMs = 4000 } = {}) {
  sendKeys({ title, keys: "^s" });
  await sleep(settleMs);
  return { ok: true };
}

/** Press Escape — closes transient overlays without touching the project. */
export async function escape({ title = DEFAULT_WINDOW_TITLE, settleMs = 1200 } = {}) {
  sendKeys({ title, keys: "{ESC}" });
  await sleep(settleMs);
  return { ok: true };
}

/**
 * Read the editor screen and describe what is on it.
 *
 * Returns the tab strip, the project header facts and the visible item labels —
 * enough for a caller to decide the next step without guessing.
 */
export function describeEditor({ title = DEFAULT_WINDOW_TITLE } = {}) {
  const screen = readScreen({ title });
  if (!screen.ok) return { ok: false, error: screen.error };
  const text = screen.text;
  const tabs = EDITOR_TABS.filter((t) => text.includes(t));
  const ratio = screen.words.find((w) => /^\d+:\d+$/.test(w.text));
  const fps = screen.words.find((w) => /fps/i.test(w.text));
  const items = screen.words.filter((w) => /^VID[_\s]?\d|^IMG[_\s]?\d|\.mp4$|\.insv$/i.test(w.text)).map((w) => w.text);
  return {
    ok: true,
    tabs,
    aspectRatio: ratio?.text ?? null,
    fps: fps?.text ?? null,
    items,
    hasTimeline: text.includes("Bearbeiten"),
    words: screen.words.length,
  };
}
