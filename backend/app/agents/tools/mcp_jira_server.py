"""
MCP (Model Context Protocol) Jira Server
========================================
This server provides comprehensive Jira API operations through MCP protocol.
Supports:
- Projects: list, get
- Issues: create, get, update, delete, list, assign
- Search: search issues (JQL)
"""

import os
import json
from typing import Dict, Any, Optional, List

try:
    from jira import JIRA
    JIRA_AVAILABLE = True
except ImportError:
    JIRA_AVAILABLE = False


class MCPJiraServer:
    """
    MCP Server for Jira operations.
    Implements the Model Context Protocol for Jira API interactions.
    """
    
    def __init__(self, server: str = None, email: str = None, api_token: str = None):
        """
        Initialize MCP Jira Server.
        
        Args:
            server: Jira server URL. Falls back to JIRA_SERVER env var.
            email: Jira email. Falls back to JIRA_EMAIL env var.
            api_token: Jira API token. Falls back to JIRA_TOKEN env var.
        """
        self.server = server or os.getenv("JIRA_SERVER")
        self.email = email or os.getenv("JIRA_EMAIL")
        self.api_token = api_token or os.getenv("JIRA_TOKEN")
        self.client = None
        self._connected = False
        
        if self.server and self.email and self.api_token:
            self._connect()
    
    def _connect(self):
        """Establish connection to Jira API."""
        if not JIRA_AVAILABLE:
            print("⚠️ jira package not installed. Install with: pip install jira")
            self._connected = False
            return False
        
        if not self.server or not self.email or not self.api_token:
            print("⚠️ Jira credentials missing. Set JIRA_SERVER, JIRA_EMAIL, and JIRA_TOKEN.")
            self._connected = False
            return False
            
        try:
            self.client = JIRA(
                server=self.server,
                basic_auth=(self.email, self.api_token)
            )
            self._connected = True
            print("✅ MCP Jira Server connected successfully!")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to Jira: {e}")
            self._connected = False
            return False
    
    def is_connected(self) -> bool:
        """Check if server is connected to Jira."""
        return self._connected and self.client is not None
    
    def get_status(self) -> dict:
        """Get server connection status."""
        if not JIRA_AVAILABLE:
            return {
                "status": "error",
                "message": "jira package not installed. Run: pip install jira"
            }
        
        if not self.server or not self.email or not self.api_token:
            return {
                "status": "disconnected",
                "message": "Jira credentials missing. Please set JIRA_SERVER, JIRA_EMAIL, and JIRA_TOKEN environment variables."
            }
        
        if not self.is_connected():
            return {
                "status": "disconnected",
                "message": "Failed to connect to Jira server."
            }
        
        return {
            "status": "connected",
            "message": f"Connected to {self.server}"
        }
    
    # ==================== PROJECT OPERATIONS ====================
    
    def list_projects(self) -> dict:
        """List all accessible projects."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Jira"}
        
        try:
            projects = self.client.projects()
            project_list = []
            for proj in projects:
                project_list.append({
                    "id": proj.id,
                    "key": proj.key,
                    "name": proj.name
                })
            
            return {
                "success": True,
                "projects": project_list,
                "count": len(project_list)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_project(self, project_key: str) -> dict:
        """Get project details."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Jira"}
        
        try:
            project = self.client.project(project_key)
            return {
                "success": True,
                "id": project.id,
                "key": project.key,
                "name": project.name,
                "description": getattr(project, 'description', '')
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ==================== ISSUE OPERATIONS ====================
    
    def create_issue(self, project_key: str, summary: str, description: str = "",
                    issue_type: str = "Task", priority: str = None) -> dict:
        """
        Create a new Jira issue.
        
        Args:
            project_key: Project key (e.g., 'PROJ')
            summary: Issue summary/title
            description: Issue description
            issue_type: Issue type (Task, Bug, Story, etc.)
            priority: Priority (Low, Medium, High, Highest)
            
        Returns:
            dict: Issue creation result
        """
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Jira"}
        
        try:
            issue_dict = {
                'project': {'key': project_key},
                'summary': summary,
                'issuetype': {'name': issue_type},
            }
            
            if description:
                issue_dict['description'] = {
                    'type': 'doc',
                    'version': 1,
                    'content': [{
                        'type': 'paragraph',
                        'content': [{'type': 'text', 'text': description}]
                    }]
                }
            
            if priority:
                issue_dict['priority'] = {'name': priority}
            
            issue = self.client.create_issue(fields=issue_dict)
            
            return {
                "success": True,
                "message": f"✅ Issue '{summary}' created!",
                "issue_key": issue.key,
                "issue_id": issue.id,
                "issue_url": f"{self.server}/browse/{issue.key}"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_issue(self, issue_key: str) -> dict:
        """Get issue details."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Jira"}
        
        try:
            issue = self.client.issue(issue_key)
            
            return {
                "success": True,
                "key": issue.key,
                "summary": issue.fields.summary,
                "description": getattr(issue.fields, 'description', ''),
                "status": issue.fields.status.name,
                "issue_type": issue.fields.issuetype.name,
                "priority": getattr(issue.fields.priority, 'name', 'None'),
                "assignee": getattr(issue.fields.assignee, 'displayName', 'Unassigned'),
                "created": str(issue.fields.created),
                "updated": str(issue.fields.updated)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def update_issue(self, issue_key: str, summary: str = None, description: str = None,
                    status: str = None) -> dict:
        """Update an issue."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Jira"}
        
        try:
            issue = self.client.issue(issue_key)
            update_dict = {}
            
            if summary:
                update_dict['summary'] = summary
            
            if description:
                update_dict['description'] = {
                    'type': 'doc',
                    'version': 1,
                    'content': [{
                        'type': 'paragraph',
                        'content': [{'type': 'text', 'text': description}]
                    }]
                }
            
            if status:
                # Find transition to the desired status
                transitions = self.client.transitions(issue)
                for t in transitions:
                    if t['name'].lower() == status.lower():
                        self.client.transition_issue(issue, t['id'])
                        break
            
            if update_dict:
                self.client.edit_issue(issue, fields=update_dict)
            
            return {
                "success": True,
                "message": f"✅ Issue {issue_key} updated!"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def delete_issue(self, issue_key: str) -> dict:
        """Delete an issue."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Jira"}
        
        try:
            self.client.delete_issue(issue_key)
            return {
                "success": True,
                "message": f"✅ Issue {issue_key} deleted!"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def list_issues(self, project_key: str = None, status: str = None, 
                   max_results: int = 10) -> dict:
        """List issues."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Jira"}
        
        try:
            jql = " ORDER BY created DESC"
            
            if project_key:
                jql = f"project = {project_key}" + jql
            if status:
                separator = " AND " if project_key else ""
                jql = f"{jql}{separator}status = '{status}'"
            
            issues = self.client.search_issues(jql, maxResults=max_results)
            
            issue_list = []
            for issue in issues:
                issue_list.append({
                    "key": issue.key,
                    "summary": issue.fields.summary,
                    "status": issue.fields.status.name,
                    "issue_type": issue.fields.issuetype.name,
                    "priority": getattr(issue.fields.priority, 'name', 'None')
                })
            
            return {
                "success": True,
                "issues": issue_list,
                "count": len(issue_list)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def assign_issue(self, issue_key: str, assignee: str) -> dict:
        """Assign an issue to a user."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Jira"}
        
        try:
            self.client.assign_issue(issue_key, assignee)
            return {
                "success": True,
                "message": f"✅ Issue {issue_key} assigned to {assignee}!"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def add_comment(self, issue_key: str, comment: str) -> dict:
        """Add a comment to an issue."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Jira"}
        
        try:
            self.client.add_comment(issue_key, comment)
            return {
                "success": True,
                "message": f"✅ Comment added to {issue_key}!"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ==================== SEARCH ====================
    
    def search_issues(self, jql: str = None, query: str = None, max_results: int = 10) -> dict:
        """Search issues using JQL or natural language."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Jira"}
        
        try:
            # Convert natural language to JQL if query provided
            if query and not jql:
                jql = f"text ~ '{query}' ORDER BY created DESC"
            
            issues = self.client.search_issues(jql, maxResults=max_results)
            
            issue_list = []
            for issue in issues:
                issue_list.append({
                    "key": issue.key,
                    "summary": issue.fields.summary,
                    "status": issue.fields.status.name,
                    "issue_type": issue.fields.issuetype.name,
                    "priority": getattr(issue.fields.priority, 'name', 'None')
                })
            
            return {
                "success": True,
                "issues": issue_list,
                "count": len(issue_list)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ==================== MCP PROTOCOL HANDLER ====================
    
    def execute_command(self, command: dict) -> dict:
        """
        Execute a command through MCP protocol.
        
        Args:
            command: dict with 'operation' and parameters
            
        Returns:
            dict: Result of the operation
        """
        if not self.is_connected():
            if not JIRA_AVAILABLE:
                return {"success": False, "error": "jira package not installed. Run: pip install jira"}
            return {"success": False, "error": "Not connected to Jira. Please configure JIRA credentials."}
        
        operation = command.get("operation", "").lower()
        
        # Map operations to methods
        operations_map = {
            # Projects
            "list_projects": lambda: self.list_projects(),
            "get_project": lambda: self.get_project(command.get("project_key")),
            
            # Issues
            "create_issue": lambda: self.create_issue(
                command.get("project_key", "PROJ"),
                command.get("summary", "New Issue"),
                command.get("description", ""),
                command.get("issue_type", "Task"),
                command.get("priority")
            ),
            "get_issue": lambda: self.get_issue(command.get("issue_key")),
            "update_issue": lambda: self.update_issue(
                command.get("issue_key"),
                command.get("summary"),
                command.get("description"),
                command.get("status")
            ),
            "delete_issue": lambda: self.delete_issue(command.get("issue_key")),
            "list_issues": lambda: self.list_issues(
                command.get("project_key"),
                command.get("status"),
                command.get("max_results", 10)
            ),
            "assign_issue": lambda: self.assign_issue(
                command.get("issue_key"),
                command.get("assignee")
            ),
            "add_comment": lambda: self.add_comment(
                command.get("issue_key"),
                command.get("comment")
            ),
            
            # Search
            "search_issues": lambda: self.search_issues(
                command.get("jql"),
                command.get("query"),
                command.get("max_results", 10)
            ),
            
            # Status
            "status": lambda: self.get_status()
        }
        
        if operation in operations_map:
            try:
                return operations_map[operation]()
            except Exception as e:
                return {"success": False, "error": f"Operation failed: {str(e)}"}
        else:
            return {
                "success": False,
                "error": f"Unknown operation: {operation}. Available: {', '.join(operations_map.keys())}"
            }
    
    def get_available_operations(self) -> list:
        """Return list of available operations."""
        return [
            # Projects
            "list_projects", "get_project",
            # Issues
            "create_issue", "get_issue", "update_issue", "delete_issue", 
            "list_issues", "assign_issue", "add_comment",
            # Search
            "search_issues",
            # Status
            "status"
        ]


def create_mcp_jira_server(server: str = None, email: str = None, 
                           api_token: str = None) -> MCPJiraServer:
    """Create and return an MCP Jira Server instance."""
    return MCPJiraServer(server, email, api_token)


if __name__ == "__main__":
    # Quick test
    server = MCPJiraServer()
    print(json.dumps(server.get_status(), indent=2))
    print("Available operations:", server.get_available_operations())
