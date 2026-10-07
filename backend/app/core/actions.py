"""Explicit, single-use approval for validated actions; no language parser."""
import subprocess
import platform
import threading
import time
import uuid

APPS = {"notepad": ["notepad.exe"], "calculator": ["calc.exe"], "paint": ["mspaint.exe"]}
ACTIONS = ("open_app", "github.create_issue", "slack.send_message", "discord.send_message")


class ActionService:
    def __init__(self, storage, integrations):
        self.storage = storage
        self.integrations = integrations
        self.pending = {}
        self.lock = threading.Lock()

    def preview(self, action, params, agent):
        if action not in ACTIONS:
            raise ValueError("Unknown action")
        if action == "open_app":
            if platform.system() != "Windows":
                raise ValueError("App launching is available on Windows.")
            if not agent.get("capabilities", {}).get("terminal"):
                raise PermissionError("This agent cannot launch apps.")
            if params.get("app") not in APPS or set(params) != {"app"}:
                raise ValueError("Choose Notepad, Calculator, or Paint.")
            description = "Open " + params["app"] + " on this computer."
        else:
            service = action.split(".")[0]
            if service not in agent.get("integrations", []):
                raise PermissionError("Enable this integration on the selected agent first.")
            if not self.integrations.config(service).get("connected"):
                raise ValueError("Connect the integration first.")
            fields = {"repository", "title", "body"} if service == "github" else {"channel", "text"}
            if set(params) - fields or any(not isinstance(v, str) or len(v) > 4000 for v in params.values()):
                raise ValueError("Invalid action parameters")
            required = fields - {"body"}
            if any(not params.get(k, "").strip() for k in required):
                raise ValueError("Fill all required fields.")
            resource = params["repository"] if service == "github" else params["channel"]
            if resource not in self.integrations.config(service)["resources"]:
                raise PermissionError("The destination is outside the selected sources.")
            description = f"Create issue in {resource}: {params['title']}\n\n{params.get('body', '')}" if service == "github" else f"Send to {service} channel {resource}: {params['text']}"
        identifier = str(uuid.uuid4())
        record = {"id": identifier, "action": action, "params": dict(params), "agent_id": agent["id"], "description": description, "expires": time.time() + 300}
        with self.lock:
            self.pending = {k: v for k, v in self.pending.items() if v["expires"] > time.time()}
            if len(self.pending) >= 100:
                raise ValueError("Too many pending actions.")
            self.pending[identifier] = record
        self.storage.audit(action, "awaiting approval")
        return record

    def approve(self, identifier, agents, network_enabled):
        with self.lock:
            record = self.pending.pop(identifier, None)
        if not record or record["expires"] <= time.time():
            raise ValueError("Action expired or was already used.")
        agent = agents.get_agent_by_id(record["agent_id"])
        if not agent:
            raise PermissionError("Agent no longer exists.")
        action = record["action"]
        try:
            if action == "open_app":
                if not agent.get("capabilities", {}).get("terminal"):
                    raise PermissionError("App launching permission was removed.")
                subprocess.Popen(APPS[record["params"]["app"]], shell=False)
                result = {"message": "App opened."}
            else:
                if not network_enabled or action.split(".")[0] not in agent.get("integrations", []):
                    raise PermissionError("Network access or integration permission was removed.")
                result = self.integrations.execute_write(action, record["params"])
            self.storage.audit(action, "completed")
            return result
        except Exception:
            self.storage.audit(action, "failed")
            raise

    def cancel(self, identifier):
        with self.lock:
            record = self.pending.pop(identifier, None)
        if record:
            self.storage.audit(record["action"], "cancelled")
        return record is not None
