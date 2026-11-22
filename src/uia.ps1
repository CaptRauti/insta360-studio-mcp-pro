# UI Automation dump for Insta360 Studio.
# Usage:
#   powershell -NoProfile -File uia.ps1 -Title "Insta360 Studio" -MaxDepth 6
#   powershell -NoProfile -File uia.ps1 -Title "Insta360 Studio" -Invoke "Exportieren"
param(
  [string]$Title = "Insta360 Studio",
  [int]$MaxDepth = 6,
  [string]$Invoke = "",
  [string]$Out = ""
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$root = [System.Windows.Automation.AutomationElement]::RootElement
$cond = New-Object System.Windows.Automation.PropertyCondition(
  [System.Windows.Automation.AutomationElement]::NameProperty, $Title)
$win = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $cond)
if ($win -eq $null) {
  # fallback: substring match
  $kids = $root.FindAll([System.Windows.Automation.TreeScope]::Children,
    [System.Windows.Automation.Condition]::TrueCondition)
  foreach ($k in $kids) {
    try { if ($k.Current.Name -like "*$Title*") { $win = $k; break } } catch {}
  }
}
if ($win -eq $null) { Write-Output '{"ok":false,"error":"window not found"}'; exit 1 }

$rows = New-Object System.Collections.ArrayList
function Walk($el, $depth) {
  if ($depth -gt $MaxDepth) { return }
  try {
    $walker = [System.Windows.Automation.TreeWalker]::RawViewWalker
    $child = $walker.GetFirstChild($el)
    while ($child -ne $null) {
      $c = $child.Current
      $r = $c.BoundingRectangle
      $line = [pscustomobject]@{
        depth = $depth
        name  = $c.Name
        type  = $c.ControlType.ProgrammaticName -replace "ControlType\.", ""
        id    = $c.AutomationId
        cls   = $c.ClassName
        x     = [int]$r.X; y = [int]$r.Y; w = [int]$r.Width; h = [int]$r.Height
        enabled = $c.IsEnabled
        offscreen = $c.IsOffscreen
      }
      [void]$rows.Add($line)
      Walk $child ($depth + 1)
      $child = $walker.GetNextSibling($child)
    }
  } catch {}
}
Walk $win 0

if ($Invoke -ne "") {
  # find element by name (exact first, then substring) and invoke/click it
  $target = $null
  foreach ($r in $rows) { if ($r.name -eq $Invoke) { $target = $r; break } }
  if ($target -eq $null) { foreach ($r in $rows) { if ($r.name -like "*$Invoke*") { $target = $r; break } } }
  if ($target -eq $null) { Write-Output '{"ok":false,"error":"element not found"}'; exit 2 }
  # re-find the actual element to invoke
  $all = $win.FindAll([System.Windows.Automation.TreeScope]::Descendants,
    [System.Windows.Automation.Condition]::TrueCondition)
  $hit = $null
  foreach ($e in $all) {
    try { if ($e.Current.Name -eq $target.name) { $hit = $e; break } } catch {}
  }
  if ($hit -eq $null) { Write-Output '{"ok":false,"error":"element vanished"}'; exit 3 }
  $done = $false
  try {
    $p = $hit.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
    $p.Invoke(); $done = $true
  } catch {}
  if (-not $done) {
    try {
      $p = $hit.GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern)
      $p.Select(); $done = $true
    } catch {}
  }
  if (-not $done) {
    try {
      $r = $hit.Current.BoundingRectangle
      [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point([int]($r.X + $r.Width/2), [int]($r.Y + $r.Height/2))
      $done = "cursor"
    } catch {}
  }
  Write-Output (@{ ok = $true; invoked = $target.name; method = $done; rect = @{ x=$target.x; y=$target.y; w=$target.w; h=$target.h } } | ConvertTo-Json -Compress)
  exit 0
}

$json = $rows | ConvertTo-Json -Depth 4 -Compress
Write-Output ("COUNT=" + $rows.Count)
if ($Out -ne "") { [System.IO.File]::WriteAllText($Out, $json) }
Write-Output $json
