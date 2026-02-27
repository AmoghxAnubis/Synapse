"""
MCP (Model Context Protocol) Client
====================================
This client provides an interface to communicate with MCP servers.
It handles JSON-RPC based communication and natural language command parsing.
"""

import json
import re
from typing import Dict, Any, Optional


class MCPClient:
    """
    MCP Client for communicating with MCP servers.
    Provides natural language interface for GitHub operations.
    """
    
    def __init__(self, server=None):
        """
        Initialize MCP Client.
        
        Args:
            server: MCP Server instance to communicate with
        """
        self.server = server
    
    def set_server(self, server):
        """Set the MCP server instance."""
        self.server = server
    
    def parse_natural_command(self, user_input: str) -> Dict[str, Any]:
        """
        Parse natural language command into MCP operation.
        
        Args:
            user_input: Natural language input from user
            
        Returns:
            dict: Parsed command with operation and parameters
        """
        user_input = user_input.lower().strip()
        
        # ==================== REPOSITORY COMMANDS ====================
        
        # Create repository patterns
        if re.search(r'create.*new.*repo|make.*new.*repo|start.*new.*repo|new.*repository', user_input):
            name_match = re.search(r'(?:called|named|repo|name\s+is)\s+["\']?(\w[\w-]*)["\']?', user_input)
            name = name_match.group(1) if name_match else None
            
            desc_match = re.search(r'(?:desc(?:ribe)?|description)\s+["\']([^"\']+)["\']', user_input)
            description = desc_match.group(1) if desc_match else ""
            
            private = "private" in user_input
            
            if name:
                return {"operation": "create_repo", "name": name, "description": description, "private": private}
        
        # Delete repository patterns
        if re.search(r'delete.*repo|remove.*repo', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            if repo_match:
                return {"operation": "delete_repo", "repo": repo_match.group(1)}
        
        # List repositories
        if re.search(r'list.*repo|show.*repo|my repos', user_input):
            return {"operation": "list_repos"}
        
        # Fork repository
        if re.search(r'fork.*repo', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            if repo_match:
                return {"operation": "fork_repo", "repo": repo_match.group(1)}
        
        # Star repository
        if re.search(r'star.*repo', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            if repo_match:
                return {"operation": "star_repo", "repo": repo_match.group(1)}
        
        # Unstar repository
        if re.search(r'unstar.*repo', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            if repo_match:
                return {"operation": "unstar_repo", "repo": repo_match.group(1)}
        
        # ==================== COMMIT COMMANDS ====================
        
        # Push commit patterns
        if re.search(r'push.*commit|commit.*file|add.*file|save.*file', user_input):
            # Extract repo
            repo_match = re.search(r'(?:to|in|on)\s+(?:repo\s+)?["\']?([\w/-]+)["\']?', user_input)
            repo = repo_match.group(1) if repo_match else None
            
            # Extract file path
            file_match = re.search(r'(?:file\s+)?([\w/.-]+\.[\w]+)', user_input)
            file_path = file_match.group(1) if file_match else None
            
            # Extract commit message
            msg_match = re.search(r'(?:message|msg|with\s+commit)\s+["\']([^"\']+)["\']', user_input)
            if not msg_match:
                msg_match = re.search(r'(?:message|msg)\s+(?:is\s+)?(.+?)(?:\s+to|\s+in|$)', user_input)
            message = msg_match.group(1).strip() if msg_match else "Update via Synapse"
            
            # Extract branch
            branch_match = re.search(r'(?:branch)\s+["\']?(\w+)["\']?', user_input)
            branch = branch_match.group(1) if branch_match else "main"
            
            # Extract content (look for text in quotes or after "with content")
            content_match = re.search(r'content\s+["\']([^"\']+)["\']', user_input)
            content = content_match.group(1) if content_match else "# New file\n\nCreated via Synapse AI"
            
            if repo and file_path:
                return {
                    "operation": "push_commit",
                    "repo": repo,
                    "branch": branch,
                    "message": message,
                    "file_path": file_path,
                    "content": content
                }
        
        # Get commit history
        if re.search(r'commit.*history|show.*commits|list.*commits', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            if repo_match:
                return {"operation": "get_commits", "repo": repo_match.group(1)}
        
        # ==================== PULL REQUEST COMMANDS ====================
        
        # Create pull request
        if re.search(r'create.*pr|make.*pull.*request|new.*pr|open.*pr', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            title_match = re.search(r'(?:title|name)\s+["\']([^"\']+)["\']', user_input)
            body_match = re.search(r'(?:description|body)\s+["\']([^"\']+)["\']', user_input)
            head_match = re.search(r'(?:from|branch)\s+["\']?(\w+)["\']?', user_input)
            base_match = re.search(r'(?:to|base)\s+["\']?(\w+)["\']?', user_input)
            
            if repo_match and title_match:
                return {
                    "operation": "create_pr",
                    "repo": repo_match.group(1),
                    "title": title_match.group(1),
                    "body": body_match.group(1) if body_match else "",
                    "head": head_match.group(1) if head_match else "main",
                    "base": base_match.group(1) if base_match else "main"
                }
        
        # Merge pull request
        if re.search(r'merge.*pr|merge.*pull', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            pr_match = re.search(r'(?:pr|pull.*request)\s+#?(\d+)', user_input)
            
            if repo_match and pr_match:
                return {
                    "operation": "merge_pr",
                    "repo": repo_match.group(1),
                    "pr_number": int(pr_match.group(1))
                }
        
        # Close pull request
        if re.search(r'close.*pr|close.*pull', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            pr_match = re.search(r'(?:pr|pull.*request)\s+#?(\d+)', user_input)
            
            if repo_match and pr_match:
                return {
                    "operation": "close_pr",
                    "repo": repo_match.group(1),
                    "pr_number": int(pr_match.group(1))
                }
        
        # List pull requests
        if re.search(r'list.*pr|show.*pr|open.*prs|pull.*requests', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            state = "closed" if "closed" in user_input else "open"
            
            if repo_match:
                return {"operation": "list_prs", "repo": repo_match.group(1), "state": state}
        
        # ==================== ISSUE COMMANDS ====================
        
        # Create issue
        if re.search(r'create.*issue|new.*issue|open.*issue|file.*issue', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            title_match = re.search(r'(?:title|name)\s+["\']([^"\']+)["\']', user_input)
            body_match = re.search(r'(?:description|body)\s+["\']([^"\']+)["\']', user_input)
            
            if repo_match and title_match:
                return {
                    "operation": "create_issue",
                    "repo": repo_match.group(1),
                    "title": title_match.group(1),
                    "body": body_match.group(1) if body_match else ""
                }
        
        # Close issue
        if re.search(r'close.*issue|resolve.*issue', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            issue_match = re.search(r'issue\s+#?(\d+)', user_input)
            
            if repo_match and issue_match:
                return {
                    "operation": "close_issue",
                    "repo": repo_match.group(1),
                    "issue_number": int(issue_match.group(1))
                }
        
        # Reopen issue
        if re.search(r'reopen.*issue', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            issue_match = re.search(r'issue\s+#?(\d+)', user_input)
            
            if repo_match and issue_match:
                return {
                    "operation": "open_issue",
                    "repo": repo_match.group(1),
                    "issue_number": int(issue_match.group(1))
                }
        
        # Comment on issue
        if re.search(r'comment.*issue|reply.*issue', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            issue_match = re.search(r'issue\s+#?(\d+)', user_input)
            comment_match = re.search(r'comment\s+["\']([^"\']+)["\']', user_input)
            
            if repo_match and issue_match and comment_match:
                return {
                    "operation": "comment_issue",
                    "repo": repo_match.group(1),
                    "issue_number": int(issue_match.group(1)),
                    "comment": comment_match.group(1)
                }
        
        # List issues
        if re.search(r'list.*issue|show.*issue|open.*issues', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            state = "closed" if "closed" in user_input else "open"
            
            if repo_match:
                return {"operation": "list_issues", "repo": repo_match.group(1), "state": state}
        
        # ==================== FILE COMMANDS ====================
        
        # Read file
        if re.search(r'read.*file|show.*file|get.*file|view.*file', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            file_match = re.search(r'file\s+["\']?([\w/.-]+)["\']?', user_input)
            branch_match = re.search(r'(?:branch)\s+["\']?(\w+)["\']?', user_input)
            
            if repo_match and file_match:
                return {
                    "operation": "read_file",
                    "repo": repo_match.group(1),
                    "file_path": file_match.group(1),
                    "branch": branch_match.group(1) if branch_match else "main"
                }
        
        # ==================== BRANCH COMMANDS ====================
        
        # Create branch
        if re.search(r'create.*branch|new.*branch|make.*branch', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            branch_match = re.search(r'(?:branch|called)\s+["\']?(\w+)["\']?', user_input)
            source_match = re.search(r'(?:from|source)\s+["\']?(\w+)["\']?', user_input)
            
            if repo_match and branch_match:
                return {
                    "operation": "create_branch",
                    "repo": repo_match.group(1),
                    "branch_name": branch_match.group(1),
                    "source_branch": source_match.group(1) if source_match else "main"
                }
        
        # Delete branch
        if re.search(r'delete.*branch|remove.*branch', user_input):
            repo_match = re.search(r'(?:repo|repository)\s+["\']?([\w/-]+)["\']?', user_input)
            branch_match = re.search(r'branch\s+["\']?(\w+)["\']?', user_input)
            
            if repo_match and branch_match:
                return {
                    "operation": "delete_branch",
                    "repo": repo_match.group(1),
                    "branch_name": branch_match.group(1)
                }
        
        # ==================== STATUS COMMANDS ====================
        
        # GitHub status
        if re.search(r'github.*status|check.*github|github.*connected', user_input):
            return {"operation": "status"}
        
        # Unknown command
        return {"operation": None, "error": "Could not understand the command. Please try again with more details."}
    
    def execute(self, user_input: str) -> Dict[str, Any]:
        """
        Execute a natural language command.
        
        Args:
            user_input: Natural language input from user
            
        Returns:
            dict: Result of the operation
        """
        if not self.server:
            return {"success": False, "error": "MCP server not configured"}
        
        # Check if server is connected
        if not self.server.is_connected():
            return {
                "success": False, 
                "error": "GitHub not connected. Please set GITHUB_TOKEN environment variable."
            }
        
        # Parse the natural language command
        command = self.parse_natural_command(user_input)
        
        if not command.get("operation"):
            return {
                "success": False,
                "error": command.get("error", "Could not understand command. Try being more specific.")
            }
        
        # Execute the command on the server
        try:
            result = self.server.execute_command(command)
            return result
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def format_result_for_user(self, result: Dict[str, Any]) -> str:
        """
        Format the result for user-friendly display.
        
        Args:
            result: Result from MCP operation
            
        Returns:
            str: Formatted message for user
        """
        if not result.get("success", False):
            return f"❌ {result.get('error', 'Unknown error')}"
        
        # Format success message based on operation type
        message = result.get("message", "Operation completed!")
        
        # Add additional details if available
        details = []
        if "repo_url" in result:
            details.append(f"📁 URL: {result['repo_url']}")
        if "pr_url" in result:
            details.append(f"🔗 PR: {result['pr_url']}")
        if "issue_url" in result:
            details.append(f"🔗 Issue: {result['issue_url']}")
        if "commit_url" in result:
            details.append(f"🔗 Commit: {result['commit_url']}")
        if "fork_url" in result:
            details.append(f"🍴 Fork: {result['fork_url']}")
        
        # Add lists if available
        if "repositories" in result:
            repos = result["repositories"]
            message = f"📋 Found {len(repos)} repositories:"
            for repo in repos[:5]:
                message += f"\n  • {repo['name']} - ⭐ {repo.get('stars', 0)}"
        
        elif "pull_requests" in result:
            prs = result["pull_requests"]
            message = f"📋 Found {len(prs)} pull requests:"
            for pr in prs[:5]:
                message += f"\n  • #{pr['number']}: {pr['title']}"
        
        elif "issues" in result:
            issues = result["issues"]
            message = f"📋 Found {len(issues)} issues:"
            for issue in issues[:5]:
                message += f"\n  • #{issue['number']}: {issue['title']}"
        
        elif "commits" in result:
            commits = result["commits"]
            message = f"📋 Recent commits:"
            for commit in commits[:5]:
                message += f"\n  • {commit['sha']}: {commit['message'][:50]}..."
        
        if details:
            message += "\n" + "\n".join(details)
        
        return message


# Standalone function to create client instance
def create_mcp_client(server=None) -> MCPClient:
    """Create and return an MCP Client instance."""
    return MCPClient(server)


if __name__ == "__main__":
    # Quick test of parsing
    from mcp_github_server import MCPGitHubServer
    
    server = MCPGitHubServer()
    client = MCPClient(server)
    
    # Test commands
    test_commands = [
        "create a new repo called my-test-repo",
        "list my repositories",
        "push a commit to repo owner/test with message 'Update file' file test.txt branch main",
        "create a PR for repo owner/test with title 'My PR'",
        "close issue #5 in repo owner/test",
    ]
    
    for cmd in test_commands:
        print(f"\n--- Command: {cmd}")
        parsed = client.parse_natural_command(cmd)
        print(f"Parsed: {json.dumps(parsed, indent=2)}")
