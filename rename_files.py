import os
import re

root_dir = "d:/main_portfolio"
patterns = [
    r"Аннануров\s+Даниил\s+Петрович\s+ИВТ\s+1\.2",
    r"Аннануров_Даниил_Петрович_ивт_1_2_",
    r"Аннануров\s+ДП\s+ИВТ\s+1\.2"
]

def rename_files():
    for dirpath, dirnames, filenames in os.walk(root_dir):
        for filename in filenames:
            if not filename.lower().endswith('.pdf'):
                continue
                
            new_name = filename
            for pattern in patterns:
                new_name = re.sub(pattern, "", new_name, flags=re.IGNORECASE)
            
            new_name = new_name.strip()
            # Remove double spaces or leading/trailing underscores/spaces that might remain
            new_name = re.sub(r'\s+', ' ', new_name)
            new_name = new_name.strip(' _')
            
            if new_name != filename:
                old_path = os.path.join(dirpath, filename)
                new_path = os.path.join(dirpath, new_name)
                
                # Handle collisions
                if os.path.exists(new_path):
                    base, ext = os.path.splitext(new_name)
                    counter = 1
                    while os.path.exists(new_path):
                        new_path = os.path.join(dirpath, f"{base} ({counter}){ext}")
                        counter += 1
                
                try:
                    os.rename(old_path, new_path)
                    print(f"Renamed: '{filename}' -> '{os.path.basename(new_path)}'")
                except Exception as e:
                    print(f"Error renaming {filename}: {e}")

if __name__ == "__main__":
    rename_files()
