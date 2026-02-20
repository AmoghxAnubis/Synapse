from app.agents.tools.github_tool import GitHubConnector
# Import other tools here later (Notion, Jira)

class AgentManager:
    def __init__(self):
        print("🕵️ Initializing Agentic Capabilities...")
        self.github = GitHubConnector()
        # self.notion = NotionConnector()
        
    def route_request(self, user_query):
        """
        DETERMINISTIC ROUTING (NPU Task)
        Instead of asking the LLM 'what tool?', we check keywords first.
        This is faster and more reliable for Hackathons.
        """
        query = user_query.lower()

        # --- ROUTING LOGIC ---
        
        # 1. GITHUB INTENT
        if "github" in query or "repo" in query or "pull request" in query:
            print("🔀 Routing to: GitHub Agent")
            
            # Extract repo name (Mock extraction for MVP - usually LLM does this)
            # For the demo, we default to a specific repo if not found, or ask LLM
            # Here we just look for a string that looks like "user/repo"
            words = query.split()
            target_repo = None
            for word in words:
                if "/" in word: # highly likely a repo name
                    target_repo = word
                    break
            
            if target_repo:
                return self.github.get_repo_summary(target_repo)
            else:
                return "I see you want GitHub info, but I need the repo name (format: username/repo)."

        # 2. NOTION INTENT (Placeholder)
        elif "notion" in query:
            return "Notion Agent is installed but not configured yet."

        # 3. FALLBACK -> STANDARD RAG
        else:
            return None # Signals main.py to use standard Memory/LLM