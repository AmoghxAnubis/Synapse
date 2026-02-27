"""
MCP (Model Context Protocol) GitHub Server
==========================================
This server provides comprehensive GitHub API operations through MCP protocol.
It can handle all GitHub operations including:
- Repository: create, delete, list, fork, star/unstar
- Commits: push new commits, get commit history
- Pull Requests: create, merge, close, list
- Issues: create, close, open, comment
- Files: read/write file contents
"""

import os
import json
import base64
import subprocess
from github import Github
from github.GithubException import GithubException


class MCPGitHubServer:
    """
    MCP Server for GitHub operations.
    Implements the Model Context Protocol for GitHub API interactions.
    """
    
    def __init__(self, token: str = None):
        """
        Initialize MCP GitHub Server.
        
        Args:
            token: GitHub Personal Access Token. Falls back to GITHUB_TOKEN env var.
        """
        self.token = token or os.getenv("GITHUB_TOKEN")
        self.client = None
        self.user = None
        self._connected = False
        
        if self.token:
            self._connect()
    
    def _connect(self):
        """Establish connection to GitHub API."""
        try:
            self.client = Github(self.token)
            self.user = self.client.get_user()
            self._connected = True
            print("✅ MCP GitHub Server connected successfully!")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to GitHub: {e}")
            self._connected = False
            return False
    
    def is_connected(self) -> bool:
        """Check if server is connected to GitHub."""
        return self._connected and self.client is not None
    
    def get_status(self) -> dict:
        """Get server connection status."""
        if not self.is_connected():
            return {
                "status": "disconnected",
                "message": "GitHub token missing. Please set GITHUB_TOKEN environment variable."
            }
        
        try:
            user_data = self.user.login
            return {
                "status": "connected",
                "user": user_data,
                "message": f"Connected as {user_data}"
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }
    
    # ==================== REPOSITORY OPERATIONS ====================
    
    def create_repository(self, name: str, description: str = "", 
                         private: bool = False, auto_init: bool = True) -> dict:
        """
        Create a new GitHub repository.
        
        Args:
            name: Repository name
            description: Repository description
            private: Whether repository should be private
            auto_init: Whether to initialize with README
            
        Returns:
            dict: Repository creation result
        """
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.user.create_repo(
                name=name,
                description=description,
                private=private,
                auto_init=auto_init
            )
            return {
                "success": True,
                "message": f"✅ Repository '{name}' created successfully!",
                "repo_url": repo.html_url,
                "repo_name": repo.full_name
            }
        except GithubException as e:
            return {"success": False, "error": f"Failed to create repository: {e.data.get('message', str(e))}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def delete_repository(self, repo_name: str) -> dict:
        """
        Delete a GitHub repository.
        
        Args:
            repo_name: Repository name (format: username/repo or just repo name)
            
        Returns:
            dict: Deletion result
        """
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            # Handle both "repo" and "owner/repo" formats
            if "/" not in repo_name:
                repo_name = f"{self.user.login}/{repo_name}"
            
            repo = self.client.get_repo(repo_name)
            repo.delete()
            return {
                "success": True,
                "message": f"✅ Repository '{repo_name}' deleted successfully!"
            }
        except GithubException as e:
            return {"success": False, "error": f"Failed to delete repository: {e.data.get('message', str(e))}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def list_repositories(self, sort: str = "updated", per_page: int = 10) -> dict:
        """
        List user's repositories.
        
        Args:
            sort: Sort by 'updated', 'created', 'pushed', 'full_name'
            per_page: Number of repos to return
            
        Returns:
            dict: List of repositories
        """
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repos = self.user.get_repos(sort=sort)
            repo_list = []
            count = 0
            for repo in repos:
                if count >= per_page:
                    break
                repo_list.append({
                    "name": repo.name,
                    "full_name": repo.full_name,
                    "description": repo.description,
                    "url": repo.html_url,
                    "private": repo.private,
                    "stars": repo.stargazers_count,
                    "forks": repo.forks_count,
                    "language": repo.language,
                    "updated_at": str(repo.updated_at)
                })
                count += 1
            
            return {
                "success": True,
                "repositories": repo_list,
                "count": len(repo_list)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def fork_repository(self, repo_name: str) -> dict:
        """
        Fork a GitHub repository.
        
        Args:
            repo_name: Repository to fork (format: owner/repo)
            
        Returns:
            dict: Fork result
        """
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            forked_repo = self.user.create_fork(repo)
            return {
                "success": True,
                "message": f"✅ Forked '{repo_name}' successfully!",
                "fork_url": forked_repo.html_url,
                "fork_name": forked_repo.full_name
            }
        except GithubException as e:
            return {"success": False, "error": f"Failed to fork: {e.data.get('message', str(e))}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def star_repository(self, repo_name: str) -> dict:
        """Star a repository."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            self.user.add_to_starred(repo)
            return {
                "success": True,
                "message": f"⭐ Starred '{repo_name}'!"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def unstar_repository(self, repo_name: str) -> dict:
        """Unstar a repository."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            self.user.remove_from_starred(repo)
            return {
                "success": True,
                "message": f"☆ Unstarred '{repo_name}'!"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ==================== COMMIT OPERATIONS ====================
    
    def push_commit(self, repo_name: str, branch: str, message: str, 
                    file_path: str, content: str, sha: str = None) -> dict:
        """
        Push a new commit to a repository.
        
        Args:
            repo_name: Repository name (owner/repo)
            branch: Branch name (default: main)
            message: Commit message
            file_path: Path to file in repo
            content: File content (will be base64 encoded)
            sha: SHA of existing file (required for updates)
            
        Returns:
            dict: Push result
        """
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            
            # Get the reference
            try:
                ref = repo.get_git_ref(f"refs/heads/{branch}")
            except GithubException:
                # Branch doesn't exist, create it from default branch
                default_branch = repo.default_branch
                default_ref = repo.get_git_ref(f"refs/heads/{default_branch}")
                repo.create_git_ref(ref=f"refs/heads/{branch}", sha=default_ref.object.sha)
                ref = repo.get_git_ref(f"refs/heads/{branch}")
            
            # Encode content to base64
            content_bytes = content.encode('utf-8')
            content_b64 = base64.b64encode(content_bytes).decode('utf-8')
            
            # Check if file exists to get SHA
            if not sha:
                try:
                    file_info = repo.get_contents(file_path, ref=branch)
                    sha = file_info.sha
                except GithubException:
                    pass  # File doesn't exist, will create new
            
            # Create or update file
            if sha:
                result = repo.update_file(
                    path=file_path,
                    message=message,
                    content=content_b64,
                    sha=sha,
                    branch=branch
                )
            else:
                result = repo.create_file(
                    path=file_path,
                    message=message,
                    content=content_b64,
                    branch=branch
                )
            
            commit = result['commit']
            return {
                "success": True,
                "message": f"✅ Pushed commit to '{repo_name}/{branch}'!",
                "commit_sha": commit.sha,
                "commit_url": commit.html_url,
                "commit_message": commit.message
            }
        except GithubException as e:
            return {"success": False, "error": f"Failed to push: {e.data.get('message', str(e))}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_commit_history(self, repo_name: str, per_page: int = 10) -> dict:
        """Get commit history for a repository."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            commits = repo.get_commits()[:per_page]
            
            commit_list = []
            for commit in commits:
                commit_list.append({
                    "sha": commit.sha[:7],
                    "message": commit.commit.message,
                    "author": commit.commit.author.name,
                    "date": str(commit.commit.author.date),
                    "url": commit.html_url
                })
            
            return {
                "success": True,
                "commits": commit_list,
                "count": len(commit_list)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ==================== PULL REQUEST OPERATIONS ====================
    
    def create_pull_request(self, repo_name: str, title: str, body: str,
                            head: str, base: str = "main") -> dict:
        """
        Create a pull request.
        
        Args:
            repo_name: Repository name
            title: PR title
            body: PR description
            head: Source branch
            base: Target branch (default: main)
            
        Returns:
            dict: PR creation result
        """
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            pr = repo.create_pull(
                title=title,
                body=body,
                head=head,
                base=base
            )
            return {
                "success": True,
                "message": f"✅ Pull Request created: #{pr.number}",
                "pr_number": pr.number,
                "pr_url": pr.html_url,
                "pr_title": pr.title
            }
        except GithubException as e:
            return {"success": False, "error": f"Failed to create PR: {e.data.get('message', str(e))}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def merge_pull_request(self, repo_name: str, pr_number: int, 
                           commit_message: str = "") -> dict:
        """Merge a pull request."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            pr = repo.get_pull(pr_number)
            
            if pr.is_merged():
                return {"success": False, "error": f"PR #{pr_number} is already merged"}
            
            merge_result = pr.merge(commit_message or f"Merge PR #{pr_number}")
            
            if merge_result.merged:
                return {
                    "success": True,
                    "message": f"✅ PR #{pr_number} merged successfully!",
                    "merged_at": str(merge_result.merged_at),
                    "sha": merge_result.sha
                }
            else:
                return {"success": False, "error": "Merge failed"}
        except GithubException as e:
            return {"success": False, "error": f"Failed to merge PR: {e.data.get('message', str(e))}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def close_pull_request(self, repo_name: str, pr_number: int) -> dict:
        """Close a pull request without merging."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            pr = repo.get_pull(pr_number)
            pr.edit(state="closed")
            return {
                "success": True,
                "message": f"✅ PR #{pr_number} closed!"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def list_pull_requests(self, repo_name: str, state: str = "open") -> dict:
        """List pull requests in a repository."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            prs = repo.get_pulls(state=state)
            
            pr_list = []
            for pr in prs:
                pr_list.append({
                    "number": pr.number,
                    "title": pr.title,
                    "state": pr.state,
                    "author": pr.user.login,
                    "url": pr.html_url,
                    "created_at": str(pr.created_at),
                    "head_branch": pr.head.ref,
                    "base_branch": pr.base.ref
                })
            
            return {
                "success": True,
                "pull_requests": pr_list,
                "count": len(pr_list)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ==================== ISSUE OPERATIONS ====================
    
    def create_issue(self, repo_name: str, title: str, body: str = "", 
                     labels: list = None) -> dict:
        """Create a new issue."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            issue = repo.create_issue(
                title=title,
                body=body,
                labels=labels or []
            )
            return {
                "success": True,
                "message": f"✅ Issue created: #{issue.number}",
                "issue_number": issue.number,
                "issue_url": issue.html_url,
                "issue_title": issue.title
            }
        except GithubException as e:
            return {"success": False, "error": f"Failed to create issue: {e.data.get('message', str(e))}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def close_issue(self, repo_name: str, issue_number: int) -> dict:
        """Close an issue."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            issue = repo.get_issue(issue_number)
            issue.edit(state="closed")
            return {
                "success": True,
                "message": f"✅ Issue #{issue_number} closed!"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def open_issue(self, repo_name: str, issue_number: int) -> dict:
        """Reopen a closed issue."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            issue = repo.get_issue(issue_number)
            issue.edit(state="open")
            return {
                "success": True,
                "message": f"✅ Issue #{issue_number} reopened!"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def comment_on_issue(self, repo_name: str, issue_number: int, 
                         comment: str) -> dict:
        """Add a comment to an issue."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            issue = repo.get_issue(issue_number)
            issue_comment = issue.create_comment(comment)
            return {
                "success": True,
                "message": f"✅ Comment added to issue #{issue_number}!",
                "comment_url": issue_comment.html_url
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def list_issues(self, repo_name: str, state: str = "open") -> dict:
        """List issues in a repository."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            issues = repo.get_issues(state=state)
            
            issue_list = []
            for issue in issues:
                if not issue.pull_request:  # Exclude PRs
                    issue_list.append({
                        "number": issue.number,
                        "title": issue.title,
                        "state": issue.state,
                        "author": issue.user.login,
                        "url": issue.html_url,
                        "created_at": str(issue.created_at),
                        "labels": [label.name for label in issue.labels]
                    })
            
            return {
                "success": True,
                "issues": issue_list,
                "count": len(issue_list)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ==================== FILE OPERATIONS ====================
    
    def read_file(self, repo_name: str, file_path: str, branch: str = "main") -> dict:
        """Read a file from repository."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            file_info = repo.get_contents(file_path, ref=branch)
            
            # Decode base64 content
            content = base64.b64decode(file_info.content).decode('utf-8')
            
            return {
                "success": True,
                "file_path": file_info.path,
                "content": content,
                "sha": file_info.sha,
                "size": file_info.size,
                "type": file_info.type
            }
        except GithubException as e:
            return {"success": False, "error": f"File not found: {e.data.get('message', str(e))}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_file_info(self, repo_name: str, file_path: str, branch: str = "main") -> dict:
        """Get file metadata (sha, size, etc.) without downloading content."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            file_info = repo.get_contents(file_path, ref=branch)
            
            return {
                "success": True,
                "file_path": file_info.path,
                "sha": file_info.sha,
                "size": file_info.size,
                "type": file_info.type,
                "download_url": file_info.download_url
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ==================== BRANCH OPERATIONS ====================
    
    def create_branch(self, repo_name: str, branch_name: str, 
                      source_branch: str = "main") -> dict:
        """Create a new branch."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            
            # Get SHA from source branch
            source_ref = repo.get_git_ref(f"refs/heads/{source_branch}")
            sha = source_ref.object.sha
            
            # Create new branch
            repo.create_git_ref(ref=f"refs/heads/{branch_name}", sha=sha)
            
            return {
                "success": True,
                "message": f"✅ Branch '{branch_name}' created from '{source_branch}'!",
                "branch": branch_name
            }
        except GithubException as e:
            return {"success": False, "error": f"Failed to create branch: {e.data.get('message', str(e))}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def delete_branch(self, repo_name: str, branch_name: str) -> dict:
        """Delete a branch."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to GitHub"}
        
        try:
            repo = self.client.get_repo(repo_name)
            ref = repo.get_git_ref(f"refs/heads/{branch_name}")
            ref.delete()
            
            return {
                "success": True,
                "message": f"✅ Branch '{branch_name}' deleted!"
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
            return {"success": False, "error": "Not connected to GitHub. Please configure GITHUB_TOKEN."}
        
        operation = command.get("operation", "").lower()
        
        # Map operations to methods
        operations_map = {
            # Repository operations
            "create_repo": lambda: self.create_repository(
                command.get("name"),
                command.get("description", ""),
                command.get("private", False),
                command.get("auto_init", True)
            ),
            "delete_repo": lambda: self.delete_repository(command.get("repo")),
            "list_repos": lambda: self.list_repositories(
                command.get("sort", "updated"),
                command.get("per_page", 10)
            ),
            "fork_repo": lambda: self.fork_repository(command.get("repo")),
            "star_repo": lambda: self.star_repository(command.get("repo")),
            "unstar_repo": lambda: self.unstar_repository(command.get("repo")),
            
            # Commit operations
            "push_commit": lambda: self.push_commit(
                command.get("repo"),
                command.get("branch", "main"),
                command.get("message"),
                command.get("file_path"),
                command.get("content"),
                command.get("sha")
            ),
            "get_commits": lambda: self.get_commit_history(
                command.get("repo"),
                command.get("per_page", 10)
            ),
            
            # Pull request operations
            "create_pr": lambda: self.create_pull_request(
                command.get("repo"),
                command.get("title"),
                command.get("body", ""),
                command.get("head"),
                command.get("base", "main")
            ),
            "merge_pr": lambda: self.merge_pull_request(
                command.get("repo"),
                command.get("pr_number"),
                command.get("commit_message", "")
            ),
            "close_pr": lambda: self.close_pull_request(
                command.get("repo"),
                command.get("pr_number")
            ),
            "list_prs": lambda: self.list_pull_requests(
                command.get("repo"),
                command.get("state", "open")
            ),
            
            # Issue operations
            "create_issue": lambda: self.create_issue(
                command.get("repo"),
                command.get("title"),
                command.get("body", ""),
                command.get("labels")
            ),
            "close_issue": lambda: self.close_issue(
                command.get("repo"),
                command.get("issue_number")
            ),
            "open_issue": lambda: self.open_issue(
                command.get("repo"),
                command.get("issue_number")
            ),
            "comment_issue": lambda: self.comment_on_issue(
                command.get("repo"),
                command.get("issue_number"),
                command.get("comment")
            ),
            "list_issues": lambda: self.list_issues(
                command.get("repo"),
                command.get("state", "open")
            ),
            
            # File operations
            "read_file": lambda: self.read_file(
                command.get("repo"),
                command.get("file_path"),
                command.get("branch", "main")
            ),
            "get_file_info": lambda: self.get_file_info(
                command.get("repo"),
                command.get("file_path"),
                command.get("branch", "main")
            ),
            
            # Branch operations
            "create_branch": lambda: self.create_branch(
                command.get("repo"),
                command.get("branch_name"),
                command.get("source_branch", "main")
            ),
            "delete_branch": lambda: self.delete_branch(
                command.get("repo"),
                command.get("branch_name")
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
                "error": f"Unknown operation: {operation}. Available operations: {', '.join(operations_map.keys())}"
            }
    
    def get_available_operations(self) -> list:
        """Return list of available operations."""
        return [
            # Repository
            "create_repo", "delete_repo", "list_repos", "fork_repo", "star_repo", "unstar_repo",
            # Commits
            "push_commit", "get_commits",
            # Pull Requests
            "create_pr", "merge_pr", "close_pr", "list_prs",
            # Issues
            "create_issue", "close_issue", "open_issue", "comment_issue", "list_issues",
            # Files
            "read_file", "get_file_info",
            # Branches
            "create_branch", "delete_branch",
            # Status
            "status"
        ]


# Standalone function to create server instance
def create_mcp_server(token: str = None) -> MCPGitHubServer:
    """Create and return an MCP GitHub Server instance."""
    return MCPGitHubServer(token)


if __name__ == "__main__":
    # Quick test
    server = MCPGitHubServer()
    print(json.dumps(server.get_status(), indent=2))
    print("Available operations:", server.get_available_operations())
