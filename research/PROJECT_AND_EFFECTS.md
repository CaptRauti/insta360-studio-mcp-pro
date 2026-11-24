# Der lokale Projekt- und Effektpfad

Stand: gegen Studio 6.0.9, mit einem echten Projekt (`mcpTest`) als Belegquelle.
Diese Datei korrigiert eine frühere Fehlannahme: **Timeline-Bearbeitung, Effekte,
Übergänge und Sound sind NICHT cloud-gebunden.** Alles liegt lokal und ist lesbar
und schreibbar.

## 1. Wo das Projekt liegt

`AppData/Local/Insta360/Insta360 Studio/nle/pro.insproj` ist **nur die Projektliste**
(Name, fps, Frames, `projectPath`). Das eigentliche Projekt liegt unter
`projectPath` als `<projekt-id>.insproj` — reines JSON, ~64 KB für vier Clips.
Daneben `<id>_backup.insproj` und `project_album_info.data`.

Das `.insproj` im **Installationsverzeichnis** (2,3 KB, ohne `tracks`) ist ein
anderes, schlankeres Format — nicht verwechseln.

## 2. Was drin steht (gemessen an `mcpTest`)

```
tracks[]                     2 Spuren (type 0 = Video, type 2 = Audio, z = Ebene)
  clips[]                    4 Clips
    id, name, url            Clip-Identitaet + Quelldatei (F:/Luna/VID_*.mp4)
    startFrame               904 / 1241 / 1661 -> Position in der Timeline
    sourceFrames,
    source_total_frames      904 / 337 / 420 / 1780
    leftTrim, rightTrim      Schnitt
    effect_filter            externfilterId, externfilterName,
                             externfilterOpacity, externfilterResourcePath
    media_process            56 Felder: enableLut, enableColorPlus,
                             enableBeautyMode, enableMotionBlur,
                             enableUnderWaterCorrect, enableMultiFrameDenoise,
                             colorAdjust* (15 Regler), enableLocalToneMapping ...
    deep_track               KI-Tracking, eigener save_path
    stab_setting             Stabilisierung (enableStab, stabLevel, FPV ...)
    dewarp_setting           current_dewarp_type (Weitwinkel/Superweitwinkel/
                             TinyPlanet ...), removeDistortion
    camera_transform         distance, eulers (pitch/roll/yaw), fov
    audio_setting            volume, fade in/out, Denoise-Typ
    key_frame_track          Keyframes (leer = keine)
    play_rate_track          Zeitlupe/-raffer
  transitions[]              id, prevClip, nextClip, resourceId, path,
                             frames/maximumFrames/minimumFrames, type
```

Ein Clip hatte bereits einen echten Effekt aktiv: `HD Fireworks` /
`Fireworks I`, Opacity 70, Ressourcenpfad in `Studio/Download/filter/...`.
**Kein Cloud-Feld daran.**

## 3. Die lokale Bibliothek

`D:/Dokumente/Insta360/Studio/Download/` (Größe gemessen):

| Ordner | Inhalt |
|---|---|
| `effect/` | 260 Einträge |
| `transition/` | 134 Einträge (je `resourceId`/`<ordner>` mit Cover jpg+webp) |
| `filter/` | 5 LUTs als `.cube.binary` (+ `cover/` mit Vorschaubildern) |
| `audio/`, `imported_audio/` | Sound |
| `sticker/`, `text/`, `movement/`, `operation/`, `watermark/` | Sticker, Text, Bewegung |

## 4. Der lokale API-Zweig kennt das alles

`ExportParams` hat drei Felder:

```
1 exportHeader      (ExportHeader)        -> taskId, savePath, protoMd5, width, height ...
2 mainParams        (CloudExportData)     -> der Cloud-Zweig
3 localExtraParams  (LocalExtraParams)    -> der lokale Zweig
```

Der lokale Zweig trägt in `LocalExtraParams.videoExportParam` den
`LocalVideoExportParam` — **und dessen Feld 7 ist `clipIndex`**. Dazu
`exportType` (1), `videoFxZOrder` (4).

Die eigentliche Clip-/Effekt-/Sound-Nutzlast liegt in `ExportClipInfo`:

```
ExportClipInfo
  1 clipInfos[]     -> ClipInfo  (26 Felder: sourceGroup, timelineSetting,
                                   stitchingSetting, audioSettings, userSettings,
                                   color_adjust_setting, time_water_mark, ...)
  2 bgm_clip[]      -> BgmClip   (url, position_in_media_time_ms,
                                   start_src_time_ms, end_src_time_ms, volume,
                                   afade_in/out_duration_ms, music_id)
  3 text_clips[]    -> TextClip  (text_params, position_param, url, start_ms,
                                   duration_ms, id, effect_id)
  4 sticker_clips[] -> StickerClip (position_param, url, start_ms, duration_ms,
                                   id, effect_id, flip, in/out/period-Animation
                                   mit Id und Dauer)
```

`TimelineSetting` (in `ClipInfo` Feld 2) trägt:

```
1/2  trim_start / trim_end        7/8 media_trim_start / media_trim_end
6    duration_ms
3    view_segments[]              -> Kamerafahrt
4    play_rate_segments[]         -> Geschwindigkeit
5    transition_segment[]         -> TransitionSegment(startKeyFrameId,
                                     endKeyFrameId, funcType, p1, p2)
12   camera_movement_segment[]
```

Dazu `ColorAdjustSetting` (12 Regler, `enable_adjustment`),
`UserSettings` (`remove_grain_enabled`, `ai_raw_enable`, `is_silent`,
`interpolation_type`, Audio-Mischung), `MovementTemplateData` für
Bewegungsvorlagen (Keyframes + Transitions) — und als `ViewDataType`
ausdrücklich `DeepTrack` (KI-Tracking) und `MovementTemplate`.

**`ExportClipInfo` wird von `ExportRequest.exportInfo` (Feld 2) getragen.**
`ExportRequest` gehört zur `service.Export`-Familie, nicht zu `Export2`.

## 5. Warum der Videoexport bisher scheitert — und was daraus folgt

Bisheriger Befund: `VIDEO(9)`/`VIDEO_CLIP(10)` antworten in jedem getesteten
UI-Zustand mit `EXPORTER_START_FAILURE`; nur Foto-/Bildtypen schreiben Dateien.

Der Deskriptor erklärt das jetzt:

- `LocalVideoExportParam` hat **kein Quellfeld**, nur `clipIndex` — der lokale
  Videoexport adressiert einen Clip **im internen Projektzustand des Exporters**.
- `Export2.StartExporting` (`ExportParams` → `ExportReply`) kann diesen Zustand
  über den Request offenbar nicht setzen, sonst hätte ein geladenes Projekt
  gereicht.
- Die Nutzlast, die Clips, Effekte, Text, Sticker und Sound tatsächlich
  transportiert (`ExportClipInfo`), hängt an `ExportRequest` aus der
  **`service.Export`-Familie** — einer anderen Service-Familie als die live
  laufende `Export2`.

**Nächster Messschritt:** prüfen, ob `service.Export` (mit `ExportRequest`,
`ExportClipInfo`, `ExportParam`) überhaupt einen Listener hat. Bisher ist nur
`Export2` (4096) und Thumbnail (4098) bekannt. Falls `Export` erreichbar ist,
ist das der Weg zum vollständigen lokalen Projekt-Export ohne GUI — mit
Effekten, Text, Stickern, Sound und Schnitt. Falls nicht, ist der Weg: Projekt
per `.insproj` schreiben, in der GUI öffnen, GUI-Export fahren (funktioniert
nachweislich).

## 6. Praktische Konsequenz für das MCP-Projekt

Die Annahme "Effekte gehen nur über die Cloud" ist widerlegt. Offen und messbar:

1. `service.Export` auf Erreichbarkeit prüfen (Ports/Listener des Exporters).
2. `.insproj`-Schreibpfad bauen: Clip-Trim, Transition, Effekt-Referenz,
   Audio-Lautstärke — und prüfen, was Studio beim Lesen akzeptiert.
3. Effekt-IDs aus `Download/` (260 Effekte, 134 Transitions) als Katalog
   aufbereiten, damit ein Aufrufer Namen statt Pfade angeben kann.
