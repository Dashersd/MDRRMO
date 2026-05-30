<?php
/**
 * Script to compress and resize the 39MB icon.png file to a web-optimized size.
 */

$input = 'assets/icon.png';
$output = 'assets/icon_compressed.png';

if (!file_exists($input)) {
    die("Error: assets/icon.png not found.\n");
}

$size_mb = filesize($input) / (1024 * 1024);
echo "Original size: " . round($size_mb, 2) . " MB\n";

if (!extension_loaded('gd')) {
    die("GD extension is not loaded. Please make sure GD is enabled in your PHP installation.\n");
}

echo "Opening PNG image (this might take a few seconds because of its 39MB size)...\n";
// Increase memory limit for this process since 39MB image needs lots of RAM to decode
ini_set('memory_limit', '512M');

$src = @imagecreatefrompng($input);
if (!$src) {
    die("Error: Could not open the PNG image. It might be corrupt or too large for the current memory limit.\n");
}

$width = imagesx($src);
$height = imagesy($src);
echo "Original dimensions: {$width}x{$height}\n";

$max_size = 512;
if ($width > $max_size || $height > $max_size) {
    if ($width > $height) {
        $new_width = $max_size;
        $new_height = intval($height * ($max_size / $width));
    } else {
        $new_height = $max_size;
        $new_width = intval($width * ($max_size / $height));
    }
} else {
    $new_width = $width;
    $new_height = $height;
}

echo "Resizing to {$new_width}x{$new_height}...\n";
$dst = imagecreatetruecolor($new_width, $new_height);

// Maintain transparency for PNG
imagealphablending($dst, false);
imagesavealpha($dst, true);
$transparent = imagecolorallocatealpha($dst, 255, 255, 255, 127);
imagefill($dst, 0, 0, $transparent);

imagecopyresampled($dst, $src, 0, 0, 0, 0, $new_width, $new_height, $width, $height);

echo "Saving optimized PNG...\n";
// 9 is maximum compression
if (imagepng($dst, $output, 9)) {
    imagedestroy($src);
    imagedestroy($dst);

    $new_size_kb = filesize($output) / 1024;
    echo "Optimized size: " . round($new_size_kb, 2) . " KB\n";

    if (rename($output, $input)) {
        echo "✓ Success! Overwrote assets/icon.png with optimized version.\n";
    } else {
        echo "Error: Could not replace the original file.\n";
    }
} else {
    echo "Error: Failed to save the optimized image.\n";
}
