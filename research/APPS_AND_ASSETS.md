# Insta360 Studio — Apps, Ressourcen und Dashboards

> **Install path moved (2026-11-23).** Studio 6.0.9's launcher installs per-user and moved the
> application from `C:\Program Files\Insta360 Studio\` to
> `%LOCALAPPDATA%\Insta360\Apps\Insta360 Studio\current\`, leaving the old folder behind **empty**.
> Every path below was captured from the old location; the file set is the same, only the root moved.
> Scripts resolve it through `research/studioroot.py` instead of hardcoding it.
>
> Binary offsets are build-specific: `studio_worker.dll` is 188,050,376 bytes on 6.0.8 and
> 188,077,512 on 6.0.9, so embedded descriptor offsets shift between versions.

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

## 5. NVAP-Container — Filter-Captions und Sticker

**Werkzeug:** `research/nvap_extract2.py [--verbose] [--write]` → `research/nvap/`

**44 Dateien** im Installationsbaum tragen die `NVAP`-Signatur, **alle** unter
`Resources/`: 22 × `.compoundcaption` (Filter-Namenskarten) und
22 × `.animatedsticker{in,out,}animation` (Sticker-Animationen).
Die Dateien unter `data/models/*.ins(nx)` sind **kein** NVAP — sie beginnen mit
Rohdaten (Floats), nicht mit dem Container-Kopf.

### Aufbau

```
"NVAP" | u32 version (2) | u32 headerLen (16) | u32 count   <- 16 Byte
u32 @ +16 (Archiv-Starthinweis) | u32 @ +20
danach das ZIP-Archiv
```

Der Container ist ein **echtes ZIP-Archiv**, und die entscheidende Eigenheit
ist: **die Nutzlast-Bytes sind invertiert (XOR 0xFF)**. Deshalb fand ein Scan
nach dem literalen `PK\x03\x04` nur Zufallstreffer — der echte Header steht als
`\xaf\xb4\xfc\xfb` in der Datei. Der Beweis ist direkt lesbar: in
`…Ace Pro3….compoundcaption` enthält das Feld bei Offset 176 die Bytes
`\xbb\xbe\xcb\xba\xc9\xbb\xcd\xb9\xd2…`, und XOR 0xFF ergibt exakt
`DA4E6D2F-B305-4FFC-AFB4-A36DC9BFB69F/`.

Zwei Varianten existieren:

| Variante | Dateien | Lokale Header |
|---|---|---|
| A | 16 (`.compoundcaption` älterer Kameras) | literal — validierbarer LFH-Scan genügt |
| B | 25 (neuere Kameras + alle Sticker) | invertiert — nur über die Central Directory lesbar |

### Warum das ZIP nicht direkt öffnet — und wie es doch geht

Central Directory (`PK\x01\x02`) und EOCD (`PK\x05\x06`) liegen im **Klartext**
und sind in sich stimmig. `zipfile` lehnt die Dateien trotzdem ab, weil die
aufgezeichneten `local_header_offset`-Werte **relativ zur Archivbasis** sind und
diese Basis unbekannt ist. Die Auflösung ist eindeutig:

```
base   = Position des ersten Local File Header im Archiv
cd_at  = base + cd_offset_aus_dem_EOCD
```

`base + lho` landet dann für **jeden** Eintrag exakt auf einem Header. Belegt
an Ace Pro3: `lho` = 83 / 63703 / 64388 / 65082 … und die Basis 176 ergibt
176+83 = 259, 176+63703 = 63879, … — genau die Stellen mit (invertierter)
Header-Signatur. Das CD-Feld `cd_size` ist für diese Rechnung **unbrauchbar**:
`eocd − cd_size` liefert 69117, die echte Directory liegt bei 69200.

Der **Eintragsname in der Central Directory dient als Prüfsumme**: akzeptiert
wird ein Eintrag nur, wenn der Name im Header mit dem Namen im Verzeichnis
übereinstimmt (literal oder invertiert dekodiert). Als zweite Stufe greift ein
gelockerter Test, der nur die Header-Signatur an `base + lho` verlangt.

### Inhalt

**Captions** (`.compoundcaption`)

| Eintrag | Bedeutung |
|---|---|
| `caption0_<aspect>.xml` | Storyboard **pro Seitenverhältnis** (`1v1`, `21v9`, `3v4`, `4v3`, `9v16`, `9v21`) |
| `<md5>.png` | Hintergrundbild der Karte (mit `useFastBlur` weichgezeichnet) |

Das Storyboard ist ein `<storyboard sceneWidth sceneHeight>` mit
`trackGroup`/`textTrack` (Platzhaltertext, `fontFamily="LG1052"`, Outline,
Ausrichtung) und `transform`-Parametern (`scaleX`, `scaleY`, `transX`,
`transY`, `opacity`) plus `complexRender`-Effekt mit `outline`/`body`-Layern
und `blurRadius`. Das ist die **im Video eingebrannte Filter-Namenskarte**.

**Sticker** (`.animatedsticker*`) — ein vollständiges Keyframe-System:

| Eintrag | Bedeutung |
|---|---|
| `info.json` | `name` (z. B. `StickerAnimation_in_08`), `uuid`, `version`, `minSdkVersion`, `refDuration` (ms), `supportedAspectRatio`, `noBackground`, `cover`, `translation[]` |
| `in-animation.xml` / `out-animation.xml` | Ein-/Ausblend-Animation |
| `animation.xml`, `animation<aspect>.xml` | Animation je Seitenverhältnis (`1v1`, `3v4`, `4v3`, `9v16`, `21v9`) |
| `cover.jpg`, `*.png` | Vorschau- und Grafikebenen |

Die Animations-XMLs sind reine Keyframe-Listen:

```xml
<effect name="transform">
 <animation paramName="opacity">
  <key time="0" value="0"/>
  <key time="480" value="1"/>
 </animation>
</effect>
```

`refDuration` 500 ms, `supportedAspectRatio` z. B. `16v9`, `translation[]`
enthält u. a. die chinesischen Anzeigenamen (`贴纸入动画_弹入`). Damit sind
Sticker-Namen, Dauern, Seitenverhältnis-Varianten und Animationskurven
maschinell lesbar — Grundlage für eine Sticker-Auswahl über den MCP-Server.

### Abdeckung (ehrlich)

| | Anzahl |
|---|---|
| Container gesamt | 44 |
| davon auslesbar | **41** |
| nicht auslesbar | 3 (B2, DE, 1 Sticker) |
| **valide Einträge geschrieben** | **200** (163 XML, 17 PNG, 20 JSON) |
| davon XML gültig geparst | **163 von 163** |

Gegenüber dem ersten Extraktor (16 Container, 77 Einträge, 10 defekte XMLs)
ist das die 2,6-fache Ausbeute ohne einen einzigen defekten Eintrag. Offen
bleiben `B2` und `DE` (`.compoundcaption`) sowie eine Sticker-Datei: dort
liegt `base + lho` auf echten Headern, aber Name bzw. Deflate-Strom passen
nicht zusammen — vermutlich enthält der erste Eintrag ein verschachteltes
Archiv. Der Extraktor schreibt nichts, was er nicht validiert hat (XML parst,
PNG-Signatur, Größe stimmt).

### Vier Fallen beim Parsen

1. **Nicht nach `PK\x03\x04` scannen und jeden Treffer glauben.** Die Nutzdaten
   enthalten diese Bytes zufällig. Jeder Kandidat muss validiert werden
   (Version, Methode 0/8, Namenslänge plausibel, Name druckbar mit bekannter
   Endung, Deflate liefert exakt `usize`).
2. **Die Invertierung nicht übersehen.** Ohne XOR 0xFF sehen die Header wie
   Zufallsbytes aus; `\xaf\xb4` ist `PK`, nicht Müll.
3. **`cd_offset` steht bei `EOCD + 16`, nicht bei `+12`.** Bei `+12` liegt
   `cd_size`. Ein einzelner `unpack` an der falschen Stelle verschiebt die Basis
   um die Directory-Größe (987) und lässt jede Rekonstruktion scheitern.
4. **`decompressobj.flush()` ist Pflicht** — sonst fehlt der letzte
   Deflate-Block und das XML ist stillschweigend abgeschnitten.

---

## 6. Was das für den MCP-Server bedeutet

| Bereich | Status |
|---|---|
| FOV-/Kamera-Validierung | **neu möglich** — `camera_matrix.json` als Referenzdaten |
| Wasserzeichen-Positionen | **neu möglich** — Tabelle liegt vor |
| Filter-Captions / Sticker | **Format vollständig entschlüsselt** (200 Einträge); Auswahl weiterhin nur über GUI |
| Sport-Dashboard | 69 Widgets + 25 Themes bekannt; Steuerung nur über GUI/CEF, keine API |
| GPU-Beschleunigung | `--hw_accel_hint` erklärt; kein direkter Aufruf nötig |
| Treiber-Detektor | irrelevant für Automation |
| Quick Look | eigenständige App, nicht Teil der Studio-Automation |

Offen bleibt: QML-UI-Quellcode (kompiliert im Binary), drei NVAP-Container
(B2, DE, 1 Sticker), die Entschlüsselung des Studio-Hauptlogs.
