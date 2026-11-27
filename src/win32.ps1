# Win32 helper for Insta360 Studio UI automation.
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File win32.ps1 -Action find -Title "Insta360 Studio"
#   ... -Action click -X 120 -Y 40 [-Hwnd 135976]
#   ... -Action keys -Keys "^e" [-Hwnd ...]
#   ... -Action type -Text "abc"
#   ... -Action focus
#   ... -Action capture -Out C:\path\shot.png
# -Quiet: never disturb the machine the user is working on. No cursor movement,
# no foreground change, no restore of a minimised window, no move. Clicks are
# delivered as WM_* messages to the window under the point, keys go to the
# focused child through the attached input queue instead of the system queue.
# ui.mjs sets this from INSTA360_QUIET, so the policy lives in one place.
param(
  [Parameter(Mandatory=$true)][string]$Action,
  [string]$Title = "Insta360 Studio",
  [int]$Hwnd = 0,
  [int]$X = -1,
  [int]$Y = -1,
  [string]$Keys = "",
  [string]$Key = "",
  [int]$Repeat = 1,
  # Wheel delta for -Action scroll, in the units WM_MOUSEWHEEL takes: multiples of
  # 120, positive away from the user (up), negative towards them (down).
  [int]$Delta = -120,
  [string]$Text = "",
  [string]$Out = "",
  [int]$SleepMs = 120,
  [switch]$Pin,
  [switch]$Quiet,
  # Send the click straight to the named window in client coordinates, without the
  # WindowFromPoint z-order lookup. Use when an always-on-top window covers the
  # target (the lookup then resolves the coverer however often the target is
  # re-pinned), or to verify the message sequence against a window of your own.
  [switch]$Direct,
  # "left" (default) or "right". Studio creates a view keyframe from a right-button
  # gesture, so the button is part of the gesture and not a detail of the caller.
  [ValidateSet("left", "right")][string]$Button = "left",
  # Drag destination, client coordinates, for -Action rightdrag.
  [int]$ToX = -1,
  [int]$ToY = -1
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Windows.Forms | Out-Null
Add-Type -AssemblyName System.Drawing | Out-Null

$sig = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class W32 {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern bool GetCursorPos(out POINT p);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, int dx, int dy, uint d, IntPtr e);
  [DllImport("user32.dll")] public static extern IntPtr FindWindowEx(IntPtr p, IntPtr c, string cls, string title);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr FindWindow(string cls, string title);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint msg, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] public static extern IntPtr SendMessage(IntPtr h, uint msg, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint flags);
  [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte scan, uint flags, IntPtr extra);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint flags);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr h);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumProc cb, IntPtr l);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsWindowEnabled(IntPtr h);
  [DllImport("user32.dll")] public static extern IntPtr GetWindow(IntPtr h, uint cmd);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern IntPtr WindowFromPoint(POINT p);
  [DllImport("user32.dll")] public static extern IntPtr SetFocus(IntPtr h);
  [DllImport("user32.dll")] public static extern IntPtr MonitorFromWindow(IntPtr h, uint flags);
  [DllImport("user32.dll")] public static extern bool RedrawWindow(IntPtr h, IntPtr r, IntPtr hrgn, uint flags);
  [DllImport("user32.dll")] public static extern bool UpdateWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetMonitorInfo(IntPtr m, ref MONITORINFO mi);
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool attach);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X, Y; }
  [StructLayout(LayoutKind.Sequential)] public struct MONITORINFO {
    public int cbSize; public RECT rcMonitor; public RECT rcWork; public uint dwFlags;
  }
}
"@
if (-not ("W32" -as [type])) { Add-Type -TypeDefinition $sig }

function Get-WinRect([IntPtr]$h) {
  $r = New-Object W32+RECT
  [void][W32]::GetWindowRect($h, [ref]$r)
  return $r
}

function Get-MonitorInfo([IntPtr]$h) {
  $mi = New-Object W32+MONITORINFO
  $mi.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($mi)
  $mon = [W32]::MonitorFromWindow($h, 2)   # MONITOR_DEFAULTTONEAREST
  [void][W32]::GetMonitorInfo($mon, [ref]$mi)
  return @{
    handle = [int64]$mon
    primary = (($mi.dwFlags -band 1) -eq 1)
    left = $mi.rcMonitor.Left; top = $mi.rcMonitor.Top
    right = $mi.rcMonitor.Right; bottom = $mi.rcMonitor.Bottom
  }
}

# Pick the best of several candidate handles: visible first, then largest area.
#
# Area is what separates the real window from the placeholders: the real one measured
# 1384x900, every placeholder 1x1. A minimised real window still wins (its iconic rect
# is ~160x31), and `iconic` is reported separately so the caller can say so.
function Select-BestWindow($candidates) {
  $pick = $null
  foreach ($pass in @("visible", "any")) {
    foreach ($cand in @($candidates)) {
      if ($null -eq $cand -or $cand -eq [IntPtr]::Zero) { continue }
      if ($pass -eq "visible" -and -not [W32]::IsWindowVisible($cand)) { continue }
      $r = Get-WinRect $cand
      $area = ($r.Right - $r.Left) * ($r.Bottom - $r.Top)
      if ($null -eq $pick -or $area -gt $pick.area) { $pick = @{ hwnd = $cand; area = $area } }
    }
    if ($null -ne $pick) { return [IntPtr]$pick.hwnd }
  }
  return [IntPtr]::Zero
}

# Find the Studio window by title.
#
# The title is *not* the unique handle it looks like. Measured with Studio 6.0.9 running:
# 48 top-level windows carried exactly the title "Insta360 Studio" -- one real (1384x900,
# visible) plus 47 invisible 1x1 Qt placeholders of class Qt6511QWindowOwnDCIcon, spread
# over three processes. And FindWindow($null, "Insta360 Studio") returned 0 ten times out
# of ten, so that call never resolved anything here; the substring fallback did, and it
# took the first *visible* match in Z-order while ignoring its size. Measured cost: inside a
# single script run, `find` reported hwnd 201322 at 2560x1440 while `capture` reported
# 15272252 at 1384x900 -- two calls, two different handles. Window-relative coordinates then
# mean different things, and because a click is resolved through WindowFromPoint, the same
# click that had just toggled a checkbox stopped toggling it and moved the window instead.
# So enumerate and choose deliberately: exact title first, visible only, largest area
# (`Select-BestWindow`), and report how many windows shared the title.
function Find-Target {
  $script:titleMatches = 0
  if ($Hwnd -ne 0) { return [IntPtr]$Hwnd }
  $script:exact = @()
  $script:like = @()
  $cb = [W32+EnumProc]{
    param($hw, $l)
    $len = [W32]::GetWindowTextLength($hw)
    if ($len -le 0) { return $true }
    $sb = New-Object System.Text.StringBuilder ($len + 2)
    [void][W32]::GetWindowText($hw, $sb, $sb.Capacity)
    $t = $sb.ToString()
    if ($t -eq $Title) { $script:titleMatches++; $script:exact += $hw }
    elseif ($t -like "*$Title*") { $script:like += $hw }
    return $true
  }
  [void][W32]::EnumWindows($cb, [IntPtr]::Zero)
  $h = Select-BestWindow $script:exact
  if ($h -ne [IntPtr]::Zero) { return $h }
  # No exact title match at all: fall back to a substring match over the same criteria.
  return (Select-BestWindow $script:like)
}

function Get-BlockingModal([IntPtr]$top) {
  # The native dialog that makes $top disabled, if there is one.
  #
  # Windows disables a window while a modal dialog owned by it is up, and then
  # *silently discards* its mouse and keyboard input: SendMessage/PostMessage
  # still return normally, so a caller checking only for errors concludes the
  # click landed. Everything the automation does looks fine and nothing happens.
  # Measured with Studio's folder picker ("Ordner öffnen", class #32770): while
  # it was up, opening a list box failed in every one of four attempts at every
  # x across the row, and pixel-diffing the export dialog showed nothing --
  # because PrintWindow of the parent does not include the picker.
  #
  # Owned windows are enumerated rather than assuming class #32770: a Qt dialog
  # of the same process counts too. Titles are read for the message.
  $script:modal = $null
  $cb = [W32+EnumProc]{
    param($hw, $l)
    if ($hw -eq $top) { return $true }
    if (-not [W32]::IsWindowVisible($hw)) { return $true }
    if ([W32]::GetWindow($hw, 4) -ne $top) { return $true }   # GW_OWNER must be the target
    $len = [W32]::GetWindowTextLength($hw)
    $sb = New-Object System.Text.StringBuilder ([Math]::Max($len + 2, 2))
    [void][W32]::GetWindowText($hw, $sb, $sb.Capacity)
    $cls = New-Object System.Text.StringBuilder 256
    [void][W32]::GetClassName($hw, $cls, 256)
    $script:modal = @{ hwnd = [int64]$hw; title = $sb.ToString(); cls = $cls.ToString() }
    return $false
  }
  [void][W32]::EnumWindows($cb, [IntPtr]::Zero)
  return $script:modal
}

$h = Find-Target
if ($h -eq [IntPtr]::Zero) {
  Write-Output (@{ ok = $false; error = "window not found"; title = $Title } | ConvertTo-Json -Compress)
  exit 1
}

# Input sent to a disabled window is discarded by Windows without an error, so
# every input action checks first and refuses loudly. Reading (capture, find,
# uia) stays allowed: a modal blocker is exactly when a screenshot is wanted.
if ($Action -in @("click", "dblclick", "scroll", "rightdrag", "atkeys", "keymsg", "keys", "type")) {
  if (-not [W32]::IsWindowEnabled($h)) {
    $modal = Get-BlockingModal $h
    $err = if ($modal) {
      "window is disabled while the modal ""$($modal.title)"" (class $($modal.cls), hwnd $($modal.hwnd)) is open; Windows discards input to a disabled window, so $Action cannot land -- close the modal first"
    } else {
      "window is disabled and no window it owns was found; Windows discards input to a disabled window, so $Action cannot land"
    }
    Write-Output (@{ ok = $false; blocked = $true; action = $Action; modal = $modal; error = $err } | ConvertTo-Json -Compress)
    exit 4
  }
}

# Restoring a minimised window would push it in front of the user's work, so in
# quiet mode a minimised Studio is reported as such and the caller decides.
if ([W32]::IsIconic($h)) { if (-not $Quiet) { [void][W32]::ShowWindow($h, 9) } }

function Set-Foreground($hwnd) {
  # Bringing a window to the front from a background process is blocked two ways:
  # SetForegroundWindow/BringWindowToTop return false (Windows' foreground lock),
  # and the ALT-keypress trick that is supposed to release that lock does not
  # reliably work here either — measured: both returned false and the foreground
  # window stayed put.
  #
  # SetWindowPos with HWND_TOPMOST is not subject to the lock and does work
  # (measured: returns true, and WindowFromPoint over the target's area then
  # resolves to it). It is used as the primary mechanism, with the foreground
  # calls kept as a best-effort follow-up so keyboard focus lands too.
  $HWND_TOPMOST = [IntPtr](-1)
  $SWP_NOSIZE = 0x1
  $SWP_NOMOVE = 0x2
  $SWP_SHOWWINDOW = 0x40
  [void][W32]::SetWindowPos($hwnd, $HWND_TOPMOST, 0, 0, 0, 0, ($SWP_NOMOVE -bor $SWP_NOSIZE -bor $SWP_SHOWWINDOW))
  Start-Sleep -Milliseconds 120
  [void][W32]::keybd_event(0x12, 0, 0, [IntPtr]::Zero)   # ALT down
  [void][W32]::keybd_event(0x12, 0, 2, [IntPtr]::Zero)   # ALT up
  Start-Sleep -Milliseconds 60
  [void][W32]::SetForegroundWindow($hwnd)
  Start-Sleep -Milliseconds 100
}

# Undo the TOPMOST pin, so the window does not float over everything afterwards.
function Clear-Topmost($hwnd) {
  $HWND_NOTOPMOST = [IntPtr](-2)
  $SWP_NOSIZE = 0x1
  $SWP_NOMOVE = 0x2
  [void][W32]::SetWindowPos($hwnd, $HWND_NOTOPMOST, 0, 0, 0, 0, ($SWP_NOMOVE -bor $SWP_NOSIZE))
}

# The window under a point, with a guard: it must belong to the same process as
# the target, so a race (the user moved the window, another app covers it) can
# never click into somebody else's application.
function Resolve-Child([IntPtr]$top, [int]$relX, [int]$relY) {
  $rect = Get-WinRect $top
  $pt = New-Object W32+POINT
  $pt.X = $rect.Left + $relX
  $pt.Y = $rect.Top + $relY
  $child = [W32]::WindowFromPoint($pt)
  if ($child -eq [IntPtr]::Zero) { throw "no window at screen $($pt.X),$($pt.Y)" }
  $pidTop = 0; $pidChild = 0
  [void][W32]::GetWindowThreadProcessId($top, [ref]$pidTop)
  [void][W32]::GetWindowThreadProcessId($child, [ref]$pidChild)
  if ($pidTop -ne $pidChild) { throw "window at screen $($pt.X),$($pt.Y) belongs to another process (pid $pidChild), refusing" }
  return @{ child = $child; screenX = $pt.X; screenY = $pt.Y }
}

# The window under a point, with a pin-and-retry fallback for occlusion.
#
# Quiet mode relies on WindowFromPoint, which resolves by z-order, so a window
# that another application covers cannot be reached at all. Measured: with Teams
# maximised on the primary monitor, Studio sat behind it and every card click in
# the project library was refused ("belongs to another process") — the clicks
# were delivered, nothing happened, and the caller saw a project that "did not
# open". The same applies to a covering window of our own process, which resolves
# to the wrong child.
#
# The fallback pins the target topmost for the length of the resolution, then
# hands the front back with Clear-Topmost. The cursor and the keyboard focus are
# still untouched, so quiet mode's promise — the user's mouse and typing are not
# disturbed — holds; only the z-order changes, and only when the plain path
# refuses outright.
function Resolve-ChildPinned([IntPtr]$top, [int]$relX, [int]$relY) {
  try {
    $r = Resolve-Child $top $relX $relY
    return @{ child = $r.child; screenX = $r.screenX; screenY = $r.screenY; pinned = $false }
  } catch {
    if ($_.Exception.Message -notmatch "belongs to another process|no window at screen") { throw }
    Set-Topmost $top
    try {
      $r = Resolve-Child $top $relX $relY
      return @{ child = $r.child; screenX = $r.screenX; screenY = $r.screenY; pinned = $true }
    } catch {
      # Distinguish the two stages in the message: a bare refusal is the point
      # being empty of our window, "after pinning" means the pin did not lift it
      # above the covering window.
      throw ("after pinning the window topmost, " + $_.Exception.Message)
    } finally {
      Clear-Topmost $top
    }
  }
}

# Pin a window to the top of the z-order without moving or resizing it.
function Set-Topmost($hwnd) {
  $HWND_TOPMOST = [IntPtr](-1)
  $SWP_NOSIZE = 0x1
  $SWP_NOMOVE = 0x2
  $SWP_SHOWWINDOW = 0x40
  [void][W32]::SetWindowPos($hwnd, $HWND_TOPMOST, 0, 0, 0, 0, ($SWP_NOMOVE -bor $SWP_NOSIZE -bor $SWP_SHOWWINDOW))
  Start-Sleep -Milliseconds 90
}

# Click by message instead of by cursor. The user keeps their mouse: nothing
# moves the pointer, nothing takes the foreground, and the click still lands
# because the messages are delivered to the window under the point.
function Send-MessageClick([IntPtr]$top, [int]$relX, [int]$relY, [bool]$double, [bool]$direct = $false, [string]$button = "left") {
  $WM_MOUSEMOVE = 0x0200
  # Left and right are different messages, not different wParam values.
  $downMsg = $(if ($button -eq "right") { 0x0204 } else { 0x0201 })   # WM_(R|L)BUTTONDOWN
  $upMsg = $(if ($button -eq "right") { 0x0205 } else { 0x0202 })     # WM_(R|L)BUTTONUP
  $downState = $(if ($button -eq "right") { [IntPtr]2 } else { [IntPtr]1 })
  # A double click is a *message*, not two clicks: the OS raises
  # WM_LBUTTONDBLCLK only for real mouse input, and CEF/Qt widgets that act on a
  # double click wait for exactly that message. Sending DOWN/UP twice looks like
  # two single clicks and opens nothing.
  $WM_LBUTTONDBLCLK = 0x0203
  if ($direct) {
    # -Direct: the caller named the window, so the point is already client-relative
    # and the z-order lookup is skipped. Needed when an always-on-top window covers
    # the target: WindowFromPoint then resolves the coverer no matter how often the
    # target is re-pinned, and nothing can be driven. It is also the only way to
    # verify the message sequence against a window of one's own.
    $child = $top
    $cx = $relX
    $cy = $relY
    $style = "direct"
  } else {
    $found = Resolve-ChildPinned $top $relX $relY
    $child = $found.child
    $cr = Get-WinRect $child
    $cx = $found.screenX - $cr.Left
    $cy = $found.screenY - $cr.Top
    $style = $(if ($found.pinned) { "message-pinned" } else { "message" })
  }
  $lp = [IntPtr]((($cy -band 0xFFFF) -shl 16) -bor ($cx -band 0xFFFF))
  [void][W32]::SendMessage($child, $WM_MOUSEMOVE, [IntPtr]::Zero, $lp)
  Start-Sleep -Milliseconds 30
  [void][W32]::SendMessage($child, $downMsg, $downState, $lp)
  Start-Sleep -Milliseconds 45
  [void][W32]::SendMessage($child, $upMsg, [IntPtr]::Zero, $lp)
  if ($double -and $button -eq "left") {
    Start-Sleep -Milliseconds 60
    [void][W32]::SendMessage($child, $WM_LBUTTONDBLCLK, $downState, $lp)
    Start-Sleep -Milliseconds 45
    [void][W32]::SendMessage($child, $upMsg, [IntPtr]::Zero, $lp)
  }
  return @{ mode = $style; child = [int64]$child; cx = $cx; cy = $cy }
}

# Wheel as a window message, so a scrollable list can be read without taking the
# pointer or the foreground. Two details differ from the click above: WM_MOUSEWHEEL
# carries *screen* coordinates in lParam (every other mouse message carries client
# ones, and passing client coordinates scrolls whatever sits at that screen point),
# and the delta lives in the high word of wParam.
function Send-MessageWheel([IntPtr]$top, [int]$relX, [int]$relY, [int]$delta, [int]$repeat = 1) {
  $WM_MOUSEWHEEL = 0x020A
  $found = Resolve-ChildPinned $top $relX $relY
  $child = $found.child
  $sx = $found.screenX
  $sy = $found.screenY
  $wParam = [IntPtr]((($delta -band 0xFFFF) -shl 16))
  # lParam is screen-relative and *wraps*: pack the low 16 bits of each axis.
  $lp = [IntPtr](((($sy -band 0xFFFF) -shl 16) -bor ($sx -band 0xFFFF)))
  for ($i = 0; $i -lt $repeat; $i++) {
    [void][W32]::SendMessage($child, $WM_MOUSEWHEEL, $wParam, $lp)
    Start-Sleep -Milliseconds 40
  }
  return @{ child = [int64]$child; screenX = $sx; screenY = $sy; delta = $delta; repeat = $repeat }
}

# Right-button drag as window messages: DOWN, a stream of MOVEs with the button held,
# UP. The moves are what make it a drag rather than a click -- Studio's own guide says
# "Halte die rechte Maustaste gedrückt und ziehe, um die Ansicht mit Keyframes
# festzulegen", so the gesture *is* the operation and a right click alone only gives
# the context menu. Steps of ~8px are enough for CEF, which samples the pointer path.
function Send-MessageRightDrag([IntPtr]$top, [int]$relX, [int]$relY, [int]$toX, [int]$toY, [bool]$direct = $false) {
  $WM_MOUSEMOVE = 0x0200
  $WM_RBUTTONDOWN = 0x0204
  $WM_RBUTTONUP = 0x0205
  $MK_RBUTTON = [IntPtr]2
  if ($direct) {
    $child = $top
    $baseX = 0
    $baseY = 0
    $style = "direct"
  } else {
    $found = Resolve-ChildPinned $top $relX $relY
    $child = $found.child
    $cr = Get-WinRect $child
    $baseX = $cr.Left
    $baseY = $cr.Top
    $style = $(if ($found.pinned) { "message-pinned" } else { "message" })
  }
  $sx = $relX - $baseX
  $sy = $relY - $baseY
  $ex = $toX - $baseX
  $ey = $toY - $baseY
  $lpAt = { param($x, $y) [IntPtr](((($y) -band 0xFFFF) -shl 16) -bor (($x) -band 0xFFFF)) }
  [void][W32]::SendMessage($child, $WM_MOUSEMOVE, [IntPtr]::Zero, (& $lpAt $sx $sy))
  Start-Sleep -Milliseconds 40
  [void][W32]::SendMessage($child, $WM_RBUTTONDOWN, $MK_RBUTTON, (& $lpAt $sx $sy))
  Start-Sleep -Milliseconds 60
  $steps = [Math]::Max(6, [int]([Math]::Sqrt([Math]::Pow($ex - $sx, 2) + [Math]::Pow($ey - $sy, 2)) / 8))
  for ($i = 1; $i -le $steps; $i++) {
    $x = [int][Math]::Round($sx + ($ex - $sx) * $i / $steps)
    $y = [int][Math]::Round($sy + ($ey - $sy) * $i / $steps)
    [void][W32]::SendMessage($child, $WM_MOUSEMOVE, $MK_RBUTTON, (& $lpAt $x $y))
    Start-Sleep -Milliseconds 25
  }
  Start-Sleep -Milliseconds 60
  [void][W32]::SendMessage($child, $WM_RBUTTONUP, [IntPtr]::Zero, (& $lpAt $ex $ey))
  return @{ mode = $style; child = [int64]$child; from = @{ x = $sx; y = $sy }; to = @{ x = $ex; y = $ey }; steps = $steps }
}

# Type text into the window under a point as WM_CHAR messages.
#
# SendKeys is NOT usable here. It pushes through the system keyboard queue, which
# the OS routes to the focus of the *foreground* window -- and in quiet mode the
# foreground is the user's own application, so their next sentence would arrive
# as our file path. WM_CHAR is addressed to the target window instead, so it
# cannot leak anywhere, and it needs neither the front nor a cursor.
# Which window a keyboard message has to go to.
#
# With a point: the child window under it -- CEF renders the UI into a child, and
# a message to the frame never reaches it. Without one (-1): the child under the
# *centre* of the window, for the same reason. The child check keeps a message
# from crossing into another process.
function Resolve-TargetChild([IntPtr]$top, [int]$relX, [int]$relY) {
  if ($relX -lt 0 -or $relY -lt 0) {
    $rect = Get-WinRect $top
    $relX = [int][Math]::Floor(($rect.Right - $rect.Left) / 2)
    $relY = [int][Math]::Floor(($rect.Bottom - $rect.Top) / 2)
  }
  return (Resolve-ChildPinned $top $relX $relY).child
}

# Send one key, as a window message, to the child under (relX, relY).
#
# Only keys that carry no modifier can be delivered this way: Chromium builds a
# key event's modifier state from the *real* keyboard, so a synthesised
# Ctrl+A would reach the page as a bare "a" and a synthesised Ctrl+S as "s".
# Enter, Tab, Escape, Backspace and the arrows are fine and are what the dialog
# and the native pickers actually need.
function Send-KeyMessage([IntPtr]$top, [int]$relX, [int]$relY, [string]$key, [int]$repeat = 1) {
  $map = @{
    "ENTER" = 0x0D; "RETURN" = 0x0D; "TAB" = 0x09; "ESCAPE" = 0x1B; "ESC" = 0x1B;
    "BACKSPACE" = 0x08; "BACK" = 0x08; "DELETE" = 0x2E; "DEL" = 0x2E;
    "HOME" = 0x24; "END" = 0x23; "SPACE" = 0x20;
    "UP" = 0x26; "DOWN" = 0x28; "LEFT" = 0x25; "RIGHT" = 0x27;
    "PAGEUP" = 0x21; "PAGEDOWN" = 0x22
  }
  $name = $key.Trim().ToUpperInvariant()
  if (-not $map.ContainsKey($name)) {
    throw ("unsupported key '$key' -- a letter is text, not a key; send text with -Action type. " +
           "Known keys: " + (($map.Keys | Sort-Object) -join ", "))
  }
  $vk = $map[$name]
  $child = Resolve-TargetChild $top $relX $relY
  $WM_KEYDOWN = 0x0100
  $WM_KEYUP = 0x0101
  for ($i = 0; $i -lt [Math]::Max(1, $repeat); $i++) {
    [void][W32]::SendMessage($child, $WM_KEYDOWN, [IntPtr]$vk, [IntPtr]::Zero)
    [void][W32]::SendMessage($child, $WM_KEYUP, [IntPtr]$vk, [IntPtr]::Zero)
    Start-Sleep -Milliseconds 20
  }
  Start-Sleep -Milliseconds $SleepMs
  return @{ child = [int64]$child; key = $name; vk = $vk; repeat = [Math]::Max(1, $repeat) }
}

function Send-TextMessage([IntPtr]$top, [int]$relX, [int]$relY, [string]$text) {
  # No point means "the window": target the content child, not the frame, or the
  # characters land nowhere and the reply still says ok.
  $child = Resolve-TargetChild $top $relX $relY
  $WM_CHAR = 0x0102
  foreach ($ch in $text.ToCharArray()) {
    [void][W32]::SendMessage($child, $WM_CHAR, [IntPtr][int]$ch, [IntPtr]::Zero)
    Start-Sleep -Milliseconds 15
  }
  Start-Sleep -Milliseconds $SleepMs
  return @{ child = [int64]$child; chars = $text.Length }
}

$rect = Get-WinRect $h
$cursor = New-Object W32+POINT
[void][W32]::GetCursorPos([ref]$cursor)
$info = @{
  ok = $true
  hwnd = [int64]$h
  left = $rect.Left; top = $rect.Top
  right = $rect.Right; bottom = $rect.Bottom
  width = $rect.Right - $rect.Left
  height = $rect.Bottom - $rect.Top
  quiet = [bool]$Quiet
  iconic = [bool][W32]::IsIconic($h)
  foreground = ([W32]::GetForegroundWindow() -eq $h)
  monitor = (Get-MonitorInfo $h)
  cursor = @{ x = $cursor.X; y = $cursor.Y }
  # How many windows shared the title, and whether that made the pick a choice:
  # measured 48 for "Insta360 Studio" (1 real + 47 placeholders), so a bare title is
  # not a unique handle. Reported here rather than only in the docs, because a caller
  # that automated the *wrong* window sees no error anywhere else.
  titleMatches = $script:titleMatches
  titleAmbiguous = ($script:titleMatches -gt 1)
}

switch ($Action) {
  "find" {
    if (-not $Quiet) { Set-Foreground $h }
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "focus" {
    Set-Foreground $h
    Start-Sleep -Milliseconds 200
    $info.action = "focus"
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "click" {
    if ($Quiet) {
      $res = Send-MessageClick $h $X $Y $false $Direct $Button
      Start-Sleep -Milliseconds $SleepMs
      $info.action = "click"
      $info.clicked = @{ relx = $X; rely = $Y; child = $res.child; cx = $res.cx; cy = $res.cy }
      $info.style = $res.mode
      Write-Output ($info | ConvertTo-Json -Compress)
      break
    }
    Set-Foreground $h
    Start-Sleep -Milliseconds 120
    $ax = $rect.Left + $X
    $ay = $rect.Top + $Y
    [void][W32]::SetCursorPos($ax, $ay)
    Start-Sleep -Milliseconds 60
    [W32]::mouse_event(0x0002, 0, 0, 0, [IntPtr]::Zero)   # LEFTDOWN
    Start-Sleep -Milliseconds 40
    [W32]::mouse_event(0x0004, 0, 0, 0, [IntPtr]::Zero)   # LEFTUP
    Start-Sleep -Milliseconds $SleepMs
    $info.action = "click"
    $info.clicked = @{ x = $ax; y = $ay; relx = $X; rely = $Y }
    if (-not $Pin) { Clear-Topmost $h }
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "dblclick" {
    if ($Quiet) {
      $res = Send-MessageClick $h $X $Y $true $Direct $Button
      Start-Sleep -Milliseconds $SleepMs
      $info.action = "dblclick"
      $info.clicked = @{ relx = $X; rely = $Y; child = $res.child; cx = $res.cx; cy = $res.cy }
      $info.style = $res.mode
      Write-Output ($info | ConvertTo-Json -Compress)
      break
    }
    Set-Foreground $h
    Start-Sleep -Milliseconds 120
    $ax = $rect.Left + $X
    $ay = $rect.Top + $Y
    [void][W32]::SetCursorPos($ax, $ay)
    Start-Sleep -Milliseconds 60
    [W32]::mouse_event(0x0002, 0, 0, 0, [IntPtr]::Zero)
    [W32]::mouse_event(0x0004, 0, 0, 0, [IntPtr]::Zero)
    Start-Sleep -Milliseconds 60
    [W32]::mouse_event(0x0002, 0, 0, 0, [IntPtr]::Zero)
    [W32]::mouse_event(0x0004, 0, 0, 0, [IntPtr]::Zero)
    Start-Sleep -Milliseconds $SleepMs
    $info.action = "dblclick"
    $info.clicked = @{ x = $ax; y = $ay; relx = $X; rely = $Y }
    if (-not $Pin) { Clear-Topmost $h }
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "scroll" {
    if ($X -lt 0 -or $Y -lt 0) {
      Write-Output (@{ ok = $false; error = "scroll needs -X and -Y (window-relative point over the list)" } | ConvertTo-Json -Compress)
      break
    }
    if ($Quiet) {
      $res = Send-MessageWheel $h $X $Y $Delta $Repeat
      $info.action = "scroll"
      $info.scrolled = $res
      $info.style = "message"
      Write-Output ($info | ConvertTo-Json -Compress)
      break
    }
    Set-Foreground $h
    Start-Sleep -Milliseconds 120
    [void][W32]::SetCursorPos(($rect.Left + $X), ($rect.Top + $Y))
    Start-Sleep -Milliseconds 60
    for ($i = 0; $i -lt $Repeat; $i++) {
      [W32]::mouse_event(0x0800, 0, 0, [uint32]($Delta -band 0xFFFF), [IntPtr]::Zero)   # MOUSEEVENTF_WHEEL
      Start-Sleep -Milliseconds 60
    }
    $info.action = "scroll"
    $info.scrolled = @{ relx = $X; rely = $Y; delta = $Delta; repeat = $Repeat }
    if (-not $Pin) { Clear-Topmost $h }
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "rightdrag" {
    if ($ToX -lt 0 -or $ToY -lt 0) {
      Write-Output (@{ ok = $false; error = "rightdrag needs -ToX and -ToY" } | ConvertTo-Json -Compress)
      break
    }
    if ($Quiet) {
      $res = Send-MessageRightDrag $h $X $Y $ToX $ToY $Direct
      Start-Sleep -Milliseconds $SleepMs
      $info.action = "rightdrag"
      $info.drag = @{ from = $res.from; to = $res.to; steps = $res.steps; child = $res.child }
      $info.style = $res.mode
      Write-Output ($info | ConvertTo-Json -Compress)
      break
    }
    Set-Foreground $h
    Start-Sleep -Milliseconds 120
    $ax = $rect.Left + $X
    $ay = $rect.Top + $Y
    $bx = $rect.Left + $ToX
    $by = $rect.Top + $ToY
    [void][W32]::SetCursorPos($ax, $ay)
    Start-Sleep -Milliseconds 60
    [W32]::mouse_event(0x0008, 0, 0, 0, [IntPtr]::Zero)   # RIGHTDOWN
    Start-Sleep -Milliseconds 80
    $steps = [Math]::Max(6, [int]([Math]::Sqrt([Math]::Pow($bx - $ax, 2) + [Math]::Pow($by - $ay, 2)) / 8))
    for ($i = 1; $i -le $steps; $i++) {
      [void][W32]::SetCursorPos($ax + [int](($bx - $ax) * $i / $steps), $ay + [int](($by - $ay) * $i / $steps))
      Start-Sleep -Milliseconds 25
    }
    Start-Sleep -Milliseconds 60
    [W32]::mouse_event(0x0010, 0, 0, 0, [IntPtr]::Zero)   # RIGHTUP
    Start-Sleep -Milliseconds $SleepMs
    $info.action = "rightdrag"
    $info.drag = @{ from = @{ x = $ax; y = $ay }; to = @{ x = $bx; y = $by }; steps = $steps }
    if (-not $Pin) { Clear-Topmost $h }
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "redraw" {
    # Force a repaint of a window that is not in the foreground. A background
    # Chromium window is not composited, so its last presented frame can lag
    # behind an interaction; invalidating + updating flushes it.
    $RDW_INVALIDATE = 0x1
    $RDW_UPDATENOW = 0x100
    $RDW_ALLCHILDREN = 0x80
    $RDW_FRAME = 0x400
    $flags = ($RDW_INVALIDATE -bor $RDW_UPDATENOW -bor $RDW_ALLCHILDREN -bor $RDW_FRAME)
    [void][W32]::RedrawWindow($h, [IntPtr]::Zero, [IntPtr]::Zero, $flags)
    [void][W32]::UpdateWindow($h)
    Start-Sleep -Milliseconds 250
    $info.action = "redraw"
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "unpin" {
    Clear-Topmost $h
    $info.action = "unpin"
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "atkeys" {
    # Focus the window under (X,Y) and send keys to it, all in one action.
    #
    # The export dialog is CEF/HTML: a synthesized click gives its inputs the
    # mouse but not the keyboard, so plain SendKeys went nowhere. SetFocus is not
    # enough either -- it only works inside the calling thread's input queue, so
    # the two threads are attached first. Doing both here keeps any other
    # SetForegroundWindow from taking the focus back in between.
    if ($Quiet) {
      if ($Keys) {
        Write-Output (@{ ok = $false; quiet = $true; error = "quiet mode cannot send the key chord '$Keys': SendKeys goes to the system keyboard queue and would be typed into whatever window has the user's focus. Send text as -Text (WM_CHAR), click instead, or set INSTA360_QUIET=0." } | ConvertTo-Json -Compress)
        exit 4
      }
      $res = Send-TextMessage $h $X $Y $Text
      $info.action = "atkeys"
      $info.child = $res.child
      $info.chars = $res.chars
      $info.text = $Text
      $info.style = "message"
      Write-Output ($info | ConvertTo-Json -Compress)
      break
    }
    $rect = Get-WinRect $h
    $pt = New-Object W32+POINT
    $pt.X = $rect.Left + $X
    $pt.Y = $rect.Top + $Y
    $child = [W32]::WindowFromPoint($pt)
    $pid2 = 0
    $tid = [W32]::GetWindowThreadProcessId($child, [ref]$pid2)
    $me = [W32]::GetCurrentThreadId()
    $attached = $false
    if ($tid -ne 0 -and $tid -ne $me) { $attached = [W32]::AttachThreadInput($me, $tid, $true) }
    [void][W32]::SetForegroundWindow($h)
    [void][W32]::SetFocus($child)
    if ($attached) { [void][W32]::AttachThreadInput($me, $tid, $false) }
    Start-Sleep -Milliseconds 250
    if ($Keys) { [System.Windows.Forms.SendKeys]::SendWait($Keys) }
    if ($Text) { [System.Windows.Forms.SendKeys]::SendWait($Text) }
    Start-Sleep -Milliseconds $SleepMs
    $info.action = "atkeys"
    $info.child = $child.ToInt64()
    $info.focused = $attached
    $info.keys = $Keys
    $info.text = $Text
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "keymsg" {
    # One key, as a message -- the quiet-mode counterpart of -Action keys.
    if (-not $Key) {
      Write-Output (@{ ok = $false; error = "keymsg needs -Key ENTER|TAB|ESCAPE|BACKSPACE|DELETE|HOME|END|SPACE|UP|DOWN|LEFT|RIGHT" } | ConvertTo-Json -Compress)
      exit 3
    }
    try {
      $res = Send-KeyMessage $h $X $Y $Key $Repeat
    } catch {
      Write-Output (@{ ok = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress)
      exit 3
    }
    $info.action = "keymsg"
    $info.key = $res.key
    $info.vk = $res.vk
    $info.repeat = $res.repeat
    $info.child = $res.child
    $info.style = "message"
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "keys" {
    if ($Quiet) {
      Write-Output (@{ ok = $false; quiet = $true; error = "quiet mode cannot send the key chord '$Keys': SendKeys goes to the system keyboard queue and would be typed into whatever window has the user's focus. Set INSTA360_QUIET=0 for chords, or use -Action atkeys/-Action type which deliver characters as WM_CHAR." } | ConvertTo-Json -Compress)
      exit 4
    }
    if ($false) {
      $pidT = 0
      $tid = [W32]::GetWindowThreadProcessId($h, [ref]$pidT)
      $me = [W32]::GetCurrentThreadId()
      $attached = $false
      if ($tid -ne 0 -and $tid -ne $me) { $attached = [W32]::AttachThreadInput($me, $tid, $true) }
      try {
        [void][W32]::SetFocus($h)
        Start-Sleep -Milliseconds 200
        [System.Windows.Forms.SendKeys]::SendWait($Keys)
      } finally {
        if ($attached) { [void][W32]::AttachThreadInput($me, $tid, $false) }
      }
      Start-Sleep -Milliseconds $SleepMs
      $info.action = "keys"
      $info.keys = $Keys
      $info.style = "quiet-focus"
      Write-Output ($info | ConvertTo-Json -Compress)
      break
    }
    Set-Foreground $h
    Start-Sleep -Milliseconds 200
    [System.Windows.Forms.SendKeys]::SendWait($Keys)
    Start-Sleep -Milliseconds $SleepMs
    $info.action = "keys"
    $info.keys = $Keys
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "type" {
    if ($Quiet) {
      $res = Send-TextMessage $h -1 -1 $Text
      $info.action = "type"
      $info.child = $res.child
      $info.chars = $res.chars
      $info.text = $Text
      $info.style = "message"
      Write-Output ($info | ConvertTo-Json -Compress)
      break
    }
    Set-Foreground $h
    Start-Sleep -Milliseconds 200
    [System.Windows.Forms.SendKeys]::SendWait($Text)
    Start-Sleep -Milliseconds $SleepMs
    $info.action = "type"
    $info.text = $Text
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "capture" {
    # A minimised window is not composited, so PrintWindow gives back a blank or
    # a stale frame -- which every caller reads as "the UI is empty". Say so
    # instead. Loud mode restores the window first (it is allowed to), quiet mode
    # refuses, because raising the window is the interruption it exists to avoid.
    if ([W32]::IsIconic($h)) {
      if ($Quiet) {
        Write-Output (@{ ok = $false; quiet = $true; iconic = $true; error = "the window is minimised: a minimised window has no composited frame, so it cannot be captured. Restore it and run again (quiet mode does not raise or move windows); INSTA360_QUIET=0 would let the tool restore it itself." } | ConvertTo-Json -Compress)
        exit 3
      }
      [void][W32]::ShowWindow($h, 9)
      Start-Sleep -Milliseconds 400
    }
    if (-not $Out) { $Out = Join-Path $env:TEMP "studio_capture.png" }
    $w = $rect.Right - $rect.Left
    $hh = $rect.Bottom - $rect.Top
    $bmp = New-Object System.Drawing.Bitmap $w, $hh
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $mode = "screen"
    if ($Text -eq "print" -or $Quiet) {
      # PrintWindow with PW_RENDERFULLCONTENT works even when the window is occluded
      $hdc = $g.GetHdc()
      $ok = [W32]::PrintWindow($h, $hdc, 2)
      $g.ReleaseHdc($hdc)
      $mode = "print:$ok"
    }
    if ($mode -eq "screen") {
      Set-Foreground $h
      Start-Sleep -Milliseconds 250
      $g.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bmp.Size)
    }
    $bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    $info.action = "capture"
    $info.mode = $mode
    $info.out = $Out
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "move" {
    if ($Quiet) {
      # Moving the window is the one thing that visibly fights the user for the
      # desktop. Refuse, and say how to get the old behaviour back.
      Write-Output (@{ ok = $false; quiet = $true; error = "quiet mode does not move the Studio window; set INSTA360_QUIET=0 for that" } | ConvertTo-Json -Compress)
      exit 3
    }
    # deterministically place the window: -X -Y = top-left, -Keys = "WxH" size
    $ww = $w; $hhh = $rect.Bottom - $rect.Top
    if ($Keys -match '^(\d+)x(\d+)$') { $ww = [int]$Matches[1]; $hhh = [int]$Matches[2] }
    [void][W32]::ShowWindow($h, 9)   # SW_RESTORE
    Start-Sleep -Milliseconds 150
    [void][W32]::SetWindowPos($h, [IntPtr]::Zero, $X, $Y, $ww, $hhh, 0x0040)
    Start-Sleep -Milliseconds 300
    $r2 = Get-WinRect $h
    $info.action = "move"
    $info.left = $r2.Left; $info.top = $r2.Top
    $info.width = $r2.Right - $r2.Left; $info.height = $r2.Bottom - $r2.Top
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  default {
    Write-Output (@{ ok = $false; error = "unknown action $Action" } | ConvertTo-Json -Compress)
    exit 2
  }
}
