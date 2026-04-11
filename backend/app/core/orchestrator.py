import time
import subprocess
import threading
import re
from datetime import datetime
from typing import Dict, Any

class Orchestrator:
    def __init__(self):
        print("⚡ Orchestrator Initialized (Autonomic System)")
        self.active_mode = "FOCUS"  # Default state
        self.monitoring = False
        self.mode_keywords = {
            "MEETING": ["meeting", "call", "team", "briefing", "notes", "agenda"],
            "RESEARCH": ["research", "search", "find", "summarize", "analyze"],
            "WORKFLOW": ["create", "jira", "slack", "github", "notion", "issue", "pr", "send", "upload"],
            "FOCUS": ["focus", "work", "code", "write", "edit"],
            "DEFAULT": []
        }

    def detect_mode(self, user_input: str) -> Dict[str, str]:
        """
        Detect high-level intent and set mode.
        Returns: {"mode": str, "intent": str}
        """
        user_lower = user_input.lower()
        detected_intent = "general query"

        for mode, keywords in self.mode_keywords.items():
            if any(keyword in user_lower for keyword in keywords):
                self.set_mode(mode)
                if mode == "MEETING":
                    detected_intent = "meeting coordination"
                elif mode == "RESEARCH":
                    detected_intent = "knowledge retrieval/summary"
                elif mode == "WORKFLOW":
                    detected_intent = "multi-tool workflow execution"
                elif mode == "FOCUS":
                    detected_intent = "focused task execution"
                break

        return {
            "mode": self.active_mode,
            "intent": detected_intent
        }

    def set_mode(self, mode: str) -> Dict[str, str]:
        """
        Switches context.
        Modes: 'FOCUS', 'MEETING', 'RESEARCH', 'WORKFLOW', 'DEFAULT'
        """
        valid_modes = list(self.mode_keywords.keys()) + ["DEFAULT"]
        if mode not in valid_modes:
            mode = "DEFAULT"
        
        print(f"🔄 Switching Workflow to: {mode}")
        self.active_mode = mode
        self._apply_mode_rules(mode)
        return {"status": "switched", "current_mode": mode}

    def get_active_mode(self) -> str:
        """Get current active mode."""
        return self.active_mode

    def _apply_mode_rules(self, mode: str):
        """
        OS-level actions based on mode.
        """
        if mode == "MEETING":
            print("📅 Meeting mode: Preparing collaboration tools...")
            subprocess.Popen("notepad.exe")  # Demo
        elif mode == "RESEARCH":
            print("🔍 Research mode: Opening analysis tools...")
            subprocess.Popen("calc.exe")  # Demo
        elif mode == "WORKFLOW":
            print("⚙️ Workflow mode: Toolbelt activated...")
        elif mode == "FOCUS":
            print("🎯 Focus mode: Distraction-free environment...")
        elif mode == "DEFAULT":
            print("➡️ Default mode: Standard processing...")

    def start_monitoring(self):
        """
        Background thread for proactive mode switching.
        """
        self.monitoring = True
        thread = threading.Thread(target=self._watch_loop)
        thread.daemon = True
        thread.start()

    def _watch_loop(self):
        print("👀 Watchdog active: Monitoring System Time...")
        while self.monitoring:
            now = datetime.now()
            if now.second == 0:
                print("⏰ Scheduled Event Triggered!")
            time.sleep(1)

# Global Instance
system_orchestrator = Orchestrator()

