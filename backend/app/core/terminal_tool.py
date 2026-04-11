"""
Terminal Tool for Synapse Agents
Executes shell commands in a sandboxed manner with safety checks.
"""

import subprocess
import platform
import re

# Commands that are blocked for safety
BLOCKED_PATTERNS = [
    r"\brm\s+-rf\b",
    r"\bformat\b",
    r"\bdel\s+/[sS]\b",
    r"\brmdir\s+/[sS]\b",
    r"\bmkfs\b",
    r"\bdd\s+if=",
    r"\b:(){",
    r"shutdown",
    r"reboot",
    r"taskkill\s+/f\s+/im\s+explorer",
]


class TerminalTool:
    """Sandboxed terminal command execution."""

    def __init__(self, timeout: int = 15):
        self.timeout = timeout
        self.is_windows = platform.system() == "Windows"

    def execute(self, command: str) -> dict:
        """
        Run a shell command with timeout and safety checks.
        Returns { stdout, stderr, exit_code, blocked }.
        """
        # Safety check
        if self._is_dangerous(command):
            return {
                "stdout": "",
                "stderr": f"⛔ Command blocked for safety: '{command}'",
                "exit_code": -1,
                "blocked": True,
            }

        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=self.timeout,
                cwd=None,  # Runs in backend's working dir
            )
            return {
                "stdout": result.stdout[:5000],  # Cap output size
                "stderr": result.stderr[:2000],
                "exit_code": result.returncode,
                "blocked": False,
            }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": f"⏱️ Command timed out after {self.timeout}s",
                "exit_code": -1,
                "blocked": False,
            }
        except Exception as e:
            return {
                "stdout": "",
                "stderr": f"Execution error: {str(e)}",
                "exit_code": -1,
                "blocked": False,
            }

    def _is_dangerous(self, command: str) -> bool:
        """Check if command matches any blocked patterns."""
        for pattern in BLOCKED_PATTERNS:
            if re.search(pattern, command, re.IGNORECASE):
                return True
        return False


# Global instance
terminal_tool = TerminalTool()
