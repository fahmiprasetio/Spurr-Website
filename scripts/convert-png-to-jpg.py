#!/usr/bin/env python3
"""
Convert all PNG images in a folder to JPG format
"""
import os
import sys
from PIL import Image
from pathlib import Path

def convert_png_to_jpg(folder_path, quality=95):
    """Convert all PNG files in folder to JPG"""
    folder_path = Path(folder_path)
    
    if not folder_path.exists():
        print(f"Error: Folder not found: {folder_path}")
        return False
    
    png_files = list(folder_path.glob("*.png"))
    
    if not png_files:
        print(f"No PNG files found in {folder_path}")
        return False
    
    for png_file in png_files:
        try:
            # Open PNG and convert to JPG
            img = Image.open(png_file)
            
            # Convert RGBA to RGB if needed
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                img = background
            
            # Save as JPG
            jpg_file = png_file.with_suffix('.jpg')
            img.save(jpg_file, 'JPEG', quality=quality, optimize=True)
            
            # Remove original PNG
            png_file.unlink()
            print(f"✓ Converted: {png_file.name} → {jpg_file.name}")
        except Exception as e:
            print(f"✗ Error converting {png_file.name}: {e}")
            return False
    
    print(f"\nSuccessfully converted {len(png_files)} files to JPG")
    return True

if __name__ == "__main__":
    folder = "public/car-image(sequences)/SF90 Stradale sequence"
    if convert_png_to_jpg(folder):
        print(f"\nAll files in {folder} converted to JPG!")
    else:
        sys.exit(1)
