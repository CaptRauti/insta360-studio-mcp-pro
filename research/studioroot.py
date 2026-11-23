"""Locate the Insta360 Studio install directory.

Studio 6.0.9 moved its install from ``C:\\Program Files\\Insta360 Studio`` to a
per-user location under ``%LOCALAPPDATA%\\Insta360\\Apps\\Insta360 Studio\\current``
and left the old folder behind empty — so a hardcoded path silently points at
nothing. Every script in this directory imports ROOT from here instead.

Resolution order:
  1. INSTA360_STUDIO_DIR
  2. %LOCALAPPDATA%\\Insta360\\Apps\\Insta360 Studio\\current   (>= 6.0.9)
  3. C:\\Program Files\\Insta360 Studio                          (<= 6.0.8)
  4. C:\\Program Files (x86)\\Insta360 Studio

Run it directly to see what it picked:

    python research/studioroot.py
"""

import os

EXE = 'Insta360 Studio.exe'
WORKER = 'studio_worker.dll'
LEGACY = r'C:\Program Files\Insta360 Studio'


def _valid(directory):
    return bool(directory) and os.path.isfile(os.path.join(directory, EXE))


def _candidates():
    local = os.environ.get('LOCALAPPDATA') or os.path.join(
        os.path.expanduser('~'), 'AppData', 'Local')

    apps = os.path.join(local, 'Insta360', 'Apps')
    if os.path.isdir(apps):
        for name in sorted(os.listdir(apps)):
            yield os.path.join(apps, name, 'current')

    yield r'C:\Program Files\Insta360 Studio'
    yield r'C:\Program Files (x86)\Insta360 Studio'


def find_root():
    """Return the install directory, or None when Studio is not installed."""
    env = os.environ.get('INSTA360_STUDIO_DIR')
    if _valid(env):
        return env
    for candidate in _candidates():
        if _valid(candidate):
            return candidate
    return None


FOUND = find_root()
# Fall back to the legacy path so callers still produce a sensible error
# message instead of crashing on None.
ROOT = FOUND or LEGACY


def path(*parts):
    """Join parts onto the install directory, e.g. path('data', 'cfg.json')."""
    return os.path.join(ROOT, *parts)


def version():
    """Installed file version, or None when it cannot be read."""
    import subprocess

    exe = path(EXE)
    if not os.path.isfile(exe):
        return None
    try:
        out = subprocess.run(
            ['powershell', '-NoProfile', '-Command',
             "(Get-Item -LiteralPath '{}').VersionInfo.FileVersion".format(exe)],
            capture_output=True, text=True, timeout=30)
        return out.stdout.strip() or None
    except Exception:
        return None


def main():
    print('found    :', FOUND)
    print('ROOT     :', ROOT)
    print('version  :', version())
    print('worker   :', path(WORKER), os.path.isfile(path(WORKER)))
    print('data/    :', os.path.isdir(path('data')))
    print('Resources:', os.path.isdir(path('Resources')))


if __name__ == '__main__':
    main()
