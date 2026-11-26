# Insta360 Studio `.insproj` Project File Schema

Evidence-based reference derived by reading real project files on disk and running
the repository's own comparison tool (`research/diff_project.mjs`).

**Files analysed** (read-only):

| Project | Project file | Size | fps | frames | clips |
|---|---|---|---|---|---|
| `mcpTest` | `2a9983c4-276b-40ff-89ad-71410aac9aad.insproj` | 64059 B | 30 | 3441 | 4 (+1 transition) |
| `Lamspringe` | `df7f3358-5a02-4d92-bde1-21e14a7ac842.insproj` | 321597 B | 60 | 73281 | 21 (0 transitions) |
| `mcpAuto` | `61D1EC17-93D6-4D44-B508-067C5CAAE95A.insproj` | 47970 B | 30 | 2652 | 3 |
| `mcpE2E` | `B6865F17-5162-4ED0-8EF0-8908BF005F41.insproj` | 33287 B | 30 | 800 | 2 (+1 transition) |
| `mcpAcceptance` | `mcpAcceptance.insproj` | 63487 B | 30 | 3381 | 4 (+1 transition) |
| `360Timelapse` | `59cf73d1-…` | 1081 B | 30 | 0 | 0 (empty, `isPanoramic:true`) |
| `Unbenannt1` | `69f90c6d-…` | 1070 B | 30 | 0 | 0 (empty) |
| `Unbenannt2` | `0a0e7a3e-…` | 1274 B | 30 | 0 | 0 (empty) |

`mcpTest` is Studio-authored and is the richest populated example; `Lamspringe`
is a large real-world project at 60 fps. `mcpAuto` / `mcpE2E` / `mcpAcceptance`
were produced by `research/new_project_e2e.mjs` and
`research/acceptance_probe.mjs`.

The file is plain UTF-8 JSON (no binary header, no encryption); `\n` is not used
for formatting — keys are emitted in the order Studio writes them.

> **Version note.** The set of top-level keys, and the set of keys inside a
> `clip`, varies with the Studio version that last saved the file. Three key
> profiles were observed and are noted inline below. The union is documented;
> a writer should treat any given key as optional unless a target version needs
> it.

---

## 1. Top-level keys

Union of every top-level key observed across all profiled projects. "Example" is
a real value quoted from a real file.

| Key | Type | Example (source) | Meaning |
|---|---|---|---|
| `aspectRatio` | string | `"16:9"` (mcpTest), `"2:1"` (360Timelapse) | Output/timeline aspect ratio. |
| `autoFps` | boolean | `false` (mcpAuto), `true` (mcpTest) | Auto frame-rate flag. Studio sets this `false` on save (recorded round-trip, `src/project.mjs`). Exact UI behaviour otherwise **unknown**. |
| `creationTime` | string | `"2026.11.23 21:30:23"` (mcpTest) | Local-time creation stamp, `YYYY.MM.DD HH:MM:SS`. |
| `enableEffects` | boolean | `true` (mcpTest) | Master switch for effects. Present in Studio 6-era files. |
| `fps` | number | `30` (mcpTest), `60` (Lamspringe) | Timeline frame rate. |
| `frames` | number | `3441` (mcpTest) | Total timeline length in frames. Equals **Σ clip length** (see §6). |
| `hdrColorSpaceAdaptAccepted` | boolean | `false` | HDR colour-space adapt dialog accepted flag. Newer files only. |
| `hdrPreviewEnabled` | boolean | `false` | HDR preview toggle. Newer files only. |
| `id` | string | `"2a9983c4-276b-40ff-89ad-71410aac9aad"` | Project id. Normally equals the filename stem, but not required to (`mcpAcceptance.insproj` carries `id:"mcpAcceptance0000000000000000000000"`). |
| `isPanoramic` | boolean | `false` (mcpTest), `true` (360Timelapse) | 360/panoramic project flag. |
| `lastModifiedTime` | string | `"2026.11.23 22:15:46"` (mcpTest) | Local-time last-save stamp. |
| `mainMagnetizable` | boolean | `true` | Main-track magnet/snap flag. Exact behaviour **unknown**. |
| `markTrimEnd` | number | `3441` (mcpTest) | Timeline end marker frame. Equals `frames` in every observed non-empty project. |
| `markTrimIn` | number | `0` | Timeline in marker frame. `0` in every observed project. |
| `markTrimVisible` | boolean | `false` | Whether trim markers are shown. |
| `name` | string | `"mcpTest"` | Project display name (= project folder name). |
| `projectPath` | string | `"D:/Dokumente/Insta360/Studio/TimelineProject/mcpTest"` | Absolute project directory, **forward slashes**. |
| `skipHdrColorSpaceAdaptDialog` | boolean | `false` | HDR adapt dialog suppression. Newer files only. |
| `tracks` | array | see §2 | The timeline: array of track objects. |
| `watermarkPanelApplyAll` | boolean | `true` | Watermark "apply to all" flag. |
| `watermarkPanelConfigJson` | string | `"{\"flat_logo_watermark\":{…},\"logo_watermark\":{…},\"time_watermark\":{…},\"version\":1}"` | JSON **encoded as a string**. Decoded shape (mcpTest): `flat_logo_watermark{enabled,position,style_path,transparency}`, `logo_watermark{corner_radius,enabled,feather,position,rotate,size,style_path}`, `time_watermark{enabled,format,transparency}`, `version`. Empty string `""` in brand-new projects (Unbenannt2). |

**Older-profile-only keys** (present in `360Timelapse`, `Unbenannt1`; these are
the same fields Studio's project-list entry uses — see `registerProject` in
`src/pipeline.mjs`):

| Key | Type | Example | Meaning |
|---|---|---|---|
| `adsorbable` | boolean | `true` | unknown (also a project-list field). |
| `lowQualityProxyType` | number | `-1` | unknown (proxy/media type). |
| `previewable` | boolean | `false` | unknown. |
| `projectMediaType` | string | `""` | unknown. |

Those four keys never appear in the newer Studio-authored profiles; in newer
files they live only in Studio's project list
(`%LOCALAPPDATA%/Insta360/Insta360 Studio/nle/pro.insproj`), not in the project.

**Related — Studio's project list entry** (`pro.insproj`, `{"projects":[…]}`,
observed 8 entries). One entry, quoted from `mcpTest`:
`{"aspectRatio":"16:9","autoFps":true,"creationTime":"2026.11.23 21:30:23","enableEffects":true,"fps":30,"frames":3441,"hdrColorSpaceAdaptAccepted":false,"hdrPreviewEnabled":false,"id":"2a9983c4-…","isPanoramic":false,"lastModifiedTime":"2026.11.23 22:15:46","mainMagnetizable":true,"markTrimEnd":3441,"markTrimIn":0,"markTrimVisible":false,"name":"mcpTest","projectPath":"D:/Dokumente/…/mcpTest","skipHdrColorSpaceAdaptDialog":false,"watermarkPanelApplyAll":true,"watermarkPanelConfigJson":"…"}`.
It mirrors a subset of the project's own top-level fields (no `tracks`).

---

## 2. `tracks` array

Every observed project has 2 or 3 tracks. A track object is small:

```json
{ "audible": true, "clips": [ … ], "id": "662e58a4-4b9a-4408-8e6e-fc5cb4f0ce1d",
  "locked": false, "transitions": [ … ], "type": 0, "visible": true, "z": 0 }
```

| Field | Type | Example | Meaning |
|---|---|---|---|
| `audible` | boolean | `true` | Track audio enabled. |
| `clips` | array | (see §3) | Clips on the track, **in timeline order**. |
| `id` | string | `"662e58a4-4b9a-4408-8e6e-fc5cb4f0ce1d"` | Track id. |
| `locked` | boolean | `false` | Track lock. |
| `transitions` | array | (see §5) | Transitions on the track. |
| `type` | number | `0` | Track kind — see below. |
| `visible` | boolean | `true` | Track visibility. |
| `z` | number | `0` / `-1` | Track stacking order. Present in newer files (mcpTest/mcpAuto/mcpE2E/Unbenannt2); **absent** in older ones (Lamspringe, 360Timelapse). |

### `type` values observed

| Value | Observed in | Interpretation |
|---|---|---|
| `0` | every populated project (track 0) | **video** track (this is the one that carries clips). |
| `2` | mcpTest track 1, Lamspringe track 2, mcpAuto track 1 | **audio** track (`z:-1`, always empty `clips` in these files). |
| `3` | Lamspringe track 1, 360Timelapse track 2, Unbenannt1 track 2 | **overlay** track (always empty here). |
| `1` | never observed | **unknown** (reserved; no file exercised it). |

Only track `type:0` ever holds clips. The `TRACK_TYPE` map in `src/project.mjs`
(`0:video, 2:audio, 3:overlay`) matches the observed values exactly.

---

## 3. The clip object

A clip has ~53 keys (newer profile) / ~48 keys (older profile). Full key list,
quoted from `mcpTest` clip[0]:

```
aspect_ratio_info, asteroidPitchOffset, audio_setting, baseViewAutoApplied,
camera_movement, camera_transform, dashboard_setting, deep_track,
default_factor, dewarp_setting, effect_filter, enable_user_keyframe,
flat_logo_watermark, fps, has_set_play_rate_manually, hdrPreviewEnabled,
hdrPreviewUserToggled, head_track, highlight_data, id, inAsteroidMode,
key_frame_track, lastTrimEditTime, leftTrim, legacy_camera_movement,
logo_watermark, media_process, name, online, original_camera_transform,
panoAnimationPresetId, play_rate_track, popupApplyDefaultCameraTransformTips,
ratio, resourceId, rightTrim, roughTrimmed, sourceFrames, source_left_trim,
source_right_trim, source_total_frames, srcId, stab_setting, startFrame, state,
stitching_optimization, stitching_setting, subtype, supplementFrameType,
supplement_frame_type, time_watermark, type, url, userRotateDegree, viewType
```

Keys **only** in the older profile (Lamspringe, no `mcpTest` counterpart):
none added; conversely the older clip is **missing** `asteroidPitchOffset`,
`inAsteroidMode`, `legacy_camera_movement`, `hdrPreviewEnabled`,
`hdrPreviewUserToggled`. The older `stab_setting` additionally carries
`enableCameraMovement`, `enableHeadTracking`, `enableMainWindow`.

### (a) Source metadata — describes the file/device on disk

| Field | Type | Example (mcpTest clip0) | Meaning |
|---|---|---|---|
| `url` | string | `"F:/Luna/VID_20261112_051426_001.mp4"` | Absolute source file path. |
| `name` | string | `"VID_001.mp4"` | Source basename shown in the UI. |
| `srcId` | string | `""` | Source identity (empty in all observed). |
| `resourceId` | string | `""` | Source identity (empty in all observed). |
| `sourceFrames` | number | `904` | Source length in frames. Equal to `source_total_frames` in every observed clip. |
| `source_total_frames` | number | `904` | Full source length in frames, before trims. |
| `source_left_trim` | number | `0` | Left trim already baked into the source (0 in every observed clip). |
| `source_right_trim` | number | `0` | Right trim already baked into the source (0 in every observed clip). |
| `fps` | number | `30` | Source frame rate. |
| `ratio` | number | `8` | Source/display aspect-ratio enum (mirrors `aspect_ratio_info.current_aspect_ratio`). |
| `aspect_ratio_info` | object | `{currentAspectRatio:"8", current_aspect_ratio:8, supportAspectRatios:null, support_aspect_ratios:[8]}` | Aspect-ratio metadata; `current*` is a string enum, `support*` is the allowed list. |
| `type` | number | `1` | Clip media type. `1` in every observed clip; other values **unknown**. |
| `subtype` | number | `0` | Clip sub-type. `0` everywhere; **unknown**. |
| `viewType` | number | `0` | View/data type (recall `research/PROJECT_AND_EFFECTS.md` names `ViewDataType` values `DeepTrack`/`MovementTemplate`). `0` everywhere; **unknown**. |
| `supplementFrameType` | string | `"SupplementFrameTypeNormal"` | Supplement-frame kind. |
| `supplement_frame_type` | number | `0` | Numeric form of the above. |
| `online` | boolean | `false` | unknown (online/offline media). |
| `dashboard_setting` | object | `{dashboardDataId:"", dashboardDataType:0, dashboardSourceType:"TypeNoneData", dashboardStyle:"", enableDashboard:true, supportDashboard:true}` | Sports-dashboard overlay config. |
| `stitching_setting` | object | `{cameraAccessory:0, customStitchingValue:0, customStitchingValueMax:0, enableColdShoe:false, enableCoolingShell:false, propellerGuardStatus:0, supportCameraAccessory:[0], supportColdShoe:false, supportCoolingShell:false, supportCustomStitching:false, supportPropellerGuard:false, supportStitching:false}` | Device/accessory stitching capabilities. |
| `stitching_optimization` | object | `{enableAIStitching:false, enableDynamicStitching:false, enableImageFusionStitching:false, enableOpticalFlowStitching:false, ignoreDynamicStitching:false, ignoreImageFusionStitching:false, ignoreOpticalFlowStitching:false, optimizedOffset:"", supportAIStitching:false, supportDynamicStitching:false, supportImageFusionStitching:false, supportOpticalFlowStitching:false}` | Stitching-optimisation flags + support caps. |

### (b) Editing state — what the user changed

| Field | Type | Example | Meaning |
|---|---|---|---|
| `id` | string | `"3eaa5081-9bd9-431a-b9d8-d5abf57ee119"` | Clip identity, referenced by transitions (`prevClip`/`nextClip`) and embedded in `deep_track.save_path`. |
| `startFrame` | number | `0` | Timeline position in frames = running sum of preceding clip lengths (see §6). |
| `leftTrim` | number | `0` | Frames removed from the left of the source. |
| `rightTrim` | number | `0` | Frames removed from the right of the source. |
| `source_left_trim`/`source_right_trim` | number | `0` | See §3(a) — kept here for the length formula. |
| `roughTrimmed` | boolean | `false` | unknown (rough-cut trim applied?). |
| `lastTrimEditTime` | number | `0` | Timestamp of last trim edit; `0` everywhere observed. |
| `state` | number | `0` | Clip state enum; `0` everywhere observed; **unknown**. |
| `effect_filter` | object | see below | Applied filter/effect. |
| `media_process` | object | see §4 | Per-clip image-quality settings (56 fields). |
| `audio_setting` | object | see below | Clip audio. |
| `stab_setting` | object | see below | Stabilisation. |
| `dewarp_setting` | object | see below | Dewarp/projection. |
| `camera_transform` | object | see below | Current view direction/zoom. |
| `original_camera_transform` | object | identical to `camera_transform` in mcpTest | Pre-edit camera transform (baseline for reset). |
| `camera_movement` | object | see below | Camera-movement template container. |
| `head_track` | object | see below | Head-tracking container. |
| `key_frame_track` | object | `{}` | User keyframes. **Empty `{}` in all 25 projects on this machine** — see the section below for the candidate schema recovered from the binary. |
| `play_rate_track` | object | `{}` | Speed/slow-motion track. **Empty `{}` in every observed clip** — semantics **unknown**. |
| `deep_track` | object | see below | AI tracking cache, keyed to the project directory. |
| `time_watermark` | object | `{enableTimeWatermark:false, timeWatermarkFormat:2, timeWatermarkTransparency:100}` | Per-clip time watermark. |
| `logo_watermark` | object | `{enableLogoWatermark:false, logoWatermarkCornerRadius:0, logoWatermarkFeather:0, logoWatermarkLocationType:0, logoWatermarkRotate:0, logoWatermarkSize:30, selectedLogoWatermarkPath:":resource/default_logo_0.png"}` | Logo watermark. |
| `flat_logo_watermark` | object | `{clipAspectRatio:8, enableFlatLogoWatermark:false, flatLogoWatermarkTransparency:100, logoWatermarkLocationType:0, selectedLogoWatermarkPath:"D:/…/insta360-LunaUltra-Leica.png"}` | Flat (logo-style) watermark. |
| `enable_user_keyframe` | boolean | `true` | Keyframe editing enabled. |
| `has_set_play_rate_manually` | boolean | `false` | Whether play rate was set by hand. |
| `baseViewAutoApplied` | boolean | `false` | unknown (auto base view applied). |
| `legacy_camera_movement` | boolean | `false` | Legacy camera-movement mode flag. |
| `userRotateDegree` | number | `0` | User rotation. |
| `default_factor` | number | `1` | unknown (default zoom factor?). |
| `panoAnimationPresetId` | number | `-1` | Panorama animation preset id (`-1` = none). |
| `asteroidPitchOffset` | number | `0` | Asteroid (little-planet) pitch offset. |
| `inAsteroidMode` | boolean | `false` | Asteroid mode flag. |
| `hdrPreviewEnabled` | boolean | `false` | HDR preview (per-clip). |
| `hdrPreviewUserToggled` | boolean | `false` | User toggled HDR preview. |
| `highlight_data` | boolean | `false` | unknown (highlight data present). |

**`effect_filter`** — the applied filter/effect (empty = none):
```json
// no effect (mcpTest clip0)
{"externfilterId":"","externfilterName":"","externfilterOpacity":70,"externfilterResourcePath":""}
// with effect (mcpTest clip1)
{"externfilterId":"HD Fireworks","externfilterName":"Fireworks I",
 "externfilterOpacity":70,
 "externfilterResourcePath":"D:/Dokumente/Insta360/Studio/Download/filter/HD Fireworks/1765962688000/HD Fireworks.cube.binary"}
```
`externfilterId` = effect id, `externfilterName` = display name, `externfilterOpacity`
= strength (0–100), `externfilterResourcePath` = path to the `.cube.binary` LUT.

**`audio_setting`** (identical structure in every observed clip):
```json
{"audioDetached":false,"currentDenoiseType":1,"currentFadeIn":0,"currentFadeOut":0,
 "currentMixingWeight":50,"currentTracksDelay":-2147483648,"currentVolume":100,
 "defaultTracksDelay":-2147483648,"enableDenoise":false,"enableMixing":true,
 "maxFadeIn":300,"maxFadeOut":300,"preDetachVolume":100,"supportAudio":true,
 "supportDenoise":true,"supportDenoiseTypes":[1,2],"supportMixing":false}
```
Editable values: `currentVolume`, `currentFadeIn`/`currentFadeOut` (bounded by
`maxFadeIn`/`maxFadeOut`), `currentDenoiseType`, `enableDenoise`, `currentMixingWeight`.
`currentTracksDelay`/`defaultTracksDelay` are `-2147483648` (INT_MIN sentinel = "unset").

**`stab_setting`** (mcpTest):
```json
{"enableDirectionalLock":false,"enableFpv":false,"enableImmerrsionStab":false,
 "enablePanoFpv":false,"enableStab":false,"modifiable":true,"stabLevel":0,
 "supportBoostStabLevel":false,"supportDirectionalLock":false,"supportFpv":false,
 "supportHighStabLevel":false,"supportPanoFpv":false,"supportStab":false}
```
The older profile (Lamspringe) adds `enableCameraMovement`, `enableHeadTracking`,
`enableMainWindow`. Edit values: `enableStab`, `stabLevel`, `enableFpv`, `enablePanoFpv`,
`enableImmerrsionStab`, `enableDirectionalLock`; `support*` are capability flags.

**`dewarp_setting`** (mcpTest):
```json
{"all_dewarp_types":[{"name":"TinyPlanet","value":16},{"name":"Superweitwinkel","value":0},
  {"name":"Weitwinkel","value":1},{"name":"Linear","value":2},{"name":"Schmal","value":3}],
 "aspectRatio":8,"current_dewarp_type":{"name":"Weitwinkel","value":1},
 "default_dewarp_type":{"name":"Superweitwinkel","value":0},
 "fov_distance_range":{"is_max_x":false,"is_min_x":false,"max_distance":1,
   "max_fov":160.40260314941406,"min_distance":0,"min_fov":1},
 "removeDistortion":false,
 "support_dewarp_types":[ … same five … ]}
```
`current_dewarp_type` = active projection (Lamspringe clip0 uses `{"name":"Linear","value":2}`);
`default_dewarp_type`,`support_dewarp_types`,`all_dewarp_types` describe the source's
options; `removeDistortion` toggles distortion removal.

**`camera_transform` / `original_camera_transform`** — view direction:
```json
{"distance":1,"fov":{"type":1,"value":39.43048686077504},
 "eulers":{"pitch":{"type":0,"value":0},"roll":{"type":0,"value":0},"yaw":{"type":0,"value":0}}}
```
`eulers.*` and `fov` are `{type,value}` pairs (keyframed values: `type` picks
constant/keyframe). `distance` = zoom distance.

**`camera_movement`**:
```json
{"bottom_by_category":[],"camera_movement_models":[],"distance":0.6,
 "fov":1.3089969389957472,"pitch_offset":0,"roll_offset":0,
 "view_category_filter":1,"yaw_offset":0}
```
**`head_track`**: `{distance:1, fov:1.3089969389957472, head_track_list:[], pitch_offset:0, roll_offset:0, yaw_offset:0}`.
`camera_movement_models` and `head_track_list` are **empty in every observed clip**.

**`deep_track`** (AI tracking cache):
```json
{"cache_path":"","deep_track_list":[],"original_clip_id":"",
 "save_path":"D:/Dokumente/Insta360/Studio/TimelineProject/mcpTest/mcpTest/3eaa5081-9bd9-431a-b9d8-d5abf57ee119"}
```
`save_path` = `<projectPath>/<projectName>/<clipId>`. Studio re-points this at the
new project when the file is opened elsewhere (recorded round-trip; and the
`mcpAuto` backup↔primary diff shows `id` and `deep_track.save_path` moving together).
`deep_track_list` is empty in all observed clips.

### (c) Anything else / mixed

`media_process` and the `support*` sub-blocks inside `stab_setting`,
`dewarp_setting`, `stitching_setting`, `stitching_optimization`, `audio_setting`
mix **capability/bounds metadata** (which the device/source determines) with
editable values. Treat the `support*` keys as read-only capability flags, not as
settings to author.

---

## 4. `media_process` block (56 fields)

Identical key set in every observed project (mcpTest, Lamspringe, mcpAuto,
mcpE2E, mcpAcceptance). Grouped by role; example values from mcpTest clip0
(which has everything at default/off).

**Colour-adjust scalars** (bounded by `colorAdjustCommonMin`/`Max`):

| Field | Example | Field | Example |
|---|---|---|---|
| `colorAdjustAutoadjust` | `0` | `colorAdjustHighlights` | `0` |
| `colorAdjustBlackpoint` | `0` | `colorAdjustSaturation` | `0` |
| `colorAdjustBrightness` | `0` | `colorAdjustShadows` | `0` |
| `colorAdjustBrilliance` | `0` | `colorAdjustTint` | `0` |
| `colorAdjustContrast` | `0` | `colorAdjustVibrance` | `0` |
| `colorAdjustDefinition` | `0` | `colorAdjustWarmth` | `0` |
| `colorAdjustExposure` | `0` | | |

Bounds: `colorAdjustCommonMin` `-100`, `colorAdjustCommonMax` `100`,
`colorAdjustDefinitionMin` `0`.

**Colour+ (strength):** `colorPlusStrength` `30`, `colorPlusStrengthMin` `0`,
`colorPlusStrengthMax` `100`.

**Feature enable toggles** (all `false` at default): `enableAe`, `enableBeautyMode`,
`enableColorAdjust`, `enableColorPlus`, `enableHorizontalCorrect`,
`enableLocalToneMapping`, `enableLut`, `enableMotionBlur`, `enableMultiFrameDenoise`,
`enablePureShot`, `enableSingleDenoise`, `enableTimeLogo`, `enableUnderWaterCorrect`.

**Horizontal correct:** `horizontalCorrectAngle` `0`, `horizontalCorrectDefaultAngle` `0`.

**Local tone mapping:** `localToneMappingStrength` `30`, `…Min` `0`, `…Max` `100`.

**Motion blur:** `motionBlurEdited` `false`, `motionBlurStrength` `50`, `motionBlurThreshold` `85`.

**Time logo:** `timeLogoFormat` `0`, `timeLogoTransparency` `100`.

**Underwater:** `underWaterStrength` `100`, `…Min` `0`, `…Max` `100`, `underWaterStyle` `0`.

**Capability support flags** (device/source; read-only): `supportAe` `false`,
`supportColorAdjust` `true`, `supportColorPlus` `true`, `supportHorizontalCorrect`
`true`, `supportLocalToneMapping` `true`, `supportLut` `false`, `supportMotionBlur`
`true`, `supportPureShot` `false`, `supportSingleDenoise` `false`,
`supportUnderWaterCorrect` `true`.

**Observed behaviour:** the `enable*` toggle plus its value field are what survive
a round-trip — e.g. `acceptance_probe` set `enableColorAdjust:true,
colorAdjustContrast:25, colorAdjustSaturation:20` and all three persisted to disk
in `mcpAcceptance` (verified by `diff_project` run, §7).

---

## 5. Transitions

A transition sits on the video track's `transitions[]` between two clips. Real
object, quoted from mcpTest:

```json
{
  "id": "4db93c6b-1904-4ecb-bc92-ea16c7191cbf",
  "resourceId": "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092",
  "path": "D:/Dokumente/Insta360/Studio/Download/transition/B9AE47D4-71E3-41F5-A5AA-E605AD3EF092/1794456470000/B9AE47D4-71E3-41F5-A5AA-E605AD3EF092/B9AE47D4-71E3-41F5-A5AA-E605AD3EF092.2.videotransition",
  "prevClip": "3eaa5081-9bd9-431a-b9d8-d5abf57ee119",
  "nextClip": "2f242419-d096-4a83-8b48-31d740a7be51",
  "frames": 60,
  "defaultFrames": 14,
  "minimumFrames": 6,
  "maximumFrames": 60,
  "name": "",
  "state": 0,
  "type": 2
}
```

| Field | Type | Example | Meaning |
|---|---|---|---|
| `id` | string | `"4db93c6b-…"` | Transition instance id. |
| `resourceId` | string | `"B9AE47D4-…"` | Transition asset id. |
| `path` | string | `"D:/…/…videotransition"` | Path to the transition asset. |
| `prevClip` | string | `"3eaa5081-…"` | **`id` of the clip before the transition** (mcpTest: clip[0]'s id). |
| `nextClip` | string | `"2f242419-…"` | **`id` of the clip after the transition** (clip[1]'s id). |
| `frames` | number | `60` (mcpTest) / `24` (mcpE2E) | Applied transition length, within `[minimumFrames, maximumFrames]`. |
| `defaultFrames` | number | `14` | The asset's default length. |
| `minimumFrames` | number | `6` | Allowed minimum. |
| `maximumFrames` | number | `60` | Allowed maximum. |
| `name` | string | `""` | Display name (empty in observed files). |
| `state` | number | `0` | Transition state; `0` everywhere observed; **unknown**. |
| `type` | number | `2` | Transition kind enum; `2` in every observed file. |

`prevClip`/`nextClip` are clip **ids** (not indices), matching
`tracks[0].clips[*].id`: mcpTest's transition links clip[0]→clip[1] by their ids.
`makeTransition()` in `src/project.mjs` writes exactly this shape (defaults
`frames:30, defaultFrames:14, minimumFrames:6, maximumFrames:60, state:0, type:2`).

---

## 6. Frame arithmetic (verified)

Let `len(c) = c.source_total_frames - c.leftTrim - c.rightTrim`
(equivalently `c.sourceFrames - c.leftTrim - c.rightTrim`, since the two source
counts are equal in every observed clip).

Then, for clips `[0..n]` on the video track **in array order**:

```
startFrame[0] = 0
startFrame[k] = startFrame[k-1] + len(clip[k-1])
frames         = Σ len(clip[k])          (project-level)
markTrimEnd    = frames
markTrimIn     = 0
```

Verified with zero drift on every populated project:

| Project | starts | Σ len | `frames` | `markTrimEnd` |
|---|---|---|---|---|
| mcpTest (all trims 0) | 0, 904, 1241, 1661 | 3441 | 3441 | 3441 |
| mcpAuto | 0, 894, 1778 | 2652 | 2652 | 2652 |
| mcpE2E | 0, 600 | 800 | 800 | 800 |
| mcpAcceptance | 0, 904, 1181, 1601 | 3381 | 3381 | 3381 |
| Lamspringe (21 clips) | 0, 1651, 4599, … , 72538 | 73281 | 73281 | 73281 |

`timelineLayout()` / `relayout()` in `src/project.mjs` implement exactly this
formula, and the `mcpAcceptance` diff confirms it: after the probe trimmed clip[1]
by 30/30, `startFrame` of clips 2 and 3 dropped from 1241→1181 and 1661→1601 (each
by the 60-frame length reduction) and `frames`/`markTrimEnd` went 3441→3381.

Transitions do **not** change `startFrame` (mcpTest keeps the naive running sum
despite a 60-frame transition).

---

## 7. Safe to write vs fields Studio overwrites

Method: `research/diff_project.mjs` was run on (i) a Studio-authored file vs a file
the tooling produced from the same template, and (ii) backup↔primary pairs.

### Diff runs performed

1. **mcpTest (Studio) vs mcpAcceptance (tool edit of mcpTest)** — 16 diffs, all of
   them the tool's intended edit plus path form. Tool-changed fields that landed
   and persisted: `tracks[0].clips[1].leftTrim` `0→30`, `rightTrim` `0→30`,
   `media_process.enableColorAdjust` `false→true`,
   `media_process.colorAdjustContrast` `0→25`,
   `media_process.colorAdjustSaturation` `0→20`,
   `effect_filter.externfilterName`/`externfilterOpacity`/`externfilterResourcePath`,
   and the derived `frames`/`markTrimEnd` `3441→3381` and `startFrame`s
   `1241→1181`, `1661→1601`.
2. **mcpAuto primary vs backup** — 11 diffs; clip `id`, `name`, `url`,
   `deep_track.save_path`, `leftTrim` and `startFrame` all move **together** when
   clips are reordered, i.e. the clip is an atomic record keyed by `id` and
   `deep_track.save_path` embeds that `id`.
3. **Lamspringe primary vs backup** — 1 diff: `tracks[0].transitions` length `0` vs
   `1`, everything else identical (a transition was added/removed; the rest of a
   321 KB project is byte-stable under an external edit).
4. **Unbenannt2 primary vs backup** — 2 diffs, both `tracks[*].id`, i.e. track ids
   were re-assigned between saves; no other field changed.

### Safe to write from outside

These carried the tool's edits through the round-trips above and are the fields the
tooling authors directly:

- Per clip: `leftTrim`, `rightTrim`, `startFrame`, `effect_filter.*`
  (`externfilterId`, `externfilterName`, `externfilterOpacity`,
  `externfilterResourcePath`), `media_process.enable*` + value fields,
  `audio_setting.currentVolume`/`currentFadeIn`/`currentFadeOut`,
  `camera_transform`, `dewarp_setting.current_dewarp_type`, `url`, `name`,
  `key_frame_track`, `play_rate_track`.
- Per track: `clips[]` order, `transitions[]` (whole objects), `type`, `audible`,
  `visible`, `locked`, `z`.
- Project: `aspectRatio`, `fps`, `frames`, `markTrimIn`, `markTrimEnd`,
  `name`, `projectPath`, `id`, `creationTime`, `lastModifiedTime`.

(After any edit, `startFrame`/`frames`/`markTrimEnd` must be recomputed per §6 — a
mismatch shifts or overlaps clips.)

### Studio overwrites / normalises

- **Clip and transition `id`.** Studio-authored clips use lowercase hex UUIDs
  (`3eaa5081-9bd9-431a-b9d8-d5abf57ee119`), while freshly generated ids written by
  the tooling are uppercase (`6E239392-AD58-4F98-B39F-87E9FD7E718F`). The recorded
  round-trip notes in `src/project.mjs` and `src/pipeline.mjs` state Studio
  **re-IDs clips and transitions** on open; the case difference between the two
  writers is consistent with that. (No pre/post-Studio pair survives on disk to
  re-run this directly — see "Unresolved".)
- **`deep_track.save_path`.** Studio **re-points it at the new project directory**
  (`<projectPath>/<projectName>/<clipId>`). A project copied to another folder
  keeps the *old* path until Studio opens it (observed: `mcpAcceptance`'s clips
  still point at `…/mcpTest/mcpTest/…` because that file was never opened by Studio).
- **`autoFps`.** Studio sets it `false` on save (recorded round-trip). Tool-written
  files (`mcpAuto`, `mcpE2E`) carry `autoFps:false`; the template and other
  Studio-authored files carry `autoFps:true`.
- **Path separators.** Studio writes **forward slashes** (`url`, `projectPath`,
  effect `externfilterResourcePath` in mcpTest). The tooling wrote **backslashes**
  into `effect_filter.externfilterResourcePath`
  (`D:\\Dokumente\\…\\HD Fireworks.cube.binary` in mcpAuto/mcpE2E/mcpAcceptance).
  Expect Studio to normalise separators on save.

### `key_frame_track` — candidate schema, recovered from the binary (unverified)

**Status: hypothesis, not measurement.** `key_frame_track` is `{}` in all 25 projects on
this machine, so there is no row to read. What exists is the string table of
`Insta360 Studio.exe` — the `.insproj` is written by Studio's own C++ serialiser, so
every JSON key is a literal in that binary, and the literals of one struct sit together.
`research/jsonkey_neighbours.py` prints a literal's neighbourhood; the table at
`0x077ca2xx` (a view/pose) and `0x077ca5xx` (a track) is adjacent to `collectComments`,
a `jsoncpp` member, which is what identifies the region as a JSON parser's key set:

```
id, fov, distance, yaw, pitch, roll            → a view (the same names as camera_transform)
timeRatio, target, states, to, version,
startTime, linear, endTime, targets,
transitions, smooth                             → a track/stage
slip_in_slip_out, fade_in_fade_out,
slip_in_fade_out, fade_in_slip_out              → transition curve names
```

The last four match the `clip.keyframe.*` entries in `translations/de-DE.json`
(`Nichts`, `Gleichmäßige Überblendung` are the remaining curves), so they are almost
certainly this struct's `transitions` values.

**Do not write a builder against this yet.** Two traps the skill has already been bitten
by apply here: a plausible-looking key set silently mis-serialises, and a track whose
real shape is `states[]`/`targets[]` may need more than per-keyframe poses. Harvest the
truth first — a project Studio wrote with keyframes is the authority, and
`research/keyframe_probe.mjs` finds it and prints the keys flat:

```bash
node research/keyframe_probe.mjs    # scans every project, prints any non-empty key_frame_track
```

The `key_frame_track.cpp` symbol table in `studio_worker.dll` adds two names —
`RemoveKeyFrameInsideArea`, `RemoveHeadTrackModeKeyFrame`, and the literal
`head_track_start_keyframe` — so Deep Track's own keyframes share this track's type
space (see `ViewData.KeyFrameType` in `src/proto/export.proto`: `kKeyFrame`,
`kDeepTrackStart`, `kDeepTrackEnd`, `kViewFinderStart`, `kViewFinderEnd`, `kNone`).

---

## 8. Unresolved / unknown

- Exact meaning of `type` (clip, `=1`), `subtype`, `viewType`, `state`, `online`,
  `highlight_data`, `default_factor`, `roughTrimmed`, `lastTrimEditTime`,
  `baseViewAutoApplied`, `asteroidPitchOffset`, `inAsteroidMode`.
- `key_frame_track` and `play_rate_track` are **empty `{}` in every observed clip**;
  their populated shape is unknown. Likewise `camera_movement.camera_movement_models`,
  `head_track.head_track_list`, `deep_track.deep_track_list`.
- Track `type:1` never occurs in any sampled file.
- `autoFps`, `mainMagnetizable`, `adsorbable`, `previewable`, `projectMediaType`,
  `lowQualityProxyType` semantics are inferred only from presence/location.
- The "Studio re-IDs / re-points / sets autoFps false" behaviour is taken from the
  measured notes recorded in `src/project.mjs` and `src/pipeline.mjs`; no
  pre-Studio/post-Studio file pair is preserved on this disk to reproduce it via
  `diff_project.mjs` directly (all primary files are byte-identical to their
  `_backup`, or differ only by user edits).
