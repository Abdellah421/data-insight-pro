Add-Type -AssemblyName System.Drawing

$publicDir = Join-Path $PSScriptRoot "..\public"
$publicDir = (Resolve-Path $publicDir).Path

$blue = [System.Drawing.Color]::FromArgb(255, 37, 99, 235)
$navy = [System.Drawing.Color]::FromArgb(255, 15, 23, 42)
$slate = [System.Drawing.Color]::FromArgb(255, 30, 41, 59)
$white = [System.Drawing.Color]::White
$muted = [System.Drawing.Color]::FromArgb(255, 191, 219, 254)
$barLight = [System.Drawing.Color]::FromArgb(255, 147, 197, 253)

function Draw-RoundedRect {
  param($g, $brush, [int]$x, [int]$y, [int]$w, [int]$h, [int]$r)
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $g.FillPath($brush, $path)
  $path.Dispose()
}

function Draw-Mark {
  param($g, [int]$x, [int]$y, [int]$size)
  $radius = [int]($size * 0.22)
  if ($radius -lt 4) { $radius = 4 }
  $brush = New-Object System.Drawing.SolidBrush $blue
  Draw-RoundedRect -g $g -brush $brush -x $x -y $y -w $size -h $size -r $radius
  $brush.Dispose()
  $whiteBrush = New-Object System.Drawing.SolidBrush $white
  $lightBrush = New-Object System.Drawing.SolidBrush $barLight
  $gap = [int]($size * 0.14)
  $barW = [int](($size - ($gap * 4)) / 3)
  $baseY = $y + $size - $gap
  $h1 = [int]($size * 0.28)
  $h2 = [int]($size * 0.46)
  $h3 = [int]($size * 0.62)
  $g.FillRectangle($whiteBrush, $x + $gap, $baseY - $h1, $barW, $h1)
  $g.FillRectangle($whiteBrush, $x + ($gap * 2) + $barW, $baseY - $h2, $barW, $h2)
  $g.FillRectangle($lightBrush, $x + ($gap * 3) + ($barW * 2), $baseY - $h3, $barW, $h3)
  $whiteBrush.Dispose()
  $lightBrush.Dispose()
}

function New-Canvas {
  param([int]$w, [int]$h)
  $bmp = New-Object System.Drawing.Bitmap $w, $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  return @{ Bmp = $bmp; G = $g }
}

function Save-Png {
  param($bmp, [string]$name)
  $path = Join-Path $publicDir $name
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  Write-Host "Wrote $path"
}

# Apple touch icon
$apple = New-Canvas 180 180
Draw-Mark -g $apple.G -x 0 -y 0 -size 180
Save-Png -bmp $apple.Bmp -name "apple-touch-icon.png"
$apple.G.Dispose(); $apple.Bmp.Dispose()

# 32x32 PNG
$f32 = New-Canvas 32 32
Draw-Mark -g $f32.G -x 0 -y 0 -size 32
Save-Png -bmp $f32.Bmp -name "favicon-32x32.png"
$f32.G.Dispose(); $f32.Bmp.Dispose()

# 48x48 PNG for ICO packing
$f48 = New-Canvas 48 48
Draw-Mark -g $f48.G -x 0 -y 0 -size 48
Save-Png -bmp $f48.Bmp -name "favicon-48.png"
$f48.G.Dispose(); $f48.Bmp.Dispose()

# OG 1200x630
$og = New-Canvas 1200 630
$og.G.Clear($navy)
$panel = New-Object System.Drawing.SolidBrush $slate
Draw-RoundedRect -g $og.G -brush $panel -x 60 -y 60 -w 1080 -h 510 -r 32
$panel.Dispose()
Draw-Mark -g $og.G -x 100 -y 200 -size 150

$titleFont = New-Object System.Drawing.Font('Segoe UI', 48, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Point)
$subFont = New-Object System.Drawing.Font('Segoe UI', 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Point)
$titleBrush = New-Object System.Drawing.SolidBrush $white
$subBrush = New-Object System.Drawing.SolidBrush $muted
$og.G.DrawString('DataInsight Pro', $titleFont, $titleBrush, 290, 220)
$og.G.DrawString('Free Online Data Analysis', $subFont, $subBrush, 290, 310)
$titleFont.Dispose(); $subFont.Dispose()
$titleBrush.Dispose(); $subBrush.Dispose()
Save-Png -bmp $og.Bmp -name "og-image.png"
$og.G.Dispose(); $og.Bmp.Dispose()
