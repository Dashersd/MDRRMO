import os
import sys

# Try to import Pillow. If not present, try to install it.
try:
    from PIL import Image
except ImportError:
    print("Pillow is not installed. Installing it via pip...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

def compress_logo():
    input_path = os.path.join("assets", "icon.png")
    output_path = os.path.join("assets", "icon_compressed.png")
    
    if not os.path.exists(input_path):
        print(f"Error: Could not find {input_path}")
        return
        
    original_size = os.path.getsize(input_path) / (1024 * 1024)
    print(f"Original logo file size: {original_size:.2f} MB")
    
    print("Opening and processing the image...")
    with Image.open(input_path) as img:
        print(f"Original dimensions: {img.width}x{img.height}")
        
        # Determine new size (max width/height of 512px)
        max_size = 512
        if img.width > max_size or img.height > max_size:
            if img.width > img.height:
                new_width = max_size
                new_height = int(img.height * (max_size / img.width))
            else:
                new_height = max_size
                new_width = int(img.width * (max_size / img.height))
            
            print(f"Resizing to: {new_width}x{new_height}")
            # Use high-quality Resampling.LANCZOS (or ANTIALIAS fallback)
            try:
                resample_method = Image.Resampling.LANCZOS
            except AttributeError:
                resample_method = Image.ANTIALIAS
                
            img_resized = img.resize((new_width, new_height), resample_method)
        else:
            print("Image is already small, keeping original dimensions.")
            img_resized = img
            
        print("Saving optimized version...")
        # Save as PNG with optimal compression
        img_resized.save(output_path, "PNG", optimize=True)
        
    compressed_size = os.path.getsize(output_path) / 1024
    print(f"Compressed logo file size: {compressed_size:.2f} KB")
    
    # Overwrite the original logo with the optimized one
    os.replace(output_path, input_path)
    print("✓ Success! Overwrote original assets/icon.png with optimized web version.")

if __name__ == "__main__":
    compress_logo()
