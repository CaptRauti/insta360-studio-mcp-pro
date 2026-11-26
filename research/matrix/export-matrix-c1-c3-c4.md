# Export matrix — C1 / C3 / C4 measurement (LamspringeKlon, 2:1 3600 Panorama)

Source: `research/matrix/lam360-opt-*.json`, `lam360-preset-matrix.json`, `option-effects.json`.
Consolidated by `node research/matrix/consolidate.mjs` → `export-matrix.json` (re-run it; do not retype these
numbers). Project state at measurement: 60 fps, 2:1 ratio, `LamspringeKlon.mp4` → `C:/Users/stefa/Desktop`.

## C1 — the option inventory (all five controls opened and read)

| Control | Click point (window-rel.) | Options as the popup lists them |
|---|---|---|
| Auflösung | 657,391 | 4K - 4320 x 2160 · 5.7K - 5760 x 2880 · 8K - 7680 x 3840 · Benutzerdefiniert |
| Rahmen | 657,483 | *Die Bildrate des Projekts anpassen - 60.00* · 24.00 · 25.00 · 29.97 · 30.00 · 50.00 · 59.94 |
| Bitrate | 657,529 | ✓ Empfohlen · Benutzerdefiniert |
| Kodierung | 657,600 | H.264 · H.265 · ProRes 422 · ProRes 422LT |
| Farbraum | 657,646 | Rec.709 8bit · Rec.709 10bit |

List-box geometry is in the raw files (`listBox.box`, and the `brightness.closed`/`open` pair that the popup
detector keys on — closed ≈ 26–32, open ≈ 48–52, i.e. a *rise* of ~18 points reliably means "open").

**Order matters.** `option-effects.json` shows that changing **Exportmodus** rewrites two other controls:
switching to *Mehrere Segmente* resets Voreinstellung → *Quellauflösung übernehmen* and Auflösung →
*Benutzerdefiniert*. So set Exportmodus **first**, then the preset, then the fine controls — the reverse order
silently discards work.

## C3 — the platform presets (this *is* the VR/platform export surface)

`lam360-preset-matrix.json`, read back after each selection. Six of seven measured (the seventh failed
selection and its readback is untrustworthy — not a finding):

| Preset | forced Kodierung | forced Farbraum | forced Rahmen |
|---|---|---|---|
| Youtube-Pano | H.265 | 10bit | project rate |
| TikTok-Pano | H.265 | 10bit | **60 fps** |
| Apple VisionPro-Pano | H.265 | 10bit | project rate |
| Meta Quest-Pano | H.265 | 10bit | project rate |
| Pico-Pano | H.265 | 10bit | project rate |
| Benutzerdefiniert | H.264 | 8bit | project rate |
| ~~Quellauflösung übernehmen~~ | — | — | selection failed, not measured |

Findings: every platform preset forces **H.265 + 10 bit**; only TikTok-Pano additionally pins the frame rate;
the platform presets leave Auflösung at *Benutzerdefiniert* while the custom preset sets 4K. That is the
concrete content of "2:1 project ratio required for VR presets" — the presets are gated behind the ratio, and
once usable they fix codec/colour space rather than resolution.

## C4 — AI stitching / I-Log / PureShot toggles

Not reached. They live below the fold of the same strip; the panel stopped accepting input before the scrolled
region could be driven (see the blocker below). `lam360-ocr-scrolled.json` holds the first scrolled read.

## Blocker found while sweeping (unresolved, hand to Stefan)

After selecting **Auflösung = 4K** on this project, the export panel **stopped accepting synthetic input
entirely** while Studio stayed healthy: `IsHungAppWindow=False`, `Responding=True`, window enabled and
foreground, no modal dialog in the full-window OCR. Five consecutive OCR reads returned byte-identical
content, and clicks/key presses produced no state change. The window still showed a size estimate of
`1296 GB`, i.e. a computation was in flight. Most likely a **textless busy overlay** (a scrim/spinner carries
no OCR text, so it is invisible to every text-based probe) that swallowed the input.

Consequences for the tool, not just for this run:
- `click()` is PostMessage press+release at one point. For a Qt combo box that opens on press and closes on
  release, that pair can never *leave a popup open* — a real fix needs a separate press / move / release.
- No dialog/modal detector exists; `dialogLabels` and full-window OCR both miss a textless overlay.
- A hang probe is cheap and was missing: `IsHungAppWindow` + `Responding` says "alive but not reacting" in one
  call, which is the difference between "wait" and "restart".

## Residual (the honest remainder of C1)

- Auflösung **5.7K and 8K**: listed, effect not measured.
- Rahmen **24 / 25 / 29.97 / 30 / 50 / 59.94**: listed, per-value effect not measured.
- Bitrate: the custom Mb/s field behind *Benutzerdefiniert* was never read.
- Kodierung H.265 / ProRes 422 / ProRes 422LT: listed; whether they override Farbraum/Bitrate not measured.

## OCR traps on this strip (they cost time — do not read these literally)

`Rec.709 IObit` = **Rec.709 10bit** · `… anpassen - 6000` = **… - 60.00** · `V Empfohlen` = **✓ Empfohlen**
· `Exportmod` = **Exportmodus** (label clipped by the column) · `Quellauflösung überneh.„` = a truncated row.
