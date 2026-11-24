# Development backlog — what Studio can do that this server cannot (yet)

Built 2026-11-24 from the official online manual (every row cites its page), `docs/FEATURE_SURVEY.md`, and the
measured behaviour of the 33 tools. Coverage legend: **✓** covered · **◐** partial / read-only · **✗** missing.

Base URL for all manual links: `https://onlinemanual.insta360.com/studio/en-us/`

---

## 0. The blocker comes first

A project this server *builds* still opens with both clips stuck on **"Lade Dateien…"** and cannot be exported.
The manual documents a class of causes we have not tested. Three leads, all from Insta360's own pages:

| Lead | Source | Why it fits |
|---|---|---|
| Project file **and** media storage locations *and the user name* must be consistent; project files must not be renamed | `operation-guide/file-management/clip-management` (FAQ 4) | Our builder writes absolute paths and copies a template. If Studio resolves anything through the project *storage location* or the profile user name, a hand-built project breaks exactly this way. |
| "Move media to another drive, then change **Project File Save Path**" is Insta360's own fix for media that will not import/edit | `troubleshooting/file-import-issue/media-import-issue` (Scenario 5) | The project file path is a real, user-visible variable — and it is a *preference* we cannot read or set today (see E3). |
| Media-library assets on a **network/other drive** fail to load on the project page | `troubleshooting/page-function-issues/library-load` | Same failure *shape* (a page that never finishes loading). Studio itself treats "resource not on the expected volume" as a load failure. |
| Error strings worth recognising instead of guessing | `troubleshooting/file-import-issue/media-import-issue` | `2 imports failed: Unknown error (2)`, `No master file corresponding to LRV file was found`, `Video generates two video files, one of which can't be retrieved`, `file is not supported in current offset version` — the last one matters for us, because this whole server depends on the *offset version*. |
| The **log tree** exists and now has a reader | `operation-guide/file-management/obtain-log-or-dump-files` | Built as D1/D2. Measured: the launcher, CEF, **detector** and Inno-Setup logs are plain text; the main/export/thumbnail/`quick_look` logs are **encrypted** (constant 16-byte header `cd013a985f5beca1bcc1ca036aa5d1a0` + `bf08ac29` frames, high-entropy payload), and the crash dumps live in `crashes\lag_reports` — written on a **hang**, which is this exact symptom. 9 dumps, newest 2026-11-23T21:58, i.e. from the test runs that hit it. |

**Do this before writing any new edit feature:** test the three path hypotheses, and use the dumps as the instrument.

State after building D1/D2: the log route is **partly closed**. The dump timestamps prove *when* Studio hung, and the
readable sibling logs give the install history, the launch arguments and the detector's decisions — but the main log
that would name the file it is stuck on cannot be read, because Insta360 encrypts it with a key inside its binaries
(reverse-engineering job, not a parser). What is left as the instrument is a **differential comparison**: one project
written by Studio itself vs. one this server builds, field by field, plus the three path hypotheses. See E3 for the
`Project File Save Path` preference, which is both a hypothesis and a lever.

---

## 1. Coverage today

| # | Studio area (manual) | Our tools | Missing |
|---|---|---|---|
| 1 | Import / media management (`creative-import`, `clip-management`) | ✓ `studio_ui_open_media` | **Clip create / copy / delete** (Studio 6.0 edits several clips from one media file and switches between schemes) ✗; import-error classification ✗ |
| 2 | 360 reframing: keyframes, FOV presets, Reorient (`keyframe`, `adjust-the-perspective`) | ◐ `studio_clip_transform` / `_set_transform` (static transform only) | **Keyframes** ✗, **named FOV presets** (Crystal Ball, Tiny Planet, UltraWide, Linear…) ✗, Reorient ✗, 360 Monitor ✗ |
| 3 | AI: Deep Track, Auto Frame, Auto Edit, Remove Grain, AquaVision (`deep-tracking-function`, `auto-frame`, `ai-processing-image-noise-reduction`) | ✗ | all of it ✗ |
| 4 | Filters / looks / manual colour (`en-US.json`; no manual page) | ✗ | ✗ — `color_adjust_setting` exists in the clip schema but no tool writes it |
| 5 | Transitions (v6.0 asset) | ✗ | ✗ — `transitions[]` sits in the project file |
| 6 | Text / titles | ✗ | ✗ — `text_clips[]` |
| 7 | Stickers + animation | ✗ | ✗ — `sticker_clips[]` |
| 8 | Movement presets (`movement`) | ✗ | ✗ (needs downloaded assets, see H1) |
| 9 | Speed: TimeShift, ramping, motion blur, interpolation | ✗ | ✗ |
| 10 | Audio: BGM, volume, fade, denoise, mute (`audio-settings`) | ✗ | ✗ — `bgm_clip[]` + `audioSettings` |
| 11 | HDR / colour space / I-Log / PureShot / Dolby (`dolby`) | ◐ `Farbraum` readable/settable in the export dialog | I-Log / PureShot toggles ✗; Dolby Vision → **drop** (macOS M-series only) |
| 12 | Watermark (`watermark`) | ◐ via GUI copy/paste flow | as a written parameter ✗ |
| 13 | Export: settings, batch, VR (`file-export-instructions`, `instructions-for-vr-panoramic-video-editing-and-export`) | ◐ `studio_ui_export_settings` / `_set` for `Kodierung`/`Farbraum`; **all** settings readable | measurement of `Auflösung`/`Rahmen`/`Bitrate`/`Voreinstellung` ✗, batch/queue ✗, VR platform presets ✗, AI stitching ✗ |
| 14 | Project management (`project-page-introduction`) | ◐ read/list/sources + build (build does not export, see §0) | working authoring ✗ |
| 15 | Stats / Dashboard (`dashboard-function`) | ✗ | ✗ — template, units, GPS source, GPX/FIT import |
| 16 | Plug-ins (Premiere, QuickLook, LUT, FCPX) | — | **out of scope** |
| 17 | Automation surface | — | our product; Insta360 documents none |

---

## 2. The development list

Effort: **S** ≤ half a day · **M** ~1–3 days · **L** > 3 days (or needs a new measurement campaign).

### A. Edit surface that the project file already carries — file-based, no GUI, cheapest wins

| # | Function | What it is | Effort | Notes |
|---|---|---|---|---|
| A1 | `studio_clip_keyframe_*` (add / set / move / delete) | Keyframes are Studio's core reframing mechanism: a transform pinned to a time | M | Manual: `edit-function/keyframe`. Encode the documented limits: requires flat aspect ratio; "too many keyframes and the camera stops following them" |
| A2 | `studio_clip_colour` (read/write) | Filters, exposure, WB, tone — `color_adjust_setting` in the clip | S | Manual has no page; the schema is in the recovered descriptors + `docs/INSPROJ_SCHEMA.md` |
| A3 | `studio_project_transition` | Add/change/remove a transition between two clips | S | `transitions[]` in the project |
| A4 | `studio_project_text` | Text/title clips: content, timing, style | M | `text_clips[]` |
| A5 | `studio_clip_speed` | Speed, TimeShift, ramping, motion blur, frame interpolation | M | Changes the frame arithmetic (`len(c) = source_total_frames − trims`) — verify against `INSPROJ_SCHEMA.md` before writing |
| A6 | `studio_project_audio` | BGM from a local file, volume, fade in/out, mute original, denoise | M | Manual: `preference-settings/audio-settings` — one audio track only, MP3/WAV, no recording |
| A7 | `studio_project_sticker` | Stickers + animation | M | lowest value of group A; `Resources/stickeranimation/` is catalogued |
| A8 | clip create / copy / delete | Several edit schemes per media file, switchable | M | Manual: `file-management/clip-management` — the page that also carries the §0 lead |

### B. Media page (`.insprj`) — a whole file format we do not touch

The Media page is where a *single* file gets edited, and it keeps its own project file (`.insprj`, "Media-page project
file"; `.json` = media libraries; `.insproj` = Project page — `clip-management` FAQ 3). Watermark, per-media FOV,
Stats, Remove Grain and the batch operations all live there.

| # | Function | Effort | Notes |
|---|---|---|---|
| B1 | `studio_media_read` / `studio_media_write` for `.insprj` | M | prerequisite for B2–B5 |
| B2 | `studio_media_watermark` (parameterised) | M | Manual: `edit-function/watermark` — Media page only; batch via copy/paste (6.0) or Batch Settings (5.x); only for original camera media, not exported/re-encoded files |
| B3 | `studio_media_dashboard` (Stats) | M | Manual: `dashboard-function` — GPS source (remote / app / GPX-FIT import), template, metric-imperial; **flat video only** (not 360 export), not for Timelapse/Starlapse/TimeShift/Slow Motion/Bullet Time; some labels are English-only inside German UI |
| B4 | `studio_media_denoise` | S | Manual: `file-management/ai-processing-image-noise-reduction` — auto for new X-series/GO/Ace media, toggle only for already-exported media |
| B5 | `studio_media_gpx_import` | S | GPX/FIT files for Stats; "Dashboard Disabled by Default" is a preference (see E) |

### C. Export — measure the rest, then open the queue

| # | Function | Effort | Notes |
|---|---|---|---|
| C1 | Finish the export-settings matrix | S | `Auflösung`, `Rahmen`, `Bitrate`, `Voreinstellung` are readable but not yet measured per option; the mechanism is proven |
| C2 | `studio_export_queue` (add / list / run / clear) | M | Manual: the dialog's second button is `Zur Warteschlange`; 5.x/6.0 batch settings. Also the only sane way to export many Auto-Frame/Auto-Edit results |
| C3 | VR / platform export presets | S | Manual: `instructions-for-vr-panoramic-video-editing-and-export` (2:1 project ratio required) |
| C4 | `AI stitching` + `I-Log`/`PureShot` toggles | S | Same dialog mechanism as C1; AI stitching raises export time |
| C5 | Dolby Vision | — | **drop on Windows** — H.265 + M-series Mac only (`file-management/dolby`) |

### D. Diagnostics & maintenance — the cheapest value per hour

| # | Function | Effort | Notes |
|---|---|---|---|
| D1 | `studio_logs` (list / sessions / read / grep by area) | **✅ built** | `operation-guide/file-management/obtain-log-or-dump-files`. Measured: launcher/CEF/detector/setup logs are plain text, main/export/thumbnail/`quick_look` are encrypted — the tool *reports* encryption instead of decoding it, and every read is confined to the Insta360 tree. `src/logs.mjs`, 8 tests. |
| D2 | `studio_dumps` (find crash dumps) | **✅ built** | The dumps are in `crashes\lag_reports` (written on a **hang**), not `crashes\reports`; crashpad bookkeeping (`settings.dat`, `metadata`) is counted, not listed. |
| D3 | Import/preview error classifier | S | Map the documented error strings + the "Corrupted Frame" red-frame state (`troubleshooting/playback-preview-issue/media-play-error`, v5.8.4+) to plain sentences instead of a stuck page |
| D4 | `studio_version_report` | S | Manual: `installation-and-update/download-and-installation-operations` (Menu ▸ Help ▸ Check for Updates / Install Thumbnail Plugin). **Report only — never update**: the launcher moves the install and invalidates every measured offset |
| D5 | `studio_ui_export` timeout/`export-slow` guidance | S | Manual: `troubleshooting/file-export-issue/export-slow` — export speed is GPU-bound; the documented levers are Exporter Codec = all, Image Processing Acceleration = Auto, lower bitrate |

### E. Preferences — measurement levers *and* a bug lever

| # | Function | Effort | Notes |
|---|---|---|---|
| E1 | `studio_pref_codec` | S | Manual: `preference-settings/codec-settings` and `export-slow` — Exporter Codec selection, Image Processing Acceleration (Auto), player codec |
| E2 | `studio_pref_audio` | S | Manual: `preference-settings/audio-settings` |
| E3 | `studio_pref_paths` | S | Project file save path — **the variable behind the §0 lead**; also the install tree |
| E4 | `studio_pref_language` | S | Manual: `preference-settings/language-settings`; also explains OCR surprises (`Menü` → `Menÿ`) |

### F. AI features — high user value, GUI-only, long-running

None are reachable as APIs (`ExportClipInfo` has no listener; see the skill). All are UI operations with waits.

| # | Function | Effort | Notes |
|---|---|---|---|
| F1 | Deep Track | L | `edit-function/deep-tracking-function` — persons/vehicles/animals; 360 video only, not Bullet Time/Timelapse; on **both** pages, so the Media-page path (B) helps |
| F2 | Auto Frame | L | `edit-function/auto-frame` — 360 video > 10 s, media page only, produces multiple highlight clips → pairs naturally with C2 |
| F3 | Auto Edit (`auto_cut`) | L | Studio 6.0; needs ≥ 3 clips or > 30 s total, min clip 4 s. Long run, but the single biggest "edit a folder of footage" win |
| F4 | Remove Grain / AquaVision | M | `file-management/ai-processing-image-noise-reduction`; AquaVision is an AI preset + re-analyse |

### G. Rule engine — encode Studio's own constraints

Studio refuses or silently degrades impossible combinations, and the manual states them. A preflight tool turns a
lost export into an immediate answer.

| # | Rule | Source |
|---|---|---|
| G1 | Movement cannot be combined with Deep Track or keyframes on the same clip | `edit-function/movement` |
| G2 | Movement requires a flat aspect ratio (≠ 2:1); 2:1 is required for VR export | `movement`, `instructions-for-vr-...` |
| G3 | Stats export works with flat video only, and not for Timelapse/Starlapse/TimeShift/Slow Motion/Bullet Time | `dashboard-function` |
| G4 | Auto Frame: 360 video, > 10 s, not Timelapse/Bullet Time/Slow Motion | `edit-function/auto-frame` |
| G5 | Deep Track: 360 video only, not Bullet Time/Timelapse | `deep-tracking-function` |
| G6 | Watermark: original camera media only | `edit-function/watermark` |
| G7 | Audio: one track, MP3/WAV, no recording | `preference-settings/audio-settings` |
| G8 | Project files must not be renamed; storage locations and user name must match | `clip-management` |

### H. Deliberately out of scope

| # | Item | Why |
|---|---|---|
| H1 | Movement presets | their asset library is a cloud download; a GUI-only path with a network dependency |
| H2 | Dolby Vision | macOS M-series only |
| H3 | Cloud material share / cloud export beyond the known 10-per-batch limit | requires a logged-in account (`log-in-to-use/how-to-log-in`) for little automation value |
| H4 | Premiere / FCPX / QuickLook / LUT plug-ins | separate installs, not a Studio automation surface |
| H5 | 360 Monitor / Reorient-as-preview | display-only |
| H6 | macOS-only paths | this server targets Windows |

---

## 3. Suggested order

1. ~~**D1 + D2** (log/dump reader)~~ — **done 2026-11-24**: `src/logs.mjs`, `studio_logs` + `studio_dumps`, 8 tests, 93 total. Result: dumps are readable evidence, Studio's main log is not (encrypted).
2. **§0 investigation**: differential comparison (Studio-written project vs. ours, field by field) + the three path hypotheses + E3 (`Project File Save Path`). The dump timestamps from step 1 scope it to the runs that actually hung.
3. **A1, A2, A3** (keyframes, colour, transitions) — the reframing/editing core, file-based, no GUI risk.
4. **G1–G8** (preflight) — cheap, and it stops every AI/export path from failing late.
5. **C1, C3, C4** (finish the export matrix) + **B1/B2** (Media page + watermark).
6. **A4–A8, B3–B5, E1–E4.**
7. **F1–F4** — one at a time, each is a project in its own right.
