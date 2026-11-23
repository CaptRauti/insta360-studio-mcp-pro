// Where is Insta360 Studio installed?
//
// Studio 6.0.9 moved: the launcher now installs per-user under
// %LOCALAPPDATA%\Insta360\Apps\Insta360 Studio\current\ and leaves
// C:\Program Files\Insta360 Studio behind as an empty folder. Anything that
// hardcodes the old path silently breaks, so resolve it instead — from the
// running process first (always correct), then the known locations.
//
// Resolution order:
//   1. INSTA360_STUDIO_DIR environment variable
//   2. the directory of a running "Insta360 Studio.exe" (most reliable)
//   3. %LOCALAPPDATA%\Insta360\Apps\Insta360 Studio\current
//   4. C:\Program Files\Insta360 Studio            (<= 6.0.8 layout)
//   5. C:\Program Files (x86)\Insta360 Studio
//
// The result is cached for the lifetime of the process.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const EXE = "Insta360 Studio.exe";
const WORKER = "studio_worker.dll";

let cached = null;

function hasStudio(dir) {
  return !!dir && existsSync(path.join(dir, EXE));
}

function fromEnv() {
  const dir = process.env.INSTA360_STUDIO_DIR;
  return hasStudio(dir) ? { dir, source: "INSTA360_STUDIO_DIR" } : null;
}

function fromRunningProcess() {
  try {
    const out = execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        "(Get-CimInstance Win32_Process -Filter \"Name='Insta360 Studio.exe'\" | " +
          "Select-Object -First 1 -ExpandProperty ExecutablePath)",
      ],
      { encoding: "utf8", timeout: 20000, windowsHide: true },
    ).trim();
    if (out && existsSync(out)) {
      return { dir: path.dirname(out), source: "running process" };
    }
  } catch {
    /* Studio not running, or PowerShell unavailable */
  }
  return null;
}

function fromKnownPaths() {
  const local = process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local");
  const candidates = [
    path.join(local, "Insta360", "Apps", "Insta360 Studio", "current"),
    "C:\\Program Files\\Insta360 Studio",
    "C:\\Program Files (x86)\\Insta360 Studio",
  ];

  // Newest sibling under Apps\*\current, in case the folder is renamed.
  const apps = path.join(local, "Insta360", "Apps");
  try {
    for (const name of readdirSync(apps)) {
      candidates.push(path.join(apps, name, "current"));
    }
  } catch {
    /* no Apps directory */
  }

  for (const dir of candidates) {
    if (hasStudio(dir)) return { dir, source: "known location" };
  }
  return null;
}

/** Resolve the install directory. Returns { dir, source } (dir may be null). */
export function resolveStudio() {
  if (cached) return cached;
  cached = fromEnv() ?? fromRunningProcess() ?? fromKnownPaths() ?? { dir: null, source: "not found" };
  return cached;
}

/** Absolute path to the install directory, or null. */
export function studioDir() {
  return resolveStudio().dir;
}

/** Absolute path to "Insta360 Studio.exe", or null. */
export function studioExe() {
  const dir = studioDir();
  return dir ? path.join(dir, EXE) : null;
}

/** Absolute path to studio_worker.dll (holds the gRPC descriptors), or null. */
export function studioWorkerDll() {
  const dir = studioDir();
  return dir ? path.join(dir, WORKER) : null;
}

/** File version of the installed executable, e.g. "6.0.9.0". Null when unknown. */
export function studioVersion() {
  const exe = studioExe();
  if (!exe) return null;
  try {
    const out = execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `(Get-Item -LiteralPath '${exe.replace(/'/g, "''")}').VersionInfo.FileVersion`,
      ],
      { encoding: "utf8", timeout: 20000, windowsHide: true },
    ).trim();
    return out || null;
  } catch {
    return null;
  }
}

/** Everything a diagnostics tool wants in one object. */
export function studioInfo() {
  const { dir, source } = resolveStudio();
  if (!dir) {
    return {
      found: false,
      source,
      hint:
        "Set INSTA360_STUDIO_DIR, or start Studio once so the running process can be located.",
    };
  }
  const worker = studioWorkerDll();
  return {
    found: true,
    source,
    dir,
    exe: studioExe(),
    workerDll: worker,
    workerBytes: worker && existsSync(worker) ? statSync(worker).size : null,
    version: studioVersion(),
    layout: dir.toLowerCase().includes("apps\\insta360 studio")
      ? "per-user (launcher install, >= 6.0.9)"
      : "machine-wide (Program Files, <= 6.0.8)",
  };
}
