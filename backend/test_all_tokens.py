import os
import sys
from dotenv import load_dotenv

# Add app directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/../")

from app.agents.tools.mcp_github_server import MCPGitHubServer
from app.agents.tools.mcp_notion_server import MCPNotionServer
from app.agents.tools.mcp_slack_server import MCPSlackServer
from app.agents.tools.mcp_jira_server import MCPJiraServer
from app.agents.tools.mcp_discord_server import MCPDiscordServer

def test_integrations():
    load_dotenv()
    print("Testing Individual Integrations...")
    
    # GitHub
    print("\n[GitHub]")
    gh = MCPGitHubServer()
    print(gh.get_status())
    
    # Notion
    print("\n[Notion]")
    nt = MCPNotionServer()
    print(nt.get_status())
    
    # Slack
    print("\n[Slack]")
    sl = MCPSlackServer()
    print(sl.get_status())
    
    # Jira
    print("\n[Jira]")
    jr = MCPJiraServer()
    print(jr.get_status())
    
    # Discord
    print("\n[Discord]")
    ds = MCPDiscordServer()
    print(ds.get_status())

if __name__ == "__main__":
    test_integrations()
