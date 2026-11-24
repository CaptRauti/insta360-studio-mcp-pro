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
import { existsSync } from "node:fs";
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
  moveWindow as uiMoveWindow,
  runExport,
  sendKeys as uiSendKeys,
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
import { openProjectAt } from "./pipeline.mjs";

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
      "Read — and, with care, set — Insta360 Studio's own settings, which live in one plain INI file (`startup.ini` under %LOCALAPPDATA%\\Insta360\\Insta360 Studio). This is where the locations the manual calls `Project File Save Path` and the media/export folders really are ([preference]: workspace_location, footage_project_location, project_location, export_location, last_visit_dir), together with the codec and hardware switches that decide how an export is rendered ([codec]: hardware_decoding_preview, hardware_encoding_export, hardware_encoding_h265_export, cuda_accel, hardaware_model), the UI language and theme ([ui], [preference] lang). action=read dumps the sections, action=paths gives the five locations with each directory's existence checked, action=get resolves one key, action=set rewrites a single line in place (keeping every other byte, with a .bak copy). set REFUSES while Studio is running because Studio rewrites the file from memory when it exits — close Studio first, or pass force=true when you know the change is meant to be transient.",
    inputSchema: {
      action: z.enum(["read", "paths", "get", "set"]).optional().describe("What to do (default read)"),
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
      default:
        return { ...readPrefs({ file, section }), studio: studioGuiRunning(), knownLocationKeys: LOCATION_KEYS };
    }
  },
);

tool(
  "studio_logs",
  {
    description:
      "Read Insta360 Studio's own logs. action=list summarises each log area (studio, detector, quick_look, setup) and says how much of it is readable, including how many of the encrypted containers the recovered keystream still opens; action=sessions lists recent Studio starts with their files; action=read returns the tail of one file; action=grep searches the logs; action=window (at=ISO time) returns what Studio was doing around a moment — the session is found from the time, and dates are reconstructed from the session directory, so a stall can be placed in absolute time. Studio writes its main/export/thumbnail/quick_look logs as an XOR container — those are decrypted transparently (the keystream is verified against pid and start time from the file name on every read) and reported as encrypted only when that verification fails, so a caller can tell 'nothing wrong' apart from 'cannot see'. Use studio_dumps for hang/crash minidumps.",
    inputSchema: {
      action: z
        .enum(["list", "sessions", "read", "grep", "window"])
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
    return {
      studioDir: dir,
      exists: true,
      ...studioInfo(),
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
      timeoutMs: z.number().int().optional().describe("How long to wait for the finished file (default 900000)"),
      pollMs: z.number().int().optional().describe("Polling interval (default 2000)"),
      title: z.string().optional(),
    },
  },
  async ({ outDir, stage = "full", settings = null, timeoutMs = 900000, pollMs = 2000, title }) =>
    runExport({ title: title ?? "Insta360 Studio", outDir, stage, settings, timeoutMs, pollMs }),
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
      "Needs the dialog open: studio_ui_export with stage 'dialog' opens it, stage 'full' runs the whole export.",
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
    return {
      window: dialog.window,
      settings: Object.fromEntries(Object.entries(dialog.fields).map(([k, v]) => [k, v.value])),
      controls: dialog.fields,
      screenshot: dialog.screenshot,
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
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
