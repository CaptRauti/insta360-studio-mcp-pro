# Insta360 Studio — KI-Modell-Registry

**Werkzeug:** `research/modelreg.py` → `research/model_registry.json`
**Quelle:** `studio_worker.dll`, drei eingebettete Kopien einer JSON-Registry
**Umfang:** 256 Modelleinträge (188 mit Klartextnamen, 68 verschlüsselt)

## Warum das wichtig ist

Die Modelldateien selbst heißen `0810e5c7.xml`, `a2-WdzMdTnd4Mzi4mzeoVN.insnx`
und ähnlich — reine Hashes bzw. obfuskierte Namen. Die Registry in der DLL ist
die **einzige Stelle, an der der Zweck überlebt**. Damit sind die
Hash-Dateien unter `data/` semantisch zuzuordnen.

## Format

```json
{
    "id": 8005,
    "is_encrypt": false,
    "xml_model": {
        "model": "heat57KBare_0810e5c7.xml"
    }
}
```

- Das Gruppenfeld (`mnn_model`, `xml_model`, `onnx_model`, `snpe_model`,
  `json_info`) nennt die **Laufzeit**, die die Datei lädt. 236 × MNN
  (Alibaba, CPU/NPU), 17 × OpenCV-XML, 2 × json_info, 1 × SNPE
  (Qualcomm DSP).
- `is_encrypt: true` → obfuskierter Dateiname; das ist **dieselbe id** in
  einer anderen Variante (verschlüsseltes Gegenstück zum Klartext-Eintrag).
- Die id-Bereiche sind funktional gruppiert: 1–130 Alltags-Modelle,
  197–234 Export/Defringe, 500/501 Konfiguration, 1000–1005
  Beauty/Skin, 8001–8011 OpenCV-XML (Kamera-Zustandserkennung),
  13001/13002 Selfie-Stick, 16001/2000 Super-Resolution & ONNX,
  23001–27005 On-Device-Pakete.

## Aufgelöste OpenCV-XML-Modelle (`data/*.xml`)

Alle 12 `opencv_ml_svm`-Dateien sind **lineare Regressionsmodelle**
(`svmType=EPS_SVR`, `kernel=LINEAR`, `C=0.01`, `sv_total=1`), also ein
Gewichtsvektor pro Datei — keine Klassifikatoren. Die Registry löst sie auf:

| Datei | id | Zweck |
|---|---|---|
| `ONERBatteryClassifyModel_2d11374b.xml` | 8001 | Batterietyp-Erkennung ONE R |
| `diveClassifyModel_X3Ver2_f2ed1811.xml` | 8002 | Tauchgehäuse-Erkennung X3 |
| `diveClassifyModel_X5_2780de8f.xml` | 8003 | Tauchgehäuse-Erkennung X5 → `2780de8f.xml` |
| `diveClassifyModel_c6ddd9e6.xml` | 8004 | Tauchgehäuse-Erkennung, generisch |
| `heat57KBare_0810e5c7.xml` | 8005 | 5,7K **ohne** Objektivschutz → `0810e5c7.xml` |
| `heat57KProtector_0d7d8781.xml` | 8006 | 5,7K **mit** Objektivschutz |
| `heat8KBare_e6e1de02.xml` | 8007 | 8K **ohne** Objektivschutz → `e6e1de02.xml` |
| `heat8KProtector_ebb3a394.xml` | 8008 | 8K **mit** Objektivschutz |
| `heatX5_d1790022.xml` | 8009 | X5 |
| `floatyStickModel.xml` | 8010 | Floaty/Selfie-Stick |
| `diveClassifyModel_X5_torchmode_b43fd570.xml` | 8011 | Tauchgehäuse X5, Torch-Modus |

Zusätzlich existiert eine zweite Tabelle, die Kurzschlüssel auf XML-Pfade
abbildet: `1.0`, `2.1`, `2.5`, `2.6`, `3.0` sowie `10`, `_3D`, `ALL`, `SAD`
→ `/data/<hash>.xml`. Die Schlüssel sind Kamera-/Linsen-Generationen.

**Zu `heat*`:** je Auflösungsklasse existiert ein `Bare`- und ein
`Protector`-Paar. Das legt nahe, dass damit erkannt wird, ob der abnehmbare
Objektivschutz montiert war (Bare = ohne, Protector = mit). Das ist aus der
Namensgebung **geschlossen**, nicht aus dem Code bewiesen.

`heatX5_d1790022.xml` ist damit auch der offene Punkt aus `INVENTORY.md` —
aufgelöst.

## Katalog nach Aufgabe (Klartext-Modelle)

| Aufgabe | Anzahl | Beispiele |
|---|---|---|
| Objekterkennung (`det_*`) | 40 | `det_person`, `det_face`, `det_head`, `det_pet`, `det_animal`, `det_ball`, `det_car`, `det_horse`, `det_baby`, `det_child`, `det_basketball`, `det_vehicle_sport`, `det_landscape`, `det_building_sculpture`, `det_facemask`, `det_scene` |
| Tracking | 17 | `lighttrack_shufflenetv2`, `siamrpn_*`, `light_head/search/template` |
| Klassifikation (`cls_*`) | 14 | `cls_upview`, `cls_view`, `cls_planet`, `cls_symmetry`, `cls_scene`, `cls_gesture`, `cls_age`, `cls_emotion`, `cls_expression`, `cls_occlusion`, `cls_places` |
| Re-Identifikation | 7 | `reid-0.02GFLOPs-*`, `reid_b35491f9` |
| Video-Segmentierung | 6 | `key_encoder`, `value_encoder`, `segment` |
| Defringe | 6 | `defringe_mnn`, `defringe_hr_dynamic`, `defringe_lr_dynamic` |
| Szenenerkennung | 5 | `mobilenetv2_places122`, `imagenet156`, `pov4`, `bkb` |
| Retusche / Objektentfernung | 4 | `model_clean_v5`, `model_clean_v2_5`, `model_clean_de` |
| Segmentierung (`seg_*`) | 3 | `seg_sky`, `seg_selfie_stick`, `seg_license_plate` |
| Pose | 3 | `pose_mnet_v8`, `pose_person_1640M` |
| Audio | 3 | `vad_` (Sprachaktivität), `wavebeat_` (Beat-Erkennung) |
| Denoise | 3 | `raw_denoising`, `denoise_raw_plus`, `jpg_denoise` |
| Regression (`reg_*`) | 3 | `reg_landmark` (Gesichtslandmarken), `reg_beauty` |
| Anonymisierung | 3 | `ano*` (MNN/DSP-Varianten) |
| Person | 2 | `person_segmentation`, `person_head` |
| Bildqualität | 2 | `nima_*` (Ästhetik-Score) |
| Auto-Weißabgleich / Farbe | 2 | `amc_avg_underwater`, `amc_avg_scene59` |
| Super-Resolution | 2 | `model_export`, `model_export_v22` |
| Haut / Beauty | 2 | `SkinEnhance_MobileNetV3` (MNN + SNPE), `face_retouch` |
| Einzelne | 8 | `flow_bino_stitch` (Optical Flow Stitching), `lut_`, `lama_regular_cut` (Inpainting), `occlusion_`, `tsm_hl` (Aktionserkennung), `pov_138e`, `relic_reg_mbnv2`, `autobgm_`, `orient_`, `neural_preset_` (Style-Transfer), `deepfeat_`, `saliency_`, `action_twohead_`, `mbv2_car_orientation_` |

Das ist die vollständige KI-Funktionsfläche der Software: Personenerkennung und
-Tracking (auch im 360-Grad-Bild), Objektverfolgung per DeepTrack, Selfie-Stick-
Segmentierung, Himmel-Segmentierung, Sky-Replacement, Auto-Cut,
Gesichts-Retusche, Objektentfernung, Super-Resolution, Defringe,
Tauchgehäuse- und Objektivschutz-Erkennung, Audio-Beat-Erkennung.

## Konsequenz für die Automation

Die Modelle sind **nicht** direkt aufrufbar — kein Export, keine CLI, kein
gRPC-Endpunkt dafür. Sie laufen intern im Worker-Prozess. Steuerbar sind sie
ausschließlich über die zugehörigen UI-Schalter, also über die
GUI-Automation (`src/ui.mjs`). Die Registry ist damit Referenzwissen: sie sagt,
welche Schalter überhaupt existieren und was sie im Hintergrund auslösen.
