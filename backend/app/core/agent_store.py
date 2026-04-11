import json
import os
from app.core.agents import AGENTS as DEFAULT_AGENTS

class AgentStore:
    def __init__(self, storage_path="./agents.json"):
        self.storage_path = storage_path
        self._ensure_storage_exists()

    def _ensure_storage_exists(self):
        if not os.path.exists(self.storage_path):
            with open(self.storage_path, "w") as f:
                json.dump([], f)

    def get_all_agents(self):
        """Returns default agents + custom agents from disk."""
        try:
            with open(self.storage_path, "r") as f:
                custom_agents = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            custom_agents = []
            
        return DEFAULT_AGENTS + custom_agents

    def add_agent(self, agent_data):
        """Saves a new custom agent to disk."""
        custom_agents = self._get_only_custom_agents()
        
        # Determine next ID (start from 100 to avoid conflict with defaults)
        existing_ids = [a["id"] for a in custom_agents] + [a["id"] for a in DEFAULT_AGENTS]
        new_id = max(existing_ids) + 1 if existing_ids else 100
        
        agent_data["id"] = new_id
        custom_agents.append(agent_data)
        
        self._save_custom_agents(custom_agents)
        return agent_data

    def delete_agent(self, agent_id):
        """Removes a custom agent. Defaults cannot be deleted."""
        # Prevent deleting defaults
        if any(a["id"] == agent_id for a in DEFAULT_AGENTS):
            return False
            
        custom_agents = self._get_only_custom_agents()
        new_custom_agents = [a for a in custom_agents if a["id"] != agent_id]
        
        if len(new_custom_agents) == len(custom_agents):
            return False # Not found
            
        self._save_custom_agents(new_custom_agents)
        return True

    def _get_only_custom_agents(self):
        try:
            with open(self.storage_path, "r") as f:
                return json.load(f)
        except:
            return []

    def _save_custom_agents(self, agents):
        with open(self.storage_path, "w") as f:
            json.dump(agents, f, indent=4)

# Global instance
agent_store = AgentStore()
