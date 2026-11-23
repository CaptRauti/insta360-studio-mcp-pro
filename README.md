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
| `studio-exporter-service.exe` | gRPC on a dynamic port: export/stitching | **accepts jobs, never writes a file** |
| The GUI export dialog | Qt canvas | **works — this is the export path that produces files** |

The gRPC exporter is the interesting part and the disappointing part. Its full protobuf schema was recovered from the embedded descriptors in `studio_worker.dll` (see `src/proto/export2.proto`), and requests are accepted and parsed correctly — but `StartExporting` returns "running" and produces nothing. The GUI path is what actually exports. So this server exposes both, and the GUI path is the one to use.

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
5. **Watch the output folder** until the file stops growing, then report its path and size.

No hardcoded coordinates and no vision model. `studio_ui_state` also reports whether the player has content, using a variance test on the player region — that's how you tell "no video loaded" from "video loaded" without a screenshot in your face.

### Reading the UI instead of guessing at it

Colour detection finds the accent-coloured button. It cannot tell you that a dialog offers "Auflösung", "Bitrate" or "Abbrechen", and it cannot find a control that is not accent-coloured. So the server also OCRs the screenshot with the engine built into Windows (`Windows.Media.Ocr`, via `src/ocr.ps1`): no API key, no network, no extra install, German and English recognisers included.

| Tool | What it does |
|---|---|
| `studio_ui_ocr` | Screenshot the window (or read an existing `.png`) and return the text with window-relative boxes |
| `studio_ui_click_text` | Find text by name and click it — e.g. `"Exportieren"` — so the click lands wherever that control currently sits |

Matching is case-insensitive substring, which matters because OCR mangles small text and umlauts (`Menü` comes back as `Menÿ`); asking for `Export` still hits `Exportieren`.

Live, against Studio 6.0.9:

```
studio_ui_ocr {}
  -> 94 lines / 400 words, lang de-DE, image 2576x1408
studio_ui_click_text { text: "Bearbeiten" }
  -> matched word "Bearbeiten", click (1495, 1357)
```

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

Both the module-level flow and the MCP tool call were run and checked with `ffprobe`.

---

## Tests

```bash
npm test              # wire format, .insproj, camera matrix, OCR — 32 tests
npm run check         # syntax-check every module
npm run probe         # live MCP handshake, tool list, gRPC port discovery
npm run probe:ui      # live GUI probe: window, screenshot, button detection
npm run probe:ocr     # live OCR probe: read the running window, look up controls by name
npm run probe:export  # SLOW: drives a real export (minutes, writes a big file)
```

`probe:export` is opt-in on purpose — it produces a real multi-hundred-MB file and takes minutes.

---

## What was learned about Studio's gRPC API

Kept here because it's hard to find anywhere else:

- Two helper services run as separate processes: `studio-exporter-service.exe` and `studio-thumbnail-service.exe`, each on a dynamically assigned localhost port, bound to the parent Studio PID with `--pid=` and `--enable_heartbeat`.
- gRPC reflection is **not** enabled (`UNIMPLEMENTED`).
- The protobuf descriptors are compiled into `studio_worker.dll` as plain-text `FileDescriptorProto` blobs — recoverable by scanning for the `.proto` name strings and walking the varint length prefix. `src/proto/export2.proto` is reconstructed from those.
- The live service is `service.Export2.Export2`, not `service.Export.Export` — the older descriptor in the same DLL is a decoy.
- `StartExporting` parses the request correctly (the echoed task id proves it) and returns `RUNNING`, but never writes output. Status codes seen: `0` OK, `2` exporter start failure, `1026` no source file.
- Most Studio logs are encrypted (a `bf08ac29` frame header plus a counter), but the CEF and detector logs in the same tree are plain text — check both before giving up on a log.

The probe scripts that got us there are in `research/grpc-probes/`.

---

## Limitations

- **Windows only.** The GUI layer is Win32 + PowerShell.
- **gRPC export does not produce files.** Use `studio_ui_export`.
- **GUI export needs a loaded clip.** An empty player means nothing to export — `studio_ui_state` tells you.
- The GUI layer assumes Studio's accent colour is `#FFD200`. If a future version changes its theme, the button detector needs the new colour.
- `.insproj` writes are structural JSON edits; Studio must reload the project to see them.
- The offsets in `research/` are tied to a build: `studio_worker.dll` is 188,050,376 bytes on 6.0.8 and 188,077,512 on 6.0.9, so embedded descriptors shift between versions. The recovered `.proto` files are checked in for that reason; re-run `research/protocat.py` after a Studio update.
- OCR reads what is rendered. Text drawn into the Qt canvas itself (timeline labels, preview overlays) may come back mangled or not at all — it is reliable for dialogs and panels, not for the canvas.

---

## License

MIT. See [LICENSE](LICENSE).
