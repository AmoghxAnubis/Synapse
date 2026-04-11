"""
Web Search Tool for Synapse Agents
Uses DuckDuckGo search (no API key required).
"""

import subprocess
import json


class WebSearchTool:
    """Lightweight web search using DuckDuckGo."""

    def search(self, query: str, max_results: int = 3) -> str:
        """
        Search the web and return formatted context string.
        Uses duckduckgo_search library if available, falls back to a basic approach.
        """
        try:
            from duckduckgo_search import DDGS
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=max_results))

            if not results:
                return "No web search results found."

            formatted = []
            for i, r in enumerate(results, 1):
                title = r.get("title", "No title")
                body = r.get("body", "No description")
                href = r.get("href", "")
                formatted.append(f"[{i}] {title}\n    {body}\n    Source: {href}")

            return "\n\n".join(formatted)

        except ImportError:
            return self._fallback_search(query)
        except Exception as e:
            return f"Web search failed: {str(e)}"

    def _fallback_search(self, query: str) -> str:
        """Fallback: use httpx to fetch a simple search page."""
        try:
            import httpx
            from bs4 import BeautifulSoup

            url = f"https://html.duckduckgo.com/html/?q={query.replace(' ', '+')}"
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Synapse/1.0"}
            resp = httpx.get(url, headers=headers, timeout=10, follow_redirects=True)
            soup = BeautifulSoup(resp.text, "html.parser")

            results = []
            for result in soup.select(".result__body")[:3]:
                title_el = result.select_one(".result__title")
                snippet_el = result.select_one(".result__snippet")
                title = title_el.get_text(strip=True) if title_el else "No title"
                snippet = snippet_el.get_text(strip=True) if snippet_el else ""
                results.append(f"• {title}: {snippet}")

            return "\n".join(results) if results else "No web results found."
        except Exception as e:
            return f"Web search unavailable: {str(e)}"


# Global instance
web_search_tool = WebSearchTool()
