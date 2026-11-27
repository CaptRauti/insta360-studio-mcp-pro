# The Media-page project file (`.insprj`)

Insta360 Studio has **two** project files, and they are not the same thing:

| page | file | edited by |
|---|---|---|
| Project page (timeline) | `<name>.insproj` | this server's `src/project.mjs` — see `docs/INSPROJ_SCHEMA.md` |
| Media page (single clip) | `.insprj` | `src/insprj.mjs` — the subject of this document |

The Media page edits **one** media file and keeps its own project beside it. Everything that belongs
to no `.insproj` lives here: per-clip manual colour, denoise, motion blur, watermark, the
Stats/Dashboard template, audio, stitching, and the speed (TimeShift) track. That is why the reader
comes before those writers — a writer has to find this file first.

Tool: **`studio_media_read`** (read-only). Module: `src/insprj.mjs`. Tests: `tests/insprj.test.mjs`.

## Where the files are, and how they are found

The roots come from `startup.ini` (`src/prefs.mjs`): `footage_project_location` and
`project_location`, walked as `<root>/<hash>/<file>.insprj`.

```
FootageProject/52434dd0f4c7a158e8e34a1b96a1db57/footage_project.insprj   <- Studio 6.x, JSON
Project/3cc9e7310a8d75d2a043918a0d728407/.insprj                        <- Studio 5.x, XML
Project/f82817215ace2a9e8b74c8053b718552/IMG_20240916_164919_00_001.jpg.insprj
```

**The directory is `md5(media path)`** — measured over this machine's corpus
(`node research/insprj_lookup.mjs`):

| corpus | rule | result |
|---|---|---|
| 920 JSON files (6.x) | `md5(id)`, forward slashes, original case | **920/920** |
| 417 XML files (5.x) | `md5(cloud_media_id)` | 10/371 |
| 417 XML files (5.x) | `md5(folder + "/" + <file name>)` | 46/406 |

So for a Studio 6 file the lookup is exact and O(1). For a Studio 5 file it is **not** — the rest of
those directories are md5 of a string that is still unresolved (`meta_cache.json` holds only
`{"camera_accessory":0,"version":1}`, so it is not the source), and the reader falls back to a file
name or content match. Every candidate therefore reports **how** it matched:

```js
findMediaProjects({ media }) // -> { ok, hash, hashMatched, matches: [{ path, family, match }] }
                             //    match: "hash" (certain) | "name" | "content" (possible)
```

`family` is derived from the path: `footage` (`FootageProject/…`), `media`
(`Project/<hash>/<medianame>.insprj`), `bare` (`Project/<hash>/.insprj`).

## Encoding

The extension is the same for both eras, so the encoding is read from the content:

| version | encoding | signature |
|---|---|---|
| Studio 6.x | JSON | first non-space char `{` |
| Studio 5.x | XML | `<?xml` or `<project` |

## JSON schema (Studio 6.x)

```jsonc
{
  "id": "F:/X6/Camera01/VID_20261116_221835_00_089.mp4",  // the media path == md5 source
  "selectedId": "<uuid>",
  "projects": [ { "id": "<uuid>", "name": "...", "createTime": …, "modifiedTime": …,
                  "roughcut": {…}, "clip": { … } } ]
}
```

`clip` is where the settings are. Measured inventory (`node research/insprj_inventory.mjs`) over 920
clips; the reader groups the fields as follows (the file's own names are kept underneath).

### Trim and frames

| field | present | note |
|---|---|---|
| `leftTrim`, `rightTrim`, `startFrame`, `source_left_trim`, `source_right_trim` | 920/920 | **all 0** in the whole corpus — no trimmed clip exists here |
| `sourceFrames`, `source_total_frames` | 920/920 | equal in every specimen (298 distinct values) |
| `roughTrimmed`, `lastTrimEditTime` | 920/920 | always `false` / `0` |
| `fps` | 920/920 | 29.97, 30, 59.94, 50 |

### Framing

`ratio` (8/3/4/5), `dewarp_setting`, `aspect_ratio_info`, `camera_transform`,
`inAsteroidMode`, `userRotateDegree`, `baseViewAutoApplied`.

### Colour (`clip.media_process`) — edited clips do exist

This is the group an earlier note wrongly called "no specimen anywhere": the *project-page* clips
have none, the Media-page files do.

| field | distinct values | range / specimens |
|---|---|---|
| `enableColorAdjust` | 2 | false, **true** |
| `colorAdjustExposure` | 7 | 0, 23, +100, −10 |
| `colorAdjustContrast` | 6 | 0, −48, −88, 7 |
| `colorAdjustWarmth` | 3 | 0, −93, −100 |
| `colorAdjustSaturation` | 4 | 0, 100, −37, 5 |
| `colorAdjustShadows` / `Highlights` | 5 / 3 | 84, −19, 34 / −55, 100 |
| `colorAdjustVibrance` / `Definition` | 4 / 5 | −21, −41, −88 / 100, 48, 8 |
| `colorAdjustTint` / `Brightness` / `Blackpoint` | 3 / 6 / 5 | 3, 39 / −100, −43 / −43, −28 |
| `colorAdjustCommonMin` / `Max` | 1 / 1 | −100 / 100 → the sliders' bounds |
| `enableColorPlus`, `colorPlusStrength` | 2 / 1 | `colorPlusStrength` 30, bounds 0…100 |

Other switches in the same block: `enableAe`, `enableLut`, `enableSingleDenoise`,
`enableMultiFrameDenoise`, `enablePureShot`, `enableMotionBlur`, `enableBeautyMode`,
`enableLocalToneMapping`, `enableHorizontalCorrect`, `enableUnderWaterCorrect`, `enableTimeLogo` —
each with a matching `support…` flag that says whether the *media* can do it at all.

Measured states: denoise (`enableSingleDenoise`, `enableMultiFrameDenoise`) and motion blur
(`enableMotionBlur`, `enableMotionBlurEdited`, `motionBlurStrength` 50, `motionBlurThreshold` 85) have
**both** values here; `enableLut`, `enablePureShot`, `enableUnderWaterCorrect`, `enableTimeLogo`,
`enableHorizontalCorrect` are only ever `false` — no specimen for their on-state, so a writer for
those four has nothing to compare against. `enableLocalToneMapping` (strength 30) and `enableAe` have
both.

### Watermark

| field | distinct | values |
|---|---|---|
| `enableFlatLogoWatermark` | 2 | false **and true** |
| `selectedLogoWatermarkPath` | 3 | `""`, `D:/…/Download/watermark/app/active/69/resource/insta360-X6.png`, `:resource/default_logo_0` |
| `flatLogoWatermarkTransparency` | 2 | 100, 26 |
| `logoWatermarkLocationType` | 2 | 0, 1 |
| `clipAspectRatio` | 5 | 8, 0, 3, 4 |

Two traps: the resource path is **configured even when the watermark is off**, so its presence says
nothing about the toggle; and the path points into Studio's *download* folder, so it is only valid on
a machine that has that asset. Separate top-level blocks `logo_watermark` and `time_watermark` hold
the other two watermark kinds.

### Stats / Dashboard

`clip.dashboard_setting` (present on 300/920 — the X-series clips), `enableDashboard` always `true`
when present, `supportDashboard` both, `dashboardSourceType` in {`TypeNoneData`, `TypeMeta`}, and

```
dashboardStyle = ""            // 1 of 2 distinct values
dashboardStyle = '{"enableItems":[…],"measureUnit":"metric","positions":{…}}'
```

`dashboardStyle` is **a JSON document stored in a string**; the reader parses it into
`dashboard.styleParsed` so a caller does not have to parse twice.

### Speed / TimeShift

```
play_rate_track.play_rate_model_list = [ { startTime, endTime, minPlayRate, maxPlayRate, name } ]
```
Present on only **3/920** clips — rare, which is why the fixture keeps one. In that specimen
`{ start: 0, end: 8184, min: 4, max: 4 }` against `sourceFrames: 2046`, i.e. `end = sourceFrames ×
rate`: **`endTime` is not a timeline length**, and its actual timebase is unresolved. Do not write
this field until it is measured.

### Audio

`clip.audio_setting` (306/920). `currentVolume` is 100 everywhere; `currentFadeIn`/`Out` 0;
`maxFadeIn`/`maxFadeOut` have 54 distinct values (clip-duration dependent, up to 300);
`currentMixingWeight` 50, `enableMixing` both, `supportMixing` false.

**Sentinel:** `currentTracksDelay` / `defaultTracksDelay` read `-2147483648` (INT32_MIN) — that is
"not set", not a delay of −2.1 billion.

## XML schema (Studio 5.x)

```xml
<project version="2.0.0">
  <meta app="Insta360 Studio 5.3.3" version="5.3.3" creation_time="1726829876"/>
  <file_group type="photo_normal" folder="" count="1"
              cloud_media_id="D:/DCIM/Camera01/IMG_20240916_164919_00_001.jpg">
    <file name="IMG_20240916_164919_00_001.jpg"/>
  </file_group>
  <schemes default="project file1">
    <scheme id="project file1" creation="…" last_edit_time="…" has_keyframe_user_added="0" …>
      <preference ratio_width="16" ratio_height="9" trim_start="0" trim_end="15000" duration="15000">
        <rendering fov="1.309" dewarp="15" projection="64" …/>   <!-- note: INSIDE preference -->
        <audio volume="0.5" denoise_type="…"/>                    <!-- also inside preference -->
      </preference>
      <timeline …/><dashboard_setting …/><pano_animation …/>
    </scheme>
  </schemes>
</project>
```

834 schemes across 417 files. `scheme@id` is a user-visible name — the corpus contains `Projekt1`,
`backup`, `project file1` — and `creation`/`last_edit_time` are `YYYY.MM.DD HH:MM:SS[.ms]` strings.

**No equivalence to the JSON names is claimed.** The reader puts this side under `legacy` with its own
names and states the measured differences in `translationNotes`:

| XML | JSON | measured difference |
|---|---|---|
| `preference.trim_start/_end` | `leftTrim`/`rightTrim` | milliseconds vs **frames** (0…15000 vs duration 15000 on a photo; 0…1799130 on a 30-min video) |
| `preference.audio.volume` | `audio.currentVolume` | **0.5 vs 100** — different scale |
| `preference.logo.enable_logo` / `selected_logo` | `logo_watermark.enableLogoWatermark` / `selectedLogoWatermarkPath` | different names |
| `preference.rendering.play_rate` | `play_rate_track` | nested inside `rendering`, not clip level |
| `preference.optimization.stitching` / `calibration` | `stitching_optimization` / `stitching_setting` | position matches, names differ |
| `scheme@dashboard_setting` | `dashboard_setting` | the **one** name that agrees |

## Writing: Studio's own layout, reproduced

The writer (`studio_media_write`, `src/insprj-write.mjs`) rewrites the whole file, as Studio does — so
the one thing it must not do is *re-render* it. Measured over all 920 Studio-6 files on this machine
(`research/insprj_format.mjs`):

| Property | Value | Note |
|---|---|---|
| indent | **4 spaces** | 2-space and tab reproduce **zero** files |
| `JSON.stringify` round trip | **0/920** | no indent value reproduces a single file — indentation is not the difference |
| empty array / object | **exploded** | Studio writes `"a": [\n    ]`, never `[]`; this alone accounted for the whole delta on the first specimen |
| exponent | **two digits** | `8.149072527885437e-09` on disk, `…e-9` from JS — this was the last file of the 920 to fall in line |
| trailing newline | yes | |
| line endings | LF | no CRLF in the corpus |

`serialiseStudioJson` in `src/insprj-serialise.mjs` encodes exactly those rules and is a **byte-identity
on 920/920**. That is what makes the write surgical: changing `colorAdjustExposure` 23 → 40 moves
**one line** of a 327-line file (verified live, `research/media_write_probe.mjs`), the way a hand edit
would.

The writer's rules, each because the alternative is a lie about what happened:

- **Refuse, do not clamp.** A value outside the field's own `…Min`/`…Max` is an error naming the
  bounds. Silently clamping is how a caller's intent becomes a different edit.
- **A support flag that says no is Studio's own answer.** Enabling `enableLut` where `supportLut` is
  `false` (or `enableMixing`/`supportMixing`) is refused with that reason rather than written.
- **Mutate existing keys only.** A key this clip does not carry is refused unless `allowNew`, because
  there is no specimen for "Studio reads a key we invented".
- **One refusal refuses the whole request** — nothing is written, so a typo cannot half-apply an edit.
- **XML-era files are refused by name.** Their element names and scales do not map onto these fields,
  so a write there would be invention.
- **A layout that is not the measured one is refused unless `force`**, because rewriting it would
  reformat every field. The gate is `detectStudioFormat`, not an assumption.
- **Studio running ⇒ refuse unless `force`.** Studio keeps the file in memory and rewrites it on exit;
  verified live (the guard answered with the running pid, `research/media_write_probe.mjs`).
- A `.bak` copy is kept beside the file, and the reply reports `changed` against `unchanged`.

Still **not** writable, and named as such in `NOT_WRITABLE`: the speed (TimeShift) track and the
trims — see the open questions.

## What this reader is not

- **The XML side is reported, not translated.** Treating those numbers as JSON values is a bug.
- **No frame arithmetic.** `sourceFrames`/`source_total_frames` and the play-rate timebase are
  unverified; see the two open questions below — which is why the writer refuses those fields rather
  than guessing at them.

### Open questions (do not implement around them, measure them)

1. `play_rate_model_list[].endTime` — what timebase? (`end` 8184 vs `sourceFrames` 2046 at rate 4.)
   This is the one measurement standing between a caller and the speed effect.
2. XML-era directory hash — md5 of what, for the 90 % of files where neither tested string fits?
3. `dashboardStyle` — only 2 distinct values here (empty and one template); the inner schema is
   unpacked enough to read `enableItems`/`measureUnit`/`positions` but not enough to author a template.
4. `currentTracksDelay` INT32_MIN — confirm the sentinel by setting a delay in the UI and re-reading.
5. Trims — no trimmed clip exists in the corpus (all 0), so a trim write has no specimen; it also
   moves the frame arithmetic every later read depends on.

## Re-measuring and testing

```bash
node research/insprj_lookup.mjs       # the md5 lookup rule, with match counts
node research/insprj_inventory.mjs    # the field inventory behind the tables above
node research/insprj_format.mjs       # the writing format: indent, empty containers, exponents, byte-identity per file
npm run fixtures:insprj               # rebuild the fixtures from this machine's real files
node --test tests/insprj.test.mjs     # 14 tests, the reader
node --test tests/insprj-write.test.mjs   # 24 tests, the writer
node tests/media-read-probe.mjs       # live: starts the MCP server and calls the reader
node research/media_write_probe.mjs   # live: dry run, the Studio-running gate, a real write, then the restore
```

The fixtures (`tests/fixtures/media-project-*.insprj`) are Studio's own files, trimmed to one item and
written back in **Studio's own layout** (`serialiseStudioJson`, not a pretty-print of our choosing) —
which is what lets the writer's round-trip test assert a byte-identity rather than a resemblance. A
parser test therefore fails when the app's format changes, not when a hand-written sample drifts.
