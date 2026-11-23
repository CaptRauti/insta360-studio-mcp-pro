# Insta360 Studio MCP Pro

An MCP server for **Insta360 Studio** (Windows) that goes past screenshot clicking: it reads and edits `.insproj` project files as JSON, talks to Studio's own gRPC helper services, and drives the real GUI export dialog when the API won't cooperate.

Built and tested against **Insta360 Studio 6.0.8 and 6.0.9** on Windows 11. The install directory is resolved at runtime, because 6.0.9 moved it (see [Install path](#install-path)).

---

## Why this exists

The only other Insta360 Studio MCP server does UI automation and nothing else. Studio actually ships more than that:

| Surface | What it is | Status |
|---|---|---|
| `.insproj` projects | Plain JSON — tracks, clips, transforms, stitching | **works, fully read/write** |
| `studio-thumbnail-service.exe` | gRPC on a dynamic port: thumbnails + scene detection | **works, verified** |
| `studio-exporter-service.exe` | gRPC on a dynamic port: export/stitching | **works for photo/image types; video types fail regardless of UI state** |
| The GUI export dialog | Qt canvas | **works — the path for video, and for anything needing the loaded project** |

The gRPC exporter was long written off as "accepts jobs, never writes a file". That
verdict was wrong, and the reason is instructive: the test scripts passed the whole
object returned by `discoverExporter()` (`{pid, port, ports}`) as the port, so every
call died with `Invalid URL` before it reached the service. With `port` unwrapped,
`StartExporting` does exactly what it says. A single call with
`exportType = JPG_SEQUENCE` and the source named in
`LocalImageExportParam.sourceGroup.sourceFile` writes a real 7680×4320 JPEG —
verified on disk, not inferred from a status code.

What is genuinely true: `ExportParams` carries **no media path for video**. Its
`LocalVideoExportParam` has only a `clipIndex`, and `CloudExportData` is the project
model (render settings, no file). The one source-file field in the whole request is
`SourceGroup.sourceFile`, and it hangs off `LocalImageExportParam`. So photo and
image export types can be driven from a cold start, while `VIDEO` and `VIDEO_CLIP`
answer `EXPORTER_START_FAILURE`. That was tested three ways — cold start, a clip loaded
in the player, and a project opened in the app — and it fails identically each time, so
the exporter resolves footage from its own internal project state rather than from
anything the UI or an `.insproj` hands it.

---

## Tools

### GUI automation (the export path that works)

| Tool | What it does |
|---|---|
| `studio_ui_state` | Screenshot the window and report what's on screen: dialog open/closed, accent-coloured button positions, whether the player actually has content |
| `studio_ui_capture` | Save a screenshot |
| `studio_ui_export` | Full GUI export: click the toolbar export button, click the dialog's export button, wait for the file to stop growing |
| `studio_ui_wait_export` | Wait for a specific export to finish |
| `studio_ui_open_media` | Open a `.insv` / `.mp4` / `.insproj` in Studio |
| `studio_ui_send_keys` | Send a SendKeys chord to the window |
| `studio_ui_analyze_shot` | Analyse an existing screenshot for buttons and player content |
| `studio_ui_ocr` | Read the text on screen (Windows OCR) with window-relative boxes |
| `studio_ui_click_text` | Find on-screen text by name and click it |
| `studio_ui_export_settings` | Read the export dialog's settings — path, preset, resolution, frame rate, bitrate, codec, colour space — with the click coordinates of every control |
| `studio_ui_export_set` | Change one of those settings by picking an option, then read the field back to prove it took |

### Projects (`.insproj` JSON)

| Tool | What it does |
|---|---|
| `studio_list_projects` | Find projects under the Studio project root |
| `studio_project_read` | Read a project, summarised |
| `studio_project_sources` | List the media a project references |
| `studio_clip_transform` | Read a clip's transform |
| `studio_clip_set_transform` | Write a clip's transform |
| `studio_clip_trim` | Change a clip's in/out points |
| `studio_clip_repoint` | Point a clip at a different source file |

### gRPC services

| Tool | What it does |
|---|---|
| `studio_status` | Are Studio and its helper services running, on which ports |
| `studio_api_services` | Which gRPC services/methods this server knows |
| `studio_export` | Start an export via the Exporter2 gRPC service |
| `studio_export_cancel` | Cancel a gRPC export |
| `studio_export_heartbeat` | Keep-alive for the gRPC exporter |
| `studio_thumbnail_request` | Render a thumbnail via gRPC |
| `studio_thumbnail_remove` | Remove a cached thumbnail |
| `studio_thumbnail_heartbeat` | Keep-alive for the thumbnail service |
| `studio_install_info` | Inspect the install directory |
| `studio_camera_caps` | Which FOV types, modes, aspects and reframe angles a camera allows — from the FOV/distance tables inside Studio's Qt resources |

### Camera capability data

`studio_camera_caps` is backed by `src/data/camera_matrix.json`, built from the
FOV/distance tables in `Resources/resource.rcc` (see
`research/APPS_AND_ASSETS.md`). It covers **17 cameras, 17 FOV types and 415
angle rules**, each with the default/min/max FOV angle and distance bounds the
Studio UI enforces:

```
studio_camera_caps { camera: "X6", fov: "Dewarp", videoPhoto: "Video",
                     mode: "Sphere", aspect: "16:9", angle: 120 }
-> { valid: true, rule: { defaultFov: 100, minFov: 20, maxFov: 150, ... } }
```

Use it before setting a clip transform so you don't hand Studio a value it
would silently clamp.

---

## How the GUI export works (and why it's not just clicking)

Studio's Qt canvas exposes **no** UI Automation tree — `uia.ps1` returns nothing, and that's expected, not a bug. So the server drives the GUI deterministically instead of guessing coordinates:

1. **Find the window** and normalise its rect (`win32.ps1`).
2. **Screenshot with `PrintWindow`**, not BitBlt — so it works while the window is occluded or behind another app.
3. **Decode the PNG in pure JS** (`src/png.mjs`, zlib only, no dependencies) and find Studio's primary action colour (`#FFD200`) by pixel mask. Connected components give the button's bounding box.
4. **Click by window-relative coordinates**, so the same code works at any window position.
5. **Watch the output folder** until a new file stops growing **and** passes a minimum size, then report its path and size. The size guard matters: Studio creates the output as a stub of a few dozen bytes while the encoder starts, so a file that merely stops changing for a few seconds is not proof the export finished. Without the guard you get a confident "done" and a 44-byte MP4 with no `moov` atom.

No hardcoded coordinates and no vision model. `studio_ui_state` also reports whether the player has content, using a variance test on the player region — that's how you tell "no video loaded" from "video loaded" without a screenshot in your face.

### Reading the UI instead of guessing at it

Colour detection finds the accent-coloured button. It cannot tell you that a dialog offers "Auflösung", "Bitrate" or "Abbrechen", and it cannot find a control that is not accent-coloured. So the server also OCRs the screenshot with the engine built into Windows (`Windows.Media.Ocr`, via `src/ocr.ps1`): no API key, no network, no extra install, German and English recognisers included.

| Tool | What it does |
|---|---|
| `studio_ui_ocr` | Screenshot the window (or read an existing `.png`) and return the text with window-relative boxes |
| `studio_ui_click_text` | Find text by name and click it — e.g. `"Exportieren"` — so the click lands wherever that control currently sits |

Matching is case-insensitive substring, which matters because OCR mangles small text (`Menü` comes back as `Menÿ`); asking for `Export` still hits `Exportieren`.

`ocr.ps1` forces `[Console]::OutputEncoding` to UTF-8. PowerShell otherwise writes stdout in the OEM code page (`ibm850` here), and any character outside it is best-fit mapped to an ASCII lookalike — a curly quote read off the UI becomes a bare `"`, which lands unescaped in the JSON and breaks the string. The symptom is every call failing with `unparsable OCR output` the moment the UI contains a typographic quote or a CJK caption.

Live, against Studio 6.0.9:

```
studio_ui_ocr {}
  -> 94 lines / 400 words, lang de-DE, image 2576x1408
studio_ui_click_text { text: "Bearbeiten" }
  -> matched word "Bearbeiten", click (1495, 1357)
```

### Driving the export dialog's settings

The dialog's controls are **CEF/HTML**, not native widgets: they are absent from the UI Automation tree, and the page is not reachable over a debug port (Studio's `libcef.dll` ignores `--remote-debugging-port`). So its settings are read and set by OCR and clicks — which only works with three measured facts, because the plausible shortcut gives the wrong answer:

1. **The list boxes toggle.** One click opens, the next closes. Never assume a click opened a list.
2. **An opened list paints a lighter panel** over the dialog beneath it. That is how the server knows a list is open at all: the mean gray of the changed region goes from ~30 to ~48. OCR is only used for the option text, never to decide open or closed.
3. **Everything is measured, not hardcoded.** The server diffs the frames either side of its own click to obtain the list's rectangle (measured `x 566, width 340, top = label y + 2` on a 1384×900 window), so the same code works for every control even though the resolution list is 171 px tall where the codec list is 160.

Four traps, each of which had to be fixed before a click landed on the intended option:

- **Full-window OCR misreads the small option rows.** `H.265` came back as `4265`, and the row was placed ~40 px off its true position — enough to click the wrong entry. Option text and coordinates therefore always come from a 4× upscaled crop of the measured rectangle.
- **The row holding the current value draws a marker** ~20 px left of the text column, which OCR reads as a stray token and prepends (`s/ H.265`). Rows are re-aligned to the column they all share.
- **The popup scrolls the current selection to its top edge**, clipping that row's glyphs — `Benutzerdefiniert` arrives as `utzeraetlmert`. Such a fragment is dropped; the full entry is listed again further down.
- **A control's value line sits only 2 px above the list's rectangle**, so the crop must carry no margin. With one, the field's own value shows up as a phantom first option.

Live, against Studio 6.0.9:

```
studio_ui_export_settings {}
  -> Pfad "C:/Users/stefa/Desktop", Voreinstellung "Benutzerdefiniert",
     Auflösung "1080P - 1920 x 1080", Rahmen "Quellbild-Framerate übernehmen",
     Bitrate "Empfohlen", Kodierung "H265", Farbraum "Rec.709"
studio_ui_export_settings { control: "Kodierung", listOptions: true }
  -> list box 566,594 340x178 (brightness 33 -> 51)
     options: H.264 | H.265 | ProRes 422 | ProRes 422LT
studio_ui_export_set { control: "Auflösung", value: "4K - 3840 x 2160" }
  -> picked "4K - 3840 x 2160": "Benutzerdefiniert" -> "4K -3840 x 2160", changed true
```

`studio_ui_export_set` reads the field back after clicking, so its reply states whether the value actually changed: a click that lands beside an option reports `changed: false` rather than passing for success.

---

## Install

```bash
git clone <this repo>
cd insta360-studio-mcp-pro
npm install
```

Requirements:

- **Node.js ≥ 20**
- **Windows** (the GUI layer is Win32/PowerShell)
- **Insta360 Studio** installed — the directory is found automatically (see [Install path](#install-path))
- **PowerShell** on PATH (ships with Windows)

No Python, no native modules, no build step.

### Register with an MCP client

```json
{
  "mcpServers": {
    "insta360-studio": {
      "command": "node",
      "args": ["C:\\path\\to\\insta360-studio-mcp-pro\\src\\server.mjs"]
    }
  }
}
```

Environment variables:

| Variable | Default | Meaning |
|---|---|---|
| `INSTA360_STUDIO_DIR` | auto-detected | Studio install directory; set it only to override detection |
| `INSTA360_PROJECT_ROOT` | `D:\Dokumente\Insta360\Studio` | Where projects live |
| `INSTA360_SHOT_DIR` | `%TEMP%\insta360-studio-mcp` | Where screenshots are written |

No `env` block is needed: the install directory is found automatically. Set `INSTA360_STUDIO_DIR` only to override it.

### Install path

Studio 6.0.9's launcher installs per-user and **moves** the application out of Program Files, leaving the old folder
behind empty:

| Version | Location |
|---|---|
| ≤ 6.0.8 | `C:\Program Files\Insta360 Studio\` |
| ≥ 6.0.9 | `%LOCALAPPDATA%\Insta360\Apps\Insta360 Studio\current\` |

So nothing here hardcodes it. `src/studio-path.mjs` resolves it in this order:

1. `INSTA360_STUDIO_DIR`, if set
2. the directory of a **running** `Insta360 Studio.exe` — always correct
3. `%LOCALAPPDATA%\Insta360\Apps\Insta360 Studio\current`
4. `C:\Program Files\Insta360 Studio` (the ≤ 6.0.8 layout)
5. `C:\Program Files (x86)\Insta360 Studio`

`studio_status` and `studio_install_info` report which one won, together with the resolved version and the layout kind,
so a wrong path shows up instead of failing silently. The research scripts use the same logic through
`research/studioroot.py`.

---

## Usage

Typical export flow, as an agent would do it:

```
studio_ui_state        → is a clip loaded? is a dialog already open?
studio_ui_open_media   → if the player is empty, load the file
studio_ui_export       → click through the dialog and wait for the file
```

`studio_ui_export` returns the finished file's path and size. It needs Studio running with a clip loaded — if the player is empty, Studio has nothing to export and the dialog never appears.

### Verified end-to-end

Export through `studio_ui_export` on Studio 6.0.8:

```
VID_20261112_051426_001.mp4   295,752,399 bytes
HEVC 3840×2160, 30.2 s, 78.4 Mbit/s, 905 frames
```

Export through the **gRPC service** on Studio 6.0.9, with no project loaded and no GUI interaction:

```
Nightsky Luna.jpg   18,266,497 bytes
JPEG 7680×4320, Insta360 Luna Ultra, v1.2.7
```

The same dialog path on Studio 6.0.9, exporting a 360° clip to a flat file:

```
VID_20260917_193416_00_002.mp4   98,349 bytes
HEVC 1920×1080 @ 50 fps, 1.82 s, 91 frames + AAC audio
source: VID_20260917_193416_00_002.insv — 3840×3840 360°, 1.813 s
```

The export is complete, not truncated: the 3840×3840 dual-fisheye source is 1.813 s, and stitching and reframing to 1920×1080 landed in the output. This is the path video has to take — see [Limitations](#limitations).

Reading and changing the dialog's settings (no hardcoded coordinates, each change read back from the UI):

```
studio_ui_export_set { control: "Kodierung", value: "ProRes 422 LT" }    -> H265 -> ProRes 422LT, changed
studio_ui_export_set { control: "Kodierung", value: "H.265" }            -> ProRes 422LT -> H265, changed
studio_ui_export_set { control: "Auflösung", value: "4K - 3840 x 2160" } -> Benutzerdefiniert -> 4K, changed
```

All of these were run and the outputs checked with `ffprobe` / `file` — the sizes, codecs and setting values above are read off the produced files and the live dialog.

---

## Tests

```bash
npm test                # wire format, .insproj, camera matrix, OCR, export request, dialog OCR helpers — 53 tests
npm run check           # syntax-check every module
npm run test:nvap       # NVAP extractor self-test (hybrid headers, 44/44 containers)
npm run probe           # live MCP handshake, tool list, gRPC port discovery
npm run probe:ui        # live GUI probe: window, screenshot, button detection
npm run probe:ocr       # live OCR probe: read the running window, look up controls by name
npm run probe:export    # SLOW: drives a real GUI export (minutes, writes a big file)
npm run probe:grpc-export   # live gRPC photo export, verified on disk (seconds)
npm run probe:grpc-types    # sweep every ExportType against one source
npm run probe:grpc-material # does ExportHeader.materialList carry the source?
npm run probe:ui-export-dialog  # open the export dialog and OCR it
npm run probe:ui-export-fields  # read the dialog's fields with coordinates
npm run probe:ui-export-video   # SLOW: GUI video export, then ffprobe the result
npm run probe:ui-export-settings  # read the dialog's settings, change one, read it back
```

`node tests/mcp-call.mjs <tool> '<json args>'` calls any tool on this server over stdio — handy for exercising the live ones without an MCP client.

`probe:export` is opt-in on purpose — it produces a real multi-hundred-MB file and takes minutes.

---

## What was learned about Studio's gRPC API

Kept here because it's hard to find anywhere else:

- Two helper services run as separate processes: `studio-exporter-service.exe` and `studio-thumbnail-service.exe`, each on a dynamically assigned localhost port, bound to the parent Studio PID with `--pid=` and `--enable_heartbeat`.
- gRPC reflection is **not** enabled (`UNIMPLEMENTED`).
- The protobuf descriptors are compiled into `studio_worker.dll` as plain-text `FileDescriptorProto` blobs — recoverable by scanning for the `.proto` name strings and walking the varint length prefix. `src/proto/export2.proto` is reconstructed from those.
- Measure a recovered descriptor by **round-tripping** it: parse, re-serialize, and require byte equality. A length that only looks plausible (a hand-rolled scan reported `ExportModule2.proto` as 12,675 bytes when the live blob is 219) silently merges neighbouring descriptors and invents field numbers. `research/protocat.py` does this properly.
- The live service is `service.Export2.Export2`, not `service.Export.Export` — the older descriptor in the same DLL is a decoy.
- `discoverExporter()` returns an object (`{pid, port, ports}`), not a port number. Passing it straight through yields `Invalid URL` from the gRPC layer, which looks like a protocol problem and is not one.
- `StartExporting` returns immediately with `stateCode 1` (`RUNNING`) and drives its loop off `SendHeartBeatPackage`, so a client must keep heartbeating while the work happens. Status codes seen: `0` OK, `1` running, `2` exporter start failure, `1026` no source file.
- **A working photo export over gRPC**, no project loaded, no GUI:

  ```js
  const { port } = await discoverExporter();
  const payload = buildExportParams({
    exportHeader: buildExportHeader({ taskId, exportName: "out.jpg", savePath: outDir }),
    localExtraParams: buildLocalExtraParams({
      exportType: EXPORT_TYPE.JPG_SEQUENCE,          // 5
      imageExportParam: buildLocalImageExportParam({
        sourceGroup: buildSourceGroup({ sourceFiles: ["C:/path/photo.jpg"] }),
      }),
    }),
  });
  await unaryCall({ port, path: "/service.Export2.Export2/StartExporting", payload });
  // then SendHeartBeatPackage in a loop until the file appears
  ```

  `npm run probe:grpc-export` runs exactly this and verifies the output on disk.
- `savePath` in `ExportHeader` is an **output directory**, not a file path. The exporter creates it and writes the file inside, named after the source unless `SourceGroup.dest_file_name` is set.
- The photo/image export types (`PHOTO` 0 through `DNG_SEQUENCE_DNG_WITH_JPG` 8, `DEMUX_TO_JPEG` 11) accept a source named directly. `VIDEO` (9) and `VIDEO_CLIP` (10) answer `EXPORTER_START_FAILURE` — tested cold, with a clip loaded in the player, and with a project open in Studio; all three the same. The request has no video path field, and the exporter resolves footage from internal project state that neither the UI nor an `.insproj` populates.
- The exporter dies if you fire a long burst of requests at it; it then needs Studio restarted to come back. Space the calls out.
- Most Studio logs are encrypted (a `bf08ac29` frame header plus a counter), but the CEF and detector logs in the same tree are plain text — check both before giving up on a log.

The probe scripts that got us there are in `research/grpc-probes/`.

---

## Limitations

- **Windows only.** The GUI layer is Win32 + PowerShell.
- **gRPC video export does not work — use the GUI for video.** `VIDEO`/`VIDEO_CLIP` fail with `EXPORTER_START_FAILURE` whether Studio is cold, has a clip loaded, or has a project open. Photo and image types export standalone over gRPC; `studio_ui_export` is the video path.
- **GUI export needs a loaded clip.** An empty player means nothing to export — `studio_ui_state` tells you.
- The GUI layer assumes Studio's accent colour is `#FFD200`. If a future version changes its theme, the button detector needs the new colour.
- `.insproj` writes are structural JSON edits; Studio must reload the project to see them.
- The offsets in `research/` are tied to a build: `studio_worker.dll` is 188,050,376 bytes on 6.0.8 and 188,077,512 on 6.0.9, so embedded descriptors shift between versions. The recovered `.proto` files are checked in for that reason; re-run `research/protocat.py` after a Studio update.
- OCR reads what is rendered. Text drawn into the Qt canvas itself (timeline labels, preview overlays) may come back mangled or not at all — it is reliable for dialogs and panels, not for the canvas.

---

## License

MIT. See [LICENSE](LICENSE).
