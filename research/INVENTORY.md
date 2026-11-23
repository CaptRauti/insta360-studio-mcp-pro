# Insta360 Studio — Vollständiges Software-Inventar

> **Install path moved (2026-11-23).** Studio 6.0.9's launcher installs per-user and moved the
> application from `C:\Program Files\Insta360 Studio\` to
> `%LOCALAPPDATA%\Insta360\Apps\Insta360 Studio\current\`, leaving the old folder behind **empty**.
> Every path below was captured from the old location; the file set is the same, only the root moved.
> Scripts resolve it through `research/studioroot.py` instead of hardcoding it.
>
> Binary offsets are build-specific: `studio_worker.dll` is 188,050,376 bytes on 6.0.8 and
> 188,077,512 on 6.0.9, so embedded descriptor offsets shift between versions.

Installationspfad: `C:\Program Files\Insta360 Studio\`
Version: 6.0.8
Stand der Analyse: 2026-11-22

---

## 1. Gesamtstruktur

| Bereich | Größe | Inhalt |
|---|---|---|
| `data/models` | 263 MB | 63 ONNX/NPU-Modelle (Tracking, Stitching, KI) |
| `data/web_dashboard` | 166 MB | Electron/CEF-Web-Dashboard (Geschwindigkeit/Telemetrie-Overlays) |
| `data/i_log` | 18 MB | 4× LUT-Dateien (.cube) für I-Log → Rec.709 |
| `data/b56efdaa` | 13 MB | 9× `.ins`-Modelle + `underwater.ilut` |
| `data/pano_animation` | 2,4 MB | 5× JSON+WebP-Paare (Pano-Übergänge) |
| `data/hdr_lut` | 756 KB | HDR-LUTs |
| `data/undercolor_style` | 460 KB | Farbstil-Presets |
| `data/*.xml` | 12× | **OpenCV-SVM-Modelle** (Trajektorien-/Szenen-Klassifikation) |
| `Resources/` | — | 22 Filter-Pakete, 50 Übersetzungen, CEF-Pakete, .rcc |
| `qml/` | — | Qt/QML-Oberfläche (kompiliert) |

**Kein PyInstaller.** Die App ist natives C++ mit Qt6 + QML. Der frühere Verdacht
(PyInstaller/MEI) ist falsch — die Treffer waren Zufallstreffer im CEF-Bundle.

---

## 2. Übersetzungen — vollständiger Feature-Katalog

`translations/` enthält **16 JSON-Sprachdateien** + 34 Qt-`.qm`-Dateien.
`de-DE.json` = 193.765 Bytes. Die JSON-Datei ist der **vollständige String-Katalog
der gesamten Oberfläche** — daraus lässt sich jede Option und jeder Dialog ablesen.

### 2.1 Export / Export-Warteschlange
- `Batch Export` — Stapel-Export
- `Export Queue` — Export-Warteschlange mit Abbrechen
- `Export Settings`: Format, Auflösung, Bitrate, Codec
- `Hardware detection for codecs` — Hardware-Encoder automatisch nutzen
- `Audio Mode` — Audio-Modus
- `Export Type` — Video / Foto / Pano / Mux

### 2.2 Reframe / Schnitt
- `Capture Mode` = „Reframe"
- `DeepTrack` — KI-Tracking (Personen/Tiere/Objekt)
- `Keyframes` — Keyframe-Editor
- `Trim` — Trimmen
- `Speed Ramp` — Zeitlupe/Zeitraffer
- `Frame Interpolation` (Optischer Fluss) — `supplement_frame_interpolation`
- `Template Library` — Vorlagenbibliothek
- `Stitching` — Stitching-Optionen inkl. Propellerschutz

### 2.3 Bildverarbeitung
- `Image Fusion` — Bildfusion
- `HDR` — HDR-Modus
- `Color Grading` — Farbkorrektur
- `I-Log` — Log-Profil (LUTs in `data/i_log/`)
- `Sharpening` — Schärfung (Parameter in `data/sharpen_param.ini`)
- `Underwater` — Unterwasser-Modus (`data/b56efdaa/underwater.ilut`)
- `Stabilization` — Stabilisierung

### 2.4 Dashboard / Telemetrie
- `Dashboard System` — Geschwindigkeit, Höhe, Karte, Beschleunigung
- `dashboardSystem.xml` — 13 Styles (Ethnocentric-Font, Farben, Layouts)

---

## 3. `data/*.xml` — OpenCV-SVM-Modelle

Alle 12 XML-Dateien (außer `dashboardSystem.xml`) sind **OpenCV `opencv_storage`-SVM-Modelle**
(`opencv_ml_svm`, Typ `EPS_SVR`, Kernel RBF). Sie enthalten Support-Vektoren mit
684–5292 Dimensionen.

| Datei | Dim | Größe |
|---|---|---|
| `0810e5c7.xml` | 684 | 12 KB |
| `0db3a7a0.xml` | 3456 | 60 KB |
| `0e38bc62.xml` | 5292 | 371 KB |
| `2780de8f.xml` | 5292 | 92 KB |
| `616ea2f7.xml` | 1188 | 21 KB |
| `7105bb47.xml` | 684 | 12 KB |
| `761dd84e.xml.xml` | 5292 | 59 KB |
| `79ed7b2c.xml` | 1188 | 21 KB |
| `bc293b1c.xml` | 684 | 12 KB |
| `d1f3e452.xml` | 1980 | 34 KB |
| `heatX5_d1790022.xml` | 684 | 12 KB |
| `dashboardSystem.xml` | — | 24 KB (Layout, kein SVM) |

**Zweck:** Trajektorien-/Szenen-Klassifikation. Vermutlich Erschütterungs-/
Bewegungs-Erkennung für die Stabilisierung (Gimbal vs. Action-Cam-Modus).

---

## 4. `data/cfg.json` — KI-Modell-Konfiguration

13 Top-Level-Keys, jeder ein Tracker-Modell mit Pfad + Engine + Parametern:

| Key | Modell | Parameter |
|---|---|---|
| `UavPersonTracker` | `det_pcd_*FP16.ins` + `reid_*` | `detect_interval: 6` |
| `DetectPersonTracker` | `yolov3_mnasnet05_pcd.ins` | `detect_interval: 6` |
| `LongtermTracker` | `yolov3_mnasnet05_pcd.ins` | `detect_interval: 10` |
| `LongtermBallTracker` | `det_ball_*FP16.ins` | `det_score_thd: 0.5` |
| `LongTermHeadTracker` | `det_head_*FP16.ins` | — |
| `LongtermDeepTracker` | `yolov3_mnasnet05_pcd.ins` | — |
| `PointTracker` | (Feature-basiert) | Keypoint-Tracking |
| `AlgorithmParam` | — | globale Algorithmus-Parameter |

**Modelle in `data/models/`:** 63 `.ins`/`.insnx`-Dateien, verschlüsselt
(keine lesbaren Magic-Bytes; `00`-Präfix + hohe Entropie).
Namen wie `det_pcd_*`, `reid_*`, `yolov3_mnasnet05_pcd`, `det_ball_*`, `det_head_*`
belegen Personenerkennung, Re-Identifikation, Ball-Tracking, Kopf-Tracking.

---

## 5. `Resources/filters/` — 22 Kamera-Filter-Pakete

Jeder Kamera-Ordner enthält genau **ein** Filter-Paket mit 4 Dateien:

```
<UUID>.1.compoundcaption   ← Binärcontainer, Magic "NVAP"
<UUID>.json                ← Metadaten (chinesisch)
<UUID>.lic                 ← Lizenz-Blob (verschlüsselt)
info.json                  ← vollständige Metadaten
```

### 5.1 `info.json`-Schema (Beispiel X6)
```json
{
  "category": 1,
  "isAbroad": 0, "isAdjusted": 0, "kind": 0,
  "minSdkVersion": "2.18.0",
  "name": "X6",
  "packageFileName": "<UUID>.1.compoundcaption",
  "packageSize": 45676,
  "pointType": 0, "ratioFlag": 1,
  "supportedAspectRatio": "16v9|1v1|9v16|4v3|3v4|21v9|9v21",
  "type": 15,
  "uuid": "705B16BE-D42B-4283-BED0-64ECE9CA9AFF",
  "version": 1
}
```

**Unterstützte Seitenverhältnisse:** 16:9, 1:1, 9:16, 4:3, 3:4, 21:9, 9:21
**Kamera-Abdeckung:** Ace, Ace Pro, Ace Pro2, Ace Pro3, B2, DE, Go 2, Go 3, Go 3s,
One R, One RS, One X, One X2, Sphere, TC4, X2, X3, X4, X5, X6, Z03, Z05

### 5.2 NVAP-Format
Magic `4e 56 41 50` = "NVAP", gefolgt von `02 00 00 00` (Version 2),
`10 00 00 00` (Header-Länge 16), dann ein Index-Block.
**45 Dateien** im Installationsverzeichnis enthalten NVAP.
Verarbeitet von `NvEffectSdkCore.dll` (18,9 MB) — Fehlerstrings:
`Invalid header in `, `Invalid assetTypeOfFileFormat in `,
`assetType is out of range`, `Asset package was in a wrong status!`,
`Failed to get animated sticker asset package.`,
`Failed to get video fx asset package.`

**Asset-Typen** (aus `NvEffectSdkCore.dll`): `captioncontext`, `captionrenderer`,
`captionanimation`, `captioninanimation`, `captionoutanimation`, `facemesh`,
`capturescene`, `avatarmodel`, `avatarmaterial`

---

## 6. `Resources/` — Weitere Ressourcen

| Pfad | Inhalt |
|---|---|
| `insta360.rcc` | Qt-Ressource, 928 Einträge (Icons, SVGs, Animationen, Logos) |
| `resource.rcc` | Qt-Ressource, 71 Einträge |
| `locales/*.pak` | 50× CEF-Locale-Pakete |
| `filters/` | 22 Kamera-Filter-Pakete + 2 TTF-Fonts |
| `player/` | 1 PNG (Fehlerbild) |
| `stickeranimation/` | 3 Ordner: `in`, `out`, `period` |
| `chrome_*.pak`, `resources.pak` | CEF-Bundle (Web-Dashboard) |

---

## 7. Bibliotheken (214 DLLs) — Funktionslandkarte

### 7.1 Kamera-/Video-Core
| DLL | Zweck |
|---|---|
| `studio_worker.dll` | **Kerndienst** — gRPC-Server (Export2, Thumbnail), alle Algorithmen |
| `studio-exporter-service.exe` | Export-Worker, gRPC-Port 4096 |
| `studio-thumbnail-service.exe` | Thumbnail-Worker, gRPC-Port 4098 |
| `avcodec/avformat/avfilter/avutil-*.dll` | FFmpeg 5.x (Codecs, Container) |
| `opencv_*470.dll` (32 DLLs) | OpenCV 4.7.0 — Stitching, Video, Tracking, XFeatures2D, … |
| `MNN.dll` | Alibaba MNN-Inferenz-Engine |
| `onnxruntime*.dll` | ONNX Runtime + CUDA/TensorRT-Provider |
| `nvinfer_10.dll`, `nvonnxparser_10.dll` | TensorRT 10 |
| `cudart64_*.dll`, `cublas*`, `cufft*`, `npp*` | CUDA 10.2/12.0 |
| `DirectML.dll` | DirectML (GPU-Beschleunigung ohne CUDA) |
| `DNG2EXR.dll` | DNG → EXR-Konvertierung |
| `NvEffectSdkCore.dll` | NVAP-Asset-Pakete (Captions, Facemesh, Avatare) |
| `TwirlingAudioEngine.dll` | Audio-Engine |
| `parfait.dll` | Grafik-/Compositing-Schicht |
| `tbb12.dll` | Intel Threading Building Blocks |

### 7.2 Qt6 / Oberfläche
`Qt6Core`, `Qt6Gui`, `Qt6Qml`, `Qt6Quick`, `Qt6QuickControls2`, `Qt6Multimedia`,
`Qt6MultimediaQuick`, `Qt6Network`, `Qt6OpenGL`, `Qt6QuickEffects`,
`Qt6QuickParticles`, `Qt6QuickShapes`, `Qt6QuickTimeline`, `Qt6Svg`,
`Qt6Sql`, `Qt6StateMachine`, `Qt6Xml`, `Qt6ShaderTools`, `Qt6Widgets`,
`Qt6LabsFolderListModel`, `Qt6LabsSettings`, `Qt6QmlLocalStorage`,
`Qt6QmlModels`, `Qt6QmlWorkerScript`, `Qt6QmlXmlListModel`,
`Qt6QuickDialogs2*`, `Qt6QuickLayouts`, `Qt6QuickTemplates2`

### 7.3 Infrastruktur
| DLL | Zweck |
|---|---|
| `libcef.dll`, `chrome_elf.dll` | CEF/Chromium (Web-Dashboard) |
| `7z.dll` | 7-Zip (Asset-Paket-Entpackung) |
| `libcurl.dll`, `cares.dll`, `ssleay32.dll`, `libssl-1_1-x64.dll` | Netzwerk/TLS |
| `alibabacloud-oss-cpp-sdk.dll` | Alibaba Cloud OSS (Cloud-Upload) |
| `WinSparkle.dll` | Auto-Updater |
| `app_guard.dll` | Lizenz-/Integritätsschutz |
| `dbghelp.dll` | Crash-Dumps |
| `quick-look-*.dll` | Datei-Vorschau |
| `vulkan-1.dll`, `vk_swiftshader.dll` | Vulkan / Software-Rendering |
| `d3dcompiler_47.dll` | Direct3D-Shader |

---

## 8. gRPC-Schnittstellen (live verifiziert)

| Port | Dienst | Methoden |
|---|---|---|
| 4096 | `studio-exporter-service.exe` | `service.Export2.Export2/StartExporting`, `ExporterCancel`, `SendHeartBeatPackage` |
| 4098 | `studio-thumbnail-service.exe` | `service.Thumbnail.Thumbnail/SendRequest`, `SendHeartBeatPackage`, `Remove` |

Exporter gebunden an `--pid=<Studio-PID>` mit `--enable_heartbeat`.
**Statuscodes:** 0=OK, 2=EXPORTER_START_FAILURE, 1026=NO_SOURCE_FILE.
**Schema:** vollständig rekonstruiert in `src/proto/export2.proto` (481 Zeilen)
und `src/proto/ins_cloud_export_data.proto`.

**Wichtig (korrigiert):** Der frühere Befund „akzeptiert Jobs, schreibt aber keine
Dateien" war ein Fehler in den Testskripten — sie übergaben das ganze Objekt aus
`discoverExporter()` (`{pid, port, ports}`) als Port, sodass jeder Aufruf mit
`Invalid URL` starb, bevor er den Dienst erreichte. Mit `port` destrukturiert
funktioniert der Export:

* **Foto-/Bildtypen (0–8, 11)** exportieren eigenständig, ohne Projekt und ohne GUI.
  Verifiziert: `exportType 5` (`JPG_SEQUENCE`) mit der Quelle in
  `LocalImageExportParam.sourceGroup.sourceFile` schreibt eine 18.266.497-Byte-JPEG
  (7680×4320). `ExportHeader.savePath` ist ein **Ausgabe-Verzeichnis**, keine Datei.
* **`StartExporting`** antwortet sofort mit `stateCode 1` (RUNNING) und wird über
  `SendHeartBeatPackage` getrieben — ein einzelner Aufruf ohne Herzschläge bewirkt
  nichts.
* **Video-Typen (9, 10)** scheitern mit `EXPORTER_START_FAILURE` in *jedem* getesteten
  UI-Zustand: Kaltstart, Clip im Player geladen, Projekt in Studio geöffnet. Der
  Exporter löst das Material aus seinem internen Projektzustand auf, den weder die UI
  noch eine `.insproj` befüllt. `ExportHeader.materialList` ist **nicht** der
  Medienkanal (mit mehreren `MaterialItem.type`-Werten getestet, ohne Wirkung).
* Der Exporter **stirbt bei einem langen Anfrage-Schwall** und braucht danach einen
  Studio-Neustart.
* Der **GUI-Export bleibt der Weg für Video** (verifiziert).

---

## 9. Projektformate

| Endung | Format | Beschreibung |
|---|---|---|
| `.insproj` | **reines JSON** | Timeline-Projekt (Tracks, Clips, Parameter) |
| `.insprj` | JSON | Footage-Projekt |
| `.insv` | proprietär | Kamera-Video (Dual-Fisheye) |
| `.insp` | proprietär | Kamera-Foto |
| `.ins` | verschlüsselt | KI-Modell |
| `.insnx` | verschlüsselt | KI-Modell (neuer) |
| `.ilut` | binär | LUT-Datei |
| `.cube` | Text | Standard-LUT (I-Log) |
| `.lic` | binär | Lizenz-Blob |
| `.compoundcaption` | NVAP | Asset-Paket |

**`.insproj` ist vollständig les- und schreibbar** — das ist der Hebel für
programmatische Steuerung ohne GUI.

---

## 10. Was das für den MCP-Server bedeutet

### Voll programmatisch steuerbar
- `.insproj`-Projekte lesen/schreiben (Tracks, Clips, Transforms, Trim, Repoint)
- Thumbnails generieren (gRPC 4098, live verifiziert)
- Export-Jobs anstoßen (gRPC 4096, akzeptiert)
- Heartbeat/Cancel
- Filter-Metadaten, LUTs, Presets enumerieren

### Nur über GUI steuerbar
- Tatsächlicher Export (Dialog + Button)
- Medien-Import
- Reframe/Tracking-Interaktion
- Vorlagen-Anwendung

### Nicht zugänglich
- `.ins`/`.insnx`-Modelle (verschlüsselt)
- `.lic`-Lizenz-Blobs (verschlüsselt)
- Studio-Logs (verschlüsselt/komprimiert)
- NVAP-Asset-Inhalte (nur über `NvEffectSdkCore.dll`)

---

## 11. Quellcode-Landkarte (aus `studio_worker.dll` extrahiert)

`studio_worker.dll` enthält **952 eindeutige Quellpfade** aus dem Build
(`C:\jenkins\workspace\Studio_Win\build\studio_src\`). Das ist der komplette
Modulbaum — vollständig in `research/dll_paths.json`.

### 11.1 Modulverteilung
| Modul | Dateien | Bedeutung |
|---|---|---|
| `deps/fcp` | 373 | **Render-/Export-Engine** (FrameCore Plus) |
| `deps/bmg` | 241 | **Algorithmen** (Stitching, Stabilisierung, Codecs) |
| `src/common` | 201 | App-Logik, Modelle, Services |
| `src/app` | 52 | Sub-Worker, Cloud-Export, gRPC-Server |
| `external/rpc` | 20 | gRPC-Protos |
| `deps/exporter` | 20 | Export-Worker |
| `external/cef` | 15 | CEF-Browser-Integration |
| `src/basic` | 9 | Basis-Utilities |

### 11.2 `deps/fcp` — Render-/Export-Pipeline
Vollständige Node-basierte Export-Pipeline (`ExporterRefactor`):

**Video-Nodes:** `optical_flow_insert_frame`, `original_frame_insert_node`,
`media_frame_check_node`, `render_frame_node`, `fframe_sequence_writer`

**Bild-Algorithmus-Filter:** `algo_frame_end`, `auto_exposure`, `beauty`,
`block_denoise`, `deflicker`, `defringe`, `face_detect`, `post_sharpen`,
`sequence_denoise`

**Audio-Filter (12):** `audio_ai_denoise_wind`, `audio_ambisonic`,
`audio_beamforming`, `audio_denoise`, `audio_duck`, `audio_fade_in_out`,
`audio_mixer`, `audio_resample`, `audio_speed`, `audio_voice_enhance`,
`volume_controller`

**Audio-Streams:** `bgm_audio_stream`, `clip_audio_stream`, `clip_mute_stream`,
`dual_track_clip_audio_stream`, `media_audio_stream`, `mix_audio_stream`

**Algorithmen:** `AIRaw`, `BlockDenoise`, `FrameInsert`, `SequenceDenoise`,
`SportsData` (FIT/GPX-Writer), `g01_detection`, `videotags/image_tags`

**Render-Engine (`grv/ARVRender`):**
- Render-Modelle: `SphereRenderModel`, `PlaneRenderModel`,
  `PlaneStitchingRenderModel`, `CompositeRenderModel`
- Renderer: `HybridRender`, `SceneRenderer`, `PgaRenderThread`
- Filter: `BeautyFilter`, `AeFilter`, `PostSharpenFilter`, `PIPFilter`,
  `DePurpleFringeFilter`, `BlockDenoiseFilter`, `SingleFrameDenoiseHandle`,
  `Transform2DFilter`
- Texturen: `CudaNV12TextureLoader`, `Nv12TextureLoader`, `RgbTextureLoader`,
  `Yuv420pTextureLoader`, `CudaTextureReader`, `OryolTextureReader`
- Farbkonvertierung: `ColorConverter`, `PreYuvToRgbConverter`,
  `RgbToYuvConverter`, `HdrToSdrLut`

**3D-Engine (`arvoryol`):** Eigenständige Oryol-basierte Engine mit
`Gfx` (GL/GLES), `RenderPassPool`, `InteractionDispatcher`, `Looper`,
`MeshBuilder`, `velocityTracker` (Gesten) — verantwortlich für die
interaktive 3D-Ansicht im Reframe-Modus.

**Animation:** `auto_animation`, `pano_trans_plus`, `continuous_bezier_spline`,
`section`-Protos

**UnderWaterColor:** `under_water_color_filter`, `under_warter_precompution2`,
`data_tuple.pb` — der Unterwasser-Farbkorrektur-Algorithmus.

### 11.3 `deps/bmg` — Algorithmen-Kern
**Stabilisierung:** `GyroFilter`, `Stabilizer`, `HorizontalCorrector`,
`PrecomputeStabilization`, `RuntimeStabilization`, `LiveStabilization`,
`FixedExposureRawData`, `FixedGyroRawData`, `FixedThreeARawData`,
`FixedTimeMapRawData`, `GyroTimeConverter`, `StabQuatCache`, `StabCloudCache`

**Stitching:** `DynamicStitcher`, `StitchFusion`, `StitchMap`,
`FisheyeModel`, `CameraLensType`, `PlaneView`

**ExtraInfo (Metadata-Container):** `gyro_data_parser`, `offset_serializer`,
`v1/v2/v3_reader` — **Versionen 1–3 des ExtraInfo-Formats**, plus
`PBExtraData.pb` (Protobuf), `af_lens_info`, `capture_beauty_info`,
`editinfo_list`, `extra_recipe`, `offset`, `window_crop_info`

**Codec:** `FFmpegDecoder`, `FFmpegEncoder`, `H264MetaBsfFilter`, `MFCodec`
(Media Foundation), `ProResEncoder`, `mjpeg_demuxer`, `muxer`, `demuxer`,
`hwaccel_util`, `d3d11_resize`

**MultiTile:** `CubePlaylist`, `CubePyramidUtil`, `DynamicStreamCubeDecoder`,
`GridTileDecoder`, `MultiTileAssetReader`, `MultiTileDecoder`,
`TileDemuxerPool`, `TileFFmpegDemuxer`, `StreamTimeline`

**Preview3:** `Previewer3`, `PwClip`, `PwWorker`, `PwDecoderPool`,
`PwEditorSession`, `PwPlaybackTracker`, `PwRenderTrack`, `PwTaskQueue`,
`PwTrackPolicy`, `PwFrameReader`, `PwFrontCacheReader`

**Audio:** `AIDenoiseWindFilter`, `AmbisonicFilter`, `AspAlignFilter`,
`AudioDenoise`, `AudioDuck`, `AudioMixer`, `AudioSampleDenoise`,
`BeamformingAudioFilter`, `MobvoiDspWrapper`, `RnnDenoiseFilter`,
`SisoFilter`, `SpatialAudioFilter`, `VoiceEnhanceFilter`

**Bild:** `UHdrImageWriter`, `UHdrJpegReader`, `IDRFrameDecoder`,
`DNG2EXR`

### 11.4 `src/app` — Services & Cloud
**gRPC-Server:** `export2_grpc_service_impl.cpp`, `exporter_application.cpp`,
`export_param_convert_helper.cpp`, `union_exporter.cpp`

**Exporter:** `project_exporter2.cpp` (Timeline), `video_trim_exporter2.cc`,
`photo_runnable_exporter.cc`, `image_export_context.cc`,
`photo_sequence_merger.cc`, `photo_sequence_render.cc`,
`render_model_creator2.cpp`, `runnable_exporter.cc`

**Thumbnail:** `thumbnail_grpc_service.cpp`, `footage_thumbnail_service.cc`,
`thumbnail_loader.cc`

**Cloud-Export:** `cloud_export_handler.cpp`, `cloud_export_manager.cpp`,
`cloud_export_command/create_exporter_command.cpp`, `cloud_export_progress_poller`

**Cloud-Protos (8):** `ins_cloud_export_data`, `ins_cloud_export_filter`,
`ins_cloud_export_dashboard`, `ins_cloud_special_effect`,
`ins_export_information`, `ins_one_shot_data`, `ins_player_edit_data`,
`ins_cloud_export_data`

### 11.5 `src/common` — Feature-Module
**Reframe/AutoFrame:** `frame_analyzer`, `lead_direction_analyzer`,
`multi_target_analyzer`, `saliency_target_analyzer` — automatisches Reframing
**DeepTrack:** `deep_tracker`, `deep_track_db`, `deep_track_area`,
`headtrack2keyframe_generator`
**Dashboard:** `dashboard_web_export`, `dashboard_garmin` (Garmin FIT),
`dashboard_gpx` (GPX), `dashboard_motion_assistant`
**Filter:** `meishe_asset_manager`, `meishe_effect_filter`,
`meishe_transition_filter` — **Meishe-SDK** für Effekte/Übergänge
**Denoise:** `denoise_service`
**Stabilizer:** `smart_stabilizer`, `stabilization_service`,
`stabilizer_factory`
**Stitching:** `stitching_service`
**View Projection:** `view_projection_service`, `dewarp`
**Import:** `footage_import_service`, `sd_card_edit_info`
**Logo/Watermark:** `logo_service`, `ag_watermark_asset_prefetcher`
**Share:** `chunk_file_upload_douyin` (TikTok/抖音-Upload)
**Metadata:** `metadata_writer`, `metadata_cache`, `insta_metadata`,
`video_metadata`, `image_metadata`, `hightlight_metadata_loader`
**Pureshot:** `pureshot_processor`, `pureshot_render_model_resolver`
**Star Trail:** `star_trail_processor`
**HDR:** `raw_hdr_processor`, `raw_hdr_aeb_processor`
**Export:** `export_task_params`, `space_checker`
**Settings:** `project_settings`, `project_setting_manager`,
`timeline_settings`, `stitching_settings`, `dynamic_fov_manager`

---

## 12. Audio-Feature-Set (vollständig)

Aus `deps/fcp` + `deps/bmg`:

| Feature | Implementierung |
|---|---|
| AI-Windgeräusch-Unterdrückung | `audio_ai_denoise_wind_filter` |
| Ambisonic (360°-Audio) | `audio_ambisonic_filter`, `AmbisonicFilter` |
| Beamforming | `audio_beamforming_filter`, `BeamformingAudioFilter` |
| Audio-Denoise | `audio_denoise_filter`, `AudioDenoise` |
| Ducking (Auto-Absenkung) | `audio_duck_filter`, `AudioDuck` |
| Fade In/Out | `audio_fade_in_out_filter` |
| Mixer | `audio_mixer_filter`, `AudioMixer` |
| Resampling | `audio_resample_filter` |
| Geschwindigkeit | `audio_speed_filter` |
| Voice Enhance | `audio_voice_enhance_filter`, `VoiceEnhanceFilter` |
| Lautstärke | `volume_controller_filter`, `AudioVolume` |
| Spatial Audio | `SpatialAudioFilter` |
| Siso-Filterkette | `SisoFilter`, `SisoFilterChain` |
| Mobvoi DSP | `MobvoiDspWrapper` |
| BGM-Track | `bgm_audio_stream` |
| Dual-Track | `dual_track_clip_audio_stream` |
| Mute | `clip_mute_stream` |

**Audio-Engine:** `TwirlingAudioEngine.dll`, `OpenAL32.dll`

---

## 13. Export-Pipeline (Node-Graph)

Der Export ist ein **gerichteter Node-Graph** in `deps/fcp/Src/Media/ExporterRefactor`:

```
Preprocess → Video/Node → RenderNode → Writer
    ↓
project_preprocessor → clip_time_preprocessor → clip_frame_preprocessor
    ↓
ImageAlgoNode (Filterkette): face_detect → beauty → denoise → sharpen → defringe
    ↓
FeatureNode: optical_flow_insert_frame | original_frame_insert
    ↓
RenderNode: media_render_node | media_plane_render_node | cutscene_handler
    ↓
Writer: fframe_sequence_writer
```

**Breakpoint-Resume:** `BreakpointResume/breakpoint_file_handle` — Export
kann unterbrochen und fortgesetzt werden.

**Time-Map:** `curvespeed_time_mapper` — Speed-Ramps im Export.

---

## 14. Offene Punkte

**Erledigt (siehe `APPS_AND_ASSETS.md`, `AI_MODELS.md`):**
- `.rcc`-Ressourcen vollständig ausgepackt (951 Dateien, 37 MB) — enthält
  **keine QML-Quellen**, nur Assets. JSON-Tabellen sind zlib-komprimiert und
  wurden dekodiert; daraus die Kamera-/FOV-Fähigkeitsmatrix gebaut.
- `data/web_dashboard` erschlossen (Sport-Dashboard, 69 Widgets, 25 Themes).
- Die Hilfsprogramme identifiziert: `studio_utility.exe` (HW-Beschleunigungs-Prober),
  `app_detector.exe` (GPU-Treiber-Detektor), `quick-look.exe` + `-daemon.exe` (Player).
- Öffentliche Config-Endpunkte abgerufen (Feature-Gates, GPU-Treiber-Matrix).
- **NVAP-Format** entschlüsselt: 16-Byte-Header (`NVAP`, Version 2, headerLen 16,
  count = Anzahl ZIP-Einträge) + Chunk-Tabelle + eingebettetes ZIP mit nur
  lokalen File-Headern. Inhalt: Storyboard-XML je Seitenverhältnis (die
  eingebrannte Filter-Namenskarte) + PNG-Hintergrund. 16 von 44 Containern
  auslesbar, 77 valide Einträge.
- **`data/*.xml` SVM-Zweck** aufgelöst: alle 12 Dateien sind lineare
  Regressionsmodelle (`EPS_SVR`/`LINEAR`/`sv_total=1`). Die in der DLL
  eingebettete Modell-Registry nennt Klarnamen: Tauchgehäuse-Erkennung
  (`diveClassifyModel_*`), Objektivschutz-Erkennung (`heat*Bare`/`heat*Protector`),
  Floaty/Stick (`floatyStickModel`), Batterietyp (`ONERBatteryClassifyModel`).
- **`heatX5_d1790022.xml`** = `heatX5`, id 8009 — X5-Variante der
  Objektivschutz-Erkennung.
- **KI-Modell-Registry vollständig extrahiert**: 256 Einträge, 188 mit
  Klartextnamen — die komplette KI-Funktionsfläche (40 Detektoren, 17 Tracking-,
  14 Klassifikations-, 7 Re-ID-, 6 Defringe-Modelle u. a.).

**Weiter offen:**
1. **QML-UI-Quellcode** — kompiliert in `Insta360 Studio.exe`, nicht als Quelle
   rekonstruierbar; nur die Asset-Ebene ist zugänglich.
2. **NVAP-Offset-Patchlogik** — bei 28 der 44 Container (alle Sticker, plus die
   `.compoundcaption` von X6, Ace Pro3, B2, DE, Z03, Z05) lassen sich die
   Central-Directory-Offsets nicht auflösen; ein Offset-Brute-Force über die
   ersten 1200 Bytes findet ebenfalls keinen gültigen Archivstart.
3. **`data/b56efdaa/*.ins`** — 9 Blobs, Kopf `u32` + `float32` (z. B. 4992.0 /
   2700.0 = Bildmaße), kein NVAP. Vier Dateien sind byte-identisch
   (824027 B), zwei weitere (3296096 B) ebenfalls — Varianten unter
   verschiedenen Hashes. Zweck noch nicht bestimmt.
4. **Sport-Dashboard-Steuerung** — 69 Widgets/25 Themes bekannt, aber nur über
   GUI/CEF ansteuerbar, keine API.
