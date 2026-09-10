#!/usr/bin/env python3
"""Offline budget regression checks. Never invoke a UI/dialing mode."""
from pathlib import Path
import subprocess
import tempfile

app = Path(__file__).resolve().parent
reports = app.parents[1] / ".reports" / "wx-call-tests"
reports.mkdir(parents=True, exist_ok=True)

with tempfile.TemporaryDirectory(dir=reports) as directory:
    ledger = Path(directory) / "attempts.txt"

    def check(content, expected=None, limit="5"):
        if content is None:
            ledger.unlink(missing_ok=True)
        else:
            ledger.write_text(content, encoding="utf-8")
        # budget returns before accessing System Events, OCR, mouse, or screenshots.
        result = subprocess.run([
            "/usr/bin/osascript", str(app / "call.applescript"),
            "/nonexistent-vision", "/nonexistent-click", directory,
            "budget", "退款", "余生", limit,
        ], capture_output=True, text=True, timeout=10)
        if expected is None:
            assert result.returncode != 0, (content, result.stdout)
        else:
            assert result.returncode == 0, result.stderr
            assert result.stdout.strip() == expected, result.stdout

    check(None)  # A missing ledger must fail closed, never silently reset.
    for count in (0, 1, 4, 5, 6):
        check(f"{count}\n", f"attempts={count}; limit=5")
    for invalid in ("", "oops\n", "-1\n", "1.5\n", "1\n2\n", " 1\n"):
        check(invalid)
    check("5\n", limit="6")
    check("5\n", limit="0")
print("PASS: 14 offline budget cases; no UI or calls executed")
