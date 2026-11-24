// Insta360 Studio keeps its settings in one plain INI file beside its local data.
//
// Everything the manual treats as a preference lives here — where projects and
// media live, which codecs and hardware paths the export may use, the UI
// language — as `key=value` under a `[section]` header, so it is readable text
// rather than a registry hive or an encrypted store. Measured on 6.0.9:
//
//   [preference] project_location / workspace_location / footage_project_location
//                last_visit_dir / export_location
//   [codec]      hardware_decoding_preview, hardware_encoding_export,
//                hardware_encoding_h265_export, cuda_accel, hardaware_model
//   [ui]         theme, first_run, onboarding_shown
//
// Reading is free. Writing is not: Studio holds this file in memory and rewrites
// it when it exits, so a write while the process is up is silently lost. set()
// therefore refuses unless Studio is closed (or force is passed for a caller who
// knows what it is doing).
import { copyFileSync, existsSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { execFileSync } from "node:child_process";
import { insta360LocalRoot } from "./logs.mjs";
import { studioExe } from "./studio-path.mjs";

/** The location keys a caller usually wants, in the order the app uses them. */
export const LOCATION_KEYS = [
  "workspace_location", //  where Studio saves timeline projects (our project root)
  "footage_project_location", // where footage projects live
  "project_location", //  the manual's "Project File Save Path"
  "export_location", //   default target for exports
  "last_visit_dir", //    where the file dialogs last pointed
];

/** Absolute path of Studio's settings file. */
export function prefsFile(env = process.env) {
  return join(insta360LocalRoot(env), "Insta360 Studio", "startup.ini");
}

/**
 * Parse an INI file into `{ section: { key: value } }`, preserving the order the
 * keys appear in and ignoring comments. Keys before any header land in "".
 */
export function parseIni(text) {
  const sections = {};
  let section = "";
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith(";") || line.startsWith("#")) continue;
    const header = /^\[(.+)\]$/.exec(line);
    if (header) {
      section = header[1];
      sections[section] ??= {};
      continue;
    }
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    if (!key) continue;
    sections[section] ??= {};
    sections[section][key] = line.slice(eq + 1).trim();
  }
  return sections;
}

/** Read the whole file, or one section of it, with its path and age. */
export function readPrefs({ file = prefsFile(), section } = {}) {
  if (!existsSync(file)) return { file, exists: false, sections: {}, ageSeconds: null };
  const text = readFileSync(file, "utf8");
  const all = parseIni(text);
  const ageSeconds = Math.round((Date.now() - statSync(file).mtimeMs) / 1000);
  const sections = section ? (section in all ? { [section]: all[section] } : {}) : all;
  return { file, exists: true, sections, ageSeconds, sectionMissing: Boolean(section && !(section in all)) };
}

/** Values are strings in the file; this is what they mean. */
export function typedValue(raw) {
  if (raw == null) return raw;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^-?\d+$/.test(raw)) return Number(raw);
  return raw;
}

/**
 * Look one key up. Without a section the first section that has it wins, and the
 * answer says which — `cuda_accel` is in [codec], `lang` in [preference].
 */
export function getPref(key, { file = prefsFile(), section } = {}) {
  const { sections } = readPrefs({ file, section });
  for (const [name, entries] of Object.entries(sections)) {
    if (key in entries) return { key, section: name, raw: entries[key], value: typedValue(entries[key]) };
  }
  return { key, section: null, raw: null, value: null, missing: true };
}

/** The location keys, with each directory's existence checked. */
export function readPaths({ file = prefsFile(), env = process.env } = {}) {
  const { exists } = readPrefs({ file });
  const paths = {};
  for (const key of LOCATION_KEYS) paths[key] = getPref(key, { file }).value ?? null;
  return {
    file,
    exists,
    paths,
    missingDirectories: LOCATION_KEYS.filter((k) => paths[k] && !existsSync(paths[k])),
  };
}

/**
 * Is the Studio window up? Its settings are rewritten on exit, so this is the
 * guard for writing them. Exported separately from the tool so tests can see it.
 */
export function studioGuiRunning({ env = process.env } = {}) {
  let exe;
  try {
    exe = studioExe(env);
  } catch {
    return { running: false, image: null, pids: [], note: "install path unknown" };
  }
  const image = basename(exe);
  try {
    const out = execFileSync("tasklist", ["/FI", `IMAGENAME eq ${image}`, "/FO", "CSV", "/NH"], {
      encoding: "utf8",
      windowsHide: true,
    });
    const pids = [];
    for (const line of out.split(/\r?\n/)) {
      const cols = line.split('","');
      if (cols.length < 2) continue;
      const pid = Number(cols[1].replace(/"/g, "").trim());
      if (Number.isInteger(pid) && pid > 0) pids.push(pid);
    }
    return { running: pids.length > 0, image, pids };
  } catch {
    return { running: false, image, pids: [], note: "tasklist unavailable" };
  }
}

/**
 * Set one key, editing the single line in place so every other byte of the file
 * — including the 61 colour entries and the window geometry blob — is left
 * exactly as Studio wrote it. A `.bak` copy is kept next to the file.
 *
 * Refuses while Studio is running: measured, Studio rewrites the file from
 * memory on exit, so the write would be undone. Pass force to override.
 */
export function setPref(
  key,
  value,
  { section, file = prefsFile(), force = false, env = process.env, isRunning = null } = {},
) {
  if (!existsSync(file)) throw new Error(`settings file not found: ${file}`);
  const running = isRunning ?? studioGuiRunning({ env });
  if (running.running && !force) {
    throw new Error(
      `Insta360 Studio is running (pid ${running.pids.join(", ")}) and rewrites ${basename(file)} on exit — close it first, or pass force=true to write anyway`,
    );
  }
  const text = readFileSync(file, "utf8");
  const eol = text.includes("\r\n") ? "\r\n" : "\n";
  const lines = text.split(/\r?\n/);
  const wanted = String(value);
  let current = "";
  let target = -1;
  let lastInSection = -1;
  let sectionHeader = -1;
  for (let i = 0; i < lines.length; i += 1) {
    const header = /^\s*\[(.+)\]\s*$/.exec(lines[i]);
    if (header) {
      if (current === section && lastInSection >= 0) break;
      current = header[1];
      if (header[1] === section) sectionHeader = i;
      continue;
    }
    if (current !== (section ?? current)) continue;
    const eq = lines[i].indexOf("=");
    if (eq < 0) continue;
    if (lines[i].slice(0, eq).trim() === key) {
      target = i;
      break;
    }
    lastInSection = i;
  }

  const before = target >= 0 ? lines[target] : null;
  if (target >= 0) {
    lines[target] = `${key}=${wanted}`;
  } else if (section && lastInSection >= 0) {
    lines.splice(lastInSection + 1, 0, `${key}=${wanted}`);
  } else if (section && sectionHeader >= 0) {
    lines.splice(sectionHeader + 1, 0, `${key}=${wanted}`);
  } else if (section) {
    lines.push(`[${section}]`, `${key}=${wanted}`);
  } else {
    throw new Error(`key ${key} not found and no section given — pass section to create it`);
  }

  copyFileSync(file, `${file}.bak`);
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, lines.join(eol), "utf8");
  renameSync(tmp, file);
  return {
    file,
    section: section ?? getPref(key, { file }).section,
    key,
    before,
    after: `${key}=${wanted}`,
    backup: `${file}.bak`,
    studioWasRunning: running.running,
  };
}
