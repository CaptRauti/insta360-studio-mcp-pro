# Development backlog — what Studio can do that this server cannot (yet)

Built 2026-11-24 from the official online manual (every row cites its page), `docs/FEATURE_SURVEY.md`, and the
measured behaviour of the 45 tools. Coverage legend: **✓** covered · **◐** partial / read-only · **✗** missing.

Base URL for all manual links: `https://onlinemanual.insta360.com/studio/en-us/`

---

## 0. ~~The blocker~~ — solved 2026-11-25

**A project this server builds now opens, attaches its media and exports.** The cause was
`project_album_info.data`: it is not merely a save artefact — Studio reads the album's own
`media_card_snapshots` to classify the source, and a `{album_tree:{nodes}}`-only file makes Studio decode the
file as a still (`fsType kImage` in the main log), so the clip never attaches and the player shows the
`Lade Dateien.` media card (`meanLuma 14`). Four parts are required: `album_tree` (with `root_uuids` and
`version`), `media_card_snapshots` (keyed by absolute path, each with `uuid` = that path, `display_name`,
`create_time` derived from Insta360's own file name, `is_dng_group`, `is_photo_group`,
`remark_name`, `source`), `tab_media_uuids` and `version`. Alongside it: the clip `name` must be the camera's
short display name (`VID_049.mp4`), `sourceFrames`/`fps` are *timeline* frames (convert with an integer
`projectFps/probeFps` ratio, truncating), `maxFadeIn`/`maxFadeOut` are 60, and `markTrimIn` decides what is
exported. Measured end to end on 2026-11-25: a built project GUI-exported **178,569,151 bytes, H.264
1920×1080, 1652 frames / 27.53 s + AAC** from a 1651-frame HEVC source. Detail:
`references/project-authoring.md`; skill `insta360-studio-mcp`.

Below is the reconnaissance that led to it, kept because the hypotheses and the level of evidence are still
the model for how the next failure gets diagnosed. Three leads, all from Insta360's own pages:

| Lead | Source | Why it fits |
|---|---|---|
| Project file **and** media storage locations *and the user name* must be consistent; project files must not be renamed | `operation-guide/file-management/clip-management` (FAQ 4) | Our builder writes absolute paths and copies a template. If Studio resolves anything through the project *storage location* or the profile user name, a hand-built project breaks exactly this way. |
| "Move media to another drive, then change **Project File Save Path**" is Insta360's own fix for media that will not import/edit | `troubleshooting/file-import-issue/media-import-issue` (Scenario 5) | The project file path is a real, user-visible variable — and it is a *preference* we cannot read or set today (see E3). |
| Media-library assets on a **network/other drive** fail to load on the project page | `troubleshooting/page-function-issues/library-load` | Same failure *shape* (a page that never finishes loading). Studio itself treats "resource not on the expected volume" as a load failure. |
| Error strings worth recognising instead of guessing | `troubleshooting/file-import-issue/media-import-issue` | `2 imports failed: Unknown error (2)`, `No master file corresponding to LRV file was found`, `Video generates two video files, one of which can't be retrieved`, `file is not supported in current offset version` — the last one matters for us, because this whole server depends on the *offset version*. |
| The **log tree** exists and now has a reader | `operation-guide/file-management/obtain-log-or-dump-files` | Built as D1/D2. Measured: the launcher, CEF, **detector** and Inno-Setup logs are plain text; the main/export/thumbnail/`quick_look` logs are XOR containers behind a constant 16-byte header (`cd013a985f5beca1bcc1ca036aa5d1a0`, `bf08ac29` frames) — **and they decode**: `studio_logs` recovers the keystream, verified per file against the pid and start time in the name. The crash dumps live in `crashes\lag_reports` — written on a **hang**, which is this exact symptom. |

**How it was closed:** the three path hypotheses were tested one by one and none of them was the cause; the
dumps and the decoded main log were the instruments that produced the answer (see below).

State after the log decoder (D1): the log route is **open**, and the dumps are now explained rather than
just dated. The main/export/thumbnail/`quick_look` containers decode with a keystream recovered from the
ciphertext itself (D1) and verified per file against the pid and start time in the file name — 136/136
containers, 423 702 lines on this install. First measurements:

- **Not every dump is a hang.** With `studio_dumps correlate` the nine reports split into Studio's own
  `LagMonitorUiWorker::HandleTimeout` (**real stall** — a UI-thread deadline missed after
  `PgaRenderThread.cc:  frame render slow, cost total: 365 ms` while the thumbnail service loads
  CUDA/OpenGL textures) and the `secondary instance` path (**harmless** — a second Studio instance
  shutting itself down writes a lag report too). Counting dumps as hangs without this split overstates
  the bug.
- **Absolute time is available.** Lines carry only `hh:mm:ss.ddd`; the date comes from the session
  directory (sessions run 22 h+ and cross midnight), so
  `studio_logs action=window at=<ISO time>` answers "what was Studio doing when it stalled?" — this is
  the instrument the differential comparison below should be built on.

The **differential comparison has now been run** (`research/proj_diff.mjs`), against the projects on
this machine, and it came back narrow:

- **Our clip structure is already Studio's.** A clip from a project Studio saved itself
  (`TimelineProject/Unbenannt1`, saved 17:18 by Studio during the run that stalled) and one this server
  built (`MCP_Tests/mcpFlat`) have **exactly the same 55 fields — zero structural difference**. The
  output of `research/proj_diff.mjs` between a Studio-written project and ours is
  "only in reference: 0, only in candidate: 0". The schema work is done; what differed was convention.
- **The one real deviation was the clip's `name`** — Studio shows the camera's own short name
  (`VID_049.mp4`), we wrote the ingested name (`VID_20260822_190557_049.mp4`). Every album node Studio
  has ever written (24/24 across four projects) maps the full path to that short form. Fixed in
  `clipDisplayName()` (`src/project.mjs`), used as the fallback wherever a clip is not in the harvest
  library. Note this is *naming*, not loading: media is resolved by `url` (the log shows the loader
  opening FrameReaders from the clip url), which we were already writing correctly.
- **`project_album_info.data` is a load requirement — this was the misreading that cost the most time.** The
  first pass read it as a save artefact because `mcpFlat` appeared to load without it; the album was then
  written as `{album_tree:{nodes}}` only, and *that* file produced a project which opened, kept its timeline and
  never attached its source. The complete album (all four parts, see the top of §0) is what makes the clip
  attach. The instrument that settled it was the decoded main log, not a project diff: on load Studio prints
  `DUMP:1 VideoSampleGroup: mediaMs 0 clip 0 srcMs 0 fsType kImage` — with no snapshot in the album it
  classifies the file as a **still**, which is why the timeline exists while the player stays black and the
  export answers `Quelldatei fehlt`.
- **Studio did load that project's clips.** In the log around the 17:17 dump, both clips
  (`F:/Luna/VID_20261112_051426_001.mp4`, `D:/Videos/Lamspringe26/VID_20260822_190557_049.mp4`) open
  FrameReaders and their decoders and print `VideoSampleGroup` dumps — so "Lade Dateien…" was not a
  permanent state in that session, and the open question is the **export** path, not the load path.
- **The paths were never hidden.** §0's three path hypotheses are all answered by
  `%LOCALAPPDATA%\Insta360\Insta360 Studio\startup.ini`, `[preference]`:
  `project_location=D:/Dokumente/Insta360/Studio/Project`,
  `workspace_location=…/TimelineProject`, `footage_project_location=…/FootageProject`,
  `last_visit_dir=D:/Videos/Lamspringe26`, `export_location=C:/Users/stefa/Desktop`. E3 is a small
  read/set tool, not research. (Studio is configured with `cuda_accel=true`,
  `hardware_decoding_preview=true` — relevant to the render-thread stalls above.)

**The last measurement §0 needed was then made** (2026-11-25): a project built from real media exported through
the GUI — 178,569,151 bytes, H.264 1920×1080, 1652 frames / 27.53 s + AAC. §0 is closed.

---

## 1. Coverage today

| # | Studio area (manual) | Our tools | Missing |
|---|---|---|---|
| 1 | Import / media management (`creative-import`, `clip-management`) | ✓ `studio_ui_open_media` | **Clip create / copy / delete** (Studio 6.0 edits several clips from one media file and switches between schemes) ✗; import-error classification ✗ |
| 2 | 360 reframing: keyframes, FOV presets, Reorient (`keyframe`, `adjust-the-perspective`) | ◐ `studio_clip_transform` / `_set_transform` (static transform only) | **Keyframes** ✓ (`studio_clip_keyframes` / `_keyframe_add` / `_keyframe_remove`; schema measured from a Studio-written project and Studio's acceptance of a hand-written track verified), **named FOV presets** (Crystal Ball, Tiny Planet, UltraWide, Linear…) ✗, Reorient ✗, 360 Monitor ✗ |
| 3 | AI: Deep Track, Auto Frame, Auto Edit, Remove Grain, AquaVision (`deep-tracking-function`, `auto-frame`, `ai-processing-image-noise-reduction`) | ✗ | all of it ✗ |
| 4 | Filters / looks / manual colour (`en-US.json`; no manual page) | ✓ `studio_clip_filter` / `_filter_set` / `studio_filters` | **filter** in the UI sense is done (external LUT looks, 206 offered / 4 downloaded); **manual colour** (exposure, WB, tone) ✗ — `color_adjust_setting` carries 0 occurrences in 60 clips, so it has no specimen to build against |
| 5 | Transitions (v6.0 asset) | ✓ `studio_track_transitions` / `_transition_add` / `_transition_remove` / `studio_transitions` | done, Studio acceptance measured |
| 6 | Text / titles | ✗ | ✗ — `text_clips[]` |
| 7 | Stickers + animation | ✗ | ✗ — `sticker_clips[]` |
| 8 | Movement presets (`movement`) | ✗ | ✗ (needs downloaded assets, see H1) |
| 9 | Speed: TimeShift, ramping, motion blur, interpolation | ✗ | ✗ |
| 10 | Audio: BGM, volume, fade, denoise, mute (`audio-settings`) | ✗ | ✗ — `bgm_clip[]` + `audioSettings` |
| 11 | HDR / colour space / I-Log / PureShot / Dolby (`dolby`) | ◐ `Farbraum` readable/settable in the export dialog | I-Log / PureShot toggles ✗; Dolby Vision → **drop** (macOS M-series only) |
| 12 | Watermark (`watermark`) | ◐ via GUI copy/paste flow | as a written parameter ✗ |
| 13 | Export: settings, batch, VR (`file-export-instructions`, `instructions-for-vr-panoramic-video-editing-and-export`) | ◐ `studio_ui_export_settings` / `_set` for `Kodierung`/`Farbraum`; **all** settings readable | measurement of `Auflösung`/`Rahmen`/`Bitrate`/`Voreinstellung` ✗, batch/queue ✗, VR platform presets ✗, AI stitching ✗ |
| 14 | Project management (`project-page-introduction`) | ✓ read/list/sources + build; project opens, attaches media and exports (§0 closed); `studio_project_open` registers unlisted projects | clip create/copy/delete ✗, Media-page projects (`.insprj`) ✗ (B1) |
| 15 | Stats / Dashboard (`dashboard-function`) | ✗ | ✗ — template, units, GPS source, GPX/FIT import |
| 16 | Plug-ins (Premiere, QuickLook, LUT, FCPX) | — | **out of scope** |
| 17 | Automation surface | — | our product; Insta360 documents none |
| 18 | Studio's own constraints, as a preflight | ✓ `studio_project_check` | 19 rules from `movement` / `dashboard-function` / `auto-frame` / `deep-tracking-function` / `watermark` / `audio-settings` / `keyframe` / `clip-management`, each reported with its source — plus which rules it could **not** ask and why |

---

## 2. The development list

Effort: **S** ≤ half a day · **M** ~1–3 days · **L** > 3 days (or needs a new measurement campaign).

### A. Edit surface that the project file already carries — file-based, no GUI, cheapest wins

| # | Function | What it is | Effort | Notes |
|---|---|---|---|---|
| A1 | ~~`studio_clip_keyframe_*` (add / set / move / delete)~~ | Keyframes are Studio's core reframing mechanism: a transform pinned to a time | M | **Done.** `studio_clip_keyframes` (read), `_add` (insert or update an existing time), `_remove`. "Move" is remove + add — a keyframe's identity *is* its time, so there is nothing to move in place. The schema was harvested from a project Studio wrote (docs/INSPROJ_SCHEMA.md §7), and Studio accepting a hand-written track is verified (`research/keyframe_readback.mjs`): measured after the operator opened the project, Studio rewrote `tracks` and kept our node verbatim. Still to encode as a preflight rule: keyframes require a flat aspect ratio, and "too many keyframes and the camera stops following them" (manual: `edit-function/keyframe`). |
| A2 | ~~`studio_clip_colour` (read/write)~~ | Filters, exposure, WB, tone — `color_adjust_setting` in the clip | S | **Filters done, manual colour not.** `color_adjust_setting` was the wrong target: it appears in **0 of 60 clips** across 13 projects. What exists is `effect_filter` — a downloaded binary 3D LUT — in **all 60**, one of them applied. Now `studio_clip_filter` (read) / `studio_clip_filter_set` (apply, clear) / `studio_filters` (the 206-entry catalog, of which 4 are downloaded). Manual colour (exposure/WB/tone) has **no specimen anywhere**, so it stays unbuilt until someone touches those sliders in Studio. |
| A3 | ~~`studio_project_transition`~~ | Add/change/remove a transition between two clips | S | **Done and verified.** The container is the **track** (`tracks[i].transitions[]`), not the clip — the documentation said clip and was wrong. Built `studio_track_transitions` / `_transition_add` / `_transition_remove`, and Studio's acceptance is **measured**: after our write (a 40-frame update on the 0-1 gap plus a brand-new 14-frame entry on the 1-2 gap with our own uuid), the operator opened the project and Studio saved it — mtime and the file's own `lastModifiedTime` both moved, and both entries survive with our values, our 12 keys and our key order. It added **no** clip (the third clip in the earlier specimen was the operator's own copy, so the writer correctly touches `track.transitions` only). |
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
| C1 | Finish the export-settings matrix | S | **measured 2026-11-26** (nearly): all five option lists read — `Auflösung` 4 options, `Rahmen` 6 rates + project rate on the 60 fps project (**the list follows the source rate** — the 50 fps X6 project offers only `25.00`/`50.00`; read the `options` array in a failed pick's error), `Bitrate` 2, `Kodierung` 4, `Farbraum` 2, with click points and list-box geometry. Also measured: changing **Exportmodus rewrites** Voreinstellung *and* Auflösung, so it must be set first. Residual: the *effects* of 5.7K/8K, the individual frame rates, the custom-bitrate field and the H.265/ProRes choices. **Swept 2026-11-26** (`research/matrix/option-effects2.mjs`, results `option-effects2.json`): `Kodierung` H.264→`h264`/`.mp4`, H.265→`h265`/`.mp4`, **ProRes 422 *and* 422LT → container `.mov` + `Farbraum` forced to 10bit** (panel cannot tell the two variants apart); `Farbraum` 8/10bit and `Bitrate` `Empfohlen`/`Benutzerdefiniert` stick; `Auflösung` 4K/5.7K/8K/Benutzerdefiniert all stick. **`Rahmen` — pinned on two projects** (`research/matrix/verify-rahmen.mjs`, `rahmen-zoom-25.mjs`): the option list **follows the source rate** (the X6 @50 fps project offers only `25.00`/`50.00`; a failed pick's error carries the list — read it), the pick itself works (`ok:true, picked:"25.00"`; user-confirmed visible as `30.00` on the 60 fps project), but afterwards the row is **empty in every capture** (dialog column jumps `Auflösung` → `Bitrate`; 3–4× zoom, PrintWindow *and* `mode:"screen"` BitBlt, and it survives closing/re-opening the dialog) and the readback drops the control (`Rahmen = MISSING`, else the project-info panel's `60fps` at click `x≈1205`) — so every following `Rahmen` interaction fails for the rest of the session. Treat `Rahmen` as **write-only**: the rate is verifiable only by eye or on the exported file (`Größe:` is stale at `757.04MB`/`1296GB` alike; the dialog settings are persisted nowhere readable). Tell: a `Rahmen` click x ≥ 1100 means the strip's row is empty. Recovery is `Voreinstellung = Quellauflösung übernehmen` (the full label works now that `optionMatch` handles elided rows), applied last because any row change flips the preset to `Benutzerdefiniert @`. Details: `references/export-dialog.md` → C1 residual. |
| C2 | `studio_export_queue` (add / list / run / clear) | M | Manual: the dialog's second button is `Zur Warteschlange`; 5.x/6.0 batch settings. Also the only sane way to export many Auto-Frame/Auto-Edit results |
| C3 | VR / platform export presets | S | **measured 2026-11-26**: 6 of the 7 presets read back — every platform preset (Youtube / TikTok / Apple VisionPro / Meta Quest / Pico) forces **H.265 + 10 bit**, TikTok-Pano additionally pins **60 fps**, and all of them leave `Auflösung` at *Benutzerdefiniert*; *Benutzerdefiniert* is the one that resets to H.264 + 8 bit. `Quellauflösung übernehmen` selection failed → not measured. **Correction 2026-11-26:** that failure was the *truncated* option label (`Quellauflösung überneh...`) — the full label matches nothing; with the truncated form it selects fine (`changed: true`), so C3 is 7/7. Manual: `instructions-for-vr-panoramic-video-editing-and-export` (2:1 project ratio required) |
| C4 | `AI stitching` + `I-Log`/`PureShot` toggles | S | **resolved as a UI question — and the premise was partly wrong** (2026-11-26). `AI stitching` is *not* in the export strip: it is the checkbox **`Hochpräzises Stitching`** in the **`Medienverarbeitung:`** group (`export.setting.ai_effect` / `ai_stitching_3_0`), which never renders on `LamspringeKlon`. The first explanation — the per-clip `stitching_optimization.supportAIStitching: false` (21/21) on pre-stitched MP4 sources — was **tested and refuted**: flags flipped to `true` with Studio stopped, Studio started fresh (it read the flipped file and *kept* the flags through its own startup rewrite, verified 21/21 `true` after start), group still absent; `Kodierung = H.265` likewise. The gate is the **media** (0 `.insv` references here, only already-stitched `.mp4`), not the project flags or the codec — **confirmed 2026-11-26**: opening raw dual-lens X6 footage (`D:/Videos/X6/Camera01/VID_20260917_192757_00_001.insv`, 50 fps) makes the group render (`Medienvera._.` directly below `Farbraum:`, plus a section `Optimierung der unteren Naht` at y≈634). The group's other rows are `HDR` and `Dolby Vision` (`export.setting.ai_effect.hdr` / `.dolby`). There is no scroll region (strip ends `Farbraum` → `Dauer` → buttons), so the old "below the fold" note was wrong. **`I-Log` is not a Studio export toggle** (external LUT plugin) and **`PureShot` is a DNG/RAW feature** (`supportPureShot: false` here). Residual work: the group's own checkbox rows are still unmeasured (they render as textless controls, so the reader does not list them); flip-testing the flag in the `.insproj` is inconclusive while Studio holds the project in memory (`studio_project_open` degrades to a library click, `restarted: false`). Details: `references/export-dialog.md` → C4. |
| — | **Blocker: the export panel stops accepting synthetic input** | — | After selecting `Auflösung = 4K` (2:1 project) the strip ignored every click and key press while Studio stayed healthy (`IsHungAppWindow=False`, `Responding=True`, foreground, **no modal text in the full-window OCR**, five byte-identical reads, a `1296 GB` size estimate in flight) — most likely a **textless busy overlay** the text-only probes cannot see. Root fix for the tool: `click()` posts press+release at one point, so it can never leave a Qt popup open (needs separate press / move / release), and there is no overlay detector. Probe that was missing: `IsHungAppWindow` + `Responding`. **Update 2026-11-26:** it did **not** reproduce in a controlled sweep — all five option lists and every `Auflösung` option (4K/5.7K/8K/Benutzerdefiniert) went through with the liveness probe green throughout, so the wedge is *transient* and not caused by `Auflösung = 4K` as first assumed. The failure that *does* reproduce is the `Rahmen` row going unreadable after the first explicit rate (see C1), which is not the wedge. Measured recovery for a stuck strip: `{ESC}` closes the export dialog, clicking the toolbar button reopens it (`dialogOpen` via `studio_ui_state`; button ≈ `1222,24`) and input works again. Still missing: a real overlay detector. |
| C5 | Dolby Vision | — | **drop on Windows** — H.265 + M-series Mac only (`file-management/dolby`) |

### D. Diagnostics & maintenance — the cheapest value per hour

| # | Function | Effort | Notes |
|---|---|---|---|
| D1 | `studio_logs` (list / sessions / read / grep / **window** by area) | **✅ built** | `operation-guide/file-management/obtain-log-or-dump-files`. Measured: launcher/CEF/detector/setup logs are plain text; the main/export/thumbnail/`quick_look` containers **decrypt transparently** — one 2102-byte keystream (the stream restarts at each frame's payload, so a payload offset always gives the same key byte, across every file and session) recovered from the ciphertext: the crash/lag dumps embed the same lines **in clear text** as ground truth for the first ~240 bytes, the rest from a unigram score + bigram refinement over 200k frames (0.23 % of bytes outside the text alphabet). Every read is verified against the pid and start time in the file name, so a build with a different schedule is reported as encrypted rather than shown as mojibake (136/136 containers on this install). `action=window at=<time>` reconstructs absolute time from the session directory (lines carry only `hh:mm:ss.ddd`, and sessions cross midnight by 22 h+) and returns what Studio was doing around a stall. `src/logs.mjs` + `src/log-decrypt.mjs`, 15 tests. |
| D2 | `studio_dumps` (find crash dumps, **explain them**) | **✅ built** | The dumps are in `crashes\lag_reports` (written on a **hang**), not `crashes\reports`; crashpad bookkeeping (`settings.dat`, `metadata`) is counted, not listed. Each lag report is correlated with the session log running at that moment and classified: **`ui lag`** (Studio's `LagMonitorUiWorker::HandleTimeout` after a slow render frame, thumbnail service loading CUDA/OpenGL textures) vs. **`secondary instance exit`** (a second Studio instance shuts itself down and writes a lag report on the way out — *not* a hang, must not be counted as one), plus the slowest `frame render slow` cost and the last activity before the dump. |
| D3 | Import/preview error classifier | S | Map the documented error strings + the "Corrupted Frame" red-frame state (`troubleshooting/playback-preview-issue/media-play-error`, v5.8.4+) to plain sentences instead of a stuck page |
| D4 | `studio_version_report` | S | Manual: `installation-and-update/download-and-installation-operations` (Menu ▸ Help ▸ Check for Updates / Install Thumbnail Plugin). **Report only — never update**: the launcher moves the install and invalidates every measured offset |
| D5 | `studio_ui_export` timeout/`export-slow` guidance | S | Manual: `troubleshooting/file-export-issue/export-slow` — export speed is GPU-bound; the documented levers are Exporter Codec = all, Image Processing Acceleration = Auto, lower bitrate |

### E. Preferences — measurement levers *and* a bug lever

| # | Function | Effort | Notes |
|---|---|---|---|
| E1 | ~~`studio_pref_codec`~~ | — | **done** in `studio_prefs` (`action=read|get`, section `codec`): `hardware_decoding_preview`, `hardware_encoding_export`, `hardware_encoding_h265_export`, `cuda_accel`, `hardaware_model`. On this machine hardware encode incl. H.265 is on and `hardaware_model` is the RTX 3070 — the encoder the BIOS warning protects |
| E2 | `studio_pref_audio` | S | Manual: `preference-settings/audio-settings` |
| E3 | ~~`studio_pref_paths`~~ | — | **done** in `studio_prefs` (`action=paths`): `%LOCALAPPDATA%\Insta360\Insta360 Studio\startup.ini`, section `[preference]`, holds `project_location`, `workspace_location`, `footage_project_location`, `last_visit_dir`, `export_location` in plain text — each returned with its directory's existence checked. Reading is free; `set` refuses while Studio runs (it rewrites the file from memory on exit) |
| E4 | ~~`studio_pref_language`~~ | — | **done** in `studio_prefs` (`action=get key=lang`): `[preference] lang=de` on this machine. Also explains OCR surprises (`Menü` → `Menÿ`) |

### F. AI features — high user value, GUI-only, long-running

None are reachable as APIs (`ExportClipInfo` has no listener; see the skill). All are UI operations with waits.

| # | Function | Effort | Notes |
|---|---|---|---|
| F1 | Deep Track | L | `edit-function/deep-tracking-function` — persons/vehicles/animals; 360 video only, not Bullet Time/Timelapse; on **both** pages, so the Media-page path (B) helps |
| F2 | Auto Frame | L | `edit-function/auto-frame` — 360 video > 10 s, media page only, produces multiple highlight clips → pairs naturally with C2 |
| F3 | Auto Edit (`auto_cut`) | L | Studio 6.0; needs ≥ 3 clips or > 30 s total, min clip 4 s. Long run, but the single biggest "edit a folder of footage" win |
| F4 | Remove Grain / AquaVision | M | `file-management/ai-processing-image-noise-reduction`; AquaVision is an AI preset + re-analyse |

### G. Rule engine — Studio's own constraints

**Built 2026-11-26** as `studio_project_check` (`src/preflight.mjs`, 30 tests). It reports each rule against
the project, and — because that is where a preflight lies — separates `dormant` rules (real, but their trigger
cannot exist in this file) from `unverifiable` ones (the manual states them, no measured field carries them).
Three of the rules below were **rewritten after running over all 13 projects on this machine**, which is the
measurement that makes them trustworthy:

- `g3-dashboard-flat` first read `dashboard_setting.enableDashboard` — and flagged 2 clips of a real project,
  because that flag is `true` with empty data in Studio's own files. The signal is a *configured* dashboard
  (`dashboardDataId`/`dashboardStyle` non-empty). Now dormant on every project here.
- A `ratio`/`aspect_ratio_info` consistency rule was **dropped**: the schema's "they mirror each other" came
  from one observation and 21 real clips falsify it (source ratio vs display ratio are different enums).
- `markTrimEnd`/`markTrimIn` were not the constants §1 recorded. They are the export range, so a short marker
  became rule `export-range` (warning) rather than an arithmetic error — and it immediately found a real case.

| # | Rule | Status | Source / evidence |
|---|---|---|---|
| G1 | Movement cannot be combined with Deep Track or keyframes on the same clip | ✓ error · dormant here | `edit-function/movement` |
| G2 | Movement requires a flat aspect ratio (≠ 2:1) | ✓ error · dormant here | `movement` |
| G3 | Stats works with flat video only | ✓ error (configured dashboard only) | `dashboard-function` |
| G4 | Auto Frame: 360 video > 10 s | ✓ warning (length half only) | `edit-function/auto-frame` |
| G5 | Deep Track: 360 video only | ✓ error · dormant here | `deep-tracking-function` |
| G6 | Watermark: original camera media only | ✗ **unverifiable** — no field distinguishes original from re-encoded | `edit-function/watermark` |
| G7 | Audio: one track, MP3/WAV, no recording | ◐ the track count is checked; the BGM container does not appear in any observed file | `preference-settings/audio-settings` |
| G8 | Project files must not be renamed; storage locations must match | ✓ identity/path/deep-track-path rules (warnings) | `clip-management` FW 4 |
| A1′ | Keyframes require a flat aspect ratio | ✓ error · dormant here | `edit-function/keyframe` |
| — | Timeline arithmetic, media/LUT/transition payloads on disk, the measured 12-key transition shape | ✓ (three of these found real defects in our own output) | §0, §5, §6, ASSET_CATALOG §2.2 |

The unverifiable half is the part worth remembering: **nothing in the file says "this is a TimeShift clip"**
(`play_rate_track` is `{}` in every clip, `supplement_frame_type` is unexplained), so "Stats/Deep Track/Auto
Frame are not for Timelapse or TimeShift" stays unchecked until a clip from such a mode is harvested. `npm run
check` and the scan (`research/preflight_scan.mjs`) report that rather than passing it.

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

1. ~~**D1 + D2** (log/dump reader)~~ — **done 2026-11-24**: `src/logs.mjs`, `studio_logs` + `studio_dumps`, 8 tests, 93 total. Later expanded: Studio's main log **does** decode now (keystream recovered from the ciphertext, verified per file) and dumps are correlated with it, so a dump says *why* it exists — see §0.
2. ~~**§0 investigation**~~ — **closed 2026-11-25**: the album (`project_album_info.data`, all four parts) is what makes a built clip attach, and a built project now exports (178 MB, H.264 1652 frames). See the top of §0.
3. ~~**A1, A2, A3** (keyframes, colour, transitions)~~ — **done**: A1 keyframes, A2 filters (`color_adjust_setting` was the wrong target; `effect_filter` is the real one), A3 transitions (the container is the **track**, and Studio's acceptance of a hand-written entry is measured).
4. ~~**G1–G8** (preflight)~~ — **done 2026-11-26**: `studio_project_check` / `src/preflight.mjs`, 19 rules + 30 tests. Running it over all 13 projects on this machine rewrote three of the rules and found three real defects (a stale Deep Track path in two projects, an export marker that drops the tail of `StefanTest` and `mcpKey`, and the clip framing in our own clones).
5. **C1, C3, C4** (finish the export matrix) + **B1/B2** (Media page + watermark).
6. **A4–A8, B3–B5, E2** (E1, E3, E4 are done — `studio_prefs`).
7. **F1–F4** — one at a time, each is a project in its own right.
