import argparse
import os
import re
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path


COURSES_DEFAULT = ["1 курс", "2 курс", "3 курс", "4 курс"]


@dataclass(frozen=True)
class RenamePlan:
    src: Path
    dst: Path


def normalize_visible(name: str) -> str:
    # Safe normalization only: whitespace, unicode normalization, punctuation spacing.
    s = unicodedata.normalize("NFC", name)

    # Replace weird spaces with normal space
    s = s.replace("\u00A0", " ")

    # Collapse whitespace
    s = re.sub(r"\s+", " ", s).strip()

    # Remove trailing dots/spaces (Windows doesn’t allow trailing dots)
    s = s.rstrip(" .")

    # Normalize spaces around parentheses and dashes
    s = re.sub(r"\s*\(\s*", " (", s)
    s = re.sub(r"\s*\)\s*", ")", s)
    s = re.sub(r"\s*-\s*", " - ", s)
    s = re.sub(r"\s+", " ", s).strip()

    return s


def should_skip(original: str) -> bool:
    # If the filename contains no letters/digits at all, skip (too ambiguous)
    if not re.search(r"[\w\u0400-\u04FF]", original):
        return True

    # If it's extremely short (like '(2).pdf'), keep it as-is unless we only fix whitespace.
    base = Path(original).stem
    if len(base.strip()) <= 2:
        return True

    return False


def proposed_name(file_name: str) -> str | None:
    # Keep extension casing as-is; only normalize base.
    p = Path(file_name)
    stem = p.stem
    suffix = p.suffix

    normalized_stem = normalize_visible(stem)

    # If we don't know how to improve, skip
    if normalized_stem == stem:
        return None

    # Skip “unknown” names (do not touch)
    if should_skip(stem):
        return None

    return normalized_stem + suffix


def plan_renames(root: Path, courses: list[str], dry_run: bool) -> list[RenamePlan]:
    plans: list[RenamePlan] = []

    for course in courses:
        course_dir = root / course
        if not course_dir.exists():
            continue

        for src in course_dir.rglob("*"):
            if not src.is_file():
                continue

            new_name = proposed_name(src.name)
            if not new_name:
                continue

            dst = src.with_name(new_name)
            if dst == src:
                continue

            plans.append(RenamePlan(src=src, dst=dst))

    # Detect collisions
    dst_map: dict[Path, list[Path]] = {}
    for p in plans:
        dst_map.setdefault(p.dst, []).append(p.src)

    collisions = {dst: srcs for dst, srcs in dst_map.items() if len(srcs) > 1}
    if collisions:
        print("Found rename collisions; skipping colliding targets:")
        for dst, srcs in collisions.items():
            print(f"  {dst}")
            for s in srcs:
                print(f"    <- {s}")
        plans = [p for p in plans if p.dst not in collisions]

    return plans


def apply_renames(plans: list[RenamePlan], dry_run: bool) -> int:
    if not plans:
        print("No safe renames found.")
        return 0

    print("Planned renames:")
    for p in plans:
        print(f"- {p.src} -> {p.dst.name}")

    if dry_run:
        print("\nDry-run only. Use --apply to perform renames.")
        return 0

    # Two-phase rename on Windows to avoid case/normalize issues
    temp_suffix = ".__tmp_rename__"
    temp_plans: list[RenamePlan] = []

    for p in plans:
        tmp = p.src.with_name(p.src.name + temp_suffix)
        try:
            p.src.rename(tmp)
        except OSError as e:
            print(f"Failed temp-rename: {p.src} -> {tmp}: {e}")
            continue
        temp_plans.append(RenamePlan(src=tmp, dst=p.dst))

    for p in temp_plans:
        try:
            p.src.rename(p.dst)
        except OSError as e:
            print(f"Failed rename: {p.src} -> {p.dst}: {e}")

    print("Done.")
    return 0


def main() -> int:
    script_dir = Path(__file__).resolve().parent

    parser = argparse.ArgumentParser(
        description=(
            "Safely normalize filenames under course folders. "
            "Only obvious whitespace/format fixes are applied; ambiguous names are skipped."
        )
    )
    parser.add_argument(
        "--root",
        default=str(script_dir),
        help="Root folder of the site (defaults to the folder containing this script).",
    )
    parser.add_argument(
        "--courses",
        nargs="*",
        default=COURSES_DEFAULT,
        help="Course folder names to scan.",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually rename files (otherwise dry-run).",
    )

    args = parser.parse_args()

    root = Path(args.root).resolve()
    plans = plan_renames(root=root, courses=list(args.courses), dry_run=not args.apply)
    return apply_renames(plans, dry_run=not args.apply)


if __name__ == "__main__":
    raise SystemExit(main())
