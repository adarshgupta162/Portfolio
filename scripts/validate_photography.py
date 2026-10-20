#!/usr/bin/env python3
"""Lightweight validation for photography gallery build and wiring."""
from __future__ import annotations

from pathlib import Path
import json
import re
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
BUILD_SCRIPT = ROOT / "scripts" / "build_photography.py"
MANIFEST_JS = ROOT / "js" / "photography-manifest.js"
PHOTOGRAPHY_HTML = ROOT / "photography.html"
WORKFLOW = ROOT / ".github" / "workflows" / "deploy-pages.yml"


def fail(message: str) -> None:
    print(f"[FAIL] {message}")
    raise SystemExit(1)


def ok(message: str) -> None:
    print(f"[OK] {message}")


def run_manifest_build() -> None:
    result = subprocess.run(
        [sys.executable, str(BUILD_SCRIPT)],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        fail(f"Manifest build failed:\n{result.stdout}\n{result.stderr}")
    ok("Manifest generator runs successfully")


def parse_manifest() -> list[dict]:
    text = MANIFEST_JS.read_text(encoding="utf-8")
    categories_match = re.search(r"window\.PHOTOGRAPHY_CATEGORIES\s*=\s*(\[.*?\])\s*;", text, re.S)
    manifest_match = re.search(r"window\.PHOTOGRAPHY_MANIFEST\s*=\s*(\[.*\])\s*;", text, re.S)
    if not categories_match or not manifest_match:
        fail("Manifest JS does not contain expected PHOTOGRAPHY_CATEGORIES/PHOTOGRAPHY_MANIFEST assignments")
    try:
        categories = json.loads(categories_match.group(1))
        photos = json.loads(manifest_match.group(1))
    except json.JSONDecodeError as exc:
        fail(f"Manifest JS contains invalid JSON payloads: {exc}")
    if not isinstance(categories, list) or not isinstance(photos, list):
        fail("Manifest payloads must both be arrays")
    ok("Manifest JS payloads are valid JSON arrays")
    return photos


def check_manifest_syntax_with_node() -> None:
    result = subprocess.run(
        ["node", "--check", str(MANIFEST_JS)],
        cwd=ROOT,
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        fail(f"Manifest JS has syntax errors:\n{result.stdout}\n{result.stderr}")
    ok("Manifest JS is syntactically valid")


def check_manifest_paths(photos: list[dict]) -> None:
    seen = set()
    for index, item in enumerate(photos):
        src = item.get("src")
        if not isinstance(src, str) or not src.strip():
            fail(f"Manifest entry {index} is missing a valid src")
        if src.startswith("/") or "://" in src:
            fail(f"Manifest entry {index} uses a non-repository path: {src}")
        resolved = (ROOT / src).resolve()
        if not resolved.exists() or not resolved.is_file():
            fail(f"Manifest entry {index} points to missing file: {src}")
        if src in seen:
            fail(f"Duplicate manifest src detected: {src}")
        seen.add(src)
    ok("All manifest image paths exist in the repository and are unique")


def check_html_references() -> None:
    text = PHOTOGRAPHY_HTML.read_text(encoding="utf-8")
    required_refs = (
        "css/photography.css",
        "js/photography-manifest.js",
        "js/photography.js",
    )
    missing = [ref for ref in required_refs if ref not in text]
    if missing:
        fail(f"photography.html is missing required references: {', '.join(missing)}")
    ok("photography.html references CSS, manifest JS, and gallery JS")


def check_workflow_requirements() -> None:
    text = WORKFLOW.read_text(encoding="utf-8")
    checks = {
        "permissions pages write": re.search(r"permissions:\s*[\s\S]*?\bpages:\s*write\b", text),
        "permissions id-token write": re.search(r"permissions:\s*[\s\S]*?\bid-token:\s*write\b", text),
        "configure-pages action": "actions/configure-pages@v5" in text,
        "configure-pages enablement true": re.search(r"configure-pages@v5[\s\S]*?enablement:\s*true", text),
        "upload-pages-artifact action": "actions/upload-pages-artifact@v3" in text,
        "deploy-pages action": "actions/deploy-pages@v4" in text,
    }
    failed = [name for name, passed in checks.items() if not passed]
    if failed:
        fail(f"Workflow missing required Pages deployment settings: {', '.join(failed)}")
    ok("Workflow contains required GitHub Pages deployment settings")


def main() -> None:
    run_manifest_build()
    photos = parse_manifest()
    check_manifest_syntax_with_node()
    check_manifest_paths(photos)
    check_html_references()
    check_workflow_requirements()
    print("[OK] Photography validation completed")


if __name__ == "__main__":
    main()
