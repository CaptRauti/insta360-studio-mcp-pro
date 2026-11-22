# Insta360 Studio MCP Pro

An MCP server for **Insta360 Studio** (Windows) that goes past screenshot clicking: it reads and edits `.insproj` project files as JSON, talks to Studio's own gRPC helper services, and drives the real GUI export dialog when the API won't cooperate.

Built and tested against **Insta360 Studio 6.0.8** on Windows 11.

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

---

## How the GUI export works (and why it's not just clicking)

Studio's Qt canvas exposes **no** UI Automation tree — `uia.ps1` returns nothing, and that's expected, not a bug. So the server drives the GUI deterministically instead of guessing coordinates:

1. **Find the window** and normalise its rect (`win32.ps1`).
2. **Screenshot with `PrintWindow`**, not BitBlt — so it works while the window is occluded or behind another app.
3. **Decode the PNG in pure JS** (`src/png.mjs`, zlib only, no dependencies) and find Studio's primary action colour (`#FFD200`) by pixel mask. Connected components give the button's bounding box.
4. **Click by window-relative coordinates**, so the same code works at any window position.
5. **Watch the output folder** until the file stops growing, then report its path and size.

No hardcoded coordinates, no vision model, no OCR. `studio_ui_state` also reports whether the player has content, using a variance test on the player region — that's how you tell "no video loaded" from "video loaded" without a screenshot in your face.

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
- **Insta360 Studio** installed, default path `C:\Program Files\Insta360 Studio\`
- **PowerShell** on PATH (ships with Windows)

No Python, no native modules, no build step.

### Register with an MCP client

```json
{
  "mcpServers": {
    "insta360-studio": {
      "command": "node",
      "args": ["C:\\path\\to\\insta360-studio-mcp-pro\\src\\server.mjs"],
      "env": {
        "INSTA360_STUDIO_DIR": "C:\\Program Files\\Insta360 Studio"
      }
    }
  }
}
```

Environment variables:

| Variable | Default | Meaning |
|---|---|---|
| `INSTA360_STUDIO_DIR` | `C:\Program Files\Insta360 Studio` | Studio install directory |
| `INSTA360_PROJECT_ROOT` | `D:\Dokumente\Insta360\Studio` | Where projects live |
| `INSTA360_SHOT_DIR` | `%TEMP%\insta360-studio-mcp` | Where screenshots are written |

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
npm test            # protobuf wire format + .insproj reader — 12 tests, no Studio needed
npm run probe       # live MCP handshake, tool list, gRPC port discovery
npm run probe:ui    # live GUI probe: window, screenshot, button detection
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
- Export logs under `%LOCALAPPDATA%\Insta360\...\export_*.log` are compressed/encrypted — not readable for debugging.

The probe scripts that got us there are in `research/grpc-probes/`.

---

## Limitations

- **Windows only.** The GUI layer is Win32 + PowerShell.
- **gRPC export does not produce files.** Use `studio_ui_export`.
- **GUI export needs a loaded clip.** An empty player means nothing to export — `studio_ui_state` tells you.
- The GUI layer assumes Studio's accent colour is `#FFD200`. If a future version changes its theme, the button detector needs the new colour.
- `.insproj` writes are structural JSON edits; Studio must reload the project to see them.

---

## License

MIT. See [LICENSE](LICENSE).
