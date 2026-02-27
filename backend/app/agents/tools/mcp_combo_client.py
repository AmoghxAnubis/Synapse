"""
Combined MCP Client for GitHub, Notion, Jira, and Slack
======================================================
Supports GitHub, Notion, Jira, and Slack operations through natural language commands.
"""

import json
import re
from typing import Dict, Any, Optional


class MCPComboClient:
    """
    Combined MCP Client for GitHub, Notion, Jira, and Slack.
    Routes commands to appropriate server based on context.
    """
    
    def __init__(self, github_server=None, notion_server=None, jira_server=None, slack_server=None):
        self.github_server = github_server
        self.notion_server = notion_server
        self.jira_server = jira_server
        self.slack_server = slack_server
    
    def set_servers(self, github_server=None, notion_server=None, jira_server=None, slack_server=None):
        self.github_server = github_server
        self.notion_server = notion_server
        self.jira_server = jira_server
        self.slack_server = slack_server
    
    def parse_natural_command(self, user_input: str) -> Dict[str, Any]:
        """Parse natural language command and determine target service."""
        original_input = user_input
        user_input = user_input.lower().strip()
        
        # ==================== SLACK COMMANDS ====================
        
        # Send message to Slack
        if re.search(r'slack.*message|send.*slack|message.*slack', user_input):
            channel_match = re.search(r'(?:to|channel|#)\s*["\']?(\w+)["\']?', original_input)
            text_match = re.search(r'(?:message|text|content)\s+["\']([^"\']+)["\']', original_input)
            
            if channel_match and text_match:
                return {
                    "service": "slack",
                    "operation": "send_message",
                    "channel": channel_match.group(1),
                    "text": text_match.group(1)
                }
        
        # List Slack channels
        if re.search(r'slack.*channels|list.*slack.*channels|show.*slack', user_input):
            return {"service": "slack", "operation": "list_channels"}
        
        # Create Slack channel
        if re.search(r'create.*slack.*channel|new.*slack.*channel', user_input):
            name_match = re.search(r'(?:called|named|name)\s+["\']?(\w+)["\']?', original_input)
            if name_match:
                return {
                    "service": "slack",
                    "operation": "create_channel",
                    "name": name_match.group(1)
                }
        
        # Slack status
        if re.search(r'slack.*status|check.*slack|slack.*connected', user_input):
            return {"service": "slack", "operation": "status"}
        
        # ==================== JIRA COMMANDS ====================
        
        # Create Jira issue
        if re.search(r'jira.*issue|create.*jira.*ticket|new.*jira.*issue', user_input):
            project_match = re.search(r'(?:project|proj)\s+["\']?(\w+)["\']?', original_input)
            title_match = re.search(r'(?:called|titled|named|title)\s+["\']?([^"\']+)["\']?', original_input)
            desc_match = re.search(r'(?:description|desc)\s+["\']([^"\']+)["\']', original_input)
            
            return {
                "service": "jira",
                "operation": "create_issue",
                "project_key": project_match.group(1) if project_match else "PROJ",
                "summary": title_match.group(1).strip() if title_match else "New Issue",
                "description": desc_match.group(1) if desc_match else ""
            }
        
        # List Jira issues
        if re.search(r'jira.*issues|list.*jira|show.*jira.*issues', user_input):
            project_match = re.search(r'(?:project|proj)\s+["\']?(\w+)["\']?', original_input)
            return {
                "service": "jira",
                "operation": "list_issues",
                "project_key": project_match.group(1) if project_match else None
            }
        
        # Jira search
        if re.search(r'jira.*search|find.*jira|search.*jira', user_input):
            query_match = re.search(r'for\s+["\']?([^"\']+)["\']?', original_input)
            query = query_match.group(1) if query_match else ""
            return {"service": "jira", "operation": "search_issues", "query": query}
        
        # Jira projects
        if re.search(r'jira.*projects|list.*jira.*projects', user_input):
            return {"service": "jira", "operation": "list_projects"}
        
        # Jira status
        if re.search(r'jira.*status|check.*jira|jira.*connected', user_input):
            return {"service": "jira", "operation": "status"}
        
        # ==================== NOTION COMMANDS ====================
        
        # Notion page commands
        if re.search(r'notion.*page|create.*page.*notion|new.*page.*notion', user_input):
            title_match = re.search(r'(?:called|named|title)\s+["\']?([^"\']+)["\']?', original_input)
            content_match = re.search(r'content\s+["\']([^"\']+)["\']', original_input)
            
            if title_match:
                return {
                    "service": "notion",
                    "operation": "create_page",
                    "title": title_match.group(1).strip(),
                    "content": content_match.group(1) if content_match else ""
                }
        
        # Notion search
        if re.search(r'notion.*search|find.*notion|search.*notion', user_input):
            query_match = re.search(r'for\s+["\']?([^"\']+)["\']?', original_input)
            query = query_match.group(1) if query_match else ""
            return {"service": "notion", "operation": "search", "query": query}
        
        # Notion list pages
        if re.search(r'notion.*pages|list.*notion.*pages|show.*notion', user_input):
            return {"service": "notion", "operation": "list_pages"}
        
        # Notion database
        if re.search(r'notion.*database|create.*database.*notion', user_input):
            title_match = re.search(r'(?:called|named|title)\s+["\']?([^"\']+)["\']?', original_input)
            parent_match = re.search(r'parent.*page\s+["\']?([\w-]+)["\']?', original_input)
            
            if title_match:
                return {
                    "service": "notion",
                    "operation": "create_database",
                    "title": title_match.group(1).strip(),
                    "parent_page_id": parent_match.group(1) if parent_match else None
                }
        
        # Notion add content
        if re.search(r'add.*content.*notion|append.*notion|add.*to.*notion', user_input):
            page_match = re.search(r'page\s+["\']?([\w-]+)["\']?', original_input)
            content_match = re.search(r'content\s+["\']([^"\']+)["\']', original_input)
            
            if page_match and content_match:
                return {
                    "service": "notion",
                    "operation": "append_blocks",
                    "page_id": page_match.group(1),
                    "content": content_match.group(1)
                }
        
        # Notion status
        if re.search(r'notion.*status|check.*notion|notion.*connected', user_input):
            return {"service": "notion", "operation": "status"}
        
        # ==================== GITHUB COMMANDS ====================
        
        # List issues - Check BEFORE list repo (more specific)
        if re.search(r'list.*issue|show.*issue', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', original_input)
            if repo_match:
                return {"service": "github", "operation": "list_issues", "repo": repo_match.group(1), "state": "open"}
        
        # List PRs - Check BEFORE list repo
        if re.search(r'list.*pr|show.*pr|open.*prs', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', original_input)
            if repo_match:
                return {"service": "github", "operation": "list_prs", "repo": repo_match.group(1), "state": "open"}
        
        # Create repository
        if re.search(r'create.*new.*repo|make.*new.*repo|new.*repository', user_input):
            name_match = re.search(r'(?:called|named|repo|name\s+is)\s+["\']?(\w[\w-]*)["\']?', original_input)
            if name_match:
                return {"service": "github", "operation": "create_repo", "name": name_match.group(1)}
        
        # List repositories
        if re.search(r'list.*repo|show.*repo|my repos|github.*repos', user_input):
            return {"service": "github", "operation": "list_repos"}
        
        # Fork repository
        if re.search(r'fork.*repo', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', original_input)
            if repo_match:
                return {"service": "github", "operation": "fork_repo", "repo": repo_match.group(1)}
        
        # Star repository
        if re.search(r'star.*repo', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', original_input)
            if repo_match:
                return {"service": "github", "operation": "star_repo", "repo": repo_match.group(1)}
        
        # Push commit
        if re.search(r'push.*commit|commit.*file|add.*file', user_input):
            repo_match = re.search(r'(?:to|in|on)\s+(?:repo\s+)?["\']?([\w/-]+)["\']?', original_input)
            file_match = re.search(r'(?:file\s+)?([\w/.-]+\.[\w]+)', original_input)
            msg_match = re.search(r'(?:message|msg)\s+["\']([^"\']+)["\']', original_input)
            content_match = re.search(r'content\s+["\']([^"\']+)["\']', original_input)
            
            if repo_match and file_match:
                return {
                    "service": "github",
                    "operation": "push_commit",
                    "repo": repo_match.group(1),
                    "file_path": file_match.group(1),
                    "message": msg_match.group(1) if msg_match else "Update via Synapse",
                    "content": content_match.group(1) if content_match else "# New file\n\nCreated via Synapse AI",
                    "branch": "main"
                }
        
        # Create PR
        if re.search(r'create.*pr|make.*pull.*request|new.*pr', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', original_input)
            title_match = re.search(r'(?:title|name)\s+["\']([^"\']+)["\']', original_input)
            
            if repo_match and title_match:
                return {
                    "service": "github",
                    "operation": "create_pr",
                    "repo": repo_match.group(1),
                    "title": title_match.group(1),
                    "body": "",
                    "head": "main",
                    "base": "main"
                }
        
        # Merge PR
        if re.search(r'merge.*pr|merge.*pull', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', original_input)
            pr_match = re.search(r'(?:pr|pull.*request)\s+#?(\d+)', original_input)
            
            if repo_match and pr_match:
                return {
                    "service": "github",
                    "operation": "merge_pr",
                    "repo": repo_match.group(1),
                    "pr_number": int(pr_match.group(1))
                }
        
        # Create issue
        if re.search(r'create.*issue|new.*issue|file.*issue', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', original_input)
            title_match = re.search(r'(?:title|name)\s+["\']([^"\']+)["\']', original_input)
            
            if repo_match and title_match:
                return {
                    "service": "github",
                    "operation": "create_issue",
                    "repo": repo_match.group(1),
                    "title": title_match.group(1),
                    "body": ""
                }
        
        # Close issue
        if re.search(r'close.*issue|resolve.*issue', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', original_input)
            issue_match = re.search(r'issue\s+#?(\d+)', original_input)
            
            if repo_match and issue_match:
                return {
                    "service": "github",
                    "operation": "close_issue",
                    "repo": repo_match.group(1),
                    "issue_number": int(issue_match.group(1))
                }
        
        # GitHub status
        if re.search(r'github.*status|check.*github|github.*connected', user_input):
            return {"service": "github", "operation": "status"}
        
        # Unknown command
        return {"operation": None, "error": "Could not understand the command."}
    
    def execute(self, user_input: str) -> Dict[str, Any]:
        """Execute the parsed command on appropriate server."""
        command = self.parse_natural_command(user_input)
        
        if not command.get("operation"):
            return {"success": False, "error": command.get("error", "Could not understand command.")}
        
        service = command.get("service")
        
        if service == "github":
            if not self.github_server or not self.github_server.is_connected():
                return {"success": False, "error": "GitHub not connected. Set GITHUB_TOKEN."}
            try:
                return self.github_server.execute_command(command)
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        elif service == "notion":
            if not self.notion_server or not self.notion_server.is_connected():
                return {"success": False, "error": "Notion not connected. Set NOTION_TOKEN."}
            try:
                return self.notion_server.execute_command(command)
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        elif service == "jira":
            if not self.jira_server or not self.jira_server.is_connected():
                return {"success": False, "error": "Jira not connected. Set JIRA_SERVER, JIRA_EMAIL, JIRA_TOKEN."}
            try:
                return self.jira_server.execute_command(command)
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        elif service == "slack":
            if not self.slack_server or not self.slack_server.is_connected():
                return {"success": False, "error": "Slack not connected. Set SLACK_TOKEN."}
            try:
                return self.slack_server.execute_command(command)
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        return {"success": False, "error": "No service available for this command."}
    
    def format_result_for_user(self, result: Dict[str, Any]) -> str:
        """Format result for user display."""
        if not result.get("success", False):
            return f"❌ {result.get('error', 'Unknown error')}"
        
        message = result.get("message", "✅ Operation completed!")
        
        # Add URLs if available
        if "page_url" in result:
            message += f"\n📄 Page: {result['page_url']}"
        if "database_url" in result:
            message += f"\n🗃️ Database: {result['database_url']}"
        if "repo_url" in result:
            message += f"\n📁 Repo: {result['repo_url']}"
        if "pr_url" in result:
            message += f"\n🔗 PR: {result['pr_url']}"
        if "issue_url" in result:
            message += f"\n🎫 Issue: {result['issue_url']}"
        if "channel_id" in result:
            message += f"\n💬 Channel: {result['channel_id']}"
        
        # Add lists
        if "pages" in result:
            pages = result["pages"]
            message = f"📋 Found {len(pages)} pages in Notion:"
            for page in pages[:5]:
                message += f"\n  • {page.get('title', 'Untitled')}"
        
        if "repositories" in result:
            repos = result["repositories"]
            message = f"📋 Found {len(repos)} repositories:"
            for repo in repos[:5]:
                message += f"\n  • {repo['name']} - ⭐ {repo.get('stars', 0)}"
        
        if "pull_requests" in result:
            prs = result["pull_requests"]
            message = f"📋 Found {len(prs)} pull requests:"
            for pr in prs[:5]:
                message += f"\n  • #{pr['number']}: {pr['title']}"
        
        if "issues" in result:
            issues = result["issues"]
            message = f"📋 Found {len(issues)} issues:"
            for issue in issues[:5]:
                if 'key' in issue:
                    message += f"\n  • {issue['key']}: {issue.get('summary', issue.get('title', 'Untitled'))}"
                else:
                    message += f"\n  • #{issue['number']}: {issue['title']}"
        
        if "projects" in result:
            projects = result["projects"]
            message = f"📋 Found {len(projects)} Jira projects:"
            for proj in projects[:5]:
                message += f"\n  • {proj['key']}: {proj['name']}"
        
        if "channels" in result:
            channels = result["channels"]
            message = f"📋 Found {len(channels)} Slack channels:"
            for channel in channels[:5]:
                message += f"\n  • #{channel['name']}"
        
        if "results" in result:
            items = result["results"]
            message = f"🔍 Found {len(items)} results:"
            for item in items[:5]:
                title = item.get('title', item.get('name', 'Untitled'))
                message += f"\n  • {title}"
        
        return message


def create_mcp_combo_client(github_server=None, notion_server=None, jira_server=None, slack_server=None) -> MCPComboClient:
    return MCPComboClient(github_server, notion_server, jira_server, slack_server)
