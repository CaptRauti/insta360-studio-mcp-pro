param([string]$In, [int]$X, [int]$Y, [int]$W, [int]$H)
# Pixel-level truth for one dialog row: modal colour, colour histogram, ink bbox and a
# column profile of non-background pixels. Tells whether a value is DRAWN at all, and
# where - unlike OCR, which can drop low-contrast or coloured text.
#
#   powershell -NoProfile -File research/matrix/region-stats.ps1 -In shot.png -X 520 -Y 400 -W 560 -H 75
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Bitmap]::FromFile($In)
$rect = New-Object System.Drawing.Rectangle($X, $Y, $W, $H)
$crop = $src.Clone($rect, $src.PixelFormat)

$hist = @{}
for ($yy = 0; $yy -lt $crop.Height; $yy++) {
  for ($xx = 0; $xx -lt $crop.Width; $xx++) {
    $c = $crop.GetPixel($xx, $yy)
    $k = "$($c.R),$($c.G),$($c.B)"
    if ($hist.ContainsKey($k)) { $hist[$k]++ } else { $hist[$k] = 1 }
  }
}
$top = $hist.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 6
$bg = $top[0].Name
Write-Output "region: $W x $H at window $X,$Y   (file: $In)"
Write-Output "modal colour: $bg  ($($top[0].Value) of $($crop.Width * $crop.Height) px)"
Write-Output "top colours:"
$top | ForEach-Object { Write-Output ("  {0,-16} x{1}" -f $_.Name, $_.Value) }

$minx = [int]::MaxValue; $miny = [int]::MaxValue; $maxx = -1; $maxy = -1; $ink = 0
$bands = @{}
for ($xx = 0; $xx -lt $crop.Width; $xx++) {
  $b = [int]($xx / 10) * 10
  for ($yy = 0; $yy -lt $crop.Height; $yy++) {
    $c = $crop.GetPixel($xx, $yy)
    if ("$($c.R),$($c.G),$($c.B)" -ne $bg) {
      $ink++
      if ($xx -lt $minx) { $minx = $xx }; if ($yy -lt $miny) { $miny = $yy }
      if ($xx -gt $maxx) { $maxx = $xx }; if ($yy -gt $maxy) { $maxy = $yy }
      if ($bands.ContainsKey($b)) { $bands[$b]++ } else { $bands[$b] = 1 }
    }
  }
}
if ($maxx -ge 0) {
  Write-Output "ink: $ink px   bbox in crop x $minx..$maxx y $miny..$maxy"
  Write-Output "      -> window coords x $($X + $minx)..$($X + $maxx)   y $($Y + $miny)..$($Y + $maxy)"
} else {
  Write-Output "ink: NONE - the region is one flat colour, nothing is drawn here."
}
Write-Output "column ink profile (window x -> px):"
$bands.Keys | Sort-Object | ForEach-Object { Write-Output ("  x {0,5} : {1}" -f ($_ + $X), $bands[$_]) }
