from github import Github
import os

class GitHubConnector:
    def __init__(self):
        # We will use an Environment Variable for security
        self.token = os.getenv("GITHUB_TOKEN")
        self.client = Github(self.token) if self.token else None

    def is_active(self):
        return self.client is not None

    def get_repo_summary(self, repo_name):
        """Fetches open PRs and Issues from a specific repo."""
        if not self.is_active():
            return "❌ GitHub Token missing. Please set GITHUB_TOKEN."

        try:
            # Note: repo_name must be "username/repo" e.g., "torvalds/linux"
            repo = self.client.get_repo(repo_name)
            
            # Get PRs
            prs = repo.get_pulls(state='open', sort='created', direction='desc')[:5]
            pr_summary = [f"- PR #{pr.number}: {pr.title} (by {pr.user.login})" for pr in prs]
            
            # Get Issues
            issues = repo.get_issues(state='open', sort='created', direction='desc')[:5]
            # Filter out PRs (GitHub treats PRs as issues sometimes)
            real_issues = [i for i in issues if not i.pull_request]
            issue_summary = [f"- Issue #{i.number}: {i.title}" for i in real_issues]

            return f"""
            📊 **GitHub Report for {repo_name}**
            
            **Open Pull Requests:**
            {chr(10).join(pr_summary) if pr_summary else "No open PRs."}
            
            **Recent Issues:**
            {chr(10).join(issue_summary) if issue_summary else "No recent issues."}
            """
        except Exception as e:
            return f"❌ Error fetching GitHub data: {str(e)}"