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
  [string]$Text = "",
  [string]$Out = "",
  [int]$SleepMs = 120,
  [switch]$Pin,
  [switch]$Quiet
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

function Find-Target {
  if ($Hwnd -ne 0) { return [IntPtr]$Hwnd }
  $h = [W32]::FindWindow($null, $Title)
  if ($h -ne [IntPtr]::Zero) { return $h }
  # fallback: substring match over visible top-level windows
  $found = [IntPtr]::Zero
  $cb = [W32+EnumProc]{
    param($hw, $l)
    if ([W32]::IsWindowVisible($hw)) {
      $len = [W32]::GetWindowTextLength($hw)
      if ($len -gt 0) {
        $sb = New-Object System.Text.StringBuilder ($len + 2)
        [void][W32]::GetWindowText($hw, $sb, $sb.Capacity)
        if ($sb.ToString() -like "*$Title*") { $script:found = $hw; return $false }
      }
    }
    return $true
  }
  [void][W32]::EnumWindows($cb, [IntPtr]::Zero)
  if ($script:found -ne $null -and $script:found -ne [IntPtr]::Zero) { return $script:found }
  return [IntPtr]::Zero
}

$h = Find-Target
if ($h -eq [IntPtr]::Zero) {
  Write-Output (@{ ok = $false; error = "window not found"; title = $Title } | ConvertTo-Json -Compress)
  exit 1
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

# Click by message instead of by cursor. The user keeps their mouse: nothing
# moves the pointer, nothing takes the foreground, and the click still lands
# because the messages are delivered to the window under the point.
function Send-MessageClick([IntPtr]$top, [int]$relX, [int]$relY, [bool]$double) {
  $WM_MOUSEMOVE = 0x0200
  $WM_LBUTTONDOWN = 0x0201
  $WM_LBUTTONUP = 0x0202
  $MK_LBUTTON = [IntPtr]1
  $found = Resolve-Child $top $relX $relY
  $child = $found.child
  $cr = Get-WinRect $child
  $cx = $found.screenX - $cr.Left
  $cy = $found.screenY - $cr.Top
  $lp = [IntPtr]((($cy -band 0xFFFF) -shl 16) -bor ($cx -band 0xFFFF))
  [void][W32]::SendMessage($child, $WM_MOUSEMOVE, [IntPtr]::Zero, $lp)
  Start-Sleep -Milliseconds 30
  [void][W32]::SendMessage($child, $WM_LBUTTONDOWN, $MK_LBUTTON, $lp)
  Start-Sleep -Milliseconds 45
  [void][W32]::SendMessage($child, $WM_LBUTTONUP, [IntPtr]::Zero, $lp)
  if ($double) {
    Start-Sleep -Milliseconds 60
    [void][W32]::SendMessage($child, $WM_LBUTTONDOWN, $MK_LBUTTON, $lp)
    Start-Sleep -Milliseconds 45
    [void][W32]::SendMessage($child, $WM_LBUTTONUP, [IntPtr]::Zero, $lp)
  }
  return @{ mode = "message"; child = [int64]$child; cx = $cx; cy = $cy; screenX = $found.screenX; screenY = $found.screenY }
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
  return (Resolve-Child $top $relX $relY).child
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
      $res = Send-MessageClick $h $X $Y $false
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
      $res = Send-MessageClick $h $X $Y $true
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
