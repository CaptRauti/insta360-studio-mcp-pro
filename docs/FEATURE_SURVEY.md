# Insta360 Studio — Feature & Capability Survey

**Subject:** Insta360 Studio desktop editor, **v6.0.9** (Windows build, installed locally).
**Install root inspected:** `C:\Users\stefa\AppData\Local\Insta360\Apps\Insta360 Studio\current\`
**Report date:** 2026-11-23.

## Sources & confidence

| Tier | Source | Used for |
|---|---|---|
| A — primary | Local install tree (`translations/en-US.json`, `Resources/`, `configure.ini`, executables) | UI strings, feature names, bundled assets, version, helper processes |
| A — primary | Official online manual `https://onlinemanual.insta360.com/studio/en-us/` (per-page URLs cited inline) | Documented procedures, applicability per model, feature limits |
| B — primary | Insta360 press/forum posts, product pages (`insta360.com/blog/news/insta360-studio-major-update`, `forums.insta360.com/section/16/post/100947`) | v5.0/v6.0 announcements |
| C — secondary | Community release summaries (Reddit r/Insta360 6.0.x posts), a community-maintained download/version table (gist `jossef/1b439dead0f6909aca1af7099d3e074e`) | 6.0.x patch contents, historical version list — **not vendor-authoritative** |

There is **no shipped HTML/PDF/CHM manual** inside the install tree (searched: `*.html`, `*.pdf`, `*help*` → only a Web-Dashboard CEF page and two DLLs; no `docs/`, `help/`, `manual/` folder). The only local human-readable feature metadata is the Qt/PySide6 translation catalog `translations/en-US.json` (2,717 key/value pairs) and the bundled resource folders. Documentation therefore comes from Insta360's online manual, and UI feature names are cross-checked against that local catalog.

---

## Summary table

| # | Feature area | Exposed in UI | Key manual URL (base `https://onlinemanual.insta360.com/studio/en-us/`) |
|---|---|---|---|
| 1 | Import & media/CLIP management | Yes | `operation-guide/file-management/creative-import`, `.../clip-management` |
| 2 | 360 reframing (keyframes, FOV) | Yes | `operation-guide/edit-function/keyframe`, `.../adjust-the-perspective` |
| 3 | AI / automatic (Deep Track, Auto Frame, Auto Edit, denoise, AquaVision) | Yes | `operation-guide/edit-function/deep-tracking-function`, `.../auto-frame`, `file-management/ai-processing-image-noise-reduction` |
| 4 | Filters / colour looks & manual correction | Yes | (features present in `en-US.json`; manual has no dedicated page) |
| 5 | Transitions | Yes | (v6.0 built-in asset; announcement + `en-US.json`) |
| 6 | Text / titles | Yes | (v6.0 built-in asset; `en-US.json`) |
| 7 | Stickers & sticker animation | Yes | (v6.0.7 added Project-page stickers; `en-US.json`, `Resources/stickeranimation/`) |
| 8 | Movement / effect presets | Yes | `operation-guide/edit-function/movement` |
| 9 | Speed control (TimeShift, ramping, motion blur, frame interpolation) | Yes | (historical release notes + `en-US.json`) |
| 10 | Audio (music, volume, fade, denoise, mute) | Yes | `operation-guide/preference-settings/audio-settings` |
| 11 | HDR / colour-space / Dolby Vision / PureShot / I-Log LUT | Partial (export-dependent) | `file-management/dolby`, `plugin-features/studio-lut` |
| 12 | Watermark & logo | Yes | `operation-guide/edit-function/watermark` |
| 13 | Export (settings, batch, VR, presets) | Yes | `file-management/file-export-instructions`, `.../instructions-for-vr-panoramic-video-editing-and-export` |
| 14 | Project management | Yes | `operation-guide/page-introduction/project-page-introduction` |
| 15 | Plug-ins (Premiere, FCPX, QuickLook, LUT) | Separate installs | `operation-guide/plugin-features/*` |
| 16 | Automation surface (CLI / API / scripting) | **Not documented** | — (see §16) |

---

## 1. Application architecture & scope

Insta360 Studio is a free Windows/macOS desktop editor for Insta360 360° and action-camera media. v6.0 reorganises the app around **two libraries**: a *Media Library* for managing/editing individual clips, and a *Project Library* for multi-clip timelines (`forums.insta360.com/section/16/post/100947`). The QT/PySide6 UI is delivered via Qt6 Quick/QML plus an embedded CEF (`libcef.dll`, `Resources/resource.rcc`) web dashboard.

Local evidence of architecture (`ls` of install root):
- `Insta360 Studio.exe` (main), `Insta360 Launcher.exe`, `Insta360 Updater.exe`.
- `studio-exporter-service.exe`, `studio-thumbnail-service.exe` (local helper services; each ~776 KB).
- `quick-look.exe`, `quick-look-daemon.exe`, `quick-look-win.dll` (QuickLook thumbnail/preview plugin runtime).
- GPU/AI stack bundled: `MNN.dll`, `onnxruntime.dll` (+ CUDA/TensorRT providers), `nvinfer_10.dll`, `cublas*`, `cufft64_10.dll`, `NvEffectSdkCore.dll`, full OpenCV 4.7 (`opencv_*470.dll`) incl. `opencv_cudafilters470.dll` (658 MB), `DirectML.dll`. This is the runtime behind Deep Track / Auto Frame / denoise / stitching.
- `Resources/insta360.rcc`, `Resources/resource.rcc` — embedded Qt resource archives (feature iconography, text, etc.).
- Version recorded in `configure.ini`: `[General] current_version=6.0.9`.

**Pages/libraries:** Media page (single-clip: playback, splicing, stabilising, cropping, scene selection) and Project page (multi-clip; music/text/transitions) — `en-US.json` `titlebar.media_tab.description`, `titlebar.project_tab.description`; manual `project-page-introduction`.

---

## 2. Import & media management

- **Import from computer:** drag-and-drop local files (`creative-import`).
- **Import from Insta360+ cloud storage:** log into the cloud account inside Studio (`creative-import`).
- **Import from camera / USB / external disk:** enable *"Enable external storage device detection"* (default on) under Menu → Settings → User Preference → Other; connect the camera in **U-Disk Mode** over USB. Wireless/Bluetooth import is **not supported on Windows** (`creative-import`).
- **Temporary Media** library auto-syncs footage imported on the Media page, carrying over stitching, stabilisation, keyframes, tracking, and image processing. **Not** carried over: speed, watermark/logo, Stats (`project-page-introduction`).
- **Clip Management** — the "clip" is per-media edit data (framing, keyframes, speed, stitching); multiple clips per media let you store several edits for one source. Create/copy/delete; at least one clip must remain (`clip-management`).
- **Photo groups** (Interval, Starlapse) import only on the Media page, not the Project page (`creative-import` FAQ).
- Supported inputs include `.insv` (360 video), `.insp` (360 photo), `.dng`/`.jpg` (flat), `.PRO_VID` (FreeFrame, GO 3), `.mp4` (wide-angle), `.lrv` (proxy) — from manual pages (`adjust-the-perspective`, `quicklook`) and `en-US.json`.

---

## 3. 360° reframing workflow (keyframes, view direction, FOV)

**Keyframes** (`operation-guide/edit-function/keyframe`):
- Add via the Keyframe icon; available on **both** Media and Project pages.
- On the Media page, keyframes take effect only when exporting as **"Video"** (not as a 360 export).
- On the Project page, keyframes require a **flat aspect ratio** (any ratio other than `2:1 (360° Panorama)`).
- Keyframes record view direction + FOV at a timeline point; Studio interpolates between them.
- Right-click a keyframe to set its transition curve. `en-US.json` defines a `Keyframe Transition` control (`panel.clip_detail.viewfinder.transform_animation`) stating it "controls the speed of parameter changes between keyframes… does not affect playback speed". (Named curve types — Linear / Ease In / Ease Out / Hard Cut etc. — are documented for the **app**, not Studio: `onlinemanual.insta360.com/app/.../keyframes-and-camera-movements`; in Studio they are only reachable via the keyframe context menu, no tabulation found.)
- Manual workflow (blog `insta360.com/blog/tips/how-to-edit-and-reframe-360.html`): mark trim start/end → scrub → drag to set view + scroll to zoom → `+` to add keyframe → Studio plays between keyframes; "linear view" per keyframe removes distortion.

**FOV / view presets** (`operation-guide/edit-function/adjust-the-perspective`):
- **360 video (.insv):** 6 presets — **Crystal Ball, Tiny Planet, MegaView, UltraWide, Dewarp, Linear**. `en-US.json` additionally names **Natural View** and **Linear+** presets.
- **360 photo (.insp/.dng):** Crystal Ball, Tiny Planet, MegaView, UltraWide, Dewarp, **Equirectangular Panorama**.
- **FreeFrame video (.PRO_VID):** UltraWide, Dewarp, Linear, **Custom** (keyframe or mouse-wheel FOV).
- **Flat photo (.dng):** MegaView, UltraWide, Dewarp (no `.jpg` FOV/crop).
- **Wide-angle video (.mp4):** FOV cannot be changed in Studio — must be chosen on camera.
- Reframe controls expose **Pan, Tilt, Roll, View (FOV)** (`insta360.com/support/supportcourse?post_id=17067`).
- Horizon controls in the reframe panel: **360° Horizon Lock** and **45° Horizon Lock** (`en-US.json` `panel.clip_detail.viewfinder.linear_horizontal` / `linear_horizon_wide`). Stabilisation types include **FlowState Stabilization**, **FPV Stabilization**, and **Lock Direction** (`en-US.json`; `panel.stab_setting.lock_direction.tip` = "Keep the image level, suitable for cycling/motorcycle scenes…").

---

## 4. AI / automatic features

| Feature | What it does | Availability / limits | Source |
|---|---|---|---|
| **Deep Track** | Auto-identifies and locks onto persons, vehicles, or animals, keeping target centred | 360 videos only; **not** on Bullet Time or Timelapse; on Media + Project pages | `edit-function/deep-tracking-function` |
| **Auto Frame** | AI analyses 360 video and auto-generates multiple highlight clips for batch export | **Media page only**; requires 360 video, not Timelapse/Bullet Time/Slow-Motion, duration > 10 s | `edit-function/auto-frame` |
| **Auto Edit** (a.k.a. `auto_cut`) | Analyses footage, selects highlights, matches templates + music, adds transitions and filters | Studio 6.0 (`en-US.json` `startup_home.auto_cut_subtitle`, `auto_cut.generating.*`); needs ≥3 clips or >30 s total; min clip 4 s | `en-US.json`; forum 6.0 post |
| **Movement** | One-click camera-movement presets (library of effects) for 360 video without manual keyframes | Studio v5.8.8+; models ONE X–X5; requires flat ratio; **cannot combine** with Deep Track/keyframes on the same clip | `edit-function/movement` |
| **AI noise reduction ("Remove Grain")** | AI denoise; on new X3/X4/X4 Air/X5/GO 3/GO 3S/Ace-series media it auto-analyses and applies at export; toggle only for previously-exported media | v5.9.4+ enables automatically; the separate "AI Effects" on the Project page is removed at v5.9.4+ | `file-management/ai-processing-image-noise-reduction` |
| **AI Stitching** | High-precision stitching (export option `High-precision stitching`) | Export-time; increases export time | `en-US.json` `export.setting.ai_stitching_3_0` |
| **AquaVision 3.0** | AI underwater colour correction; detects underwater footage and offers an AI preset / re-analyse | `en-US.json` `panel.image_process.underwater_color.*`; manual audio/image findings | `en-US.json` |
| **Dolby Vision** | HDR enhancement on export | Requires H.265 + M-series Mac (see §11) | `file-management/dolby` |
| **Scene detection / music matching** | Part of Auto Edit ("Analyzing scenes", "Extracting highlights", "Syncing to the beat", "Adding transitions and filters") | `en-US.json` `auto_cut.generating.*` | `en-US.json` |

**Not found:** no evidence of a Studio feature named **AI upscaling / super-resolution**. `en-US.json` has zero matches for `upscal|super resolution|enhance resolution`. Round-tripping through the app is not possible in this environment, so this is "not documented / not found", not "absent".

---

## 5. Filters / colour looks & manual correction

- **Filters** are a built-in asset category (`en-US.json` `footage.tab1.filter`, `footage.filter.filter_library`). Studio 6.0 ships **16 filter categories** and supports **filter opacity** plus copy/paste of clip settings (Reddit 6.0 summary + `startup_home.video_edit_subtitle`). Bundled per-model filter resource folders exist for every supported camera: `Resources/filters/{Ace, Ace Pro, Ace Pro2, Ace Pro3, X2, X3, X4, X5, X6, One X, One X2, One R, One RS, Go 2, Go 3, Go 3s, Sphere, DE, B2, TC4, Z03, Z05, font}`.
- **Manual colour controls** (`en-US.json` `panel.clip_detail.tab.color.*`): Exposure, Brilliance, Highlights, Shadow, Contrast, Brightness, Black Point, Saturation, Vibrance, Temp (warmth), Tint, Definition.
- **One-tap image-process looks:** Color Plus (`color_plus`), Clarity Plus (`Local Contrast Enhancement`), AquaVision (2.0/3.0), Plus "Color Optimization" / "Color Restoration" (`panel.media_setting.*`).
- **DNG/RAW:** Color Plus and related effects operate on RAW; `en-US.json` warns PureShot effects only show on the matching DNG.

---

## 6. Transitions

- Built-in transition asset library; drag onto the timeline (`forums.insta360.com/section/16/post/100947`, `forums...61420`). `en-US.json`: `footage.tab1.transition`, `transition.info.transition_library`, `panel.transition_detail.title.transform`, `panel.transition_detail.reset`.
- **360-specific transitions** only work between two consecutive panoramic segments (`timeline.transition.error_info.type_mismatch`); a transition needs ≥ 0.2 s of continuous segment (`...no_space`); standard transitions work with any media type (forum).
- Studio 6.0's **Auto Edit** inserts transitions automatically.

*(The manual has no dedicated "Transitions" page; capability is established from the local catalog, the 5.0/6.0 announcements, and secondary reviews.)*

---

## 7. Text / titles

- Text is a built-in asset (`en-US.json` `word_library.category.root_name` = "Text Library", `clip.text_panel.color`). Added to the Project timeline; v6.0 supports multiple text tracks (Reddit 6.0.7 note: "multiple text and sticker tracks at the same time").
- Text styling includes colour with saved presets (`panel.text.add_color` / `remove_color`).
- No dedicated manual page located; documented in the 5.0/6.0 announcements (`insta360.com/blog/news/insta360-studio-major-update`).

---

## 8. Stickers & sticker animation

- Sticker Library with favourites and local (downloaded) collections (`en-US.json` `sticker.info.sticker_library`, `sticker.collection.no_collection`, `sticker.local_sticker.no_download`).
- Transform: position, size, rotation, horizontal/vertical flip (`clip.sticker.transform.*`).
- **Animation** with Entrance / Exit / Loop states and duration + loop speed (`clip.sticker.animation.*`). Named animations: Pop In, Fade In, Zoom In, Zoom Out, Slide Up/Down/Left/Right, Spin Out, Fade Out, Blink, Bounce, Flip, Rotation, Scroll Text, Scroll Subtitles.
- Bundled assets: `Resources/stickeranimation/{in,out,period}/` each contain `.animatedstickerinanimation` files + `.json` + `.webp` + `.lic` (licensed animated stickers).
- Project-page stickers added in **v6.0.7** (Reddit secondary source).

---

## 9. Animation / effect presets

- **Movement** library (see §4) — downloadable camera-movement effects dragged onto the timeline; `Resources` + `data/pano_animation` are the local backing (`data/pano_animation` directory under install tree). `en-US.json`: `Pano Animation Preset = Animation`, `footage.tab1.movement`-style entries, `highlights_camera_movement_group`, `tiny_planet_camera_movement_group`.
- **Auto Edit templates** — style templates with rhythm matching (`auto_cut.loading.tip_switch_template_style`, `...rematch_template_rhythm`).

---

## 10. Speed control

- **Speed / TimeShift** (`en-US.json` `playrate.*`, `TimeShift`): per-clip speed with a Speed Editor; custom speed to one decimal; "Show all Speed Editor" lets you drag speed control points across the clip (speed ramping); Clear speed settings.
- **Motion blur** — automatically on for speed ramps; effect applied at export; ND-filter handling under "Quick" mode (`en-US.json` `Motion blur turned on…`, `panel.motion_blur.toast.auto`).
- **Frame interpolation (Optical Flow)** for slow-motion, applied at export (`supplement_frame_type.title = Frame Interpolation`, `supplement_frame_type.action.optical_flow`).
- **Slow Motion** is recognised as a mode (X6 Slow Motion Mode editing added in 6.0.7 per Reddit), and `Auto Frame`/`Deep Track` explicitly exclude Slow-Motion/Timelapse/Bullet-Time clips.

---

## 11. Audio handling

Documented on `operation-guide/preference-settings/audio-settings` (Project page unless noted):
- **Background music**: Music icon → online Music Library (favourites, downloads) or import your own **MP3/WAV**.
- **Volume** + **Fade In / Fade Out** on the audio track.
- **Denoise** — on the Media page: Audio Settings → "Voice Focus" or "Noise Reduction"; on the Project page: Audio → Denoise. `en-US.json` also lists **Direction Focus** (`panel.clip_detail.denoise.direction_focus`), **Stereo**, **True Audio**, **Background Noise Reduction**.
- **Mute original sound**: volume button on the video track.
- **Limits:** only **one audio track** (multi-track not supported); direct audio recording not supported; own music must be MP3/WAV.

---

## 12. HDR / colour-space / Dolby Vision / RAW

- **Dolby Vision** (`file-management/dolby`): enable/disable in Media Processing at export; requires encoding format **H.265** and, per the manual, a **Mac with M-series chip on macOS 11.0+** and Studio v5.2.0+. `export.setting.ai_effect.dolby_tips` adds: "Only effective when exporting in 4K or below."
- **HDR:** `en-US.json` exposes `HDR Photo`, `HDR Video`, and `export.setting.ai_effect.hdr_tips`. HDR/Night-Shot photo groups are viewable on the Media page.
- **PureShot (AI RAW / HDR merge):** merges exposure brackets; `PureShot HDR Export Settings`; sequences (Burst/Interval/Starlapse). Effects only visible on the matching DNG.
- **10-bit / colour space at export:** `export.setting.bitdepth = Color Depth`; **X6 media adds a "10-bit (Rec.709 10-bit)" Color Space option in v6.0.2+** (`file-export-instructions`, and the VR page).
- **I-Log / LUT:** Studio distributes an **I-Log LUT plug-in** for external grading tools — After Effects, Premiere, DaVinci Resolve, Final Cut Pro, Photoshop, Lightroom (`plugin-features/studio-lut`). LUT is provided as a download, not applied inside Studio.
- **Anti-Flicker** (`deflicker`): "Fix flickering segments in the video, export time will increase slightly."
- **AquaVision 3.0** underwater colour (see §4).
- **Proxy/preview:** lower-resolution proxies for editing speed; export unaffected (`project.info.item.low_proxy.tooltip`).

---

## 13. Watermark & logo

`operation-guide/edit-function/watermark`:
- **Camera (brand) watermark** (360 photos & 360 videos) — 10 preset styles (v5.5.3) + custom uploaded logo; size, position, angle, corner radius, feather. Leica watermarks for the Ace series not available; 360 photos from a Flow-series gimbal unsupported; only original in-camera files.
- **Time watermark** (videos only; 360 + flat) — opacity, date format `YY/MM/DD`, `MM/DD/YY`, `DD/MM/YY`.
- **Batch apply** — "Batch Settings" → "Apply in batches" (5.x); v6.0 replaced Batch Settings with copy/paste clip attributes (Reddit secondary). Custom-watermark upload requires JPG/PNG < 5 MB (`studio_watermark_upload_format_limit`).
- **Nadir / bottom logo** (flat/JPEG, batch) and "OverLook" top-down logos (`en-US.json` `Logo.Bottom.ToolTip`, `OverLook logo`).
- Project-page watermarking requires **v5.9.4+**.

---

## 14. Export

`operation-guide/file-management/file-export-instructions` + `instructions-for-vr-panoramic-video-editing-and-export`:
- **Entry points:** right-click media → Export / Start Export; or top-right Export icon. Progress in **Task Center**; **Export Queue** added in 6.0.x (Reddit), success list under "Export Records".
- **Settings window** exposes: Resolution (Match Source / Original / custom), Frame Rate (Match Source / constant / Match project), Bitrate, Encoding Format (codec), Color Space / Color Depth, Media Processing (AI Effects: Remove Grain, Dolby Vision, High-precision stitching), file name & path, Export Mode, render range (full timeline / marked in-out / selected area), and **Preset**.
- **Codec:** H.264 / H.265 (Dolby requires H.265); **ProRes** supported (historical release note 3.4.9; `en-US.json` "ProRes requires video width to be divisible by 16"); cloud export does **not** support ProRes (`not_support_prores_cloud`). ProRes exports/imports are not consumable by the Premiere plugin (`reframe-pr` FAQ 8).
- **Export presets** for publishing platforms: **Youtube-Pano, TikTok-Pano, Bilibili-Pano, Apple VisionPro-Pano, Pico-Pano, Meta Quest-Pano** (`export.setting.preset.*`).
- **VR 360 workflow:** Project page → Aspect Ratio 2:1 (360° Panorama); features **Reorient**, **360 Monitor**, and platform **Export Presets**; requires v5.6.1+.
- **Batch export:** to local — no quantity limit (queued); to cloud — max 10 at once.
- **Original-file export:** "Video (Original)" media type exports trimmed source as INSV.
- **Source frame-rate / timecode:** export can match source or use constant frame rate; timecode is cleared if it doesn't match (`clear_timecode`).
- **Codec preferences** (`preference-settings/codec-settings`): Exporter Codec and Player Codec sections; Hardware Decoder/Encoder toggles; **CUDA acceleration** (NVIDIA); "automatically apply hardware detection results" (default on).

---

## 15. Project management

`operation-guide/page-introduction/project-page-introduction`, `file-management/clip-management`:
- Three media libraries: **Project Media**, **General Media**, **Temporary Media**.
- **Timeline settings:** Timeline Slider (zoom), Main Track Magnet, Auto Snapping, Preview Axis.
- **Project files (`.insproj`)** stored per project; path configurable via Preferences → File Path Settings → Project Files Save Path; a **search tool** ("E") is offered to locate projects. Renaming project files invalidates edit linkage.
- v6.0 added project/file **renaming** and **album** categorisation (Reddit/forum).

*(The `.insproj` JSON internals — tracks/clips/effects — are known from prior work on this host and are not re-derived here; the manual documents project files at the behavioural level only.)*

---

## 16. Camera models supported & per-model differences

**Models named as "Applicable" across manual pages** (union):
Luna Ultra, Luna Pro, ONE X, X2, X3, X4, **X4 Air**, X5, **X6**, Ace, Ace Pro, Ace Pro 2, Ace Pro 3 (in local filter bundle), GO 2, GO 3, GO 3S, **GO Ultra**, ONE R, ONE RS. Sources: `compatibility-and-configuration-requirements`, `file-export-instructions`, `adjust-the-perspective`, `studio-lut`.

**Locally bundled per-model filter resources** confirm native model handling: `Resources/filters/{Ace, Ace Pro, Ace Pro2, Ace Pro3, B2, DE, Go 2, Go 3, Go 3s, One R, One RS, One X, One X2, Sphere, TC4, X2, X3, X4, X5, X6, Z03, Z05}` (`ls Resources/filters`). `X4` folder the newest default; `X6` present. `Sphere` = Insta360 Sphere drone 360 accessory.

**Documented per-model / per-mode differences:**
- **Keyframes / Deep Track / Auto Frame / Movement**: 360-video features — applicable models listed per page; e.g. Deep Track "ONE X, X2, X3, X4, X4 Air, X5, ONE R, ONE RS"; Movement "ONE X, X2, X3, X4, X4 Air, X5" (so **not** X6 / not Ace).
- **Auto Frame** excluded for Timelapse / Bullet Time / Slow-Motion source.
- **HDR / Night Shot** photo groups viewable on Media page (historical release note v3.5.0).
- **X6**: 10-bit (Rec.709 10-bit) Color Space export option in v6.0.2+; new Slow-Motion mode editing and improved 10-bit / Dolby Vision preview in v6.0.7.
- **Ace series**: Leica-branded watermarks not supported (`watermark`).
- **Wide-angle (Ace/GO flat) video**: FOV fixed at capture, not editable in Studio (`adjust-the-perspective`).
- **VR 360 export** applicable models exclude Ace/GO flat cameras (`instructions-for-vr-panoramic-video-editing-and-export`).

**Could not confirm:** a per-model resolution/FPS capability matrix (which model does 8K, which FOVs exist per model). The manual's Studio pages do not tabulate this; camera-specific numbers live in each camera's own manual (e.g. X6 product page `insta360.com/product/insta360-x6` markets 8K 360; X4 Air page markets "Entry-Level 8K 360"). State as a gap.

---

## 17. Plug-ins

| Plug-in | Function | Install / notes | Source |
|---|---|---|---|
| **Insta360 Reframe for Adobe Premiere** | Edits `.insv` directly in Premiere; Source Settings (stitching, Direction Lock, stabilisation), proxy via `.lrv`, basic reframe (resolution, projection model, FOV presets, angle, distortion) | Windows: `C:\Program Files\Adobe\Common\Plug-ins\7.0\MediaCore\Insta360`; Premiere **2021+**; standalone installer since v5.6.4; not for CS4; no Tiny Planet (Studio-only); **no 10-bit / Dolby Vision** support | `plugin-features/reframe-pr` |
| **QuickLook** | Spacebar preview of `.insv`/`.insp`/`.lrv` | v5.6.1+; Windows daemon runs in background (~130 MB); macOS 12+ (no real-time stitch preview for X3-and-earlier dual-lens) | `plugin-features/quicklook` |
| **LUT (I-Log)** | Look-up tables for external graders (AE, Premiere, Resolve, FCP, PS, LR) | Downloaded separately from Insta360 Downloads | `plugin-features/studio-lut` |
| **Final Cut Pro X plug-in** | Open `.insp/.insv/.mp4` in FCPX (ONE R wide-angle) | Ships with installer (historical); referenced in `en-US.json` (`Apple Final Cut Pro X`) | release note v3.5.1Beta; `en-US.json` |
| **Adobe Premiere / Insta360 STITCHER** | Legacy stitcher plug-in; conflicts with Reframe (delete `ProImporterCEP` if present) | — | `reframe-pr` |

---

## 18. UI exposure & keyboard shortcuts

- **Every feature above is exposed in the GUI** (Media page and/or Project page), per the manual and `en-US.json`.
- Studio ships a **user-editable Shortcut panel**: `en-US.json` `titlebar.shortcut_btn.title = "Shortcut"`, `titlebar.shortcut_btn.description = "You can view and customize shortcut keys here."`, `shortcut.setting.title`, and the tip "Undo and Redo can be applied to basic functions using shortcut keys."
- **Shortcut actions defined in the app** (`shortcut.setting.info.*`, grouped by `type.player` / `type.timeline` / `type.other`): Play/Pause, Undo, Redo, Export, Import into project media, Zoom in/out timeline, Split, Copy, Cut, Paste, Delete, Screenshot, Enter/Exit full screen, Trim start, Trim end, Add Keyframe, Next/Previous frame, Next/Previous 10 frames, Jump to start/end, Auto snapping switch, Preview axis switch, Main track magnet switch, add TimeShift, Log Directory.
- **Gap:** the manual does **not** publish the **default key bindings** for these actions, and the bindings are not stored in any human-readable local file I could inspect (they are within the compiled UI/RCC). So the *list of shortcut actions* is documented (locally), but the *default keys* are **not documented** and not reproducible here. Mouse gestures that are documented: drag canvas to look around, scroll wheel to zoom/FOV, spacebar for QuickLook preview in Windows Explorer.

---

## 19. System requirements (`compatibility-and-configuration-requirements`)

| | Windows | Mac |
|---|---|---|
| OS | Windows 10 / 11 or later | macOS 13 or later |
| CPU | 8th-gen Intel Core or better; AMD Ryzen 3000 or better | Apple M1 or later |
| GPU | NVIDIA GeForce GTX 1660 or better | Apple M1 or later |
| RAM | 16 GB recommended | 16 GB recommended |
| Storage | 128 GB+ SSD | 128 GB+ SSD |

- **v6.0.0+ is compatible with ARM-based Windows** (Snapdragon X Elite/X Plus/etc.); earlier versions were not.
- No full touchscreen support on Windows; **not** compatible with HarmonyOS.
- Old requirement (ONE R era, `oner/en-us/studio/download`): Windows 7 SP1+, 16 GB RAM, GTX 1060 6 GB — superseded.

---

## 20. Version history (selected, officially-attributable)

- **v4.1.0** (2021-11-16) — last "Studio 2021" release notes page (`forums.insta360.com/section/14/post/1360`); that page also archives v3.x entries (Deep Track 2.0, PureShot, AquaVision, ProRes export, HDR/Night Shot, TimeShift, GSV etc.).
- **v5.0.0** (2024-03-26) — major update: multi-timeline, single-track combine of multiple 360 files, concurrent edits, background music/text/transitions, Speed Editor (`insta360.com/blog/news/insta360-studio-major-update`, forum).
- **v5.2.0** Dolby Vision; **v5.4.6** Deep Track reframing, time watermark, right-click keyframes; **v5.6.0** X5 support, 360 VR editing, anti-flicker; **v5.7.0** In/Out points, X5 Immersive Shake; **v5.8.8** Movement feature (community version table, secondary).
- **v6.0.0** (announced ~2025-10/12) — new Media/Project library workflow, queue export, photo exports (Starlapse/Timelapse/Sequence), 16 filter categories, ARM-Windows support, flat/360/preview modes (forum `section/16/post/100947`, reddit 6.0).
- **v6.0.2** — X6 10-bit (Rec.709 10-bit) Color Space export option.
- **v6.0.4** — list view with names/dates, in-place rename, copy/paste clip attributes (reddit, secondary).
- **v6.0.7** — Project-page stickers + multiple text/sticker tracks, original-resolution 360 snapshot export, X6 Slow-Motion mode, better 10-bit/Dolby preview, export queue restored (reddit, secondary).
- **Installed build: 6.0.9** (`configure.ini`).

Official per-version "update log" is published in the Insta360 **Downloads center** rather than a static page; the X6 manual states these logs are obtained there (`onlinemanual.insta360.com/x6/.../checking-for-the-latest-firmware-and-client-version-numbers`). I could not retrieve a machine-readable official changelog from that JS-driven page in this environment.

---

## 21. Automation surface (CLI / config / scripting / API) — findings

- **No command-line interface is documented or shipped as a public feature.** The manual contains no CLI reference; the install root contains no `.bat`/`.cmd`/`.ps1` wrapper or `--help` doc. Studio is a GUI app.
- **Configuration file:** `configure.ini` at the install root holds only `[General] current_version=6.0.9`. `qt.conf` sets only the Qt platform plugin path. No feature/automation config lives in these.
- **Local helper services:** `studio-exporter-service.exe` and `studio-thumbnail-service.exe` are present (previous work established they speak **gRPC on localhost** — the de-facto automation surface for exports/thumbnails, but **undocumented by Insta360** and not referenced in any manual page). Treat as unsupported/internal.
- **Logs / diagnostics:** logs at `C:\Users\<User>\AppData\Local\Insta360\Insta360 Studio\log`; dumped via Menu → Help → Diagnostic Info → Upload Log / Log Directory (`file-management/obtain-log-or-dump-files`). Feedback upload added in v5.8.8.
- **Plug-in API:** none published for Studio itself; the only extension points are the separately-installed Premiere/QuickLook/FCPX/LUT assets (§17), which integrate with **other** apps, not a Studio scripting API.
- **Cloud / account:** Insta360+ cloud import/export (max 10 files/batch) requires Insta360 account login (`log-in-to-use/how-to-log-in`).
- **Insta360 Developer SDK** exists (desktop Media/Camera SDKs) but is a **separate product** for building apps against cameras/media — not a Studio automation API (`insta360develop.github.io/Insta360-Developer_Docs/en/x/desktop/changelog`).

---

## Explicit gaps / unverified items

1. **Default keyboard key bindings** — the action list is known (from `en-US.json`), but the actual default key combinations are not published in the manual or any readable local file.
2. **AI upscaling / super-resolution** — no evidence in the local catalog or manual; status "not found", not confirmed absent.
3. **Per-model resolution/FPS/FOV matrix** — not tabulated in Studio documentation; lives in per-camera manuals/product pages (partially cited, not exhaustively verified).
4. **Official machine-readable changelog** for 6.0.x — the Downloads-center update log is JS-rendered; only secondary (Reddit/gist) and fragmentary primary (forum, X6 manual) version data obtained.
5. **`studio-exporter-service.exe` / `studio-thumbnail-service.exe` gRPC contract** — no official service/proto documentation located; asserted to exist from prior on-host work, not re-verified against vendor docs.
6. **Exact filter/transition/sticker/effect asset counts** — asset catalogs are inside `Resources/insta360.rcc` and per-id folders; the "16 filter categories" figure is from a secondary Reddit summary, not the vendor.
