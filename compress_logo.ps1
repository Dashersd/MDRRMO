Add-Type -AssemblyName System.Drawing
$inputPath = "c:\xampp\htdocs\MDRRMO\assets\icon.png"
$outputPath = "c:\xampp\htdocs\MDRRMO\assets\icon_temp.png"

if (-not (Test-Path $inputPath)) {
    Write-Output "Error: c:\xampp\htdocs\MDRRMO\assets\icon.png not found."
    exit
}

$originalSize = (Get-Item $inputPath).Length / 1MB
Write-Output "Original size: $('{0:N2}' -f $originalSize) MB"

Write-Output "Loading and resizing the image (please wait)..."
# Load the image
$image = [System.Drawing.Image]::FromFile($inputPath)

$maxSize = 512
$width = $image.Width
$height = $image.Height

if ($width -gt $maxSize -or $height -gt $maxSize) {
    if ($width -gt $height) {
        $newWidth = $maxSize
        $newHeight = [int]($height * ($maxSize / $width))
    } else {
        $newHeight = $maxSize
        $newWidth = [int]($width * ($maxSize / $height))
    }
} else {
    $newWidth = $width
    $newHeight = $height
}

Write-Output "Resizing dimensions: from $($width)x$($height) to $($newWidth)x$($newHeight)"

# Create a new blank bitmap with new dimensions
$newImage = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
$graphics = [System.Drawing.Graphics]::FromImage($newImage)

# Set high quality settings
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# Draw the original image onto the new one
$graphics.DrawImage($image, 0, 0, $newWidth, $newHeight)

# Save the new image in PNG format
$pngFormat = [System.Drawing.Imaging.ImageFormat]::Png
$newImage.Save($outputPath, $pngFormat)

# Clean up
$graphics.Dispose()
$newImage.Dispose()
$image.Dispose()

# Replace the original with the compressed one
Move-Item -Path $outputPath -Destination $inputPath -Force

$newSize = (Get-Item $inputPath).Length / 1KB
Write-Output "Optimized size: $('{0:N2}' -f $newSize) KB"
Write-Output "SUCCESS: Overwrote assets/icon.png with optimized version."
