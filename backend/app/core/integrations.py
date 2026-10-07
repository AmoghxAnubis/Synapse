"""Scoped REST connectors. Secrets stay in the OS credential store."""
import json
import re
import time
from datetime import datetime, timezone
import keyring
import httpx
from .config import PLATFORMS

BASE_URLS = {
    "github": "https://api.github.com",
    "notion": "https://api.notion.com/v1",
    "slack": "https://slack.com/api",
    "discord": "https://discord.com/api/v10",
}


class IntegrationService:
    def __init__(self, storage):
        self.storage = storage

    def _credential(self, platform):
        backend = keyring.get_keyring()
        if backend.priority <= 0 or "plaintext" in type(backend).__name__.lower():
            raise ValueError("A secure OS credential store is required for integrations.")
        return keyring.get_password("Synapse", platform)

    def config(self, platform):
        if platform not in PLATFORMS:
            raise ValueError("Unknown integration")
        return self.storage.get("integration:" + platform, {"resources": [], "connected": False, "last_synced": None})

    def status(self):
        return {p: self.config(p) for p in PLATFORMS}

    def connect(self, platform, key, resources, server="", email=""):
        if platform not in PLATFORMS:
            raise ValueError("Unknown integration")
        if not resources:
            raise ValueError("Choose at least one source to sync.")
        if platform == "github" and any(not re.fullmatch(r"[\w.-]+/[\w.-]+", r) for r in resources):
            raise ValueError("GitHub sources must use owner/repository.")
        if platform in ("slack", "discord") and any(not re.fullmatch(r"[A-Za-z0-9]+", r) for r in resources):
            raise ValueError("Enter channel IDs, not channel names.")
        if platform == "notion" and any(not re.fullmatch(r"[a-fA-F0-9-]{32,36}", r) for r in resources):
            raise ValueError("Enter the IDs of pages shared with your Notion integration.")
        if platform == "jira":
            if not re.fullmatch(r"https://[a-z0-9-]+\.atlassian\.net", server) or not email:
                raise ValueError("Jira Cloud requires an https://workspace.atlassian.net URL and email.")
            if any(not re.fullmatch(r"[A-Z][A-Z0-9_]*", r) for r in resources):
                raise ValueError("Use Jira project keys such as PROJ.")
        config = {"resources": resources, "server": server, "email": email, "connected": True, "last_synced": None}
        # Validate credentials before storing or declaring success.
        check = {"github": "/user", "notion": "/users/me", "jira": "/rest/api/3/myself", "slack": "/auth.test", "discord": "/users/@me"}[platform]
        self.request(platform, check, key=key, config=config)
        self._credential(platform)  # fail closed if keyring is unavailable
        keyring.set_password("Synapse", platform, key)
        self.storage.set("integration:" + platform, config)
        return config

    def disconnect(self, platform):
        config = self.config(platform)
        if self._credential(platform):
            keyring.delete_password("Synapse", platform)
        config["connected"] = False
        self.storage.set("integration:" + platform, config)

    def request(self, platform, path, method="GET", params=None, body=None, key=None, config=None):
        if not self.storage.get("settings", {}).get("network_enabled", False):
            raise PermissionError("Connected features are disabled.")
        config = config or self.config(platform)
        key = key or self._credential(platform)
        if not key:
            raise ValueError("Connect the integration before using it.")
        base = config.get("server") if platform == "jira" else BASE_URLS[platform]
        headers = {"User-Agent": "Synapse/0.2", "Authorization": ("Bot " if platform == "discord" else "Bearer ") + key}
        auth = None
        if platform == "github":
            headers.update({"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2026-03-10"})
        if platform == "notion":
            headers["Notion-Version"] = "2025-09-03"
        if platform == "jira":
            headers.pop("Authorization")
            auth = (config["email"], key)
        for attempt in range(3):
            try:
                response = httpx.request(method, base + path, headers=headers, auth=auth, params=params, json=body, timeout=20, follow_redirects=False, trust_env=False)
            except httpx.RequestError as exc:
                raise ValueError(f"{platform} could not be reached. Try again.") from exc
            if response.status_code == 429 or (method == "GET" and response.status_code >= 500):
                if attempt < 2:
                    try:
                        delay = min(float(response.headers.get("Retry-After", "1")), 5)
                    except ValueError:
                        delay = 1
                    time.sleep(max(0, delay))
                    continue
            if not 200 <= response.status_code < 300:
                raise ValueError(f"{platform} returned HTTP {response.status_code}. Check permissions and source selection.")
            data = response.json()
            if isinstance(data, dict) and data.get("ok") is False:
                raise ValueError(f"Slack rejected the request: {data.get('error', 'unknown error')}")
            return data
        raise ValueError(f"{platform} is temporarily unavailable.")

    def _pages(self, platform, path, params=None, field=None):
        params = dict(params or {})
        records = []
        for page in range(1, 11):
            params.update({"per_page": 100, "page": page})
            data = self.request(platform, path, params=params)
            batch = data[field] if field else data
            records.extend(batch)
            if len(batch) < 100:
                return records
        raise ValueError("Source exceeds 1,000 records. Narrow the selected source before syncing.")

    def documents(self, platform, cancel=None):
        config = self.config(platform)
        if not config.get("connected"):
            raise ValueError("Connect the integration first.")
        docs = []
        for resource in config["resources"]:
            if cancel and cancel.is_set():
                raise InterruptedError()
            if platform == "github":
                repo = self.request(platform, f"/repos/{resource}")
                docs.append(self._doc(platform, resource, "repository", repo["html_url"], repo["name"] + "\n" + (repo.get("description") or "")))
                try:
                    readme = self.request(platform, f"/repos/{resource}/readme")
                except ValueError as exc:
                    if "HTTP 404" not in str(exc):
                        raise
                else:
                    import base64
                    text = base64.b64decode(readme["content"]).decode("utf-8", errors="replace")
                    docs.append(self._doc(platform, resource, "README", readme["html_url"], text))
                for issue in self._pages(platform, f"/repos/{resource}/issues", {"state": "all"}):
                    body = issue["title"] + "\n" + (issue.get("body") or "")
                    if issue.get("comments"):
                        for comment in self._pages(platform, f"/repos/{resource}/issues/{issue['number']}/comments"):
                            body += "\nComment: " + (comment.get("body") or "")
                    docs.append(self._doc(platform, resource, str(issue["number"]), issue["html_url"], body))
            elif platform == "notion":
                page = self.request(platform, "/pages/" + resource)
                props = page.get("properties", {})
                title = next(("".join(t.get("plain_text", "") for t in value.get("title", [])) for value in props.values() if value.get("type") == "title"), "Notion page")
                text = title + "\n" + self._notion_blocks(resource, cancel=cancel)
                docs.append(self._doc(platform, resource, resource, page.get("url", ""), text))
            elif platform == "jira":
                token = None
                for _ in range(10):
                    params = {"jql": f'project = "{resource}" ORDER BY updated DESC', "maxResults": 100, "fields": "summary,description,status,comment"}
                    if token:
                        params["nextPageToken"] = token
                    data = self.request(platform, "/rest/api/3/search/jql", params=params)
                    for issue in data.get("issues", []):
                        fields = issue["fields"]
                        text = fields.get("summary", "") + "\n" + self._rich_text(fields.get("description")) + "\nStatus: " + fields.get("status", {}).get("name", "")
                        text += "\n" + self._rich_text(fields.get("comment", {}))
                        docs.append(self._doc(platform, resource, issue["key"], config["server"] + "/browse/" + issue["key"], text))
                    token = data.get("nextPageToken")
                    if not token:
                        break
                else:
                    raise ValueError("Project exceeds the sync limit; choose a smaller source.")
            elif platform == "slack":
                cursor = None
                for _ in range(10):
                    params = {"channel": resource, "limit": 100}
                    if cursor:
                        params["cursor"] = cursor
                    data = self.request(platform, "/conversations.history", params=params)
                    for message in data.get("messages", []):
                        text = message.get("text", "").strip()
                        if text:
                            stamp = message["ts"]
                            docs.append(self._doc(platform, resource, stamp, f"https://app.slack.com/archives/{resource}/p{stamp.replace('.', '')}", text))
                    cursor = data.get("response_metadata", {}).get("next_cursor")
                    if not cursor:
                        break
                else:
                    raise ValueError("Channel exceeds the sync limit; select a smaller channel.")
            elif platform == "discord":
                before = None
                for _ in range(10):
                    params = {"limit": 100}
                    if before:
                        params["before"] = before
                    batch = self.request(platform, f"/channels/{resource}/messages", params=params)
                    for message in batch:
                        text = message.get("content", "").strip()
                        if text:
                            docs.append(self._doc(platform, resource, message["id"], f"https://discord.com/channels/@me/{resource}/{message['id']}", text))
                    if len(batch) < 100:
                        break
                    before = batch[-1]["id"]
                else:
                    raise ValueError("Channel exceeds the sync limit; select a smaller channel.")
        if sum(len(d["text"]) for d in docs) > 2_000_000:
            raise ValueError("Selected content exceeds the 2 million character import limit.")
        return docs

    @staticmethod
    def _doc(platform, resource, identifier, url, text):
        return {"source": f"{platform}:{resource}:{identifier}", "text": text, "url": url, "platform": platform}

    @staticmethod
    def _rich_text(value):
        if isinstance(value, dict):
            return (value.get("text", "") if isinstance(value.get("text", ""), str) else "") + " " + " ".join(IntegrationService._rich_text(v) for k, v in value.items() if k != "text")
        if isinstance(value, list):
            return " ".join(IntegrationService._rich_text(v) for v in value)
        return ""

    def _notion_blocks(self, identifier, depth=0, cancel=None):
        if depth > 10:
            raise ValueError("Notion nesting exceeds the import limit.")
        lines, cursor = [], None
        for _ in range(10):
            if cancel and cancel.is_set():
                raise InterruptedError()
            params = {"page_size": 100}
            if cursor:
                params["start_cursor"] = cursor
            data = self.request("notion", f"/blocks/{identifier}/children", params=params)
            for block in data.get("results", []):
                value = block.get(block["type"], {})
                lines.append("".join(r.get("plain_text", r.get("text", {}).get("content", "")) for r in value.get("rich_text", [])))
                if block.get("has_children"):
                    lines.append(self._notion_blocks(block["id"], depth + 1, cancel))
            cursor = data.get("next_cursor")
            if not data.get("has_more"):
                return "\n".join(lines)
        raise ValueError("Notion page exceeds the import limit.")

    def mark_synced(self, platform):
        config = self.config(platform)
        config["last_synced"] = datetime.now(timezone.utc).isoformat()
        self.storage.set("integration:" + platform, config)

    def execute_write(self, action, params):
        if action == "github.create_issue":
            repo = params["repository"]
            if repo not in self.config("github")["resources"]:
                raise ValueError("Repository is outside the selected integration sources.")
            result = self.request("github", f"/repos/{repo}/issues", "POST", body={"title": params["title"], "body": params.get("body", "")})
            return {"message": "Issue created.", "url": result["html_url"]}
        if action in ("slack.send_message", "discord.send_message"):
            platform = action.split(".")[0]
            channel = params["channel"]
            if channel not in self.config(platform)["resources"]:
                raise ValueError("Channel is outside the selected integration sources.")
            if platform == "slack":
                result = self.request(platform, "/chat.postMessage", "POST", body={"channel": channel, "text": params["text"]})
            else:
                result = self.request(platform, f"/channels/{channel}/messages", "POST", body={"content": params["text"]})
            return {"message": "Message sent.", "id": result.get("ts", result.get("id"))}
        raise ValueError("Unknown action.")
