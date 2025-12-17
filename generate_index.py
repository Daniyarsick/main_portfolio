import os
import json
import urllib.parse

root_dir = "d:/main_portfolio"
output_file = "d:/main_portfolio/files.js"

courses = ["1 курс", "2 курс", "3 курс", "4 курс"]
file_data = {}

def get_file_type(filename):
    return os.path.splitext(filename)[1][1:].lower() or "file"

for course in courses:
    course_path = os.path.join(root_dir, course)
    if not os.path.exists(course_path):
        continue
    
    file_data[course] = {}
    
    # Iterate over subject folders
    for subject in os.listdir(course_path):
        subject_path = os.path.join(course_path, subject)
        if os.path.isdir(subject_path):
            file_data[course][subject] = []
            
            # Walk through the subject directory
            for root, dirs, files in os.walk(subject_path):
                for file in files:
                    # Create relative path for web
                    abs_path = os.path.join(root, file)
                    rel_path = os.path.relpath(abs_path, root_dir)
                    # Replace backslashes with forward slashes for web
                    web_path = "./" + rel_path.replace("\\", "/")
                    # Encode path for URL
                    # web_path_encoded = urllib.parse.quote(web_path) 
                    # Actually, for local file system or simple hosting, we might need raw paths or encoded. 
                    # Let's keep it simple and encode spaces if needed in the viewer, 
                    # but here we store the readable path and a safe path.
                    
                    file_info = {
                        "name": file,
                        "path": web_path,
                        "type": get_file_type(file),
                        "size": os.path.getsize(abs_path)
                    }
                    file_data[course][subject].append(file_info)

# Write to files.js
with open(output_file, "w", encoding="utf-8") as f:
    f.write("const fileData = ")
    json.dump(file_data, f, ensure_ascii=False, indent=4)
    f.write(";")

print(f"Successfully generated {output_file}")
