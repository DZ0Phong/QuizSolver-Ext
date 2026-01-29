import os
from PIL import Image

# Source and Destination
source_path = r"C:\Users\Hiep\.gemini\antigravity\brain\165a2c4b-fb7a-435f-bbea-2301f8f626d6\quiz_solver_icon_transparent_1769676645.png"
dest_dir = r"e:\Hoc_Code\QuizSolver-Ext\icons"

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)


def process_icon(size):
    try:
        if not os.path.exists(source_path):
            # Fallback for the prompt logic if the filename isn't exact in the script generation step
            # I will need to verify the filename returned by generate_image first,
            # but for this script I'll assume I update it or use a wildcard search if needed.
            # For now, let's just print error.
            print(f"Source not found: {source_path}")
            return

        img = Image.open(source_path)
        img = img.resize((size, size), Image.Resampling.LANCZOS)

        output_path = os.path.join(dest_dir, f"icon{size}.png")
        img.save(output_path, "PNG")
        print(f"Saved {output_path}")
    except Exception as e:
        print(f"Error: {e}")


process_icon(48)
process_icon(128)
