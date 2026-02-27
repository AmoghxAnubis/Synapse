"""
Agent Manager - Updated with GitHub, Notion, Jira, and Slack MCP Support
"""
import sys
import os

# Add parent directories to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.tools.github_tool import GitHubConnector
from agents.tools.app_launcher import AppLauncher
from agents.tools.mcp_github_server import MCPGitHubServer
from agents.tools.mcp_combo_client import MCPComboClient

try:
    from agents.tools.mcp_notion_server import MCPNotionServer
    NOTION_AVAILABLE = True
except ImportError:
    NOTION_AVAILABLE = False

try:
    from agents.tools.mcp_jira_server import MCPJiraServer
    JIRA_AVAILABLE = True
except ImportError:
    JIRA_AVAILABLE = False

try:
    from agents.tools.mcp_slack_server import MCPSlackServer
    SLACK_AVAILABLE = True
except ImportError:
    SLACK_AVAILABLE = False


class AgentManager:
    def __init__(self):
        print("🕵️ Initializing Agentic Capabilities...")
        self.github = GitHubConnector()
        self.app_launcher = AppLauncher()
        
        # Initialize MCP Servers
        print("🔌 Initializing MCP GitHub Server...")
        self.mcp_github_server = MCPGitHubServer()
        
        # Initialize Notion MCP Server if available
        if NOTION_AVAILABLE:
            print("🔌 Initializing MCP Notion Server...")
            try:
                self.mcp_notion_server = MCPNotionServer()
            except Exception as e:
                print(f"⚠️ Notion MCP Server init failed: {e}")
                self.mcp_notion_server = None
        else:
            self.mcp_notion_server = None
        
        # Initialize Jira MCP Server if available
        if JIRA_AVAILABLE:
            print("🔌 Initializing MCP Jira Server...")
            try:
                self.mcp_jira_server = MCPJiraServer()
            except Exception as e:
                print(f"⚠️ Jira MCP Server init failed: {e}")
                self.mcp_jira_server = None
        else:
            self.mcp_jira_server = None
        
        # Initialize Slack MCP Server if available
        if SLACK_AVAILABLE:
            print("🔌 Initializing MCP Slack Server...")
            try:
                self.mcp_slack_server = MCPSlackServer()
            except Exception as e:
                print(f"⚠️ Slack MCP Server init failed: {e}")
                self.mcp_slack_server = None
        else:
            self.mcp_slack_server = None
        
        # Combined MCP client for all services
        self.mcp_client = MCPComboClient(
            github_server=self.mcp_github_server,
            notion_server=self.mcp_notion_server,
            jira_server=self.mcp_jira_server,
            slack_server=self.mcp_slack_server
        )
        
    def route_request(self, user_query):
        """
        DETERMINISTIC ROUTING (NPU Task)
        Routes requests to appropriate MCP server based on keywords.
        """
        query = user_query.lower()

        # --- ROUTING LOGIC ---
        
        # 0. APP LAUNCHING INTENT (Check first!)
        is_app_request, app_name = self.app_launcher.is_app_request(user_query)
        if is_app_request:
            print(f"🔀 Routing to: App Launcher -> {app_name}")
            return self.app_launcher.launch_app(app_name)
        
        # 1. SLACK OPERATIONS - Route to MCP Slack Server
        slack_keywords = ["slack", "slack message", "send to slack", "slack channel", "slack dm"]
        has_slack_intent = any(keyword in query for keyword in slack_keywords)
        
        if has_slack_intent:
            print("🔀 Routing to: MCP Slack Server")
            
            if not self.mcp_slack_server or not self.mcp_slack_server.is_connected():
                return "⚠️ Slack MCP Server not connected. Please set SLACK_TOKEN environment variable."
            
            result = self.mcp_client.execute(user_query)
            return self.mcp_client.format_result_for_user(result)
        
        # 2. JIRA OPERATIONS - Route to MCP Jira Server
        jira_keywords = ["jira", "jira issue", "jira ticket", "jira project", "jira search"]
        has_jira_intent = any(keyword in query for keyword in jira_keywords)
        
        if has_jira_intent:
            print("🔀 Routing to: MCP Jira Server")
            
            if not self.mcp_jira_server or not self.mcp_jira_server.is_connected():
                return "⚠️ Jira MCP Server not connected. Please set JIRA_SERVER, JIRA_EMAIL, and JIRA_TOKEN environment variables."
            
            result = self.mcp_client.execute(user_query)
            return self.mcp_client.format_result_for_user(result)
        
        # 3. NOTION OPERATIONS - Route to MCP Notion Server
        notion_keywords = ["notion", "notion page", "notion database", "notion search"]
        has_notion_intent = any(keyword in query for keyword in notion_keywords)
        
        if has_notion_intent:
            print("🔀 Routing to: MCP Notion Server")
            
            if not self.mcp_notion_server or not self.mcp_notion_server.is_connected():
                return "⚠️ Notion MCP Server not connected. Please set NOTION_TOKEN environment variable."
            
            result = self.mcp_client.execute(user_query)
            return self.mcp_client.format_result_for_user(result)
        
        # 4. GITHUB OPERATIONS - Route to MCP GitHub Server
        github_intent_keywords = [
            "github", "repo", "pull request", "pr", "issue", "commit", 
            "branch", "fork", "star", "unstar", "push", "merge"
        ]
        
        has_github_intent = any(keyword in query for keyword in github_intent_keywords)
        
        if has_github_intent:
            print("🔀 Routing to: MCP GitHub Server")
            
            if not self.mcp_github_server.is_connected():
                return "⚠️ GitHub MCP Server not connected. Please set GITHUB_TOKEN environment variable."
            
            result = self.mcp_client.execute(user_query)
            return self.mcp_client.format_result_for_user(result)

        # 5. FALLBACK -> STANDARD RAG
        else:
            return None
    
    def get_mcp_status(self):
        """Get MCP servers status."""
        github_status = self.mcp_github_server.get_status() if self.mcp_github_server else {"status": "not initialized"}
        
        notion_status = {}
        if self.mcp_notion_server:
            try:
                notion_status = self.mcp_notion_server.get_status()
            except:
                notion_status = {"status": "error"}
        else:
            notion_status = {"status": "not initialized"}
        
        jira_status = {}
        if self.mcp_jira_server:
            try:
                jira_status = self.mcp_jira_server.get_status()
            except:
                jira_status = {"status": "error"}
        else:
            jira_status = {"status": "not initialized"}
        
        slack_status = {}
        if self.mcp_slack_server:
            try:
                slack_status = self.mcp_slack_server.get_status()
            except:
                slack_status = {"status": "error"}
        else:
            slack_status = {"status": "not initialized"}
        
        return {
            "github": github_status,
            "notion": notion_status,
            "jira": jira_status,
            "slack": slack_status
        }
