"""Explicit, single-use approval for validated actions; no language parser."""
import subprocess
import platform
import threading
import time
import uuid
import json
from ..workflows.actions import run_action

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
        if action == "open_app":
            with self.storage.connect() as db:
                db.execute("BEGIN IMMEDIATE")
                count = db.execute("SELECT COUNT(*) FROM action_runs WHERE status IN ('preparing','pending') AND json_extract(record,'$.expires') > ?", (time.time(),)).fetchone()[0]
                if count >= 100:
                    raise ValueError("Too many pending actions.")
                db.execute("INSERT INTO action_runs VALUES (?,?,?,NULL,?)", (identifier, json.dumps(record), "preparing", time.time()))
            try:
                run_action(self.storage, identifier, record=record)
                self._finish(identifier, "pending")
            except Exception:
                self._finish(identifier, "failed")
                raise
            return record
        with self.lock:
            self.pending = {k: v for k, v in self.pending.items() if v["expires"] > time.time()}
            if len(self.pending) >= 100:
                raise ValueError("Too many pending actions.")
            self.pending[identifier] = record
        self.storage.audit(action, "awaiting approval")
        return record

    def approve(self, identifier, agents, network_enabled):
        if self.status(identifier) is not None:
            record = self._claim(identifier, "resuming")
            if record is None:
                raise ValueError("Action expired or was already used.")
            try:
                outcome = run_action(self.storage, identifier, approved=True,
                                     execute=lambda saved: self._execute_local(saved, agents))
                return outcome["result"]
            except Exception:
                # A consumed approval never becomes pending again, including
                # checkpoint failure after a successful process launch.
                with self.storage.connect() as db:
                    db.execute("UPDATE action_runs SET status='interrupted', updated=? WHERE id=? AND status IN ('resuming','executing')", (time.time(), identifier))
                raise
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
        if self.status(identifier) is not None:
            record = self._claim(identifier, "cancelled")
            if record is None:
                return False
            # Mark cancelled durably before resuming the rejection branch.
            run_action(self.storage, identifier, approved=False)
            return True
        with self.lock:
            record = self.pending.pop(identifier, None)
        if record:
            self.storage.audit(record["action"], "cancelled")
        return record is not None

    def _finish(self, identifier, status, result=None):
        with self.storage.connect() as db:
            db.execute("UPDATE action_runs SET status=?, result=?, updated=? WHERE id=?",
                       (status, json.dumps(result) if result is not None else None, time.time(), identifier))
            db.execute("INSERT INTO audit(action,outcome,created) VALUES ('open_app',?,?)", ("awaiting approval" if status == "pending" else status, time.time()))

    def _claim(self, identifier, status):
        with self.storage.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute("SELECT record,status FROM action_runs WHERE id=?", (identifier,)).fetchone()
            if not row or row["status"] != "pending":
                return None
            record = json.loads(row["record"])
            expired = record["expires"] <= time.time()
            outcome = "expired" if expired else status
            db.execute("UPDATE action_runs SET status=?,updated=? WHERE id=?", (outcome, time.time(), identifier))
            db.execute("INSERT INTO audit(action,outcome,created) VALUES ('open_app',?,?)", (outcome, time.time()))
        return None if expired else record

    def _execute_local(self, record, agents):
        agent = agents.get_agent_by_id(record["agent_id"])
        try:
            if not agent or not agent.get("capabilities", {}).get("terminal"):
                raise PermissionError("App launching permission was removed or the agent no longer exists.")
            if platform.system() != "Windows":
                raise ValueError("App launching is available on Windows.")
            if record["expires"] <= time.time():
                raise ValueError("Action expired.")
            if record["action"] != "open_app" or set(record["params"]) != {"app"} or record["params"]["app"] not in APPS:
                raise ValueError("Invalid saved app action.")
        except Exception:
            self._finish(record["id"], "failed")
            raise
        with self.storage.connect() as db:
            changed = db.execute("UPDATE action_runs SET status='executing',updated=? WHERE id=? AND status='resuming'", (time.time(), record["id"])).rowcount
        if not changed:
            raise ValueError("Action was already used.")
        try:
            subprocess.Popen(APPS[record["params"]["app"]], shell=False)
        except OSError:
            self._finish(record["id"], "failed")
            raise RuntimeError("The app could not be opened. Create a fresh preview to retry.") from None
        result = {"message": "App opened."}
        self._finish(record["id"], "completed", result)
        return result

    def status(self, identifier):
        with self.storage.connect() as db:
            row = db.execute("SELECT * FROM action_runs WHERE id=?", (identifier,)).fetchone()
        if row is None:
            return None
        record = json.loads(row["record"])
        status = row["status"]
        if status == "pending" and record["expires"] <= time.time():
            status = "expired"
        return {**record, "status": status, "result": json.loads(row["result"]) if row["result"] else None}

    def list_pending(self):
        with self.storage.connect() as db:
            rows = db.execute("SELECT record FROM action_runs WHERE status='pending' AND json_extract(record,'$.expires') > ? ORDER BY updated DESC LIMIT 100", (time.time(),)).fetchall()
        return [json.loads(row["record"]) for row in rows]
