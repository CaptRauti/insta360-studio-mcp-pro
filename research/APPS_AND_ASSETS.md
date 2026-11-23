# Insta360 Studio — Apps, Ressourcen und Dashboards

Nachtrag zum Inventar. Deckt die drei zuvor offenen Bereiche ab:
`.rcc`-Ressourcen, `data/web_dashboard` und die bisher unanalysierten
Hilfsprogramme.

---

## 1. `.rcc`-Ressourcen (vollständig ausgepackt)

**Werkzeug:** `research/rccx.py` (PySide6 `QResource`-Baum, rekursiv)
**Ergebnis:** 55 Verzeichnisse, **951 Dateien, 37,2 MB** →
`research/rcc/extracted/` (Baum: `research/rcc/rcc_tree.json`)

### Wichtigste Erkenntnis
Die `.rcc` enthält **keine QML-Quellen**. Die gesamte UI-Logik ist in
`Insta360 Studio.exe` kompiliert; die Ressourcen liefern nur Assets
(Icons, Cursor, Fonts, Shader, Bilder, Tabellen). Ein QML-Quelltext-Export
ist damit nicht möglich — nur die Asset-Ebene ist zugänglich.

### Inhalt nach Typ
| Typ | Anzahl | Bedeutung |
|---|---|---|
| `.png` | ~470 | UI-Icons, Fenster-Deko |
| `.svg` | ~125 | Vektor-Icons, Cursor |
| `.qsb` / `.frag` / `.vert` | ~60 | Qt-Shader (Rendering-Pipeline) |
| `.ttf` / `.otf` | ~40 | Schriften |
| `.json` | 8 | **Fähigkeits- und Positions-Tabellen** |
| `.qss` | div. | Qt-Stylesheets |

### Die JSON-Tabellen sind der eigentliche Fund
Sie sind **zlib-komprimiert** (Qt6-RCC-Flag); `QResource.data()` liefert den
komprimierten Blob. Werkzeug zum Entpacken: `research/rccdecode.py`
→ 34 dekodierte Textdateien in `research/rcc/decoded/`.

| Datei | Inhalt |
|---|---|
| `fov_distance_table1_*.json` | Welche FOV-Typen je Kamera/Objektiv/Modus existieren |
| `fov_distance_table2_*.json` | **FOV-Winkel- und Distanzbereiche** (default/min/max) je FOV-Typ × Kamera × Modus × Seitenverhältnis |
| `video_water_mark_table.json` | Wasserzeichen-Position je Kamera/Objektiv/Seite/Position |
| `app_watermark/default/waterInfo.json` | Wasserzeichen-Stile je Gerät |
| `onboarding.json` | Onboarding-Schritte |

### Kamera-Fähigkeitsmatrix
**Werkzeug:** `research/cammatrix2.py` → `research/camera_matrix.json`

- **17 Kameras**, **17 FOV-Typen**, **7 Seitenverhältnisse**, 5 Modi
- **415 Winkel-Regelsätze** mit defaultFov/minFov/maxFov + Distanzen

FOV-Typen: `Dewarp, Linear, MaxView, MegaView, Super, TinyPlanet, Wide, …`
Seitenverhältnisse: `16:9, 4:3, 1:1, 3:4, 9:16, 235:100, …`

Beispiel X6 (175 Regelsätze):
| FOV | Modus | Seite | default | min | max |
|---|---|---|---|---|---|
| MegaView | Video | 16:9 | 64° | 20° | 150° |
| Dewarp | Video | 16:9 | 100° | 20° | 150° |
| Linear | Video | 16:9 | 102° | 20° | 150° |
| MegaView | Video | 9:16 | 39° | 20° | 150° |

**Nutzen für den MCP-Server:** Er kann damit vor jedem Reframe/Export
prüfen, welche FOV-Typen und Winkelwerte für die geladene Kamera/Modus/Seite
überhaupt gültig sind — statt blind Werte zu setzen.

---

## 2. `data/web_dashboard` — Sport-Dashboard-Engine

**Version:** 2.33.0.202609200950 (Build 2026-09-20), Plattform `studio`
**Umfang:** 1.226 Dateien / 166 MB — davon **991 PNG + 125 SVG** (Grafik-Assets),
nur 3 JS/HTML/CSS-Bundles (React-SPA, minifiziert, läuft in CEF).

### Aufbau
- `pages/sport/controller/` — Steuer-Panel in Studio
- `pages/sport/mask/` — das gerenderte Overlay (Export-Ausgabe)
- `public/sport/…` — Assets

### Dashboard-Widgets: **69 Typen**
Vollständige Widget-Bibliothek extrahiert (z. B. Speed-, Power-, HeartRate-,
Cadence-, Elevation-, Slope-, Gauge-, Chart-, Map-Widgets).

### Themes/Templates: **25**
`airplane1/2/3, bmw, cfmoto, classic, cool, cyber, dynamic, edit, energy,
floating, futuristic, mm93, mm93s, modern, pogacar, racing, scifi,
simplicity, simplicity2025, studio1, studio2, tradition, ultimate`

### Aktivitäts-/Sporttypen
`cycling, running, skiing, diving, fishing (fishing_pcc), airplane,
motorcycle (cfmoto/bmw), pogacar`

### Telemetrie-Felder (vom Dashboard konsumiert)
`speed, heartRate, cadence, power/powerInWatts, elevation, slope, distance,
duration, pace, temperature, pressure, depth, steps, gear, engineSpeed,
wireSpeed, verticalSpeed, acceleration, rpm, fishingPower`
+ je `…Max`-Variante und `avg…`/`total…`-Aggregate.

---

## 3. Die vier Hilfsprogramme

Alle aus derselben Build-Wurzel
`C:\jenkins\workspace\Studio_Win\build\studio_src\…`, Version 6.0.8.

### `studio_utility.exe` (777 KB) — „Studio Utility Service"
Dünner Loader: lädt `\studio_worker.dll`, Einstiegspunkte `HwaccelProbe`
und `RetryProber`. **Das ist der Hardware-Beschleunigungs-Prober**, der den
`--hw_accel_hint`-JSON erzeugt, den der Export-Dienst auf der Kommandozeile
bekommt (siehe Export-Analyse). Prüft, welche Codecs die GPU kann, und
wiederholt die Messung bei Fehlschlag.

### `app_detector.exe` (1,7 MB) — GPU-Treiber-Detektor (Qt Widgets)
- Prüft AMD/Intel/NVIDIA-Treiberversionen gegen eine Server-Liste
- Lädt Konfiguration von **öffentlichen Endpunkten**:
  - `https://insta360-studio-log.oss-cn-shanghai.aliyuncs.com/studio_config/app_config_insta360_new.json`
  - `…/studio_config/driver_config.json` (US-Spiegel: `…-us.oss-us-west-1…`)
- Kann Treiber herunterladen und installieren (`--process_type=update_driver --hw_id=… --inf_file=…`)
- Telemetrie-Events: `app_detector_launch`, `…_driver_detect_result`, `…_page_exposure`
- Nutzt AlibabaCloud-OSS-SDK; Hosts `snssdk.insta360.com` (Douyin/TikTok-SDK)

### `quick-look.exe` (96 MB) — „Quick Look"
Eigenständiger Vorschau-/Player für `.insv`/`.mp4` mit eigenem Fenster
(`QuickLookWindow`, `QuickLookControlBar`, `PlayerSlider`, System-Tray, QSS).
Eigene Dekodier-Pipeline (ffmpeg/libavcodec, 186 ffmpeg-Strings), HW-Beschleunigung
über D3D11/Vulkan/RHI/QOpenGL. Config-Schalter:
`disableHwaccelDecoder`, `disableHwaccelDecoderH265`, `decoderHwaccel(H265)`.
Eigene Mutex `StudioQuickLookAppMutex`; Quelle
`studio_src\src\app\quick_look\quick_look_win\launcher\main.cpp`.

### `quick-look-daemon.exe` (425 KB) — „Quick Look Daemon"
Wächter: Mutex `StudioQuickLookDaemonMutex`, startet `quick-look.exe`,
liest `startup.ini`, Events `start_quicklook` / `open_quicklook`.

---

## 4. Öffentliche Konfigurations-Endpunkte (abgerufen, HTTP 200)

### `app_config_insta360_new.json` (4 KB)
Feature-Gates + Telemetrie-Schalter:
- `app_detector.enable` (derzeit **false**), Treiber-Datumsgrenzen `2024/1/1` je Hersteller
- `app_monitor.crashpad` (Sentry, OSS-Upload, AMD-Hook-Erkennung)
- `app_monitor.lag_monitor` (UI-Lag-Messung, Dump bei Überschreitung)
- Versionsfilter (`app_version >= 5.9.2.0`)
- Sentry-Endpunkt: `https://studio-sentry-sg.insta360.com/`

### `driver_config.json` (475 KB) — GPU-Kompatibilitätsmatrix
**197 Einträge**: AMD 35, Intel 62, **NVIDIA 100**, plus Whitelist.
Je Eintrag: `date`, `md5`, `inf_file`/`multi_inf_file`, `isnotebook`,
`origin_download_page`. Damit meldet der Detektor „Treiber veraltet"
und nennt die Download-Seite.

---

## 5. Was das für den MCP-Server bedeutet

| Bereich | Status |
|---|---|
| FOV-/Kamera-Validierung | **neu möglich** — `camera_matrix.json` als Referenzdaten |
| Wasserzeichen-Positionen | **neu möglich** — Tabelle liegt vor |
| Sport-Dashboard | 69 Widgets + 25 Themes bekannt; Steuerung nur über GUI/CEF, keine API |
| GPU-Beschleunigung | `--hw_accel_hint` erklärt; kein direkter Aufruf nötig |
| Treiber-Detektor | irrelevant für Automation |
| Quick Look | eigenständige App, nicht Teil der Studio-Automation |

Offen bleibt: QML-UI-Quellcode (kompiliert im Binary), NVAP-Container-Index,
semantische Zuordnung der SVM-Modelle.
