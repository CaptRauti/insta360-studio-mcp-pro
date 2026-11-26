// The project editor: what it exposes and how to reach it.
//
// Measured against Studio 6.0.9 with a project loaded. Opening a project is a
// double click on its card in the project library — passing the `.insproj` path
// on the command line does *not* open it, and neither does writing the library
// file `nle/pro.insproj`: Studio rewrites that file on start and drops entries it
// did not create itself. The card click is the only reliable route, and it is
// what the MCP tool `studio_project_open` uses.
//
// The editor screen carries a tab strip:
//
//   Medien | Musik | Text | Sticker | Effekte | Übergänge | Bewegung | Projekt-Info
//
// and a `Bearbeiten` button that opens the media page for the selected item.
// The tab strip is CEF/HTML, so it is invisible to UI Automation; every
// interaction goes through screenshot + OCR + coordinate clicks.
//
// Coordinates are window-relative, exactly as OCR reports them — no scaling.

import { click, capture, sleep, windowInfo, DEFAULT_WINDOW_TITLE } from "./ui.mjs";
import { ocrImage } from "./ocr.mjs";

/** Tabs of the project editor, in the order Studio shows them. */
export const EDITOR_TABS = [
  "Medien",
  "Musik",
  "Text",
  "Sticker",
  "Effekte",
  "Übergänge",
  "Bewegung",
  "Projekt-Info",
];

/** Labels that identify the project editor (as opposed to library or player). */
export const EDITOR_LABELS = ["Abgespieltes Projekt", "Projekt-Info", "Medien", "Bearbeiten"];

/**
 * Screenshot the window and return the OCR words with coordinates.
 * Every function below builds on this — there is no cheaper way in, because the
 * editor is HTML drawn by CEF and exposes no accessible tree.
 */
export function readScreen({ title = DEFAULT_WINDOW_TITLE, mode = "print" } = {}) {
  const shot = capture({ title, mode });
  const ocr = ocrImage(shot.path);
  if (!ocr.ok) return { ok: false, error: ocr.error, shot: shot.path, words: [] };
  return { ok: true, shot: shot.path, words: ocr.words, text: ocr.words.map((w) => w.text).join(" ") };
}

/** True when the project editor is on screen rather than the library or player. */
export function looksLikeEditor(found = []) {
  const text = found.map((w) => w.text ?? w).join(" ");
  return EDITOR_LABELS.filter((l) => text.includes(l)).length >= 2;
}

/** Where a word is on screen, as the centre of its box. */
export function findWord(found, text, { exact = true, yMin = 0 } = {}) {
  const want = text.toLowerCase();
  const hits = found.filter((w) => {
    if ((w.y ?? 0) < yMin) return false;
    const t = String(w.text).toLowerCase();
    return exact ? t === want : t.includes(want);
  });
  if (!hits.length) return null;
  const w = hits[0];
  return { text: w.text, x: w.x + Math.round((w.w ?? 0) / 2), y: w.y + Math.round((w.h ?? 0) / 2), raw: w };
}

/** Every occurrence of a word, so a caller can pick the right one. */
export function findAll(found, text, { exact = true } = {}) {
  const want = String(text).toLowerCase();
  return found
    .filter((w) => (exact ? String(w.text).toLowerCase() === want : String(w.text).toLowerCase().includes(want)))
    .map((w) => ({ text: w.text, x: w.x + Math.round((w.w ?? 0) / 2), y: w.y + Math.round((w.h ?? 0) / 2), raw: w }));
}

/**
 * OCR skeleton of a label: alphanumerics only, and the glyph pairs the
 * recogniser actually confuses folded together (`l`, `i`, `|` all read as `1` in
 * Studio's small card font). `mcpCtrl049` and the OCR's `mcpctr1049` both become
 * `mcpctr1049`.
 */
export function skeleton(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/[li|]/g, "1");
}

/** True when two skeletons are equal, or differ by one substitution on a long enough name. */
export function sameSkeleton(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length < 6 || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i] && ++diff > 1) return false;
  return true;
}

/**
 * Find a caption that the OCR may have split across several words.
 *
 * Project cards are labelled with the project name, and the OCR breaks such a
 * label up wherever the case changes: "mcpFLrv" comes back as "mcp" (y=400) plus
 * "FLrv" (y=398) — two boxes, two pixels apart. Matching a single word therefore
 * reports "not in library" for a project that is plainly on screen, and names
 * with a space fail the same way.
 *
 * So consecutive words are joined and searched as a sequence, with two guards:
 * a vertical tolerance (the split halves sit a hair apart while the next card
 * row is ~135px away) and a horizontal gap limit (neighbouring cards sit close
 * together, so a row must not be smeared into one string). An exact match beats
 * a partial one, which keeps "Lamspringe" off the neighbouring "LamspringeKlon"
 * card — and both beat the fuzzy stage below.
 *
 * The last stage exists because OCR confuses glyph shapes inside names and
 * nobody gets to choose what Studio calls a project: `mcpCtrl049` is read as
 * `mcpctr1049` (`l` -> `1`), `mcpzwx` as `mcpzv.'x` (`w` -> `v`, plus stray
 * punctuation). Those read as "not in library" for a card sitting in plain
 * sight, so after an exact and a substring match the labels are compared by
 * their OCR skeleton — alphanumerics only, `l`/`i`/`|` folded to `1` — with one
 * substitution tolerated on names of six characters or more. Folded, the first
 * example is `mcpctrl049` on both sides: an exact hit.
 */
export function findLabel(found, text, { yMin = 0, yTol = 8, maxGap = 60 } = {}) {
  const wantTight = String(text).toLowerCase().replace(/\s+/g, "");
  const wantSkeleton = skeleton(text);
  const tight = (g) => g.map((w) => String(w.text)).join("").toLowerCase();
  const words = found
    .filter((w) => (w.y ?? 0) >= yMin)
    .slice()
    .sort((a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0));

  let best = null;
  const consider = (group, score) => {
    const first = group[0];
    const last = group[group.length - 1];
    const cand = {
      text: group.map((w) => String(w.text)).join(" "),
      x: Math.round((first.x + (last.x + (last.w ?? 0))) / 2),
      y: Math.round((first.y ?? 0) + (first.h ?? 0) / 2),
      raw: first,
      score,
    };
    const better =
      !best ||
      score > best.score ||
      (score === best.score && (cand.y < best.y || (cand.y === best.y && cand.x < best.x)));
    if (better) best = cand;
  };

  // Sort into vertical bands first, then scan each band left to right: a split
  // caption can put the left half a pixel *below* the right half, so a plain
  // y-then-x ordering presents the halves in the wrong sequence.
  const bands = [];
  for (const w of words) {
    const band = bands[bands.length - 1];
    // Chain the tolerance off the band's lowest word so far, not its first one:
    // a stray word 10px above the caption row must not push the caption's own
    // halves into two different bands.
    if (!band || (w.y ?? 0) - band.maxY > yTol) bands.push({ minY: w.y ?? 0, maxY: w.y ?? 0, words: [w] });
    else {
      band.words.push(w);
      band.maxY = Math.max(band.maxY, w.y ?? 0);
    }
  }

  for (const band of bands) {
    const row = band.words.sort((a, b) => (a.x ?? 0) - (b.x ?? 0));
    for (let i = 0; i < row.length; i++) {
      let group = [row[i]];
      for (let j = i; j < row.length && group.length < 6; j++) {
        if (j > i) {
          const prev = row[j - 1];
          const cur = row[j];
          if ((cur.x ?? 0) - ((prev.x ?? 0) + (prev.w ?? 0)) > maxGap) break;
          group = group.concat([cur]);
        }
        const t = tight(group);
        if (t === wantTight) consider(group, 3);
        else if (t.includes(wantTight)) consider(group, 2);
        else if (sameSkeleton(skeleton(group.map((w) => String(w.text)).join("")), wantSkeleton)) consider(group, 1);
      }
    }
  }
  return best;
}

/**
 * Open a project from the library by name.
 *
 * The card is clicked, not the label: the label sits in the card's lower part,
 * and a double click on the text itself missed (measured — the click landed on
 * empty space above the card and nothing happened). The card centre is derived
 * from the label box, `heightAbove` up from the label's top.
 */
export async function openProject(name, { title = DEFAULT_WINDOW_TITLE, cardOffsets = [21, 30, 40, 55], settleMs = 12000, verifyFile = null } = {}) {
  const existsSync = (await import("node:fs")).existsSync;
  const statSync = (await import("node:fs")).statSync;
  const mtimeOf = (f) => {
    try {
      return f && existsSync(f) ? statSync(f).mtimeMs : null;
    } catch {
      return null;
    }
  };

  /**
   * The card to click, preferring the library grid over the page list.
   *
   * The left sidebar also shows project names (it is the project list), and clicking
   * there switches project as a side effect — so a naive first match can click the
   * wrong thing. The grid sits right of the list, which is what the x-sort encodes.
   * The y floor is 120: on the 1384x900 layout the first card row is at y≈242, and a
   * 250 floor (taken from a taller window) filtered every card out.
   */
  const pickCard = (words) => {
    const cands = [];
    const span = findLabel(words, name, { yMin: 120 });
    if (span) cands.push(span);
    for (const w of findAll(words, name, { exact: false })) {
      if ((w.raw?.y ?? 0) > 120) cands.push(w);
    }
    if (!cands.length) return null;
    cands.sort((a, b) => b.x - a.x);
    return cands[0];
  };

  // Make sure the library grid is showing. The page can be anywhere — the editor, the
  // media library — and "Projektbibliothek" is on screen in the *sidebar* even then,
  // so its presence alone does not prove the grid is up (it used to be treated as if
  // it did). Click the entry and look again.
  let screen = readScreen({ title });
  if (!screen.ok) return { ok: false, error: screen.error };
  let wentToLibrary = false;
  let label = pickCard(screen.words);
  if (!label) {
    const entry = findAll(screen.words, "Projektbibliothek", { exact: false })[0];
    if (entry) {
      click({ title, x: entry.x, y: entry.y });
      await sleep(3000);
      screen = readScreen({ title });
      if (!screen.ok) return { ok: false, error: screen.error };
      label = pickCard(screen.words);
      wentToLibrary = true;
    }
  }
  if (!label) {
    const visible = (screen.words ?? []).filter((w) => w.y > 120).map((w) => w.text);
    return { ok: false, error: `project "${name}" not in library`, visible, wentToLibrary };
  }

  // The caption sits *below* the thumbnail, so the click target is above the
  // label, not around it. Measured on the 2576x1408 layout (label top y=406):
  // a double-click at label.y-45 -- the old fixed guess -- lands in the dead gap
  // between thumbnail and caption and opens nothing, while label.y-21 is inside
  // the thumbnail and opens the project. Offsets are tried in order and each one
  // is verified, so a layout change costs time instead of silently failing.
  //
  // "Is the editor up" is not enough: with the library list still on screen a click
  // that lands one row off opens a *different* project and the editor appears anyway
  // — observed, and it reported "opened ✓" for the wrong project. So each attempt
  // must also show the requested name, or rewrite the requested project file (Studio
  // autosaves a project it has loaded, which dates the file).
  const cardX = label.x;
  const tried = [];
  const mtimeBefore = mtimeOf(verifyFile);

  // The thumbnail sits above the caption by half the row pitch, not by a constant.
  // The same 21px caption offset that opens a project on the start page does nothing
  // on the library page, where the grid is tall cards 170px apart and the card centre
  // is ~85px above the caption — measured on the 1384x900 window: 82 opened the
  // project, 16…31 did not. So derive the pitch from the neighbouring captions in the
  // same column and keep the fixed list as the fallback for a single-row grid.
  const columnY = [
    ...new Set(
      (screen.words ?? [])
        .filter((w) => Math.abs(w.x + (w.w ?? 0) / 2 - cardX) < 70 && w.y > 150)
        .map((w) => Math.round(w.y)),
    ),
  ].sort((a, b) => a - b);
  const gaps = [];
  for (let i = 1; i < columnY.length; i++) gaps.push(columnY[i] - columnY[i - 1]);
  const pitch = gaps.filter((g) => g > 60 && g < 300).sort((a, b) => a - b)[0];
  const offsets = pitch ? [Math.round(pitch / 2), ...cardOffsets] : [...cardOffsets];

  for (const dy of offsets) {
    const cardY = Math.round(label.raw.y - dy);
    const reply = click({ title, x: cardX, y: cardY, double: true });
    await sleep(settleMs);
    screen = readScreen({ title });
    if (!screen.ok) return { ok: false, error: screen.error };
    if (!looksLikeEditor(screen.words)) {
      tried.push(cardY);
      continue;
    }
    const named = (screen.words ?? []).some((w) => String(w.text).toLowerCase().includes(name.toLowerCase()));
    const mtimeAfter = mtimeOf(verifyFile);
    const rewritten = mtimeBefore != null && mtimeAfter != null && mtimeAfter > mtimeBefore;
    if (named || rewritten) {
      // `style` says how the click was delivered: "message" is the plain quiet
      // path, "message-pinned" means another window covered the card and the
      // window had to be pinned topmost for the click (see Resolve-ChildPinned).
      return {
        ok: true,
        editor: true,
        clicked: { x: cardX, y: cardY },
        offset: dy,
        style: reply?.style ?? null,
        verifiedBy: named ? "project name on screen" : "project file rewritten",
        wentToLibrary: wentToLibrary || undefined,
        text: screen.text.slice(0, 400),
      };
    }
    tried.push(cardY);
  }
  return {
    ok: false,
    editor: false,
    error: `project "${name}" did not open`,
    label: { x: cardX, y: Math.round(label.raw.y) },
    tried,
    wentToLibrary: wentToLibrary || undefined,
    text: screen.text.slice(0, 400),
  };
}

/** Switch to one of the editor tabs. */
export async function openTab(tab, { title = DEFAULT_WINDOW_TITLE, settleMs = 2500 } = {}) {
  const screen = readScreen({ title });
  if (!screen.ok) return { ok: false, error: screen.error };
  const hit = findWord(screen.words, tab, { exact: false, yMin: 0 });
  if (!hit) return { ok: false, error: `tab "${tab}" not found`, tabs: EDITOR_TABS };
  click({ title, x: hit.x, y: hit.y });
  await sleep(settleMs);
  const after = readScreen({ title });
  return { ok: true, tab, clicked: { x: hit.x, y: hit.y }, text: after.ok ? after.text.slice(0, 400) : null };
}

/** The project editor's own header facts: name, path, ratio, frame rate. */
export function editorInfo(words) {
  const text = words.map((w) => w.text).join(" ");
  const ratio = words.find((w) => /^\d+:\d+$/.test(w.text));
  const fps = words.find((w) => /fps/i.test(w.text));
  const info = {};
  if (ratio) info.aspectRatio = ratio.text;
  if (fps) info.fps = fps.text;
  const title = words.find((w) => w.text === "Projekt-Info");
  info.hasProjectInfo = Boolean(title);
  info.hasTimeline = /Bearbeiten/.test(text);
  return info;
}
