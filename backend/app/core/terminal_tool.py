"""Bounded diagnostic commands. Never execute arbitrary shell text."""
import subprocess
import sys
from .config import BACKEND_DIR

COMMANDS = {
    "python-version": [sys.executable, "--version"],
    "git-version": ["git", "--version"],
    "git-status": ["git", "--no-optional-locks", "status", "--short"],
}


class TerminalTool:
    def execute(self, command):
        if command not in COMMANDS:
            return {"stdout": "", "stderr": "Choose an allowed diagnostic: " + ", ".join(COMMANDS), "exit_code": -1, "blocked": True}
        try:
            result = subprocess.run(COMMANDS[command], shell=False, cwd=BACKEND_DIR.parent,
                                    capture_output=True, text=True, timeout=10,
                                    creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
            return {"stdout": result.stdout[:5000], "stderr": result.stderr[:2000], "exit_code": result.returncode, "blocked": False}
        except (OSError, subprocess.TimeoutExpired) as exc:
            return {"stdout": "", "stderr": str(exc), "exit_code": -1, "blocked": False}


terminal_tool = TerminalTool()
