# Insta360 Studio MCP Pro

An MCP server for **Insta360 Studio** (Windows) that goes past screenshot clicking: it reads and edits `.insproj` project files as JSON, talks to Studio's own gRPC helper services, and drives the real GUI export dialog when the API won't cooperate.

Built and tested against **Insta360 Studio 6.0.8 and 6.0.9** on Windows 11. The install directory is resolved at runtime, because 6.0.9 moved it (see [Install path](#install-path)).

---

## Why this exists

The only other Insta360 Studio MCP server does UI automation and nothing else. Studio actually ships more than that:

| Surface | What it is | Status |
|---|---|---|
| `.insproj` projects | Plain JSON — tracks, clips, transforms, stitching | **works, fully read/write** |
| `studio-thumbnail-service.exe` | gRPC on a dynamic port: thumbnail rendering, scene detection | **thumbnails work, verified (real JPEGs on disk); scene detection accepted but replies empty** |
| `studio-exporter-service.exe` | gRPC on a dynamic port: export/stitching | **works for photo/image types; video types fail regardless of UI state** |
| The GUI export dialog | Qt canvas | **works — the path for video, and for anything needing the loaded project** |
| `NetworkService` | gRPC the app *calls out* to Insta360's cloud: downloads, telemetry, log upload | **not a local surface** — no listener, no host binary, identical in 6.0.8 and 6.0.9 |

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
| `studio_ui_send_keys` | Send a key to the window: one plain key (`{ESC}`, `{TAB}`, …) works in quiet mode, a chord only in loud mode |
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
| `studio_thumbnail_request` | Render a frame of a source via gRPC and report the file it wrote (needs no UI) |
| `studio_scene_detect` | Ask the service to analyse a source for scene changes |
| `studio_thumbnail_remove` | Drop cached thumbnails for named sources |
| `studio_thumbnail_heartbeat` | Keep-alive for the thumbnail service |
| `studio_install_info` | Inspect the install directory |
| `studio_camera_caps` | Which FOV types, modes, aspects and reframe angles a camera allows — from the FOV/distance tables inside Studio's Qt resources |

### Logs & crash dumps

Studio keeps its own logs, and they are the only place it explains itself. The tree is
`%LOCALAPPDATA%\Insta360\Insta360 Studio\log\` with one directory per Studio start under
`studio\`, plus the `detector\`, `quick_look\` and `setup\` areas.

| Tool | What it does |
|---|---|
| `studio_logs` | `action=list` summarises each area and how much of it is readable text; `action=sessions` lists recent Studio starts with their files; `action=read` returns the tail of one file; `action=grep` searches the readable logs (regex, modified-within-days) |
| `studio_dumps` | List crash minidumps, newest first — `crashes\lag_reports` are written when Studio **hangs** |

Measured on 6.0.9 (2026-11-24), and this is the part worth knowing before you trust a log:

| Area | Readable | Encrypted |
|---|---|---|
| `studio\…\*_launcher_*.log`, `*_cef_*.log` | ✅ launcher line, Chromium/GL errors | — |
| `studio\…\<ts>_<pid>.log`, `*_export_*`, `*_thumbnail_*` | — | ❌ |
| `detector\` (config, GPU state, `detector enable false`) | ✅ | — |
| `setup\` (Inno Setup install history: **which build, which EXE, when**) | ✅ | — |
| `quick_look\` | — | ❌ |

The encrypted files share a constant 16-byte container header
(`cd013a985f5beca1bcc1ca036aa5d1a0`) and carry `bf08ac29` frame magic; the payload is
high-entropy, so it is real encryption with a key inside Studio's binaries, not a
reversible obfuscation. Both tools therefore **report** encryption instead of decoding
it — a log reader that prints mojibake out of a cipher is worse than one that says it
cannot read the file. Every read is also confined to the Insta360 tree, so `file` cannot
be used as an arbitrary file reader.

Live, on this machine:

```
studio_logs {}                       -> studio 114 files (37 readable / 68 encrypted, 113 MB),
                                        detector 1/1, quick_look 5/0, setup 2/2
studio_logs {action:"sessions"}      -> 26 Studio starts, newest 2026-11-24T09:14:30
studio_dumps {}                      -> 9 dumps, newest 2026-11-23T21:58:56 (lag/hang)
studio_logs {action:"read", file:"…31604.log"}
                                     -> {readable:false, kind:"encrypted", reason:"…"}
studio_logs {action:"grep", area:"setup", pattern:"Insta360_Studio_6"}
                                     -> 6.0.8_release_insta360(RC_build100) 11-21,
                                        6.0.9_beta1_insta360(RC_build8)     11-23
```

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
3. **Everything is measured, not hardcoded.** The server diffs the frames either side of its own click to obtain the list's rectangle (measured `x 566, width 340, top = label y + 2` on a 1384×900 window), so the same code works for every control even though the resolution list is 171 px tall where the codec list is 160. The rectangle's **size** is the same on a 2576×1408 window — only its `x` moves with the layout (measured `x 1162` there).

Four traps, each of which had to be fixed before a click landed on the intended option:

- **Full-window OCR misreads the small option rows.** `H.265` came back as `4265`, and the row was placed ~40 px off its true position — enough to click the wrong entry. Option text and coordinates therefore always come from a 4× upscaled crop of the measured rectangle.
- **The row holding the current value draws a marker** ~20 px left of the text column, which OCR reads as a stray token and prepends (`s/ H.265`). Rows are re-aligned to the column they all share.
- **The control's own value line overhangs the list's rectangle by ~8 px**, so the crop catches the bottom of those glyphs: `Benutzerdefiniert` arrives as `utzeraetlmert`, `1080P - 1920 x 1080` as `- IYZU X 1`, with a glyph height of ~8 px against ~10-11 px for a whole row. Measured, and it corrects an earlier guess (a scrolled-and-clipped current selection) that the geometry does not support. Such rows are dropped, and the margin is 20 px rather than 5 because the first real option sits 32 px (codec list) to 42 px (resolution list) below the box top while the fragment sits at 0-3 px — the box is found by pixel-diffing two frames, so its top wanders a few px between runs.
- **A control's value line sits just above the list's rectangle**, so the crop must carry no margin at all. With one, the field's own value shows up as a phantom first option.
- **An accent-coloured button in the dialog region is weaker evidence than it looks.** `uiState` used to call the dialog open on that alone. Measured: an accent box at `x 1422, y 1006` (110×32) on a 2576×1408 window while `readDialog()` returned **zero** fields and the OCR of the same capture listed the media library instead of any dialog label. What produced that state is **not** established — the capture may have caught the dialog half-painted, since the same box is present when the dialog is unmistakably open. `uiState` therefore verifies with the dialog's own labels (two of `Auflösung`/`Kodierung`/`Voreinstellung`/`Farbraum`/`Bitrate`/`Rahmen`/`Dateiname`) and reports `dialogCheck: labels | accent-only | ocr-failed | no-accent`, so a bare `dialogOpen: true` can be told apart from a verified one. A `readDialog()` that comes back empty is worth a second look before it is read as a missing control: the window size was the reason in the case above.
- **The reader was pinned to the window size it was measured on.** `rowFor` bounded the value column with an absolute `x < 700` taken from a 1384×900 window. On a 2576×1408 window the labels sit at `x~1074` and the values at `x~1171`, so the bound cut the value column off and **every** control read as `not found` while its label was plainly in the OCR — `studio_ui_export_settings` returned `value: null`, and an export through `runExport` would have started nothing. Measured at both sizes, the label-to-value distance is the same 97 px and the values run out at 222-237 px, so the bound is now **relative to the label** (`lab.x + 250`) and the row tolerance follows the glyph height. `tests/export-dialog.test.mjs` carries fixtures for both window sizes.

Which controls are which, read off Studio 6.0.9 (the set depends on the preset — `Benutzerdefiniert` shows all of them):

| Control | Kind | Options |
| --- | --- | --- |
| `Pfad` | modal folder picker | — (opens "Ordner öffnen", see below) |
| `Voreinstellung` | list | `1080p`, `4K`, `Benutzerdefiniert` |
| `Auflösung` | list | `1080P - 1920 x 1080`, `2K - 2560 x 1440`, `4K - 3840 x 2160`, `Benutzerdefiniert…` |
| `Rahmen` | list | `Quellbild-Framerate übernehmen…`, `25.00`, `50.00` |
| `Bitrate` | list | `Empfohlen`, `Original`, `Benutzerdefiniert` |
| `Kodierung` | list | `H.264`, `H.265`, `ProRes 422`, `ProRes 422LT` |
| `Farbraum` | list | `Rec.709 8bit`, `Rec.709 10bit` (`IObit` is how OCR reads the ten) |

`Dateiname` **is** in the 6.0.9 video dialog (read back as `mcpTest(2).mp4`, typed into, see the quiet-mode
measurements below); it was reported missing here earlier and that was wrong.

Traps in that table:

- **Leaving a list open is not harmless.** The open panel covers the controls below it, so the next click on one of those lands on an *option*: probing `Voreinstellung` and then `Kodierung` silently picked a preset and reported a 340×369 list box — the union of both regions. `studio_ui_export_settings` therefore closes again whatever it opened (`closedAgain` in the reply), and `closeControl` is exported for callers doing their own sequence.
- **The row holding the current value is the one row OCR mangles**, because of its selection marker: `H.265` came back as `1-1.265` and `Rec.709 10bit` as `Rec.709 IObit`. Since every option worth switching to is a *different* row, `selectOption` returns early when the request already matches the current value instead of matching that row. Requests are compared exactly first, then again with `i/l→1` and `o→0` folded, which is what makes a request written as `Rec.709 10bit` still match the `IObit` reading.

- **`Pfad` opens a modal picker, and that picker eats everything.** A click on it brings up `Ordner öffnen` — a
  native shell folder dialog owned by Studio. While it is up, *every* click and keystroke goes into the picker, so
  the export dialog looks dead: list boxes stop opening (`list box for "Voreinstellung" did not open in 4 clicks`),
  typing appears to go nowhere, and pixel-diffing the dialog shows no change at all — **because `PrintWindow` of
  the parent does not include the picker window.** Cancelling the picker restores the dialog at once, which is
  what identified it: the list box opened again with the usual brightness step (38 → 52).
  The picker's own `Ordner:` field takes a name, not a path — a typed path is rejected with `Der Ordnername ist
  ungültig.` — so the folder is picked by navigating its list, and driving that is not built yet.
  `studio_ui_export_set { control: "Pfad" }` therefore answers `ok: false` **without clicking**, since leaving a
  modal picker open is worse than not trying. `studio_ui_export`'s own `outDir` is only a *wish*: the dialog's
  folder is what the file lands in, and the reply states which folder that was (`outDir`, `outDirSource`,
  `outDirMismatch`), what was asked for (`outDirAsked`) and watches *that* folder for the file to stop growing.
- **Check for modal windows before believing a control is inert.** Two controls here looked like they ignored
  input until `list_windows` showed a window of the *same process* sitting on top. The parent's capture cannot
  show it, so a screenshot-based check reports "nothing happened" either way.

Live, against Studio 6.0.9:

```
studio_ui_export_settings {}
  -> Pfad "C:/Users/stefa/Desktop", Voreinstellung "Benutzerdefiniert",
     Auflösung "1080P - 1920 x 1080", Rahmen "Quellbild-Framerate übernehmen",
     Bitrate "Empfohlen", Kodierung "H265", Farbraum "Rec.709"
studio_ui_export_settings { control: "Kodierung", listOptions: true }
  -> list box 566,594 340x178 (brightness 33 -> 51), closedAgain {ok:true, closed:true}
     options: H.264 | H.265 | ProRes 422 | ProRes 422LT
studio_ui_export_set { control: "Auflösung", value: "4K - 3840 x 2160" }
  -> picked "4K - 3840 x 2160": "Benutzerdefiniert" -> "4K -3840 x 2160", changed true
```

`studio_ui_export` takes the same settings as a `settings` object and applies them between opening the dialog and clicking the button, so one call can export 4K H.264 instead of the default:

```
studio_ui_export { settings: { Voreinstellung: "4K", Kodierung: "H.264" } }
```

`studio_ui_export_set` reads the field back after clicking, so its reply states whether the value actually changed: a click that lands beside an option reports `changed: false` rather than passing for success.

---

---

## Quiet mode — the operator keeps their machine (default)

The GUI automation above is safest, and most reliable, when it touches nothing. The
naive version of it fights whoever is sitting at the machine: it raises the window,
puts the pointer on the button it is about to press, and drags the window back to a
known position. Quiet mode is **on by default**; set `INSTA360_QUIET=0` to get the
old behaviour back.

| operation | loud (`INSTA360_QUIET=0`) | quiet (default) |
| --- | --- | --- |
| read the UI, wait for state | `SetForegroundWindow`, then capture | `PrintWindow` of a background window, pointer untouched |
| click, double-click | `SetCursorPos` + `mouse_event` | `WM_LBUTTONDOWN`/`WM_LBUTTONUP` to the window under the point |
| typing text (`WM_CHAR`), e.g. into the export dialog's `Dateiname` | `SendKeys` on the system queue | `WM_CHAR` messages, addressed to the content window |
| `studio_ui_send_keys` with **one** plain key (`{ESC}`, `{TAB}`, `{ENTER}`, `{BACKSPACE}`, arrows) | `SendKeys` | `WM_KEYDOWN`/`WM_KEYUP` for that key, addressed to the content window |
| `studio_ui_send_keys` with a **chord** (`^s`, `%{F4}`, `a{ENTER}b`) | `SendKeys` | refuses (exit 4) |
| `studio_ui_move` | moves the window | refuses (exit 3) and says how to allow it |
| `studio_ui_focus` | raises the window | no-op unless `force: true` |
| any action on a **minimised** window | restores the window, then acts | refuses (exit 3): a window that is not composited has no frame |

Why chords are refused instead of translated: `SendKeys` pushes through the system
keyboard queue, and the OS routes that to the focus of the *foreground* window. In
quiet mode the foreground is the operator's own application, so a `Ctrl+E` on the
way to the export dialog would be typed into their mail. Messages are addressed to
the target window and cannot leak, so text and plain keys are fine and chords are
not.

A key with no modifier is not a chord, so `studio_ui_send_keys` accepts exactly one
of those — `{ESC}`, `{TAB}`, `{ENTER}`, `{BACKSPACE}`, `{DEL}`, `{HOME}`, `{END}`,
arrows, `{PGUP}`/`{PGDN}`, `{SPACE}` — and delivers it as `WM_KEYDOWN`/`WM_KEYUP`
to the content window. Measured: `sendKeys({ keys: "{ESC}" })` closed the export
dialog while the operator's focus was in another application. Anything with a
modifier, a repeat or a second key is refused (exit 4) rather than guessed at.

Nothing in this tool needs `Ctrl+A` any more: the export dialog's `Dateiname` is
cleared with `End` plus `Backspace` (`clearField`) and committed with no key at
all, because the field and its display update as the characters arrive. `ENTER` is
deliberately never sent to that dialog — it would press the default button, which
is `Export`. The dialog's `Pfad` is a folder *picker*, not a text field: leave the
folder alone and read back what it holds.

Measured while the operator was working in another application, with Studio on a
second monitor (`research/quiet_probe.mjs` and `research/click_reach.mjs`, both
checked in):

```
quiet=true
window 1384x900 @ 2945,138 monitor=secondary foreground=false
start                words= 56
message-click "Musik" at 114,82
  click result: {"child":1442140,"cx":114,"cy":82}
after click          words= 99   <- the media library became the music library
  diff start->after: 54852px
clicking back on "Medien" at 53,82
after back           words= 56
  diff start->end: 0px  (0 = as found)

start                 cursor=484,1439 fg="Outlook (PWA) - Gesendete Elemente"
after windowInfo      cursor=484,1439 fg="Outlook (PWA) - Gesendete Elemente"
  pointer+foreground unchanged: true
readScreen            ok=true words=56
  pointer+foreground unchanged: true
```

- **The click arrives by message, not through the pointer.** The panel really did
  switch (54 852 pixels changed) and the click back restored the window exactly
  (0 pixels), while the pointer never moved and the foreground stayed with the
  operator's application. The message is addressed to the child window under the
  point, and `Resolve-Child` refuses if that window belongs to another process, so
  a race (the operator moved the window, something covers it) fails loudly instead
  of clicking into somebody else's application.
- **A background window's frame can lag one interaction behind**, because a window
  that is not in the foreground is not composited. Reads are fine, but after an
  interaction that changes the window, call `redraw()` (the `redraw` action) before
  believing the capture; it forces an invalidate + update of the whole window.
- **Studio exposes no UI Automation tree** — `uia.ps1` walking the RawView from the
  window returns `COUNT=0` — so screenshots + OCR remain the only way to read it.
  That is a property of the app, not a gap in this automation.

### Measurements, 24.11.2026 (Studio 6.0.9, operator working in another application)

```
# a wrong outDir cannot redirect the export to a folder nobody is watching
runExport({ outDir: "C:\Users\stefa\AppData\Local\Temp" })
  -> ok true, file C:\Users\stefa\Desktop\mcpTest(1).mp4 (356 793 785 bytes, 55 s)
     outDir "C:\Users\stefa\Desktop", outDirSource "dialog",
     outDirAsked "...\Temp", outDirMismatch true
     window 2945,138 1384x900 before and after -- nothing moved, no file in Temp

# the dialog's Dateiname does take typed text (the older note said it did not)
click row "Dateiname" -> keyMsg END, typeAt "X"
  -> read back "mcpTest(2).mp4X"        the field and its display update live
setText({ label: "Dateiname", text: "mcpTest(1).mp4" })
  -> ok true, changed true  "mcpTest(2).mp4" -> "mcpTest(1).mp4"
setText({ label: "Dateiname", text: "mcpTest(2).mp4" })
  -> ok true, changed true  back to "mcpTest(2).mp4"
  -> uiState().dialogOpen true   no ENTER was sent, so nothing pressed Export
```

- **A keyboard message with no point used to go nowhere, and still report `ok`.** With no `X`/`Y` the script sent
  the characters to the window at its *top-left corner* — the frame, not the content — so typing landed nowhere
  while the reply said `ok: true`. That is why the dialog's fields looked inert. Now the point-less case targets
  the content window under the window's centre, and it is measured: with CEF's focus on `Dateiname`, a
  `typeText({ text: "Z" })` with no coordinates came back in the field (`mcpTest(2).mpZ4`). Note the *caret*: the
  text goes wherever the focus sits, so a caller that wants a specific field clicks it first (`typeAt`).
- **Studio's CEF renders into the top-level window** — `WindowFromPoint` at any point inside it returns the window
  itself, not a child. Messages still reach it (that is why click and typing work by message), and `Resolve-Child`'s
  process check still matters for the windows where a child *does* exist.
- **A single key is deliverable by message.** `sendKeys({ keys: "{ESC}" })` returned `{ESCAPE, vk 27}` and
  `uiState().dialogOpen` went `true -> false`: the dialog closed without the window ever coming forward. Chords
  stay refused with the reason.

```
# a minimised window is refused instead of reported as empty UI
capture({ hwnd: <minimised window> })
  -> exit 3, ok false, iconic true:
     "the window is minimised: a minimised window has no composited frame, so it cannot be captured.
      Restore it and run again (quiet mode does not raise or move windows);
      INSTA360_QUIET=0 would let the tool restore it itself."
```

A minimised window has no composited frame, so `PrintWindow` hands back a blank or a stale picture — which reads
as "the UI is empty" rather than as an error. Quiet mode now says so and exits 3; loud mode restores the window
first, which is what loud mode is for. (Verified with a window of our own that was minimised on purpose; Studio
was left untouched.)

The same check sits in the pipeline's wait, where it replaces a wrong answer rather than a blank picture:
`waitForLibrary` on a minimised window used to burn its whole timeout and report "the start page did not render
in time" — as if Studio were broken. It now answers in 2.3 s with

```
{ "ok": false, "words": 0,
  "error": "Studio is minimised — restore its window, then run again (quiet mode does not raise or move windows)" }
```

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

And the same export with a setting changed by the server, `studio_ui_export { settings: { Kodierung: "H.264" } }`:

```
Kodierung: h265 -> h264   (changed, read back from the dialog)
VID_20260917_193416_00_002.mp4   337,661 bytes
H.264 1920×1080 @ 50 fps, 1.80 s + AAC audio
```

Studio's own default is H.265, and the neighbouring run without the setting produced HEVC — so the 337 KB H.264
file is the proof that the dialog control reaches the encoder, not just the UI.
`npm run probe:ui-export-with-settings [Codec]` runs that comparison and sets the codec back afterwards.

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
npm test                # wire format, .insproj, camera matrix, OCR, export request, dialog OCR, thumbnail payloads, log/dump reader — 93 tests
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
npm run probe:ui-export-with-settings [Codec]  # SLOW: export with a changed codec, ffprobe the file
npm run probe:thumbnail <media> [scene|thumb|remove|beat]  # live thumbnail service, prints what it wrote
```

`node tests/mcp-call.mjs <tool> '<json args>'` calls any tool on this server over stdio — handy for exercising the live ones without an MCP client.

`probe:export` is opt-in on purpose — it produces a real multi-hundred-MB file and takes minutes.

---

## What was learned about Studio's gRPC API

Kept here because it's hard to find anywhere else:

- The thumbnail service takes a `SourceGroup` (repeated `sourceFile` in field 1) in **field 2** of `ThumbnailRequest`; field 1 is an int64 `id`. `taskType` decides which file it writes: `0 kFootageCover` → `simple_cover.jpg`, `1 kSingleTask` → `clip_0_cover.jpg`, `2 kQuickSeekTask` → `seek_0.jpg`, all under `<AppData>/Insta360/Studio/Project/<hash>/thumbnail/`. `renderType` is `0 kPlane`, `1 kPlaneSphere`, `2 kSphere`, `3 kDewarp`, `4 kStereo`. Verified: a 360 `.insv` in, a dewarped 1280x720 JPEG out, no UI involved.
- A descriptor-correct payload is the difference between a working call and a silent no-op: with the field numbers guessed (a string in `id`, the source file in `width`) the service still answered, still returned success, and never wrote a file. "The RPC returned" is not evidence that it did anything — check for the artefact.
- `SendSceneDetectRequest` is accepted on the same service but has answered with an empty reply in every test so far; where it would put a result is still unknown. It is exposed as-is rather than dressed up as working.
- `NetworkService` (16 methods: `StartDownload`, `SendEventTrack`, `UploadLogToOss`, ...) is **not** a local surface. It is the app calling Insta360's cloud: no Studio process listens on TCP, there is no host binary for it, and the method-path strings sit next to `cloud.insta360.com` endpoints. It is present with the same 16 methods in both the 6.0.8 and 6.0.9 descriptor dumps, so nothing was switched off by the update.
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
- Most Studio logs are encrypted (a constant 16-byte container header `cd013a985f5beca1bcc1ca036aa5d1a0` plus `bf08ac29` frames — **not** a frame header at offset 0, as an earlier reading of this tree claimed), but the launcher, CEF, detector and setup logs in the same tree are plain text. Use `studio_logs` / `studio_dumps` instead of reading the tree by hand: they classify every file, refuse the opaque ones honestly, and scope by area and age.

The probe scripts that got us there are in `research/grpc-probes/`.

---

## Documentation

| File | What it holds |
|---|---|
| `docs/FEATURE_SURVEY.md` | Studio's documented feature set, per-page manual URLs, per-model applicability — the source list for what can be automated at all |
| `docs/DEVELOPMENT_BACKLOG.md` | Manual-vs-server coverage audit: what Studio documents, what these 33 tools cover, and the ranked list of functions still to build |
| `docs/INSPROJ_SCHEMA.md` | The measured `.insproj` schema, including the frame arithmetic `len(c) = source_total_frames − leftTrim − rightTrim` |
| `docs/ASSET_CATALOG.md` | Asset library and unpacked NVAP contents |

---

## Limitations

- **A project this server builds does not export.** It opens, the clips carry correct per-clip metadata, and then both timeline clips sit on "Lade Dateien…" — cause not established. The manual's own path rules (project file and media locations, user name, no renaming) are the current leads; see `docs/DEVELOPMENT_BACKLOG.md` §0. The log route to the cause is **partly closed**: Studio's own hang produces a minidump (`studio_dumps` lists them, newest 2026-11-23T21:58 — i.e. during the test runs that hit this), but the main log that would name the file it is stuck on is encrypted, so a dump plus a differential comparison against a Studio-written project is the instrument, not a text log.
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
