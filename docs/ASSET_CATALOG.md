# Insta360 Studio — Local Asset Library Catalogue

All facts below were produced by enumerating and reading the files on this machine.
Two roots are involved:

| Root | Path |
|---|---|
| Asset download library | `D:\Dokumente\Insta360\Studio\Download\` |
| Studio install (Resources) | `C:\Users\stefa\AppData\Local\Insta360\Apps\Insta360 Studio\current\` (constant `ROOT` in `research/studioroot.py`) |
| Projects (ground truth for references) | `D:\Dokumente\Insta360\Studio\TimelineProject\` (`*.insproj`, plain JSON) |

Catalog manifests live in `Download\info\*.json`; per-asset payloads live in the category folder next to them.

---

## 1. Category counts

Counts are of **top-level asset folders on disk** (`Download\<category>\<id-or-name>\`), with the **installed payload** count
and the **catalog** size from the manifest recorded separately. Most catalog entries exist only as thumbnails + a manifest
row; only the rows the app has actually downloaded carry a payload file.

| Category | Folder | Top-level asset folders | Installed payloads | Catalog manifest (`info/`) |
|---|---|---:|---|---|
| Filters | `filter\` | 5 dirs (4 filters + `cover\`) | **4** `.cube.binary` LUTs | `filter_resource_manifest.json` — **206** names |
| Transitions | `transition\` | **134** | **8** `.videotransition` (NVAP) + 8 `.lic` | `transition_resource_manifest.json` — **134** |
| Effects (video FX) | `effect\` | **260** | **63** `.videofx` (NVAP) + 63 `.lic` + 63 `.effect_package_ready` | `effect_resource_manifest.json` → `versions` — **260** |
| Text presets | `text\` | **93** | 0 payload files — thumbnail only | `text_resource_manifest.json` — **93** |
| Stickers | `sticker\` | **710** | 0 payload files — covers only | `sticker_resource_manifest.json` → `versions` — **710** |
| Movement presets | `movement\` | **31** | **14** with full payload (`.name`+`.duration`+`.json`) | `movement_resource_manifest.json` — **31** |
| Audio / music | `audio\` | **6** | **6** `.mp3` + waveform `.json` + `.png` | `online_music_resource_manifest.json` — **3237** catalog; `persistent_music.json` lists 6 |

Notes on the numbers (each verified):

* Filters — only 4 `.cube.binary` LUTs exist: `00sLook`, `DarkGlow`, `HD Fireworks`, `Nostalgic`
  (also exactly the 4 names in `info\downloaded_filter.json`). The 5th top-level dir `filter\cover\` holds
  185 `.png` + 21 `.jpg` = 206 preview images matching the 206 catalog names one-for-one.
* Transitions — 134 folders, but only 8 contain a `.videotransition` payload; extension census showed
  14 `.videotransition` / 14 `.lic` including macOS `._*` AppleDouble twins, i.e. **8** real each.
* Effects — 260 folders, 63 with a `.videofx` payload (97 raw incl. `._*` twins → 63 real), each payload twin
  sits beside a `.lic` and an `.effect_package_ready` marker.
* Movement — of 31 folders, only 14 contain `.name` + `.duration` + `.json` (matches the 14 timestamps in
  `info\downloaded_pano.json`); the other 17 folders hold only a `.webp` thumbnail.
* Audio — 6 tracks: `210013743`, `210016681`, `23617`, `23618`, `24023`, `24024`.

Other category-like folders that are **not** asset types: `info\` (manifests), `operation\`
(`exposure_records.json`, `operation_resource_manifest.json`), `watermark\` (device watermark PNGs +
`Frame_Watermark_Config_Table.txt` / `Image_Watermark_Config_Table.txt`), `imported_audio\`.

---

## 2. Per-category layout, formats, and `.insproj` reference shape

All payload paths are absolute Windows paths written into the project. Two escaping styles appear in the same
file set: forward slashes (`D:/...`) and doubled backslashes (`D:\\...`) — both were observed verbatim.

### 2.1 Filters (`filter\`)

Layout:

```
Download\filter\<FilterName>\<epoch_ms>\<FilterName>.cube.binary
Download\filter\cover\<FilterName>\<epoch_ms>\<FilterName>.<hash>.png|.jpg
```

Resource format — `<FilterName>.cube.binary`, e.g.
`Download\filter\00sLook\1793348936000\00sLook.cube.binary` (786,440 bytes).
Magic/first bytes: `40 00 00 00 03 00 00 00 ...` → a **binary 3D LUT**: `uint32 size = 0x40 (64)`,
`uint32 channels = 3`, then 64³ × 3 one-byte RGB samples (`786432 + 8 = 786440`). Same concept as a
`.cube` LUT, stored binary.

`.insproj` reference shape — inside a clip's `effect_filter` object:

```json
"effect_filter": {
    "externfilterId": "HD Fireworks",
    "externfilterName": "HD Fireworks",
    "externfilterOpacity": 55,
    "externfilterResourcePath": "D:\\Dokumente\\Insta360\\Studio\\Download\\filter\\HD Fireworks\\1765962688000\\HD Fireworks.cube.binary"
}
```

This real, populated block is from `TimelineProject\mcpAcceptance\mcpAcceptance.insproj`; the empty form
(`externfilterId: ""`, `externfilterOpacity: 70`) appears in 68 clips across the project set.

### 2.2 Transitions (`transition\`)

Layout:

```
Download\transition\<UUID>\<epoch_ms>\<UUID>\<UUID>.<version>.videotransition      ← NVAP container
Download\transition\<UUID>\<epoch_ms>\<UUID>\<UUID>.json                           ← Chinese metadata
Download\transition\<UUID>\<epoch_ms>\<UUID>\<UUID>.<version>.lic                  ← license
Download\transition\<UUID>\<epoch_ms>\<UUID>\cover.webp|.jpg
```

Example metadata (`0D4E05B5-…json`, read verbatim):
```json
{"素材名称":"从左到右-叠化","UUID":"0D4E05B5-A3E3-4C10-A081-58A920B45A15","素材类型":"转场/叠化","素材大小":"80KB","最低支持SDK版本":"2.13.0"}
```
(`素材名称`=asset name, `素材类型`=type, `素材大小`=size, `最低支持SDK版本`=min SDK version.)

`.insproj` reference shape — an entry in the clip's `transitions` array (real entry from `mcpAcceptance.insproj`):

```json
{
    "defaultFrames": 14,
    "frames": 60,
    "id": "4db93c6b-1904-4ecb-bc92-ea16c7191cbf",
    "maximumFrames": 60,
    "minimumFrames": 6,
    "name": "",
    "nextClip": "2f242419-d096-4a83-8b48-31d740a7be51",
    "path": "D:/Dokumente/Insta360/Studio/Download/transition/B9AE47D4-71E3-41F5-A5AA-E605AD3EF092/1794456470000/B9AE47D4-71E3-41F5-A5AA-E605AD3EF092/B9AE47D4-71E3-41F5-A5AA-E605AD3EF092.2.videotransition",
    "prevClip": "3eaa5081-9bd9-431a-b9d8-d5abf57ee119",
    "resourceId": "B9AE47D4-71E3-41F5-A5AA-E605AD3EF092",
    "state": 0,
    "type": 2
}
```

`id`/`prevClip`/`nextClip` are per-instance clip UUIDs; `resourceId` is the asset UUID and `path` points
straight at the `.videotransition` payload. 134 entries in `transition_resource_manifest.json` map
UUID → version/timestamp.

### 2.3 Effects / video FX (`effect\`)

Layout:

```
Download\effect\<UUID>\<hash-or-epoch>\resource\<UUID>\<UUID>.videofx      ← NVAP container
Download\effect\<UUID>\<hash-or-epoch>\resource\<UUID>\<UUID>.lic
Download\effect\<UUID>\<hash-or-epoch>\<UUID>.effect_package_ready
Download\effect\<UUID>\<hash-or-epoch>\cover.webp
```

The middle segment is sometimes a numeric timestamp (`1785384012000`) and sometimes a SHA-256
(`6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b`).

`.insproj` reference: **no dedicated effect field was found.** The only effect-related keys present in the
project corpus are `effect_filter` (filter LUTs, §2.1) and `enableEffects` (boolean, 15 occurrences). An
applied video-effect is not recorded in the `*.insproj` files inspected — see §4.

### 2.4 Text presets (`text\`)

Layout:

```
Download\text\<UUID>\<epoch_ms>\<UUID>.webp
```

Only thumbnails exist (94 `.webp` across 93 folders) — no effect/payload file is downloaded for text presets.
Catalog: `text_resource_manifest.json`, 93 entries `UUID → epoch_ms`.

`.insproj` reference: **none found** — no text-preset key appears in any `*.insproj`.

### 2.5 Stickers (`sticker\`)

Layout:

```
Download\sticker\<UUID>\<epoch_ms-or-hash>\cover.png
Download\sticker\<UUID>\<epoch_ms-or-hash>\mini_cover.png
```
(1091 `.png` + 326 `.webp` across 710 folders.) Only cover art is present locally; the animated content is
supplied by the `stickeranimation` NVAP containers in the install (§3).

Catalog: `sticker_resource_manifest.json` → `versions` dict of 710 UUIDs.

`.insproj` reference: **none found.**

### 2.6 Movement presets (`movement\`)

Layout for a fully-downloaded preset (e.g. `surrounding-normal`):

```
Download\movement\surrounding-normal\surrounding-normal.name        → "360 Left"
Download\movement\surrounding-normal\surrounding-normal.duration    → "8000"   (ms)
Download\movement\surrounding-normal\<epoch_ms>\surrounding-normal.json  → binary keyframe blob
Download\movement\surrounding-normal\cover.webp
```

The `.json` is **not** JSON: `movement/asteroid-south_pole/1775051034000/asteroid-south_pole.json`
(1,529 bytes) begins `85 f5 2a c8 92 91 46 13 d3 f8 8f 53 6c e6 38 5a` — an opaque/compressed binary
keyframe payload.

Catalog: `movement_resource_manifest.json` (31 names, e.g. `XXX_ZZF → 1776666007000`);
`downloaded_pano.json` timestamps list the 14 downloaded ones. `.insproj` has `camera_movement` /
`camera_movement_models` blocks, but no preset file path was found in them — see §4.

### 2.7 Audio / music (`audio\`)

Layout:

```
Download\audio\<numericId>\<epoch_ms>\<numericId>.mp3    ← audio track
Download\audio\<numericId>\<epoch_ms>\<numericId>.png    ← cover
Download\audio\<numericId>\<epoch_ms>\<numericId>.json   ← waveform
```

The `.json` is a flat array of amplitude values (0.0–1.0), e.g. `210013743.json` starts
`[4.3E-5,1.29E-4,2.57E-4,8.6E-5,...]` — a pre-computed waveform for the timeline UI, not asset metadata.
Catalog: `online_music_resource_manifest.json` (3237 tracks) and `persistent_music.json` (the 6 local ones).
`.insproj` reference: **none found.**

---

## 3. NVAP containers

**Container format:** file magic `NVAP`; wraps a ZIP whose *data region* is XOR-0xFF (byte-inverted) while the
central directory and EOCD stay plaintext. Parser: `research/nvap_extract.py` (read-only use; not modified).
`nvap_extract.py --write` → `research/nvap/`; `nvap_selftest.py` and `nvap_verify.py` both exit 0.

### 3.1 Counts

| Location | NVAP files | By container type |
|---|---:|---|
| Studio install `ROOT` | **44** | 22 × `.compoundcaption` (filters, per camera model) + 22 × sticker animation (8 `in`, 8 `out`, 6 `period`) |
| Download library | **71** | 63 × `.videofx` (effects) + 8 × `.videotransition` (transitions) |
| **Total** | **115** | |

**All unpack.** The 44 under `ROOT` extract to **254 files** (`research/nvap/`): 206 `.xml`, 30 `.json`,
18 `.png`. The 63 `.videofx` and 8 `.videotransition` unpack with the same parser (entries listed below).

Extraction is flattened to `<UUID>__<originalname>` inside the preserved `Resources/...` subtree, e.g.
`nvap/Resources/filters/Ace/2FD76DB7-…/2FD76DB7-…__caption0_9v16.xml`.

Per-subtree extracted counts (measured):

| Subtree | `.xml` | `.json` | `.png` |
|---|---:|---:|---:|
| `Resources/filters/` | 117 | 8 | 2 |
| `Resources/stickeranimation/in/` | 28 | 8 | 5 |
| `Resources/stickeranimation/out/` | 28 | 8 | 5 |
| `Resources/stickeranimation/period/` | 33 | 6 | 6 |

### 3.2 What the unpacked files are

* **Filter `.compoundcaption`** — per-aspect-ratio storyboard XML (`caption0_9v16`, `_9v21`, `_1v1`(3v4/4v3/21v9 …))
  describing a **text + image caption overlay** (the device/watermark label a camera filter draws). It is a
  `<storyboard>` with a `<trackGroup>` holding:
  * a `<textTrack source="placeholder">` with font/outline styling (`fontFamily="LG1052 [LG1052]"`,
    `outlineColor`, `alignX/Y`, `scaleX/Y`, `transX/Y`, `opacity`) and a `<complexRender>` of
    `outline`/`body` layers with blur/colour, and
  * a `<track source="076601cb6e35560ba5bc214329a8a723.png">` — an **embedded PNG** (this is why 18 PNGs
    appear; the same hash-named PNG is referenced by filename inside the XML).
* **`info.json`** — per-asset metadata: `uuid`, `name`, `version`, `minSdkVersion`, `supportedAspectRatio`
  (pipe-separated, e.g. `"16v9|9v16|1v1|4v3|3v4|9v18|18v9|9v21|21v9"`), `is3D`, `noBackground`,
  `refDuration`, and a `translation[]` array (`originalText` / `targetLanguage` / `targetText`).
* **`cover.jpg` / `.png`** — preview images.

### 3.3 Sticker / effect animation XML format (keyframes)

Both use `<effect name="transform"><animation paramName="…"><key time="…" value="…"/></animation></effect>`.
`time` is in milliseconds, `value` is the animated scalar. What the keyframes describe:

* **`period`** (loop) — e.g. `39746F33-…__animation9v16.xml`:
  ```xml
  <effect name="transform">
   <animation wrapMode="repeat" paramName="rotationZ">
    <key time="0" value="0"/>
    <key time="800" value="-360"/>
   </animation>
  </effect>
  ```
  → a continuous **rotation** from 0° to −360° over 800 ms, looping (`wrapMode="repeat"`).
  `info.json`: `name = "贴纸组合动画_旋转"` ("sticker combo animation_rotate"), `refDuration = 800`.
* **`in`** (entrance) — `098C9311-…__in-animation.xml`:
  ```xml
  <effect name="transform">
   <animation paramName="opacity">
    <key time="0" value="0"/>
    <key time="480" value="1"/>
   </animation>
  </effect>
  ```
  → **fade-in** opacity 0→1 over 480 ms. `info.json`: `"贴纸入动画_渐显"` (fade-in), `refDuration = 500`.
* **`out`** (exit) — same structure, `animatedstickeroutanimation` (`_out-animation.xml`).

So the keyframes are **transform-property tracks** (`rotationZ`, `opacity`, and by the same schema
`scaleX/Y`, `transX/Y`) that the engine evaluates over the clip duration, with `wrapMode` controlling whether
the track loops (`period`) or plays once (`in`/`out`).

**Effect (`videofx`) payloads** instead use `<effect name="vignette|glow">` with `<param name=… value=…>`
and constant `clipDuration="86400000"` (i.e. apply for the whole clip) — no keyframes. Example
`01BE6D35-….videofx` → `fx9v16.xml`:
```xml
<storyboard sceneWidth="720" sceneHeight="1280">
 <track clipStart="0" source=":1" clipDuration="86400000">
  <effect name="vignette"><param name="degree" value="0.6"/><param name="maxAlpha" value="0.76"/></effect>
  <effect name="glow"><param name="intensity" value="0.28"/><param name="thresh" value="0.82"/>
   <param name="radius" value="35"/><param name="blendingMode" value="screen"/><param name="glowColorMode" value="custom"/></effect>
 </track>
</storyboard>
```
Its `info.json` is `{"name":"11","uuid":"01BE6D35-…","version":1,"minSdkVersion":"3.10.1","noBackground":true,"supportedAspectRatio":"16v9|9v16",…}`.

**Transition (`videotransition`) payloads** contain `info.json` + `wipemask*.xml` per aspect ratio
(`wipemask.xml`, `wipemask1v1.xml`, `wipemask4v3.xml`, `wipemask9v16.xml`, `wipemask9v21.xml`,
`wipemask18v9.xml`, `wipemask21v9.xml`). Each mask XML is a `<storyboard sceneWidth/Height>` with a
`<track source="1v1.caf" clipStart="0" clipDuration="5000">` — i.e. a 5-second mask clip referenced by a
`.caf` file that is **not** present inside the container (see §4).

---

## 4. Not determined / caveats

* **Effect, text, sticker, movement and audio `.insproj` reference shapes are not observable here.**
  The project corpus only ever references filters (`externfilterResourcePath` + `externfilterId`) and
  transitions (`path` + `resourceId`). Every `effect_filter` in the set is either empty (`""`) or a filter LUT;
  there is no sticker/text/movement/audio resource-path key at all, and `camera_movement` blocks contain only
  numeric params (`distance`, `fov`, `pitch_offset`, empty `camera_movement_models`). The on-disk shapes for
  those five types are documented from the asset library and manifests, not from live project usage.
* **Transition mask media missing.** `wipemask*.xml` points at `1v1.caf`, which is not inside the
  `.videotransition` NVAP (only XML + `info.json` + cover were extracted). Whether the mask is generated by the
  engine or fetched from a separate archive is unknown.
* **Movement `.json` is opaque.** Header `85 f5 2a c8 …` matches neither zlib nor gzip; it is treated as an
  unparsed binary keyframe blob — its schema was not decoded.
* **Filter count nuance.** 206 catalog filters vs 4 downloaded LUTs; only 4 `.cube.binary` files exist on disk.
  It is not established whether the remaining 202 are lazily downloaded on first use or supplied by the install.
* **`_FFB58D0A-…` / `._*` files** in `transition\` and `effect\` are macOS AppleDouble resource forks, not
  assets; they inflate naive extension counts (e.g. `.videofx` 97 raw → 63 real).
* **Compatibility of the 44 `ROOT` NVAPs** with the Download-library parser was verified by successful
  extraction; no per-file failure list exists, so "all 44 unpack" rests on the tool's exit status plus the
  presence of complete extracted trees, not on an itemised pass/fail log.