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
        """Returns default agents + custom agents from disk, with overlay support."""
        try:
            with open(self.storage_path, "r") as f:
                custom_agents = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            custom_agents = []
        
        # Build a map of custom agents by ID (overlays override defaults)
        custom_by_id = {a["id"]: a for a in custom_agents}
        
        # Merge: use default as base, overlay on top (so new default fields survive)
        merged = []
        for default in DEFAULT_AGENTS:
            if default["id"] in custom_by_id:
                merged.append({**default, **custom_by_id.pop(default["id"])})
            else:
                merged.append(default)
        
        # Add remaining custom agents (non-overlays)
        merged.extend(custom_by_id.values())
        
        return merged

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

    def update_agent(self, agent_id, updates):
        """
        Update fields on an agent. Works for both default and custom agents.
        For defaults, we store an overlay in the custom agents file.
        """
        allowed_fields = {"system_instruction", "capabilities", "linked_sources", "integrations", "name", "description", "icon"}
        filtered = {k: v for k, v in updates.items() if k in allowed_fields}
        
        if not filtered:
            return None
        
        # Check if it's a custom agent
        custom_agents = self._get_only_custom_agents()
        for agent in custom_agents:
            if agent["id"] == agent_id:
                agent.update(filtered)
                self._save_custom_agents(custom_agents)
                return agent
        
        # It's a default agent — store an overlay as a custom entry
        default = next((a for a in DEFAULT_AGENTS if a["id"] == agent_id), None)
        if default:
            overlay = {**default, **filtered}
            # Check if overlay already exists
            for i, agent in enumerate(custom_agents):
                if agent.get("id") == agent_id:
                    custom_agents[i].update(filtered)
                    self._save_custom_agents(custom_agents)
                    return custom_agents[i]
            # No overlay yet, create one
            custom_agents.append(overlay)
            self._save_custom_agents(custom_agents)
            return overlay
        
        return None

    def get_agent_by_id(self, agent_id):
        """Get a single agent by ID."""
        all_agents = self.get_all_agents()
        return next((a for a in all_agents if a["id"] == agent_id), None)

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
