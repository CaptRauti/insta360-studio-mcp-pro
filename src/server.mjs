#!/usr/bin/env node
// Insta360 Studio MCP server — drives the app's real gRPC services instead of
// screenshot clicking.
//
// Architecture note: Insta360 Studio ships two helper services
// (studio-exporter-service.exe, studio-thumbnail-service.exe) that speak gRPC
// on dynamically assigned localhost ports. The proto descriptors are embedded
// in Insta360 Studio.exe and were recovered from there (see proto/export2.proto).
// Projects are plain JSON (.insproj), so everything an agent needs — retime,
// repoint, re-aim, export, thumbnail — is reachable without the Qt canvas.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { existsSync, readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";

import {
  EXPORT_TYPE,
  STABILIZATION_TYPE,
  STITCH_TYPE,
  buildExportHeader,
  buildExportParams,
  buildLocalExtraParams,
  buildLocalImageExportParam,
  buildLocalVideoExportParam,
  buildSourceGroup,
  buildStitchingSetting,
  cancelExport,
  decodeExportReply,
  heartbeat,
  requireExporterPort,
  startExporting,
} from "./exporter.mjs";
import { discoverExporter, discoverThumbnail, portOpen } from "./grpc-client.mjs";
import { LOCATION_KEYS, getPref, prefsFile, readPaths, readPrefs, setPref, studioGuiRunning } from "./prefs.mjs";
import {
  findProjects,
  getClipTransform,
  projectSources,
  readProject,
  repointClip,
  setClipTransform,
  summarizeProject,
  trimClip,
  writeProject,
} from "./project.mjs";
import { addKeyframe, hasKeyframes, listKeyframes, removeKeyframe, toDegrees, toRadians, transitionNodes } from "./keyframes.mjs";
import { clipOrder, readTransitionManifest, removeTransition, scanTransitionAssets, setTransition, transitionRoot, transitionState } from "./transitions.mjs";
import { checkProject, RULES, UNVERIFIABLE } from "./preflight.mjs";
import { clearFilter, filterRoot, filterState, readFilterManifest, scanInstalledFilters, setFilter } from "./filters.mjs";
import {
  removeThumbnail,
  requestThumbnail,
  requireThumbnailPort,
  sendSceneDetect,
  thumbnailHeartbeat,
} from "./thumbnail.mjs";
import {
  DEFAULT_OUT_DIR,
  analyzeShot,
  capture as uiCapture,
  click as uiClick,
  scroll as uiScroll,
  moveWindow as uiMoveWindow,
  runExport,
  sendKeys as uiSendKeys,
  sleep as uiSleep,
  uiState,
  waitForExport,
  windowInfo as uiWindowInfo,
} from "./ui.mjs";
import {
  cameraAngles,
  cameraCaps,
  describeCamera,
  listCameras,
  validateFov,
} from "./camera.mjs";
import { studioDir, studioExe, studioInfo } from "./studio-path.mjs";
import {
  LOG_AREAS,
  grepLogs,
  listCrashDumps,
  listLogAreas,
  listSessions,
  readLogTail,
  readLogWindow,
} from "./logs.mjs";
import { findText, ocrImage } from "./ocr.mjs";
import { closeControl, isPickerField, isTextBox, openControl, readDialog, selectOption, setText } from "./export-dialog.mjs";
import { readQueue, addToQueue, clearQueue, clickQueueButton } from "./export-queue.mjs";
import { classifyLogText, explainPattern } from "./media-errors.mjs";
import { decodePreset, describePreset, readPresetModel } from "./export-model.mjs";
import { openProjectAt } from "./pipeline.mjs";
import { findMediaProjects, readMediaProject, summariseMediaProject } from "./insprj.mjs";

// The install directory is resolved at call time (see studio-path.mjs): Studio
// 6.0.9 moved from Program Files to %LOCALAPPDATA%\Insta360\Apps, and the old
// path is left behind as an empty folder, so a hardcoded value silently breaks.
const STUDIO_PROJECT_ROOT =
  process.env.INSTA360_PROJECT_ROOT ?? "D:\\Dokumente\\Insta360\\Studio";

const server = new McpServer({
  name: "insta360-studio-mcp-pro",
  version: "1.0.0",
});

/** Wrap a handler so thrown errors become MCP tool errors, not crashes. */
function tool(name, config, handler) {
  server.registerTool(name, config, async (args) => {
    try {
      const result = await handler(args ?? {});
      return {
        content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `${err.name ?? "Error"}: ${err.message}` }],
      };
    }
  });
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

tool(
  "studio_status",
  {
    description:
      "Report whether Insta360 Studio and its gRPC helper services are running, on which ports, and whether the install path exists.",
    inputSchema: {},
  },
  async () => {
    const exporter = discoverExporter();
    const thumbnail = discoverThumbnail();
    const exporterOpen = exporter ? await portOpen(exporter.port) : false;
    const thumbnailOpen = thumbnail ? await portOpen(thumbnail.port) : false;
    return {
      studioDir: studioDir(),
      studioDirExists: Boolean(studioDir() && existsSync(studioDir())),
      studioExeExists: Boolean(studioExe() && existsSync(studioExe())),
      studioInstall: studioInfo(),
      exporter: exporter ? { ...exporter, reachable: exporterOpen } : null,
      thumbnail: thumbnail ? { ...thumbnail, reachable: thumbnailOpen } : null,
      projectRoot: STUDIO_PROJECT_ROOT,
      projectRootExists: existsSync(STUDIO_PROJECT_ROOT),
      ready: Boolean(exporterOpen),
    };
  },
);

tool(
  "studio_prefs",
  {
    description:
      "Read — and, with care, set — Insta360 Studio's own settings, which live in one plain INI file (`startup.ini` under %LOCALAPPDATA%\\Insta360\\Insta360 Studio). This is where the locations the manual calls `Project File Save Path` and the media/export folders really are ([preference]: workspace_location, footage_project_location, project_location, export_location, last_visit_dir), together with the codec and hardware switches that decide how an export is rendered ([codec]: hardware_decoding_preview, hardware_encoding_export, hardware_encoding_h265_export, cuda_accel, hardaware_model), the UI language and theme ([ui], [preference] lang). action=read dumps the sections, action=paths gives the five locations with each directory's existence checked, action=get resolves one key, action=set rewrites a single line in place (keeping every other byte, with a .bak copy). set REFUSES while Studio is running because Studio rewrites the file from memory when it exits — close Studio first, or pass force=true when you know the change is meant to be transient. action=audio answers the audio question the same way: Studio 6.0.9 persists audio settings nowhere readable (measured — not in startup.ini, not in the nle JSON files, not in the CEF storage), so it reports which files it searched and what each one really holds, plus the documented rows and how to read the live values, instead of returning an empty object that looks like 'no settings'.",
    inputSchema: {
      action: z.enum(["read", "paths", "get", "set", "audio"]).optional().describe("What to do (default read)"),
      section: z.string().optional().describe("INI section, e.g. preference, codec, ui (read/get/set)"),
      key: z.string().optional().describe("Setting name (get/set)"),
      value: z.string().optional().describe("New value (set)"),
      force: z
        .boolean()
        .optional()
        .describe("set: write even though Studio is running (the change will be lost when it exits)"),
    },
  },
  async ({ action = "read", section, key, value, force = false }) => {
    const file = prefsFile();
    switch (action) {
      case "paths":
        return { ...readPaths({ file }), knownLocationKeys: LOCATION_KEYS };
      case "get": {
        if (!key) throw new Error("key is required for action=get");
        return getPref(key, { file, section });
      }
      case "set": {
        if (!key) throw new Error("key is required for action=set");
        if (value === undefined) throw new Error("value is required for action=set");
        return setPref(key, value, { file, section, force });
      }
      case "audio": {
        // Measured on 6.0.9 (2026-11-26): audio settings are persisted **nowhere** an
        // agent would look. Rather than return an empty object — which reads like "no
        // settings to see" — this walks the witnesses and reports what each one actually
        // holds, so the next person does not hunt for a file that does not exist.
        const root = path.dirname(file); // %LOCALAPPDATA%\Insta360\Insta360 Studio
        const witness = (p, holds) => {
          const full = path.join(root, p);
          if (!existsSync(full)) return { file: p, exists: false, holds };
          let keys = null;
          try {
            const parsed = JSON.parse(readFileSync(full, "utf8"));
            keys = Array.isArray(parsed)
              ? [`<array of ${parsed.length}>`]
              : Object.keys(parsed).slice(0, 12);
          } catch {
            keys = null; // INI or binary: the section list says enough
          }
          return { file: p, exists: true, holds, topLevelKeys: keys };
        };

        // readPrefs returns a wrapper around a missing section (`sectionMissing: true`,
        // `sections: {}`) — counting its keys would report "persisted" for a section
        // that does not exist. Measured: on 6.0.9 there is no [audio] section at all.
        const iniAudio = readPrefs({ file, section: "audio" });
        const iniValues = iniAudio?.sections?.audio ?? iniAudio?.values ?? {};
        const persisted = !iniAudio?.sectionMissing && Object.keys(iniValues).length > 0;
        return {
          persisted,
          iniSection: { name: "[audio]", values: iniValues },
          searched: [
            witness("startup.ini", "Ausgabepfade, Codec-/Hardware-Schalter, UI-Sprache, Theme — keine Audio-Schlüssel"),
            witness(path.join("nle", "user_preference.json"), "Vorschau-Hardwarebeschleunigung und Projekt-fps der Sitzung"),
            witness(path.join("nle", "video_export_preset_model.json"), "Export-Dialog: Codec/Farbraum/fps/Auflösung/Bitrate je Slot"),
            witness(path.join("nle", "pro.insproj"), "Projekt-Index: Name, Seitenverhältnis, fps, Frames, Trim, Wasserzeichen"),
          ],
          documented: {
            source: "Handbuch operation-guide/preference-settings/audio-settings (+ en-US.json)",
            rows: [
              "Hintergrundmusik: Musik-Symbol → Online-Musikbibliothek oder eigene MP3/WAV importieren",
              "Volume + Fade In / Fade Out auf der Audiospur",
              "Denoise: Media-Seite → Audio Settings („Voice Focus\" / „Noise Reduction\"); Projekt-Seite → Audio → Denoise",
              "Stummschalten des Originaltons über den Volume-Knopf der Videospur",
              "Grenzen: nur EINE Audiospur (kein Mehrspur-Schnitt), keine direkte Tonaufnahme, eigene Musik nur MP3/WAV",
            ],
          },
          readVia:
            "Die Werte gelten je Projekt/Clip und stehen nur in der laufenden Sitzung — sie sind nicht auf der Platte. Live lesen: die Zeilen der Projekt-/Media-Seite mit studio_ui_ocr (Region wie beim Export-Dialog) oder, für Clips, studio_project_read. Dieses Werkzeug liefert bewusst nur den belegten Ist-Zustand, keine erfundenen Zahlen.",
        };
      }
      default:
        return { ...readPrefs({ file, section }), studio: studioGuiRunning(), knownLocationKeys: LOCATION_KEYS };
    }
  },
);

tool(
  "studio_logs",
  {
    description:
      "Read Insta360 Studio's own logs. action=list summarises each log area (studio, detector, quick_look, setup) and says how much of it is readable, including how many of the encrypted containers the recovered keystream still opens; action=sessions lists recent Studio starts with their files; action=read returns the tail of one file; action=grep searches the logs; action=explain reads the logs *for* you — it searches with the classifier's own pattern and answers in sentences: which findings can be acted on (a frame that will not decode and shows as the red \"Corrupted Frame\" placeholder, a preview that never came up, an expired cloud token), which alarming-looking lines are normal in every session, and which decoder the session used (hardware or software); action=window (at=ISO time) returns what Studio was doing around a moment — the session is found from the time, and dates are reconstructed from the session directory, so a stall can be placed in absolute time. Studio writes its main/export/thumbnail/quick_look logs as an XOR container — those are decrypted transparently (the keystream is verified against pid and start time from the file name on every read) and reported as encrypted only when that verification fails, so a caller can tell 'nothing wrong' apart from 'cannot see'. Use studio_dumps for hang/crash minidumps.",
    inputSchema: {
      action: z
        .enum(["list", "sessions", "read", "grep", "window", "explain"])
        .optional()
        .describe("What to do (default list)"),
      area: z.enum(LOG_AREAS).optional().describe("Log area (list/sessions default studio; grep defaults to all areas)"),
      file: z.string().optional().describe("Absolute path of a log file (for action=read)"),
      pattern: z.string().optional().describe("Regular expression, case-insensitive (for action=grep)"),
      days: z.number().optional().describe("grep: only files modified within N days (default 7)"),
      lines: z.number().optional().describe("read: how many trailing lines (default 200)"),
      limit: z.number().optional().describe("sessions: how many recent starts (default 5); grep: max matches (default 100)"),
      decrypt: z
        .boolean()
        .optional()
        .describe("grep: also search the encrypted containers, decrypting them (default true); false searches only plain-text logs"),
      at: z
        .string()
        .optional()
        .describe("window: an ISO date-time (e.g. 2026-11-24T17:17) — the session running at that moment is found automatically"),
      minutes: z.number().optional().describe("window: half-width of the time window in minutes (default 5)"),
      session: z
        .string()
        .optional()
        .describe("window: pin one session directory (YYYY_MM_DD_HH_MM_SS_pid) instead of resolving the time to a session"),
      root: z
        .string()
        .optional()
        .describe("Override the Insta360 data root (e.g. a copied log tree from another machine)"),
    },
  },
  async ({ action = "list", area, file, pattern, days = 7, lines = 200, limit, decrypt, at, minutes, session, root } = {}) => {
    const env = root ? { ...process.env, INSTA360_LOCAL_ROOT: root } : process.env;
    switch (action) {
      case "list":
        return listLogAreas({ env });
      case "sessions":
        return listSessions({ env, area: area ?? "studio", limit: limit ?? 5 });
      case "read":
        return readLogTail({ file, lines, env });
      case "window":
        return readLogWindow({ env, at, minutes: minutes ?? 5, session, areas: area ? [area] : undefined, limit: limit ?? 400 });
      case "grep":
        return grepLogs({ env, pattern, days, areas: area ? [area] : undefined, limit: limit ?? 100, decrypt: decrypt ?? true });
      case "explain": {
        // Search with the classifier's own pattern, then put what came back into plain
        // language (src/media-errors.mjs) — the point being that a stuck import/preview
        // page usually has a sentence behind it, and that most alarming-looking lines
        // are normal in every session.
        const search = pattern ?? explainPattern();
        const found = await grepLogs({
          env,
          pattern: search,
          days: days === 7 ? 2 : days,
          areas: area ? [area] : undefined,
          limit: limit ?? 400,
          decrypt: decrypt ?? true,
        });
        const matches = found.matches ?? [];
        const classified = classifyLogText(matches.map((m) => m.text ?? m.line ?? "").join("\n"));
        return {
          days: days === 7 ? 2 : days,
          searchedWith: search === explainPattern() ? "classifier table" : "caller pattern",
          matchedLines: matches.length,
          unreadable: found.skippedEncryptedFiles?.length ?? 0,
          truncated: found.truncated ?? false,
          ...classified,
        };
      }
      default:
        throw new Error(`unknown action: ${action}`);
    }
  },
);

tool(
  "studio_dumps",
  {
    description:
      "List Insta360 crash dumps, newest first. Studio writes minidumps into crashes\\lag_reports when it HANGS (the 'stuck on Lade Dateien…' symptom) and into crashes\\reports when a module crashes; the timestamps tell you which of your runs stalled. With correlate (default) each lag report is read back against the session log running at that moment and gets a `trigger`: 'ui lag' means Studio's own LagMonitorUiWorker tripped — a real stall, with the slow render frame and the last activity before it reported; 'secondary instance exit' means a second Studio instance shut itself down, which also writes a lag report and is NOT a hang. Crashpad bookkeeping files (settings.dat, metadata) are counted, not listed.",
    inputSchema: {
      limit: z.number().optional().describe("Max dumps to return (default 40)"),
      components: z
        .array(z.string())
        .optional()
        .describe("Restrict to these components, e.g. [\"Insta360 Studio\"]"),
      correlate: z
        .boolean()
        .optional()
        .describe("Read each lag report back against the session log to say why it exists (default true)"),
      root: z.string().optional().describe("Override the Insta360 data root"),
    },
  },
  async ({ limit = 40, components, correlate, root } = {}) => {
    const env = root ? { ...process.env, INSTA360_LOCAL_ROOT: root } : process.env;
    return listCrashDumps({ env, components, limit, correlate: correlate ?? true });
  },
);

tool(
  "studio_api_services",
  {
    description:
      "List the gRPC services and methods this server knows about, with the port each one runs on.",
    inputSchema: {},
  },
  async () => ({
    services: [
      {
        name: "service.Export2.Export2",
        image: "studio-exporter-service.exe",
        port: "dynamic (discovered)",
        methods: ["StartExporting", "ExporterCancel", "SendHeartBeatPackage"],
        purpose: "Video/photo export, stitching, stabilization, reframing",
      },
      {
        name: "service.Thumbnail.ThumbnailService",
        image: "studio-thumbnail-service.exe",
        port: "dynamic (discovered)",
        methods: ["SendRequest", "SendHeartBeatPackage", "Remove"],
        purpose: "Thumbnail rendering and scene detection",
      },
    ],
    note: "Studio's gRPC server does not implement reflection; the field map in proto/export2.proto was recovered from FileDescriptorProto blobs embedded in Insta360 Studio.exe.",
  }),
);

tool(
  "studio_camera_caps",
  {
    description:
      "Look up which FOV types, modes, aspect ratios and reframe angles Insta360 Studio allows. Backed by the FOV/distance tables inside the app's Qt resources, so it matches what the UI enforces. With no camera it lists every known camera.",
    inputSchema: {
      camera: z.string().optional().describe('Camera name, e.g. "X6", "X4", "Ace Pro 2". Omit to list all.'),
      fov: z.string().optional().describe('FOV type, e.g. "Dewarp", "Linear", "MegaView"'),
      videoPhoto: z.string().optional().describe('"Video" or "Photo"'),
      mode: z.string().optional().describe('e.g. "Sphere", "Flat"'),
      aspect: z.string().optional().describe('e.g. "16:9", "9:16", "1:1"'),
      angle: z.number().optional().describe("FOV angle in degrees to validate against the allowed range"),
    },
  },
  async ({ camera, fov, videoPhoto, mode, aspect, angle }) => {
    if (!camera) {
      return { cameras: listCameras(), summary: listCameras().map(describeCamera) };
    }
    const caps = cameraCaps(camera);
    if (!caps) return { error: `unknown camera "${camera}"`, known: listCameras() };
    const rules = cameraAngles(camera, { fov, videoPhoto, mode, aspect });
    const out = { ...caps, matchedRules: rules.length, rules: rules.slice(0, 60) };
    if (angle != null) out.validation = validateFov(camera, { fov, videoPhoto, mode, aspect, angle });
    return out;
  },
);

// ---------------------------------------------------------------------------
// Projects (.insproj)
// ---------------------------------------------------------------------------

tool(
  "studio_list_projects",
  {
    description: "Find .insproj project files under the Studio project root (or a given directory).",
    inputSchema: {
      root: z.string().optional().describe("Directory to search. Defaults to INSTA360_PROJECT_ROOT."),
    },
  },
  async ({ root }) => {
    const dir = root ?? STUDIO_PROJECT_ROOT;
    const files = await findProjects(dir);
    return { root: dir, count: files.length, projects: files };
  },
);

tool(
  "studio_project_read",
  {
    description:
      "Read a .insproj project and return its summary: fps, frame count, tracks, clips and their source files.",
    inputSchema: {
      path: z.string().describe("Absolute path to the .insproj file"),
      includeClips: z.boolean().optional().describe("Include the full clip list (default true)"),
    },
  },
  async ({ path: projectPath, includeClips = true }) => {
    const data = await readProject(projectPath);
    const summary = summarizeProject(data);
    if (!includeClips) delete summary.clips;
    return summary;
  },
);

tool(
  "studio_project_sources",
  {
    description: "List every source file referenced by a project.",
    inputSchema: { path: z.string().describe("Absolute path to the .insproj file") },
  },
  async ({ path: projectPath }) => {
    const data = await readProject(projectPath);
    const sources = projectSources(data);
    return {
      count: sources.length,
      sources: sources.map((s) => ({ path: s, exists: existsSync(s) })),
      missing: sources.filter((s) => !existsSync(s)),
    };
  },
);

tool(
  "studio_clip_transform",
  {
    description:
      "Read the camera view (euler pitch/roll/yaw, fov, dewarp mode) of one clip in a project.",
    inputSchema: {
      path: z.string().describe("Absolute path to the .insproj file"),
      track: z.number().int().optional().describe("Track index (default 0)"),
      clip: z.number().int().optional().describe("Clip index within the track (default 0)"),
    },
  },
  async ({ path: projectPath, track = 0, clip = 0 }) => {
    const data = await readProject(projectPath);
    return { path: projectPath, track, clip, ...getClipTransform(data, { track, clip }) };
  },
);

tool(
  "studio_clip_set_transform",
  {
    description:
      "Change the camera view of a clip. Values are merged into the clip's camera_transform. Writes a .bak backup first.",
    inputSchema: {
      path: z.string().describe("Absolute path to the .insproj file"),
      track: z.number().int().optional(),
      clip: z.number().int().optional(),
      pitch: z.number().optional().describe("Pitch in radians"),
      roll: z.number().optional().describe("Roll in radians"),
      yaw: z.number().optional().describe("Yaw in radians"),
      fov: z.number().optional().describe("Field of view in radians"),
      dewarpType: z.number().optional().describe("Dewarp mode value (0 wide, 2 linear, 16 tiny planet, ...)"),
      backup: z.boolean().optional().describe("Write a .bak copy before saving (default true)"),
    },
  },
  async ({ path: projectPath, track = 0, clip = 0, pitch, roll, yaw, fov, dewarpType, backup = true }) => {
    const data = await readProject(projectPath);
    const cameraTransform = {};
    if (Number.isFinite(pitch)) cameraTransform.eulers = { ...(cameraTransform.eulers ?? {}), pitch: { type: 0, value: pitch } };
    if (Number.isFinite(roll)) cameraTransform.eulers = { ...(cameraTransform.eulers ?? {}), roll: { type: 0, value: roll } };
    if (Number.isFinite(yaw)) cameraTransform.eulers = { ...(cameraTransform.eulers ?? {}), yaw: { type: 0, value: yaw } };
    if (Number.isFinite(fov)) cameraTransform.fov = { type: 0, value: fov };
    const patch = {};
    if (Object.keys(cameraTransform).length) patch.cameraTransform = cameraTransform;
    if (Number.isFinite(dewarpType)) patch.dewarpSetting = { current_dewarp_type: { name: "custom", value: dewarpType } };
    const updated = setClipTransform(data, { track, clip }, patch);
    const written = await writeProject(projectPath, data, { backup });
    return { ...written, clip: { track, clip, cameraTransform: updated.camera_transform, dewarpSetting: updated.dewarp_setting } };
  },
);

tool(
  "studio_clip_repoint",
  {
    description: "Point a clip at a different source file without touching the GUI.",
    inputSchema: {
      path: z.string().describe("Absolute path to the .insproj file"),
      track: z.number().int().optional(),
      clip: z.number().int().optional(),
      newUrl: z.string().describe("New absolute source path"),
      renameTo: z.string().optional().describe("Also update the clip display name"),
      backup: z.boolean().optional(),
    },
  },
  async ({ path: projectPath, track = 0, clip = 0, newUrl, renameTo, backup = true }) => {
    const data = await readProject(projectPath);
    const change = repointClip(data, { track, clip }, newUrl, { renameTo });
    const written = await writeProject(projectPath, data, { backup });
    return { ...written, ...change, newUrlExists: existsSync(newUrl) };
  },
);

tool(
  "studio_clip_trim",
  {
    description: "Set the in/out trim of a clip in frames.",
    inputSchema: {
      path: z.string().describe("Absolute path to the .insproj file"),
      track: z.number().int().optional(),
      clip: z.number().int().optional(),
      leftTrim: z.number().int().optional().describe("Frames trimmed from the start"),
      rightTrim: z.number().int().optional().describe("Frames trimmed from the end"),
      backup: z.boolean().optional(),
    },
  },
  async ({ path: projectPath, track = 0, clip = 0, leftTrim, rightTrim, backup = true }) => {
    const data = await readProject(projectPath);
    const trim = trimClip(data, { track, clip }, { leftTrim, rightTrim });
    const written = await writeProject(projectPath, data, { backup });
    return { ...written, ...trim };
  },
);

// ---------------------------------------------------------------------------
// 360 view keyframes
//
// The track is Studio's own `key_frame_track.node_list`, measured from a project Studio
// wrote with the right-drag gesture (docs/INSPROJ_SCHEMA.md §7). Keyframes are addressed
// by their time on the clip, in frames.
// ---------------------------------------------------------------------------

const clipAt = (data, track, clip) => {
  const c = data.tracks?.[track]?.clips?.[clip];
  if (!c) throw new Error(`No clip at track ${track} index ${clip}`);
  return c;
};

const trackAt = (data, track) => {
  const t = data.tracks?.[track];
  if (!t) throw new Error(`No track ${track}; the project has ${data.tracks?.length ?? 0}`);
  return t;
};

tool(
  "studio_clip_keyframes",
  {
    description:
      "List the 360 view keyframes on a clip, with the transition nodes between them. Angles are returned " +
      "in radians and in degrees; `time` is a frame number on the clip. An empty list means no keyframes.",
    inputSchema: {
      path: z.string().describe("Absolute path to the .insproj file"),
      track: z.number().int().optional().describe("Track index (default 0)"),
      clip: z.number().int().optional().describe("Clip index within the track (default 0)"),
    },
  },
  async ({ path: projectPath, track = 0, clip = 0 }) => {
    const data = await readProject(projectPath);
    const c = clipAt(data, track, clip);
    const keyframes = listKeyframes(c);
    return {
      path: projectPath,
      track,
      clip,
      url: c.url,
      enableUserKeyframe: c.enable_user_keyframe ?? null,
      hasKeyframes: hasKeyframes(c),
      count: keyframes.length,
      keyframes,
      transitions: transitionNodes(c).map((t) => ({ name: t.name, from: t.from, to: t.to, type: t.type })),
      raw: c.key_frame_track ?? {},
    };
  },
);

tool(
  "studio_clip_keyframe_add",
  {
    description:
      "Add a 360 view keyframe to a clip, or update the one already at that time. Inserting between two " +
      "keyframes splits their transition node in two, mirroring what Studio does itself; a transition node " +
      "that already exists between a surviving pair is kept unchanged, because its point values are the only " +
      "per-transition data in the file. Writes a .bak backup first.",
    inputSchema: {
      path: z.string().describe("Absolute path to the .insproj file"),
      track: z.number().int().optional(),
      clip: z.number().int().optional(),
      time: z.number().describe("Frame number on the clip — the keyframe's identity"),
      pan: z.number().describe("Horizontal view angle (yaw)"),
      tilt: z.number().describe("Vertical view angle (pitch)"),
      roll: z.number().optional().describe("Roll angle (default 0)"),
      fov: z.number().optional().describe("Field of view (default 75° converted to radians)"),
      distance: z.number().optional().describe("Camera distance (default 0.6, Studio's own)"),
      degrees: z.boolean().optional().describe("Treat pan/tilt/roll/fov as degrees instead of radians"),
      backup: z.boolean().optional().describe("Write a .bak copy before saving (default true)"),
    },
  },
  async ({ path: projectPath, track = 0, clip = 0, time, pan, tilt, roll, fov, distance, degrees = false, backup = true }) => {
    const data = await readProject(projectPath);
    const c = clipAt(data, track, clip);
    const conv = degrees ? toRadians : (v) => v;
    const result = addKeyframe(c, {
      time,
      pan: conv(pan),
      tilt: conv(tilt),
      roll: degrees && roll != null ? toRadians(roll) : roll,
      fov: degrees && fov != null ? toRadians(fov) : fov,
      distance,
    });
    const written = await writeProject(projectPath, data, { backup });
    return { ...written, ...result, keyframes: listKeyframes(c), nodeTypes: (c.key_frame_track?.node_list ?? []).map((n) => n.node_type) };
  },
);

tool(
  "studio_clip_keyframe_remove",
  {
    description:
      "Remove the 360 view keyframe at a time on a clip, together with the transition nodes that pointed at " +
      "it, and link the surviving neighbours. Writes a .bak backup first.",
    inputSchema: {
      path: z.string().describe("Absolute path to the .insproj file"),
      track: z.number().int().optional(),
      clip: z.number().int().optional(),
      time: z.number().describe("Frame number on the clip"),
      backup: z.boolean().optional(),
    },
  },
  async ({ path: projectPath, track = 0, clip = 0, time, backup = true }) => {
    const data = await readProject(projectPath);
    const c = clipAt(data, track, clip);
    const result = removeKeyframe(c, { time });
    const written = await writeProject(projectPath, data, { backup });
    return { ...written, ...result, keyframes: listKeyframes(c), nodeTypes: (c.key_frame_track?.node_list ?? []).map((n) => n.node_type) };
  },
);

// ---------------------------------------------------------------------------
// Filters (looks)
// ---------------------------------------------------------------------------

tool(
  "studio_filters",
  {
    description:
      "List the colour filters installed on this machine, from Studio's own download tree " +
      "(filter/<id>/<version>/<id>.cube.binary, a 64³ binary LUT). The id is the directory name — " +
      "Studio's display name for a filter is not on disk anywhere (the applied specimen's id is " +
      "\"HD Fireworks\" while its UI name is \"Fireworks I\"), so a caller supplies the name when setting it.",
    inputSchema: {
      dir: z.string().optional().describe("Filter root (default: Studio's Download/filter, or INSTA360_FILTER_DIR)"),
    },
  },
  async ({ dir }) => {
    const root = filterRoot(dir);
    const filters = scanInstalledFilters(root);
    const catalog = readFilterManifest(root);
    return {
      root,
      count: filters.length,
      filters,
      catalogCount: catalog.length,
      catalogNotDownloaded: catalog.filter((c) => !c.installed).map((c) => c.name),
    };
  },
);

tool(
  "studio_clip_filter",
  {
    description: "Read a clip's colour filter: the four effect_filter values, whether one is applied, and whether its LUT file is on disk.",
    inputSchema: {
      path: z.string().describe("Absolute path to the .insproj file"),
      track: z.number().int().optional(),
      clip: z.number().int().optional(),
    },
  },
  async ({ path: projectPath, track = 0, clip = 0 }) => {
    const data = await readProject(projectPath);
    const c = clipAt(data, track, clip);
    return { ...filterState(c), enableEffects: data.enableEffects };
  },
);

tool(
  "studio_clip_filter_set",
  {
    description:
      "Apply a colour filter to a clip, or clear it by passing an empty id. The four-key effect_filter block is " +
      "mutated in place so Studio's key order survives, and clearing restores Studio's own empty form " +
      "(empty strings, opacity 70) rather than deleting the block — every clip in the corpus carries one. " +
      "If only an id is given, the LUT path is resolved from the installed filter tree. Writes a .bak backup first.",
    inputSchema: {
      path: z.string().describe("Absolute path to the .insproj file"),
      track: z.number().int().optional(),
      clip: z.number().int().optional(),
      id: z.string().describe("Filter id = the directory name under Download/filter; \"\" clears the filter"),
      name: z.string().optional().describe("Display name (defaults to the id; Studio keeps its own, which is not on disk)"),
      opacity: z.number().optional().describe("Filter strength, 0-100 (default 70, Studio's own)"),
      resourcePath: z.string().optional().describe("Explicit .cube.binary path; resolved from the installed tree when omitted"),
      dir: z.string().optional().describe("Filter root to resolve ids against"),
      backup: z.boolean().optional().describe("Write a .bak copy before saving (default true)"),
    },
  },
  async ({ path: projectPath, track = 0, clip = 0, id, name, opacity, resourcePath, dir, backup = true }) => {
    const data = await readProject(projectPath);
    const c = clipAt(data, track, clip);
    const result = id === "" ? clearFilter(c) : setFilter(c, { id, name, opacity, resourcePath, root: filterRoot(dir) });
    const written = result.changed ? await writeProject(projectPath, data, { backup }) : { written: false };
    return { ...written, ...result, id, enableEffects: data.enableEffects };
  },
);

// ---------------------------------------------------------------------------
// Transitions (read side; no writer until a specimen exists)
// ---------------------------------------------------------------------------

tool(
  "studio_transitions",
  {
    description:
      "List the transition assets Studio has downloaded: resourceId, the name from the asset's own info.json " +
      "(English) and its Chinese-localised name, the supported aspect ratios, the .videotransition payload and " +
      "its cover. Also reports the manifest, which announces more transitions than are on disk. " +
      "There is no tool that *applies* a transition yet: no project on this machine carries one, so the entry " +
      "shape is only recorded (docs/ASSET_CATALOG.md §2.2) and a writer would be built against a doc.",
    inputSchema: {
      dir: z.string().optional().describe("Transition root (default: Studio's Download/transition, or INSTA360_TRANSITION_DIR)"),
      manifestOnly: z.boolean().optional().describe("Skip walking the assets; just the manifest entries"),
    },
  },
  async ({ dir, manifestOnly = false }) => {
    const root = transitionRoot(dir);
    const manifest = readTransitionManifest(root);
    if (manifestOnly) return { root, manifestCount: manifest.length, manifest };
    const assets = scanTransitionAssets(root);
    const installed = new Set(assets.map((a) => a.resourceId));
    return {
      root,
      count: assets.length,
      assets,
      manifestCount: manifest.length,
      announcedNotDownloaded: manifest.filter((m) => !installed.has(m.resourceId)).map((m) => m.resourceId),
    };
  },
);

tool(
  "studio_track_transitions",
  {
    description:
      "Read the transitions a **track** carries. The container is the track, not the clip: the documented " +
      "spec said a clip's `transitions` array, but a scan of 13 projects / 60 clips found none there and the " +
      "entry Studio actually wrote when a transition was added lives at track.transitions[]. Reports every " +
      "field, whether the payload it names is on disk, and the track's clip ids in order (the two ends of a " +
      "transition are adjacent clips on that track).",
    inputSchema: {
      path: z.string().describe("Absolute path to the .insproj file"),
      track: z.number().int().optional().describe("Track index (default 0)"),
    },
  },
  async ({ path: projectPath, track = 0 }) => {
    const data = await readProject(projectPath);
    const t = trackAt(data, track);
    return { ...transitionState(t), track, clipIds: clipOrder(t) };
  },
);

tool(
  "studio_track_transition_add",
  {
    description:
      "Add a transition between two adjacent clips on a track, or update the one already on that gap. " +
      "The entry is written to track.transitions with the twelve keys Studio writes (frames defaulting to 14, " +
      "the asset's path resolved from resourceId, a fresh instance id). Both clip ids must be adjacent on that " +
      "track. Note: Studio's own insert also grew the clip list by one (a copy of the following clip) while " +
      "adding this entry — this tool touches track.transitions and nothing else, so whether Studio needs that " +
      "extra clip is still unverified. Writes a .bak backup first.",
    inputSchema: {
      path: z.string().describe("Absolute path to the .insproj file"),
      track: z.number().int().optional(),
      prevClip: z.string().describe("Id of the earlier clip (clip.id, not the media file)"),
      nextClip: z.string().describe("Id of the later clip"),
      resourceId: z.string().describe("Transition asset uuid — see studio_transitions"),
      frames: z.number().int().optional().describe("Length in frames, 6..60 (default 14)"),
      dir: z.string().optional().describe("Transition root to resolve the asset against"),
      backup: z.boolean().optional().describe("Write a .bak copy before saving (default true)"),
    },
  },
  async ({ path: projectPath, track = 0, prevClip, nextClip, resourceId, frames, dir, backup = true }) => {
    const data = await readProject(projectPath);
    const t = trackAt(data, track);
    const result = setTransition(t, { prevClip, nextClip, resourceId, frames, root: transitionRoot(dir) });
    if (!result.ok) return result;
    const written = result.changed ? await writeProject(projectPath, data, { backup }) : { written: false };
    return { ...written, ...result, count: transitionState(t).count };
  },
);

tool(
  "studio_track_transition_remove",
  {
    description:
      "Remove a transition from a track, by its instance id or by the pair of clips it joins. " +
      "Touches track.transitions only. Writes a .bak backup first when something was removed.",
    inputSchema: {
      path: z.string().describe("Absolute path to the .insproj file"),
      track: z.number().int().optional(),
      id: z.string().optional().describe("Transition instance id (transition.id)"),
      prevClip: z.string().optional().describe("Or: the earlier clip's id"),
      nextClip: z.string().optional().describe("Or: the later clip's id"),
      backup: z.boolean().optional(),
    },
  },
  async ({ path: projectPath, track = 0, id, prevClip, nextClip, backup = true }) => {
    const data = await readProject(projectPath);
    const t = trackAt(data, track);
    const result = removeTransition(t, { id, prevClip, nextClip });
    const written = result.removed ? await writeProject(projectPath, data, { backup }) : { written: false };
    return { ...written, ...result, transitions: transitionState(t).transitions };
  },
);

// ---------------------------------------------------------------------------
// Preflight — Studio's own rules, checked before the export finds them
// ---------------------------------------------------------------------------

tool(
  "studio_project_check",
  {
    description:
      "Check a project against Studio's own rules *before* an export or an AI step fails late. Returns " +
      "violations with the manual page or measurement each rule comes from, and — just as important — " +
      "separates what it could not ask: `dormant` rules whose trigger cannot exist in this file, and " +
      "`unverifiable` rules the manual states but no measured field carries (e.g. nothing in the file " +
      "says \"this is a TimeShift clip\"). A rule that was not evaluated is never reported as passing. " +
      "Error-severity findings fail an export or produce a wrong file; warnings are drift (a stale " +
      "Deep Track path, an export marker that drops the tail, misplaced projectPath). Read-only. " +
      "Pass rules=true to get the whole catalogue without a project.",
    inputSchema: {
      path: z.string().optional().describe("Absolute path to the .insproj file"),
      paths: z.boolean().optional().describe("Also compare against startup.ini [preference] paths (default true)"),
      rules: z.boolean().optional().describe("Return the rule catalogue instead of checking a project"),
      minSeverity: z.enum(["error", "warning"]).optional().describe("Only report findings at this level or above (default warning = all)"),
    },
  },
  async ({ path: projectPath, paths = true, rules = false, minSeverity = "warning" }) => {
    if (rules) {
      return {
        rules: RULES.map((r) => ({ ...r, checkable: true })),
        unverifiable: UNVERIFIABLE.map((u) => ({ ...u, checkable: false })),
        counts: { rules: RULES.length, unverifiable: UNVERIFIABLE.length },
      };
    }
    if (!projectPath) throw new Error("path is required (or pass rules=true for the catalogue)");
    const data = await readProject(projectPath);
    const result = checkProject(data, { file: projectPath, paths });
    const violations = minSeverity === "error" ? result.violations.filter((v) => v.severity === "error") : result.violations;
    return { ...result, violations, summary: { ...result.summary, errors: violations.filter((v) => v.severity === "error").length, warnings: violations.filter((v) => v.severity === "warning").length } };
  },
);

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

tool(
  "studio_export",
  {
    description:
      "Start an export through Studio's Exporter2 gRPC service. Builds the verified ExportParams tree " +
      "(exportHeader + localExtraParams{exportType, videoExportParam[], imageExportParam{sourceGroup}}) " +
      "and returns the decoded ExportReply (state, errCode, message, logPath). Studio must be running. " +
      "Photo/image types name their source directly and work with nothing loaded. VIDEO and VIDEO_CLIP " +
      "always fail with EXPORTER_START_FAILURE — the exporter resolves footage from internal project state " +
      "that neither the UI nor an .insproj fills; use studio_ui_export for video.",
    inputSchema: {
      sources: z.array(z.string()).describe("Absolute source file paths to export"),
      savePath: z.string().describe("Destination directory — the exporter writes the file inside it"),
      exportName: z.string().optional().describe("Name for the export job"),
      taskId: z.string().optional().describe("Task id (generated when omitted)"),
      exportType: z
        .number()
        .int()
        .optional()
        .describe(
          "ExportType: 0=PHOTO, 1=DNG_TO_DNG, 2=DNG_TO_JPG, 3=DNG_WITH_JPG, 4=NO_EXTRA_INFO_DNG_EXPORT, " +
            "5=JPG_SEQUENCE, 6=DNG_SEQUENCE_DNG, 7=DNG_SEQUENCE_JPG, 8=DNG_SEQUENCE_DNG_WITH_JPG, " +
            "9=VIDEO, 10=VIDEO_CLIP, 11=DEMUX_TO_JPEG, 12=SEQUENCE, 13=MUX_TO_VIDEO, " +
            "14=MUX_TO_PURESHOT_VIDEO, 15=MERGED_MIX, 16=MERGED_ONLY, 17=DNG_MERGED_JPG, " +
            "18=DNG_MERGED_DNG, 19=DNG_MERGED_EXR, 20=JPG_MERGED, 21=JPG_MERGED_GROUP, " +
            "22=DNG_MERGED_GROUP, 23=DNG_MERGED_GROUP_DNG, 24=SOURCE_CLIP, 25=PANO_PIC_ANIMATION, " +
            "26=PANO_PIC_ANIMATION_PRESET, 27=STAR_TRAIL_VIDEO, 28=STAR_TRAIL_PHOTO, " +
            "29=VIDEO_TO_JPEG_SEQUENCE, 30=PROJECT_COVER_PHOTO, 31=PANO_VIDEO. " +
            "Types 0-8 and 11 accept a source named here; 9 and 10 need the project loaded",
        ),
      stitchType: z.number().int().optional().describe("StitchType: 0=TEMPLATE, 1=DYNAMIC, 2=OPTICAL, 3=AI"),
      stabType: z.number().int().optional().describe("StabilizationType: 0=NONE, 1=FLOWSTATE, 2=FPV"),
      stabLevel: z.number().int().optional().describe("Stabilization strength 0-100"),
      enableStab: z.boolean().optional().describe("Enable stabilization"),
      enableImageFusion: z.boolean().optional().describe("Enable image fusion"),
      enableBottomStitch: z.boolean().optional().describe("Optimize the bottom stitch"),
      enableGpxExport: z.boolean().optional().describe("Write a GPX sidecar"),
      enableDeflicker: z.boolean().optional().describe("Deflicker (timelapse footage)"),
      framerate: z.string().optional().describe("Target framerate, e.g. '30' or '29.97'"),
      bitrate: z.string().optional().describe("Target bitrate, e.g. '100M'"),
      width: z.number().int().optional().describe("Target width in pixels"),
      height: z.number().int().optional().describe("Target height in pixels"),
      timeoutMs: z.number().int().optional().describe("Call timeout in milliseconds (default 240000)"),
    },
  },
  async ({
    sources,
    savePath,
    exportName = "export",
    taskId,
    exportType = EXPORT_TYPE.VIDEO,
    stitchType = 0,
    stabType = 0,
    stabLevel,
    enableStab = false,
    enableImageFusion = false,
    enableBottomStitch = false,
    enableGpxExport = false,
    enableDeflicker = false,
    framerate,
    bitrate,
    width,
    height,
    timeoutMs = 240000,
  }) => {
    const port = requireExporterPort();
    const missing = sources.filter((s) => !existsSync(s));
    if (missing.length) {
      return { started: false, error: "Source files not found", missing };
    }
    const uuid = taskId ?? `mcp-${Date.now()}`;

    const sourceGroup = buildSourceGroup({ sourceFiles: sources, groupIdentifier: exportName });
    const stitching = buildStitchingSetting({
      enableImageFusion,
      enableDynamicStitching: stitchType === STITCH_TYPE.DYNAMIC,
      enableOpticalFlowStitching: stitchType === STITCH_TYPE.OPTICAL,
      enableAiStitching: stitchType === STITCH_TYPE.AI,
    });
    const videoExportParam = buildLocalVideoExportParam({
      stitchType,
      stabType,
      stabLevel,
      enableStab,
      enableImageFusion,
      enableGpxExport,
      enableDeflicker,
      enableBottomStitchingOptimize: enableBottomStitch,
    });
    const imageExportParam = buildLocalImageExportParam({ sourceGroup, stitching });
    const localExtraParams = buildLocalExtraParams({
      exportType,
      videoExportParams: [videoExportParam],
      imageExportParam,
    });
    const exportHeader = buildExportHeader({
      taskId: uuid,
      exportName,
      savePath,
      framerate,
      bitrate,
      width,
      height,
    });
    const params = buildExportParams({ exportHeader, localExtraParams });

    const reply = await startExporting({ port, params, timeoutMs });
    return { port, uuid, sources, savePath, exportType, requestBytes: params.length, ...reply };
  },
);

tool(
  "studio_export_cancel",
  {
    description: "Cancel a running export by task id.",
    inputSchema: {
      taskId: z.string().describe("Task id returned by studio_export"),
      timeoutMs: z.number().int().optional(),
    },
  },
  async ({ taskId, timeoutMs = 30000 }) => {
    const port = requireExporterPort();
    const reply = await cancelExport({ port, uuid: taskId, timeoutMs });
    return { port, taskId, ...reply };
  },
);

tool(
  "studio_export_heartbeat",
  {
    description: "Send a keep-alive heartbeat to the exporter service.",
    inputSchema: {
      count: z.number().int().optional().describe("Heartbeat counter (default 1)"),
      exitApp: z.boolean().optional().describe("Ask the exporter to shut down (default false)"),
    },
  },
  async ({ count = 1, exitApp = false }) => {
    const port = requireExporterPort();
    const reply = await heartbeat({ port, count, exitApp });
    return {
      port,
      count,
      exitApp,
      reply: Object.fromEntries(
        Object.entries(reply).map(([k, v]) => [k, Buffer.isBuffer(v) ? v.toString("utf8") : v]),
      ),
    };
  },
);

// ---------------------------------------------------------------------------
// Thumbnails / scene detection
// ---------------------------------------------------------------------------

tool(
  "studio_thumbnail_request",
  {
    description:
      "Render a frame of an Insta360 source through Studio's thumbnail service and report the file it wrote. " +
      "taskType picks the kind: 0 kFootageCover -> simple_cover.jpg, 1 kSingleTask -> clip_0_cover.jpg, " +
      "2 kQuickSeekTask -> seek_0.jpg. renderType picks the projection: 0 kPlane, 1 kPlaneSphere, 2 kSphere, " +
      "3 kDewarp, 4 kStereo. Verified: a 360 .insv in, a dewarped 1280x720 JPEG out, no UI involved.",
    inputSchema: {
      files: z.array(z.string()).min(1).describe("Absolute paths of the source files (a SourceGroup can hold several)"),
      sourceFile: z.string().optional().describe("Single source file; shorthand for files: [sourceFile]"),
      width: z.number().int().optional(),
      height: z.number().int().optional(),
      frameIndex: z.number().int().optional(),
      frameTimeMs: z.number().int().optional(),
      taskType: z.number().int().optional().describe("0 kFootageCover | 1 kSingleTask | 2 kQuickSeekTask"),
      renderType: z.number().int().optional().describe("0 kPlane | 1 kPlaneSphere | 2 kSphere | 3 kDewarp | 4 kStereo"),
      onlyUseKeyframe: z.boolean().optional(),
      clipId: z.number().int().optional(),
      aspectRatio: z.number().int().optional(),
      isPanoMedia: z.boolean().optional().describe("Set for 360 footage so the frame is projected correctly"),
      isPanoExport: z.boolean().optional(),
      id: z.number().int().optional(),
      timeoutMs: z.number().int().optional(),
    },
  },
  async ({ files, sourceFile, timeoutMs = 180000, ...rest }) => {
    const port = requireThumbnailPort();
    const list = files ?? (sourceFile ? [sourceFile] : []);
    const missing = list.filter((f) => !existsSync(f));
    if (!list.length) return { requested: false, error: "No source file given" };
    if (missing.length) return { requested: false, error: "Source file not found", missing };
    const reply = await requestThumbnail({ port, files: list, timeoutMs, ...rest });
    return {
      port,
      requested: true,
      written: reply.thumbnails.filter((t) => t.thumbnailPath && existsSync(t.thumbnailPath)),
      ...reply,
    };
  },
);

tool(
  "studio_thumbnail_remove",
  {
    description:
      "Drop cached thumbnails for the given sources. The service takes a SourceGroup, so the files have to be " +
      "named -- an empty request asks it to forget nothing.",
    inputSchema: {
      files: z.array(z.string()).min(1).describe("Absolute paths whose cached entries should be dropped"),
      timeoutMs: z.number().int().optional(),
    },
  },
  async ({ files, timeoutMs = 30000 }) => {
    const port = requireThumbnailPort();
    return { port, ...(await removeThumbnail({ port, files, timeoutMs })) };
  },
);

tool(
  "studio_scene_detect",
  {
    description:
      "Ask the thumbnail service to analyse a source for scene changes (SendSceneDetectRequest). The service " +
      "accepts the request but has answered empty in tests so far, so treat the reply as unverified: it is " +
      "exposed for completeness, not as a working scene-cutting feature.",
    inputSchema: {
      files: z.array(z.string()).min(1).describe("Absolute paths of the source files (a SourceGroup)"),
      sourceGroupName: z.string().optional().describe("Label the service should echo back"),
      timeoutMs: z.number().int().optional(),
    },
  },
  async ({ files, sourceGroupName, timeoutMs = 300000 }) => {
    const port = requireThumbnailPort();
    const missing = files.filter((f) => !existsSync(f));
    if (missing.length) return { requested: false, error: "Source file not found", missing };
    return { port, ...(await sendSceneDetect({ port, files, sourceGroupName, timeoutMs })) };
  },
);

tool(
  "studio_thumbnail_heartbeat",
  {
    description:
      "Send a keep-alive heartbeat to the thumbnail service (HeartBeat 1=count, 2=exit_app). exitApp=true asks " +
      "the service to shut down, which is what the app sends when it quits.",
    inputSchema: {
      count: z.number().int().optional(),
      exitApp: z.boolean().optional(),
    },
  },
  async ({ count = 1, exitApp = false }) => {
    const port = requireThumbnailPort();
    return { port, ...(await thumbnailHeartbeat({ port, count, exitApp })) };
  },
);

// ---------------------------------------------------------------------------
// Studio install inspection
// ---------------------------------------------------------------------------

tool(
  "studio_install_info",
  {
    description:
      "Report the Studio install directory contents: main executable, helper services and version metadata.",
    inputSchema: {},
  },
  async () => {
    const dir = studioDir();
    if (!dir || !existsSync(dir)) return { studioDir: dir, exists: false, ...studioInfo() };
    const entries = await readdir(dir, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile()).map((e) => e.name);
    const info = studioInfo();
    // Both version numbers, measured: the executable's FileVersion ("6.0.9.0", four
    // parts) and what the app writes into startup.ini [General] ("6.0.9", three) — the
    // same release in two notations, so compare loosely and never treat one as canonical.
    let installer = null;
    try {
      installer = getPref("version", { section: "General" });
    } catch {
      installer = null;
    }
    return {
      studioDir: dir,
      exists: true,
      ...info,
      appVersion: { exe: info.version, startupIni: installer },
      update: {
        checkForUpdatesVia: "Studio-Menü ▸ Hilfe ▸ Auf Updates prüfen (dort auch das Thumbnail-Plugin)",
        warning:
          "Nur melden, niemals auslösen: der Launcher legt die Installation an eine andere Stelle (siehe `layout`: per-user ≥ 6.0.9 vs. Program Files ≤ 6.0.8) und entwertet damit jeden gemessenen Offset und Pfad, auf dem dieses MCP aufsetzt.",
        evidence: "startup.ini [updater] auto_download_reported=true — Studio lädt Updates selbst herunter",
      },
      executables: files.filter((f) => f.toLowerCase().endsWith(".exe")),
      helperServices: files.filter((f) => /service/i.test(f)),
      fileCount: files.length,
      directories: entries.filter((e) => e.isDirectory()).map((e) => e.name),
    };
  },
);

// ---------------------------------------------------------------------------
// GUI automation
//
// Studio's Qt canvas exposes no UI Automation tree and its gRPC exporter accepts
// jobs without ever writing a file. The only path that reliably produces output
// is the real export dialog, so these tools drive it: screenshot the window with
// PrintWindow (works while occluded), find the accent-coloured primary button by
// pixel colour, click it, and wait for the file to stop growing.
// ---------------------------------------------------------------------------

tool(
  "studio_ui_state",
  {
    description:
      "Screenshot the Studio window and report what it shows: window rect, whether the export dialog is open, " +
      "where the accent-coloured primary buttons are, and whether the player looks empty. " +
      "This is the reliable way to answer 'is a video actually loaded?'.",
    inputSchema: {
      title: z.string().optional().describe("Window title (default 'Insta360 Studio')"),
      mode: z.enum(["print", "screen"]).optional().describe("print = PrintWindow (occlusion-proof), screen = visible area"),
    },
  },
  async ({ title, mode = "print" }) => {
    const state = uiState({ title: title ?? "Insta360 Studio", mode });
    return {
      ...state,
      hint: state.player.likelyEmpty
        ? "Player looks empty — open or import a clip before exporting."
        : "Player has content — an export should work.",
    };
  },
);

tool(
  "studio_ui_capture",
  {
    description: "Save a screenshot of the Studio window and return its path.",
    inputSchema: {
      title: z.string().optional(),
      mode: z.enum(["print", "screen"]).optional(),
      out: z.string().optional().describe("Destination .png path"),
    },
  },
  async ({ title, mode = "print", out }) => uiCapture({ title: title ?? "Insta360 Studio", mode, out }),
);

tool(
  "studio_ui_click",
  {
    description:
      "Click at window-relative coordinates in the Studio window. Coordinates are relative to the window's " +
      "top-left corner, matching what studio_ui_state's button boxes report.",
    inputSchema: {
      x: z.number().int().describe("X relative to the window's left edge"),
      y: z.number().int().describe("Y relative to the window's top edge"),
      double: z.boolean().optional().describe("Double-click instead of a single click"),
      title: z.string().optional(),
    },
  },
  async ({ x, y, double = false, title }) => uiClick({ title: title ?? "Insta360 Studio", x, y, double }),
);

tool(
  "studio_ui_scroll",
  {
    description:
      "Scroll the Studio window at a window-relative point, in wheel notches (negative = down the list). " +
      "The export panel is taller than the window: its lower rows (KI Effekte, Hochpräzises Stitching, " +
      "Körnung entfernen, Exportmodus, Teilen auf) only appear after scrolling, so reading the dialog " +
      "without scrolling misses them. A short list box scrolls too — the Voreinstellung list holds more " +
      "entries than fit, and only the visible ones can be read. Delivered as WM_MOUSEWHEEL, so it works " +
      "in quiet mode and does not take the operator's pointer or focus.",
    inputSchema: {
      x: z.number().int().describe("X relative to the window's left edge"),
      y: z.number().int().describe("Y relative to the window's top edge"),
      notches: z.number().int().optional().describe("Wheel notches; negative scrolls down (default -3)"),
      title: z.string().optional(),
    },
  },
  async ({ x, y, notches = -3, title }) => uiScroll({ title: title ?? "Insta360 Studio", x, y, notches }),
);

tool(
  "studio_ui_send_keys",
  {
    description:
      "Send a key to the Studio window. One plain key (SendKeys spelling: '{ESC}', '{TAB}', '{ENTER}', " +
      "'{BACKSPACE}', '{HOME}', '{END}', arrows) is delivered by message and works in quiet mode; a chord " +
      "('^{s}', '%{F4}') goes through the system keyboard queue, which quiet mode refuses because it would be " +
      "typed into whatever window has the operator's focus.",
    inputSchema: {
      keys: z.string().describe("One plain key ({ESC}) or a SendKeys chord (^{s} -- quiet mode refuses chords)"),
      title: z.string().optional(),
    },
  },
  async ({ keys, title }) => uiSendKeys({ title: title ?? "Insta360 Studio", keys }),
);

tool(
  "studio_ui_move",
  {
    description: "Move and resize the Studio window to a fixed rectangle so click coordinates stay stable.",
    inputSchema: {
      x: z.number().int().optional(),
      y: z.number().int().optional(),
      width: z.number().int().optional(),
      height: z.number().int().optional(),
      title: z.string().optional(),
    },
  },
  async ({ x = 100, y = 40, width = 1384, height = 900, title }) =>
    uiMoveWindow({ title: title ?? "Insta360 Studio", x, y, width, height }),
);

tool(
  "studio_ui_export",
  {
    description:
      "Run a real GUI export end-to-end: click the toolbar's export button, click the dialog's primary button, " +
      "then wait until the new file in the output folder stops growing. This is the only path that produces " +
      "video files — the gRPC exporter (studio_export) answers EXPORTER_START_FAILURE for VIDEO and VIDEO_CLIP, " +
      "whatever state the app is in. A clip must be loaded and the export dialog must be reachable.",
    inputSchema: {
      outDir: z
        .string()
        .optional()
        .describe(
          "Folder you expect the file in (default: the folder the export dialog shows). The dialog's own " +
            '"Pfad" decides where it actually lands -- that field is a folder picker and is never retyped -- so ' +
            "the dialog wins when the two disagree; the reply reports outDir, outDirSource and outDirMismatch.",
        ),
      stage: z
        .enum(["dialog", "full"])
        .optional()
        .describe("dialog = only open the export dialog; full = also start and wait for the file"),
      settings: z
        .record(z.string(), z.string())
        .optional()
        .describe(
          'Dialog settings to apply before exporting, keyed by control label, e.g. {"Voreinstellung":"4K",' +
            '"Kodierung":"H.264"}. Applied with studio_ui_export_set and each one read back, so the reply ' +
            "reports which actually took. The destination folder is not settable this way: it is a folder picker.",
        ),
      verify: z
        .boolean()
        .optional()
        .describe(
          "When true, probe the produced file (ffprobe) and compare it with the dialog's own readback: frame " +
            "rate, pixel size, codec, ProRes tag, container. The reply's `verify.checks` lists what matched and " +
            "`verify.unverifiable` what the dialog does not promise in comparable form (a preset framerate, " +
            "Benutzerdefiniert). Readback alone is not evidence — measured: a row reading `25.00` next to a file " +
            "that had to be 50 on a 50 fps source.",
        ),
      timeoutMs: z.number().int().optional().describe("How long to wait for the finished file (default 900000)"),
      pollMs: z.number().int().optional().describe("Polling interval (default 2000)"),
      title: z.string().optional(),
    },
  },
  async ({ outDir, stage = "full", settings = null, verify = false, timeoutMs = 900000, pollMs = 2000, title }) =>
    runExport({ title: title ?? "Insta360 Studio", outDir, stage, settings, verify, timeoutMs, pollMs }),
);

tool(
  "studio_ui_wait_export",
  {
    description: "Wait until a file in the output folder reaches a stable size, then return its path and size.",
    inputSchema: {
      file: z.string().optional().describe("Explicit file to watch; omit to watch the newest video in outDir"),
      outDir: z.string().optional(),
      timeoutMs: z.number().int().optional(),
      pollMs: z.number().int().optional(),
    },
  },
  async ({ file, outDir = DEFAULT_OUT_DIR, timeoutMs = 900000, pollMs = 2000 }) =>
    waitForExport({ file, outDir, timeoutMs, pollMs }),
);

tool(
  "studio_ui_open_media",
  {
    description:
      "Open a media file (.insv/.mp4) or project (.insproj) in Insta360 Studio by launching the app with that path. " +
      "Use this when studio_ui_state reports an empty player.",
    inputSchema: {
      file: z.string().describe("Absolute path to the media or project file"),
    },
  },
  async ({ file }) => {
    if (!existsSync(file)) return { launched: false, error: "file not found", file };
    const exe = studioExe();
    if (!exe || !existsSync(exe)) return { launched: false, error: "Studio executable not found", exe };
    const { spawn } = await import("node:child_process");
    const child = spawn(exe, [file], { detached: true, stdio: "ignore" });
    child.unref();
    return { launched: true, exe, file, pid: child.pid };
  },
);

tool(
  "studio_project_open",
  {
    description:
      "Open a project in the Studio GUI by path — works even when the project is not in Studio's library. " +
      "The library only lists projects registered in pro.insproj; a project that was never registered or was " +
      "moved between folders cannot be clicked there. This registers it (with Studio stopped, as Studio " +
      "rewrites pro.insproj on exit), repairs a stale projectPath inside the file, restarts Studio and clicks " +
      "the card. If the project is already registered and Studio is up, it degrades to a plain click.",
    inputSchema: {
      path: z.string().describe("Project directory or .insproj file"),
      title: z.string().optional().describe("Window title (default 'Insta360 Studio')"),
    },
  },
  async ({ path: target, title }) => openProjectAt(target, { title: title ?? "Insta360 Studio" }),
);

tool(
  "studio_ui_analyze_shot",
  {
    description: "Analyse an existing screenshot file: accent button boxes and player emptiness.",
    inputSchema: { file: z.string().describe("Path to a .png screenshot") },
  },
  async ({ file }) => analyzeShot(file),
);

// ---------------------------------------------------------------------------
// Text-level UI control (OCR)
//
// Studio's Qt canvas exposes no UI Automation tree, so the only way to find a
// control used to be its accent colour. These tools read the actual text off a
// screenshot with the OCR engine built into Windows, so a caller can click
// "Exportieren" by name and land wherever that button currently sits.
// ---------------------------------------------------------------------------

tool(
  "studio_ui_ocr",
  {
    description:
      "Screenshot the Studio window (or read an existing .png) and return the text on it, with window-relative " +
      "bounding boxes. This is the text-based counterpart to studio_ui_state's colour detection: use it to find " +
      "out what the dialog actually offers and where.",
    inputSchema: {
      file: z.string().optional().describe("Existing .png to read; omit to screenshot the window first"),
      title: z.string().optional().describe("Window title (default 'Insta360 Studio')"),
      lang: z.string().optional().describe("OCR language tag such as 'de' or 'en-US'; defaults to the Windows profile languages"),
      contains: z.string().optional().describe("Only return words containing this text (case-insensitive)"),
    },
  },
  async ({ file, title, lang, contains }) => {
    const shot = file ?? (await uiCapture({ title: title ?? "Insta360 Studio", mode: "print" })).path;
    const result = ocrImage(shot, { lang });
    if (!result.ok) return { ...result, screenshot: shot };
    return {
      screenshot: shot,
      lang: result.lang,
      size: { width: result.width, height: result.height },
      lineCount: result.lines.length,
      wordCount: result.words.length,
      ...(contains
        ? { words: findText(result, contains) }
        : { lines: result.lines.map((l) => l.text) }),
    };
  },
);

tool(
  "studio_ui_click_text",
  {
    description:
      "Find on-screen text in the Studio window by OCR and click it. Far more robust than studio_ui_click with a " +
      "hardcoded pixel, because the click lands on wherever the text currently is. " +
      "Example: text 'Exportieren' clicks the export button. Always reads the window with PrintWindow, so the " +
      "coordinates stay window-relative even when the window is occluded.",
    inputSchema: {
      text: z.string().describe("Text to click (case-insensitive substring match)"),
      title: z.string().optional(),
      lang: z.string().optional(),
      nth: z.number().int().optional().describe("Which match to click when several match (default 1)"),
      double: z.boolean().optional().describe("Double-click instead of a single click"),
    },
  },
  async ({ text, title, lang, nth = 1, double = false }) => {
    const windowTitle = title ?? "Insta360 Studio";
    const shot = (await uiCapture({ title: windowTitle, mode: "print" })).path;
    const result = ocrImage(shot, { lang });
    if (!result.ok) return { ...result, screenshot: shot };

    const hits = findText(result, text);
    if (!hits.length) {
      return {
        clicked: false,
        text,
        screenshot: shot,
        reason: "text not found on screen",
        visible: result.words.map((w) => w.text),
      };
    }

    const hit = hits[Math.min(nth, hits.length) - 1];
    const click = await uiClick({ title: windowTitle, x: hit.x, y: hit.y, double });
    return {
      clicked: true,
      text,
      matched: hit,
      otherMatches: hits.length - 1,
      click,
      screenshot: shot,
    };
  },
);

tool(
  "studio_ui_export_settings",
  {
    description:
      "Read the settings in Studio's export dialog: file name, output path, preset, resolution, frame rate, " +
      "bitrate, codec and colour space, plus the window coordinates to click each control. The dialog is CEF/HTML " +
      "inside the main window, so there is no UI Automation tree and no debug port -- this is screenshot + OCR. " +
      "Needs the dialog open: studio_ui_export with stage 'dialog' opens it, stage 'full' runs the whole export. " +
      "The reply also carries `persisted`: the same dialog's state from Studio's own file " +
      "(`nle/video_export_preset_model.json`, written when the dialog closes). That is the exact witness — the OCR " +
      "readback renders `ProRes 422` and `ProRes 422LT` alike — but it says what the dialog is set to, never what " +
      "an export produced (use studio_ui_export {verify:true}).",
    inputSchema: {
      title: z.string().optional(),
      control: z.string().optional().describe("Read only this control, e.g. 'Kodierung'"),
      listOptions: z
        .boolean()
        .optional()
        .describe("Also open the control's list box and return the options it offers"),
      keepOpen: z
        .boolean()
        .optional()
        .describe(
          "Leave the list box open after reading it (default false). An open box covers the controls " +
            "below it, so the next click on one of those lands on an option instead.",
        ),
    },
  },
  async ({ title, control, listOptions = false, keepOpen = false }) => {
    const windowTitle = title ?? "Insta360 Studio";
    if (control) {
      // Text fields have no list box, so there is nothing to open: clicking one
      // four times looking for a panel would just be noise.
      if (listOptions && isTextBox(control)) {
        const dialog = readDialog({ title: windowTitle });
        return {
          control,
          value: dialog.fields[control]?.value ?? null,
          click: dialog.fields[control]?.click ?? null,
          isTextBox: true,
          picker: isPickerField(control),
          note: isPickerField(control)
            ? `chosen in a modal folder picker ("Ordner öffnen"), which is not driven yet -- and which, while ` +
              `open, swallows every click and keystroke, so it must be cancelled before anything else is touched`
            : "text field -- set it with studio_ui_export_set, which types into it",
        };
      }
      const opened = listOptions ? await openControl({ title: windowTitle, label: control }) : null;
      // The boxes toggle, so close the one just read: left open it covers the
      // controls below it and the next click would pick an option instead.
      const closed = opened?.ok && !keepOpen ? await closeControl({ title: windowTitle, label: control }) : null;
      const dialog = readDialog({ title: windowTitle });
      const field = dialog.fields[control];
      return {
        control,
        value: field?.value ?? null,
        click: field?.click ?? null,
        options: opened?.ok ? opened.options : undefined,
        listBox: opened
          ? { ok: opened.ok, error: opened.error, box: opened.box, brightness: opened.brightness }
          : undefined,
        closedAgain: closed ? { ok: closed.ok, closed: closed.closed, isListBox: closed.isListBox } : undefined,
      };
    }
    const dialog = readDialog({ title: windowTitle });
    const raw = readPresetModel();
    const decoded = decodePreset(raw.model);
    return {
      window: dialog.window,
      settings: Object.fromEntries(Object.entries(dialog.fields).map(([k, v]) => [k, v.value])),
      controls: dialog.fields,
      screenshot: dialog.screenshot,
      // The dialog's state as Studio has it *on disk* (`nle/video_export_preset_model.json`).
      // Written when the dialog CLOSES, so an open dialog's own values can legitimately
      // differ (a pick only reaches the file on close) — and it is exact where the OCR
      // readback is not: it separates `ProRes 422` from `ProRes 422LT`, which the panel
      // renders identically.
      persisted: {
        file: raw.file,
        fileExists: raw.model !== null,
        writtenWhen: "dialog close (measured: a pick does not change the file; {ESC} does)",
        slots: describePreset(decoded),
        unknownCodes: decoded.unknown,
        note: "what the dialog is set to — not what an export produced (studio_ui_export {verify:true})",
      },
    };
  },
);

tool(
  "studio_ui_export_set",
  {
    description:
      "Change one setting in Studio's export dialog. The list boxes (Kodierung, Auflösung, Farbraum, Rahmen, " +
      "Bitrate, Voreinstellung) are opened and the matching entry clicked; the two text fields Dateiname and Pfad " +
      "are typed into. Either way the field is read back afterwards, so the reply states whether the value " +
      "actually changed. Use studio_ui_export_settings first to see what the controls are called and what they " +
      "currently hold.",
    inputSchema: {
      control: z.string().describe("Control label, e.g. 'Kodierung', 'Auflösung', 'Farbraum', 'Dateiname'"),
      value: z.string().describe("Option to pick (case-insensitive substring), or the text to type"),
      title: z.string().optional(),
      showOptions: z.boolean().optional().describe("Include the available options in the reply (default true)"),
    },
  },
  async ({ control, value, title, showOptions = true }) => {
    const windowTitle = title ?? "Insta360 Studio";
    const res = isTextBox(control)
      ? await setText({ title: windowTitle, label: control, text: value })
      : await selectOption({ title: windowTitle, label: control, text: value });
    return showOptions ? res : { ...res, options: undefined };
  },
);

// ---------------------------------------------------------------------------
// Export queue (Task Center)
// ---------------------------------------------------------------------------

tool(
  "studio_export_queue",
  {
    description:
      "Studio's export queue -- list, add, run, pause, clear. The export dialog has two buttons: " +
      "`Exportieren` runs the job now, `Zur Warteschlange` enqueues it. That split is confirmed in the " +
      "session log: `ExporterManager::EnqueueTask ... auto_start: 0` for the queued one and " +
      "`auto_start: 1` for `Exportieren`, which then runs to completion. The queue itself lives in the " +
      "Task Center view (`Aufgaben-Center`), reached by the title-bar icon; its rows read " +
      "`Dateiname | Dateigröße | Status` with `Warteschlange` while waiting, an empty queue says " +
      "`Es sind keine lokalen Exportaufgaben in Arbeit`, and its header buttons are `Alle starten`, " +
      "`Alle pausieren`, `Alle löschen`. " +
      "action 'list' opens that view and returns the count, rows and buttons; " +
      "'add' clicks `Zur Warteschlange` in the open export dialog (open it with studio_ui_export " +
      "{stage:'dialog'} first) and verifies by the dialog closing plus the queue count moving; " +
      "'run'/'pause' click `Alle starten`/`Alle pausieren`; " +
      "'clear' clicks `Alle löschen` and then its confirmation -- which is an English dialog " +
      "(`Please confirm whether to delete all exporting tasks`, buttons `Löschen`/`Abbrechen`), and " +
      "without that second click nothing is deleted. " +
      "Honest scope: 'add', 'list' and 'clear' have been executed against a live Studio; " +
      "'run'/'pause' have their buttons located and label-verified but were not executed, because a " +
      "live run would export a duplicate file -- read their reply as \"the button was clicked\", not " +
      "\"an export happened\". Every step re-reads the screen and returns ok:false with what it saw " +
      "instead of assuming the click landed: Studio ignores synthetic input in some states.",
    inputSchema: {
      action: z
        .enum(["list", "add", "run", "pause", "clear"])
        .optional()
        .describe("What to do (default list)"),
      title: z.string().optional(),
      verify: z
        .boolean()
        .optional()
        .describe("add: re-read the queue afterwards to confirm the count moved (default true)"),
      open: z
        .boolean()
        .optional()
        .describe("list: open the Task Center first if it is not already up (default true)"),
    },
  },
  async ({ action = "list", title, verify = true, open = true }) => {
    const windowTitle = title ?? "Insta360 Studio";

    if (action === "list") {
      const q = readQueue({ title: windowTitle, open });
      return {
        ok: q.ok,
        heading: q.heading,
        sections: q.sections,
        count: q.count,
        countKnown: q.countKnown,
        rows: q.rows,
        empty: q.empty,
        buttons: q.buttons,
        icon: q.iconTried,
        shot: q.shot,
        note: q.note,
      };
    }

    if (action === "add") return addToQueue({ title: windowTitle, verify });
    if (action === "clear") return clearQueue({ title: windowTitle });

    // run / pause: click, then re-read so the caller sees whether it took
    const clicked = clickQueueButton({ title: windowTitle, label: action });
    if (!clicked.ok) return clicked;
    uiSleep(2500);
    const after = readQueue({ title: windowTitle, open: false });
    return {
      ...clicked,
      clickVerifiedByButtonLocation: true,
      executedLive: false,
      queue: after.ok
        ? { count: after.count, rows: after.rows, empty: after.empty }
        : { note: after.note },
      note:
        action === "run"
          ? "the button was clicked; confirm an export actually started via the session log (progress lines) or studio_ui_export {verify:true}"
          : "the button was clicked; a paused job's status should read `Pausiert` in the re-read queue",
    };
  },
);

// ---------------------------------------------------------------------------
// Media page project file
// ---------------------------------------------------------------------------

tool(
  "studio_media_read",
  {
    description:
      "Read the **Media page's** project file (`.insprj`) for a media file -- the settings that " +
      "belong to no `.insproj`: per-clip manual colour, denoise/motion blur, watermark, the " +
      "Stats/Dashboard template, audio, stitching, and the speed (TimeShift) track. This is the " +
      "read half of the Media-page work; there is no writer yet. " +
      "Pass `file`, or `media`/`name` and the project is looked up first: the parent directory is " +
      "**md5 of the media path** -- measured on 920/920 of the JSON-era files on this machine " +
      "(research/insprj_lookup.mjs), so the lookup is exact. Files Studio 5.x wrote are XML with the " +
      "same extension and their directory is only *sometimes* that md5 (10/371 by `cloud_media_id`, " +
      "46/406 by folder + file name), so those are found by file name or by the path inside the file; " +
      "every candidate says how it was found (`hash`/`name`/`content`). " +
      "The reply names the encoding (`json` = 6.x, `xml` = 5.x) and, for XML, reports its own field " +
      "names under `legacy` plus `translationNotes` for the measured differences -- e.g. " +
      "`preference.audio.volume` reads 0.5 where the JSON `audio.currentVolume` reads 100, and " +
      "`preference.trim_start/_end` are milliseconds where the JSON `leftTrim/rightTrim` are frames. " +
      "No equivalence between the two encodings is claimed beyond `dashboard_setting`, which is the " +
      "one name that agrees. " +
      "Honest scope: this reads and reports; it changes nothing. Two things a caller must not infer " +
      "from it: the presence of a configured resource (a watermark path) does not mean the feature is " +
      "on -- the toggle is separate and this reader reports both; and the TimeShift track's `end` is " +
      "not a timeline length (one specimen has `end: 8184` against `sourceFrames: 2046` at rate 4), " +
      "so its timebase is still unresolved and must be measured before anything writes it.",
    inputSchema: {
      file: z.string().optional().describe("Path to a .insprj file (read directly)"),
      media: z.string().optional().describe("Media file path -- its project is looked up under the configured roots"),
      name: z.string().optional().describe("Media file name, when the path is unknown"),
      raw: z.boolean().optional().describe("Include the untouched JSON/XML tree (default false)"),
      findOnly: z.boolean().optional().describe("Return the lookup result only, without reading a file"),
    },
  },
  async ({ file, media, name, raw = false, findOnly = false }) => {
    let target = file;
    let lookup;
    if (!target && (media || name)) {
      lookup = findMediaProjects({ media: media ?? name, name });
      if (!lookup.ok) {
        return {
          ok: false,
          lookup: { hash: lookup.hash, hashMatched: false, candidates: [] },
          note: `${lookup.note}; pass \`file\` if the location is already known`,
        };
      }
      if (findOnly) return { ok: true, lookup, note: "lookup only -- nothing was read" };
      // A hash match is a certainty; a name/content match is the best available guess, so prefer the
      // former when both are present and report the alternatives either way.
      const preferred = lookup.matches.find((m) => m.match === "hash") ?? lookup.matches[0];
      target = preferred.path;
    }
    if (!target) return { ok: false, note: "pass `file`, or `media`/`name` to look the project up" };

    const project = readMediaProject(target, { includeRaw: raw });
    const summary = summariseMediaProject(project);
    const ambiguous = (lookup?.matches?.length ?? 0) > 1;
    return {
      ...summary,
      readFrom: target,
      lookup: lookup
        ? {
            hash: lookup.hash,
            hashMatched: lookup.hashMatched,
            candidates: lookup.matches.map((m) => ({ path: m.path, family: m.family, match: m.match })),
          }
        : undefined,
      ambiguous: ambiguous || undefined,
      note: [
        "read-only: nothing was changed.",
        ambiguous
          ? `${lookup.matches.length} candidates matched; the ${lookup.matches.some((m) => m.match === "hash") ? "hash" : "first"} match was read -- check \`lookup.candidates\` if that is not the one you meant.`
          : undefined,
        project.ok
          ? undefined
          : project.note,
      ]
        .filter(Boolean)
        .join(" "),
    };
  },
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
