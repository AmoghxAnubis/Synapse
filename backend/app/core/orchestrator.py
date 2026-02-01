import time
import subprocess
import threading
from datetime import datetime

class Orchestrator:
    def __init__(self):
        print("⚡ Orchestrator Initialized (Autonomic System)")
        self.active_mode = "FOCUS" # Default state
        self.monitoring = False

    def set_mode(self, mode):
        """
        Switches context.
        Modes: 'FOCUS', 'MEETING', 'RESEARCH'
        """
        print(f"🔄 Switching Workflow to: {mode}")
        self.active_mode = mode
        self._apply_mode_rules(mode)
        return {"status": "switched", "current_mode": mode}

    def _apply_mode_rules(self, mode):
        """
        The logic that actually controls the OS.
        """
        if mode == "MEETING":
            # Demo: Open Notepad as a 'Meeting Notes' app
            print("📅 Meeting detected. Opening tools...")
            subprocess.Popen("notepad.exe")
            
        elif mode == "RESEARCH":
            # Demo: Open Calculator (Safe demo app)
            print("dup Searching context...")
            subprocess.Popen("calc.exe")
            
        elif mode == "FOCUS":
            print("Your notifications would be silenced here.")

    def start_monitoring(self):
        """
        Background thread that checks 'Calendar' (Mocked).
        """
        self.monitoring = True
        thread = threading.Thread(target=self._watch_loop)
        thread.daemon = True
        thread.start()

    def _watch_loop(self):
        print("👀 Watchdog active: Monitoring System Time...")
        while self.monitoring:
            # MOCK LOGIC: If seconds is '00', trigger a meeting
            # In a real app, this would query Google Calendar API
            now = datetime.now()
            if now.second == 0:
                print("⏰ Scheduled Event Triggered!")
                # self.set_mode("MEETING") # Uncomment to auto-trigger
            time.sleep(1)

# Global Instance
system_orchestrator = Orchestrator()