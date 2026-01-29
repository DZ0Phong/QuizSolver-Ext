import os

try:
    from PIL import Image

    print("PIL imported successfully")

    def resize_icon(path, size):
        if not os.path.exists(path):
            print(f"File not found: {path}")
            return

        try:
            img = Image.open(path)
            img = img.resize((size, size), Image.Resampling.LANCZOS)
            img.save(path)
            print(f"Resized {path} to {size}x{size}")
        except Exception as e:
            print(f"Error resizing {path}: {e}")

    resize_icon("icons/icon48.png", 48)
    resize_icon("icons/icon128.png", 128)

except ImportError:
    print("PIL (Pillow) library not found. Skipping resize.")
