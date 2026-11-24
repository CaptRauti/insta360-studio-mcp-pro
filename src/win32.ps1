# Win32 helper for Insta360 Studio UI automation.
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File win32.ps1 -Action find -Title "Insta360 Studio"
#   ... -Action click -X 120 -Y 40 [-Hwnd 135976]
#   ... -Action keys -Keys "^e" [-Hwnd ...]
#   ... -Action type -Text "abc"
#   ... -Action focus
#   ... -Action capture -Out C:\path\shot.png
param(
  [Parameter(Mandatory=$true)][string]$Action,
  [string]$Title = "Insta360 Studio",
  [int]$Hwnd = 0,
  [int]$X = 0,
  [int]$Y = 0,
  [string]$Keys = "",
  [string]$Text = "",
  [string]$Out = "",
  [int]$SleepMs = 120,
  [switch]$Pin
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
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, int dx, int dy, uint d, IntPtr e);
  [DllImport("user32.dll")] public static extern IntPtr FindWindowEx(IntPtr p, IntPtr c, string cls, string title);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr FindWindow(string cls, string title);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint msg, IntPtr w, IntPtr l);
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
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool attach);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  public delegate bool EnumProc(IntPtr h, IntPtr l);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [StructLayout(LayoutKind.Sequential)] public struct POINT { public int X, Y; }
}
"@
if (-not ("W32" -as [type])) { Add-Type -TypeDefinition $sig }

function Get-WinRect([IntPtr]$h) {
  $r = New-Object W32+RECT
  [void][W32]::GetWindowRect($h, [ref]$r)
  return $r
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

if ([W32]::IsIconic($h)) { [void][W32]::ShowWindow($h, 9) }

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

$rect = Get-WinRect $h
$info = @{
  ok = $true
  hwnd = [int64]$h
  left = $rect.Left; top = $rect.Top
  right = $rect.Right; bottom = $rect.Bottom
  width = $rect.Right - $rect.Left
  height = $rect.Bottom - $rect.Top
}

switch ($Action) {
  "find" {
    Set-Foreground $h
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "focus" {
    Set-Foreground $h
    Start-Sleep -Milliseconds 200
    $info.action = "focus"
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "click" {
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
  "keys" {
    Set-Foreground $h
    Start-Sleep -Milliseconds 200
    [System.Windows.Forms.SendKeys]::SendWait($Keys)
    Start-Sleep -Milliseconds $SleepMs
    $info.action = "keys"
    $info.keys = $Keys
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "type" {
    Set-Foreground $h
    Start-Sleep -Milliseconds 200
    [System.Windows.Forms.SendKeys]::SendWait($Text)
    Start-Sleep -Milliseconds $SleepMs
    $info.action = "type"
    $info.text = $Text
    Write-Output ($info | ConvertTo-Json -Compress)
  }
  "capture" {
    if (-not $Out) { $Out = Join-Path $env:TEMP "studio_capture.png" }
    $w = $rect.Right - $rect.Left
    $hh = $rect.Bottom - $rect.Top
    $bmp = New-Object System.Drawing.Bitmap $w, $hh
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $mode = "screen"
    if ($Text -eq "print") {
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
