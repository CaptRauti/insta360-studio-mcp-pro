param([string]$In, [int]$X, [int]$Y, [int]$W, [int]$H, [int]$Bright = 120, [int]$Sat = 40)
# Glyph-level truth for one dialog row on a DARK theme: text pixels are LIGHT and/or
# COLOURED, so a filled field background must not count as ink. Reports the image size
# (to catch capture-scale differences) plus bbox and 10px column profile for bright and
# for coloured pixels.
#
#   powershell -NoProfile -File research/matrix/region-glyphs.ps1 -In shot.png -X 520 -Y 400 -W 560 -H 75
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Bitmap]::FromFile($In)
Write-Output "file: $In"
Write-Output "image size: $($src.Width) x $($src.Height)"
if (($X + $W) -gt $src.Width -or ($Y + $H) -gt $src.Height) {
  Write-Output "region out of bounds - not measuring"; $src.Dispose(); exit 1
}
$rect = New-Object System.Drawing.Rectangle($X, $Y, $W, $H)
$crop = $src.Clone($rect, $src.PixelFormat)

$bx0 = [int]::MaxValue; $by0 = [int]::MaxValue; $bx1 = -1; $by1 = -1; $bn = 0
$cx0 = [int]::MaxValue; $cy0 = [int]::MaxValue; $cx1 = -1; $cy1 = -1; $cn = 0
$bprof = @{}; $cprof = @{}
$maxlum = 0; $maxsat = 0
for ($xx = 0; $xx -lt $crop.Width; $xx++) {
  $band = [int]($xx / 10) * 10
  for ($yy = 0; $yy -lt $crop.Height; $yy++) {
    $c = $crop.GetPixel($xx, $yy)
    $r = [int]$c.R; $g = [int]$c.G; $b = [int]$c.B
    $lum = [Math]::Max($r, [Math]::Max($g, $b))
    $sat = $lum - [Math]::Min($r, [Math]::Min($g, $b))
    if ($lum -gt $maxlum) { $maxlum = $lum }
    if ($sat -gt $maxsat) { $maxsat = $sat }
    if ($lum -gt $Bright -and $sat -le $Sat) {
      $bn++
      if ($xx -lt $bx0) { $bx0 = $xx }; if ($yy -lt $by0) { $by0 = $yy }
      if ($xx -gt $bx1) { $bx1 = $xx }; if ($yy -gt $by1) { $by1 = $yy }
      if ($bprof.ContainsKey($band)) { $bprof[$band]++ } else { $bprof[$band] = 1 }
    }
    if ($sat -gt $Sat) {
      $cn++
      if ($xx -lt $cx0) { $cx0 = $xx }; if ($yy -lt $cy0) { $cy0 = $yy }
      if ($xx -gt $cx1) { $cx1 = $xx }; if ($yy -gt $cy1) { $cy1 = $yy }
      if ($cprof.ContainsKey($band)) { $cprof[$band]++ } else { $cprof[$band] = 1 }
    }
  }
}
Write-Output "region $W x $H at window $X,$Y   brightest px lum=$maxlum  max saturation=$maxsat"
if ($bn -gt 0) {
  Write-Output "BRIGHT (text-like) px: $bn   crop x $bx0..$bx1 y $by0..$by1  -> window x $($X + $bx0)..$($X + $bx1) y $($Y + $by0)..$($Y + $by1)"
  Write-Output "  column profile:"
  $bprof.Keys | Sort-Object | ForEach-Object { Write-Output ("    x {0,5} : {1}" -f ($_ + $X), $bprof[$_]) }
} else { Write-Output "BRIGHT (text-like) px: NONE - no light glyphs in this region." }
if ($cn -gt 0) {
  Write-Output "COLOURED px: $cn   crop x $cx0..$cx1 y $cy0..$cy1  -> window x $($X + $cx0)..$($X + $cx1) y $($Y + $cy0)..$($Y + $cy1)"
  $cprof.Keys | Sort-Object | ForEach-Object { Write-Output ("    x {0,5} : {1}" -f ($_ + $X), $cprof[$_]) }
} else { Write-Output "COLOURED px: none above the saturation cut." }
