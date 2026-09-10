#!/usr/bin/env python3
"""Offline attempt-counter regression checks. Never invoke a UI/dialing mode."""
from pathlib import Path
import subprocess
import tempfile

app = Path(__file__).resolve().parent
reports = app.parents[1] / ".reports" / "wx-call-tests"
reports.mkdir(parents=True, exist_ok=True)

with tempfile.TemporaryDirectory(dir=reports) as directory:
    ledger = Path(directory) / "attempts.txt"

    def check(content, expected=None, count="1"):
        if content is None:
            ledger.unlink(missing_ok=True)
        else:
            ledger.write_text(content, encoding="utf-8")
        # budget returns before accessing System Events, OCR, mouse, or screenshots.
        result = subprocess.run([
            "/usr/bin/osascript", str(app / "call.applescript"),
            "/nonexistent-vision", "/nonexistent-click", directory,
            "budget", "退款", "余生", count,
        ], capture_output=True, text=True, timeout=10)
        if expected is None:
            assert result.returncode != 0, (content, result.stdout)
        else:
            assert result.returncode == 0, result.stderr
            assert result.stdout.strip() == expected, result.stdout

    check(None)  # A missing ledger must fail closed, never silently reset.
    for count in (0, 1, 4, 5, 6, 10, 100):
        check(f"{count}\n", f"attempts={count}")
    for invalid in ("", "oops\n", "-1\n", "1.5\n", "1\n2\n", " 1\n"):
        check(invalid)
    check("6\n", "attempts=6", count="10")
    check("5\n", count="0")
    check("5\n", count="-1")
print("PASS: 17 offline counter cases; no UI or calls executed")
