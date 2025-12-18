import argparse
import json
import os
from pathlib import Path


def get_file_type(filename: str) -> str:
    return Path(filename).suffix[1:].lower() or "file"


def build_index(root_dir: Path, courses: list[str]) -> dict:
    file_data: dict = {}

    for course in courses:
        course_path = root_dir / course
        if not course_path.exists():
            continue

        file_data[course] = {}

        for subject in course_path.iterdir():
            if not subject.is_dir():
                continue

            file_data[course][subject.name] = []

            for abs_path in subject.rglob('*'):
                if not abs_path.is_file():
                    continue

                rel_path = abs_path.relative_to(root_dir)
                web_path = "./" + rel_path.as_posix()
                file_data[course][subject.name].append({
                    "name": abs_path.name,
                    "path": web_path,
                    "type": get_file_type(abs_path.name),
                    "size": abs_path.stat().st_size,
                })

    return file_data


def main() -> int:
    script_dir = Path(__file__).resolve().parent

    parser = argparse.ArgumentParser(
        description="Generate files.js index (const fileData = ...) from course folders."
    )
    parser.add_argument(
        "--root",
        default=str(script_dir),
        help="Root folder of the site (defaults to the folder containing this script).",
    )
    parser.add_argument(
        "--output",
        default=str(script_dir / "files.js"),
        help="Output JS file path (default: <root>/files.js).",
    )
    parser.add_argument(
        "--courses",
        nargs="*",
        default=["1 курс", "2 курс", "3 курс", "4 курс"],
        help="Course folder names to scan.",
    )

    args = parser.parse_args()

    root_dir = Path(args.root).resolve()
    output_file = Path(args.output).resolve()

    file_data = build_index(root_dir=root_dir, courses=list(args.courses))

    output_file.parent.mkdir(parents=True, exist_ok=True)
    with output_file.open("w", encoding="utf-8") as f:
        f.write("const fileData = ")
        json.dump(file_data, f, ensure_ascii=False, indent=4)
        f.write(";")

    print(f"Successfully generated {output_file}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
