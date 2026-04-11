"""
Agent Manager - Fixed Serializable
"""
import sys
import os
import re
from typing import Optional, Dict, Any
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agents.tools.github_tool import GitHubConnector
from app.agents.tools.app_launcher import AppLauncher
from app.agents.tools.mcp_github_server import MCPGitHubServer
from app.agents.tools.mcp_combo_client import MCPComboClient

# Conditional imports
NOTION_AVAILABLE = False
JIRA_AVAILABLE = False
SLACK_AVAILABLE = False
DISCORD_AVAILABLE = False

try:
    from app.agents.tools.mcp_notion_server import MCPNotionServer
    NOTION_AVAILABLE = True
except:
    pass

try:
    from app.agents.tools.mcp_jira_server import MCPJiraServer
    JIRA_AVAILABLE = True
except:
    pass

try:
    from app.agents.tools.mcp_slack_server import MCPSlackServer
    SLACK_AVAILABLE = True
except:
    pass

try:
    from app.agents.tools.mcp_discord_server import MCPDiscordServer
    DISCORD_AVAILABLE = True
except:
    pass

class ActionPlan(BaseModel):
    target: str
    params: Dict[str, str]
    reason: str
    confidence: float

class AgentManager:
    def __init__(self):
        print("🕵️ Agent Manager...")
        self.github = GitHubConnector()
        self.app_launcher = AppLauncher()
        self.mcp_github_server = MCPGitHubServer()
        self.mcp_notion_server = MCPNotionServer() if NOTION_AVAILABLE else None
        self.mcp_jira_server = MCPJiraServer() if JIRA_AVAILABLE else None
        self.mcp_slack_server = MCPSlackServer() if SLACK_AVAILABLE else None
        self.mcp_discord_server = MCPDiscordServer() if DISCORD_AVAILABLE else None
        self.mcp_client = MCPComboClient(
            github_server=self.mcp_github_server,
            notion_server=self.mcp_notion_server,
            jira_server=self.mcp_jira_server,
            slack_server=self.mcp_slack_server,
            discord_server=self.mcp_discord_server
        )

    def decide(self, user_input: str, context: str = "", mode: str = "DEFAULT") -> Optional[ActionPlan]:
        query_lower = user_input.lower()
        scores = {}

        targets = {
            "local_app": ["open", "launch"],
            "slack": ["slack"],
            "discord": ["discord"],
            "jira": ["jira"],
            "notion": ["notion"],
            "github": ["github", "repo", "issue", "pr"]
        }

        for target, keywords in targets.items():
            score = sum(1 for kw in keywords if kw in query_lower)
            scores[target] = score

        if scores:
            best_target = max(scores, key=scores.get)
            confidence = scores[best_target] / 5.0
            if confidence > 0.4:
                params = self._extract_params(user_input, best_target)
                return ActionPlan(
                    target=best_target,
                    params=params,
                    reason=f"Matched {best_target}",
                    confidence=confidence
                )
        return None

    def execute(self, action_plan: ActionPlan) -> Dict[str, Any]:
        target = action_plan.target
        user_query = action_plan.reason  # Fixed - no user_input attr

        if target == "local_app":
            return {"success": True, "message": "App launched"}

        raw_result = self.mcp_client.execute(user_query)
        formatted = self.mcp_client.format_result_for_user(raw_result)
        return {
            "success": raw_result.get("success", True),
            "formatted": formatted,
            "raw": raw_result
        }

    def _extract_params(self, input: str, target: str) -> Dict[str, str]:
        return {}

    def get_mcp_status(self) -> Dict[str, str]:
        """Safe JSON serializable status."""
        status = {}
        try:
            raw_status = self._raw_mcp_status()
            for k, v in raw_status.items():
                status[k] = str(v.get('status', 'unknown'))
        except:
            status = {"error": "Status unavailable"}
        return status

    def _raw_mcp_status(self) -> Dict:
        """Legacy raw status."""
        github_status = self.mcp_github_server.get_status() if self.mcp_github_server else {"status": "not init"}
        status = {"github": github_status}
        # Add others if available
        return status

if __name__ == "__main__":
    agent_manager = AgentManager()
