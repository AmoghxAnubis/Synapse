import subprocess
import os

class AppLauncher:
    def __init__(self):
        # Map of app names to their executable paths or commands
        self.app_map = {
            # Win32 Apps
            "notepad": "notepad.exe",
            "calculator": "calc.exe",
            "paint": "mspaint.exe",
            "explorer": "explorer.exe",
            "cmd": "cmd.exe",
            "powershell": "powershell.exe",
            "browser": "msedge.exe",
            "chrome": "chrome.exe",
            "firefox": "firefox.exe",
            "spotify": "spotify.exe",
            "discord": "discord.exe",
            "slack": "slack.exe",
            "zoom": "zoom.exe",
            "word": "winword.exe",
            "excel": "excel.exe",
            "outlook": "outlook.exe",
            "Teams": "Teams.exe",
            "vlc": "vlc.exe",
            "youtube": "https://www.youtube.com",
            "github": "https://github.com",
            "gmail": "https://gmail.com",
            "google": "https://google.com",
        }
    
    def is_app_request(self, query):
        """Check if the query is asking to open an app"""
        query_lower = query.lower()
        
        # Keywords that indicate an app opening request
        app_keywords = [
            "open", "launch", "start", "run", "execute",
            "turn on", "turn on"
        ]
        
        # Check if query contains any app keywords and app names
        for keyword in app_keywords:
            if keyword in query_lower:
                for app_name in self.app_map.keys():
                    if app_name in query_lower:
                        return True, app_name
        return False, None
    
    def launch_app(self, app_name):
        """Launch the requested application"""
        app_name_lower = app_name.lower()
        
        if app_name_lower not in self.app_map:
            return f"App '{app_name}' not found in the supported list."
        
        target = self.app_map[app_name_lower]
        
        try:
            # Check if it's a URL
            if target.startswith("http"):
                # Open URL in default browser
                subprocess.Popen(f'start "" "{target}"', shell=True)
                return f"✅ Opened {app_name} in browser"
            else:
                # Launch the executable
                subprocess.Popen(target, shell=True)
                return f"✅ Launched {app_name}"
        except Exception as e:
            return f"❌ Error launching {app_name}: {str(e)}"
    
    def get_supported_apps(self):
        """Return list of supported apps"""
        return list(self.app_map.keys())
