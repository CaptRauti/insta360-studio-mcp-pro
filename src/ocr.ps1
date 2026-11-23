# Windows.Media.Ocr wrapper for Insta360 Studio UI automation.
#
# Why: Studio's Qt canvas exposes no UI Automation tree (verified), so the MCP
# server could only find buttons by accent colour. This gives it real text:
# every recognised word with a bounding box, so tools can click "Exportieren"
# instead of a pixel coordinate. Uses the OCR engine built into Windows — no
# API key, no network, no extra install.
#
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass -File ocr.ps1 -Image shot.png
#   ... -Image shot.png -Lang de
#   ... -ListLangs
#
# Output (single line JSON):
#   { ok, image, lang, width, height, lines: [ { text, words: [ {text,x,y,w,h} ] } ] }

param(
  [string]$Image = "",
  [string]$Lang = "",
  [switch]$ListLangs
)

$ErrorActionPreference = "Stop"

# WinRT's StorageFile API only accepts backslash paths.
if ($Image) { $Image = $Image.Replace('/', '\') }

Add-Type -AssemblyName System.Runtime.WindowsRuntime | Out-Null

# WinRT projections must be loaded before use.
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapPixelFormat, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapAlphaMode, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.SoftwareBitmap, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime]

# PowerShell 5.1 has no WinRT await; bridge IAsyncOperation<T> onto a .NET Task.
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and
    $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
  })[0]

function Await($op, $type) {
  $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($op))
  $task.Wait(-1) | Out-Null
  $task.Result
}

if ($ListLangs) {
  $tags = @()
  foreach ($l in [Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages) { $tags += $l.LanguageTag }
  Write-Output (@{ ok = $true; available = $tags } | ConvertTo-Json -Compress)
  exit 0
}

if (-not $Image) {
  Write-Output (@{ ok = $false; error = "no -Image given" } | ConvertTo-Json -Compress)
  exit 2
}
if (-not (Test-Path -LiteralPath $Image)) {
  Write-Output (@{ ok = $false; error = "image not found: $Image" } | ConvertTo-Json -Compress)
  exit 2
}

# Pick an engine: explicit language, else the user's profile languages.
$engine = $null
if ($Lang) {
  $language = New-Object Windows.Globalization.Language $Lang
  $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($language)
  if ($null -eq $engine) {
    Write-Output (@{ ok = $false; error = "no OCR engine for language '$Lang'" } | ConvertTo-Json -Compress)
    exit 3
  }
} else {
  $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
  if ($null -eq $engine) {
    Write-Output (@{ ok = $false; error = "no OCR engine for the user profile languages" } | ConvertTo-Json -Compress)
    exit 3
  }
}

try {
  $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($Image)) ([Windows.Storage.StorageFile])
  $stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
  $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
} catch {
  $msg = $_.Exception.Message
  if ($_.Exception.InnerException) { $msg = $_.Exception.InnerException.Message }
  Write-Output (@{ ok = $false; error = "decode failed: $msg" } | ConvertTo-Json -Compress)
  exit 4
}

# The recogniser only accepts Bgra8.
if ($bitmap.BitmapPixelFormat -ne [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8) {
  $converted = [Windows.Graphics.Imaging.SoftwareBitmap]::Convert(
    $bitmap,
    [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8,
    [Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied)
  $bitmap.Dispose()
  $bitmap = $converted
}

try {
  $result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
} catch {
  $msg = $_.Exception.Message
  if ($_.Exception.InnerException) { $msg = $_.Exception.InnerException.Message }
  Write-Output (@{ ok = $false; error = "recognize failed: $msg" } | ConvertTo-Json -Compress)
  exit 5
}

$lines = @()
foreach ($line in $result.Lines) {
  $words = @()
  foreach ($word in $line.Words) {
    $r = $word.BoundingRect
    $words += @{
      text = $word.Text
      x    = [int]$r.X
      y    = [int]$r.Y
      w    = [int]$r.Width
      h    = [int]$r.Height
    }
  }
  $lines += @{ text = $line.Text; words = $words }
}

$stream.Dispose()
$bitmap.Dispose()

Write-Output (@{
    ok     = $true
    image  = $Image
    lang   = $engine.RecognizerLanguage.LanguageTag
    width  = [int]$decoder.PixelWidth
    height = [int]$decoder.PixelHeight
    lines  = $lines
  } | ConvertTo-Json -Depth 10 -Compress)
