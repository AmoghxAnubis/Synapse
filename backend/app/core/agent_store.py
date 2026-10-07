from copy import deepcopy
import json
from .agents import AGENTS
from .config import BACKEND_DIR
from .storage import Storage


class AgentStore:
    def __init__(self, storage=None):
        self.storage = storage or Storage()
        if self.storage.get("agents") is None:
            legacy = BACKEND_DIR / "agents.json"
            records = json.loads(legacy.read_text(encoding="utf-8")) if legacy.exists() else []
            if not isinstance(records, list):
                raise ValueError("Legacy agents data must be a list; original file was preserved")
            self.storage.set("agents", records)

    def get_all_agents(self):
        custom = {a["id"]: a for a in self.storage.get("agents", [])}
        records = [{**deepcopy(a), **custom.pop(a["id"], {})} for a in AGENTS]
        records.extend(custom.values())
        for record in records:
            record.setdefault("integrations", [])
            record.setdefault("capabilities", {"web_search": False, "terminal": False})
            record.setdefault("linked_sources", [])
        return records

    def get_agent_by_id(self, agent_id):
        return next((a for a in self.get_all_agents() if a["id"] == agent_id), None)

    def add_agent(self, agent_data):
        with self.storage.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute("SELECT value FROM kv WHERE key='agents'").fetchone()
            custom = json.loads(row[0]) if row else []
            record = dict(agent_data, id=max([99] + [a["id"] for a in custom] + [a["id"] for a in AGENTS]) + 1)
            custom.append(record)
            db.execute("UPDATE kv SET value=? WHERE key='agents'", (json.dumps(custom),))
        return record

    def update_agent(self, agent_id, updates):
        with self.storage.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            custom = json.loads(db.execute("SELECT value FROM kv WHERE key='agents'").fetchone()[0])
            base = next((a for a in custom + AGENTS if a["id"] == agent_id), None)
            if base is None:
                return None
            updated = {**base, **updates, "id": agent_id}
            custom = [a for a in custom if a["id"] != agent_id] + [updated]
            db.execute("UPDATE kv SET value=? WHERE key='agents'", (json.dumps(custom),))
        return updated

    def delete_agent(self, agent_id):
        if any(a["id"] == agent_id for a in AGENTS):
            return False
        with self.storage.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            custom = json.loads(db.execute("SELECT value FROM kv WHERE key='agents'").fetchone()[0])
            remaining = [a for a in custom if a["id"] != agent_id]
            if len(remaining) == len(custom):
                return False
            db.execute("UPDATE kv SET value=? WHERE key='agents'", (json.dumps(remaining),))
        return True
