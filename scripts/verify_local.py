"""Production smoke checks for running loopback services.

Default checks are read-only except creating/removing a browser session.
--with-inference imports synthetic data and deletes only its own source/conversation.
No live external connector writes are performed.
"""
import argparse
import re
import sys
import time
import uuid
from pathlib import Path
from html.parser import HTMLParser

import requests

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))
from app.core.config import DATA_DIR

FRONTEND = "http://127.0.0.1:3000"
BACKEND = "http://127.0.0.1:8000"


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.text = []
        self.hidden = 0
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.hidden += 1
        self.ids.update(value for key, value in attrs if key == "id")
    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.hidden = max(0, self.hidden - 1)
    def handle_data(self, data):
        if not self.hidden:
            self.text.append(data.strip())


def verify_frontend(token):
    session = requests.Session()
    session.trust_env = False
    origin = {"Origin": FRONTEND}
    try:
        assert session.get(FRONTEND + "/api/backend/agents", timeout=10).status_code == 401
        assert session.get(FRONTEND + "/dashboard", allow_redirects=False, timeout=10).status_code == 307
        assert session.post(FRONTEND + "/api/session", headers={"Origin": "https://untrusted.example"}, json={"token": token}, timeout=10).status_code == 403
        assert session.post(FRONTEND + "/api/session", headers=origin, data="{invalid", timeout=10).status_code == 400
        assert session.post(FRONTEND + "/api/session", headers=origin, data="x" * 1025, timeout=10).status_code == 413
        result = session.post(FRONTEND + "/api/session", headers=origin, json={"token": token}, timeout=15)
        assert result.status_code == 200
        cookie = result.headers["Set-Cookie"].lower()
        assert "httponly" in cookie and "samesite=strict" in cookie
        assert session.get(FRONTEND + "/api/backend/agents", timeout=10).status_code == 200
        assert session.post(FRONTEND + "/api/backend/conversations", headers={"Origin": "https://untrusted.example"}, timeout=10).status_code == 403
        # Chunked body: exercise the read limit without relying on Content-Length.
        chunks = (b"x" * 65536 for _ in range(337))
        assert session.post(FRONTEND + "/api/backend/meetings", headers=origin, data=chunks, timeout=30).status_code == 413
        for route in ["/", "/dashboard/chat", "/dashboard/knowledge", "/dashboard/agents", "/dashboard/actions", "/dashboard/meetings", "/dashboard/settings", "/settings/integrations"]:
            result = session.get(FRONTEND + route, timeout=10)
            assert result.status_code == 200, (route, result.status_code)
            assert result.headers.get("X-Frame-Options") == "DENY"
        page = Page()
        page.feed(session.get(FRONTEND, timeout=10).text)
        assert {"features", "comparison", "architecture", "integrations", "stack"} <= page.ids
        text = " ".join(page.text)
        assert "Your personal" in text and "AI operating system" in text
        assert "zero cloud leakage" not in text.lower()
        assert session.delete(FRONTEND + "/api/session", headers=origin, timeout=10).status_code == 200
        assert session.get(FRONTEND + "/api/backend/agents", timeout=10).status_code == 401
        print("PASS: restored landing HTML, all section anchors, workspace routes, pairing, origin checks, chunked body limits and logout")
    finally:
        session.close()


def verify_inference(token):
    session = requests.Session()
    session.trust_env = False
    session.headers["Authorization"] = "Bearer " + token
    def call(method, path, **kwargs):
        response = session.request(method, BACKEND + path, timeout=180, **kwargs)
        response.raise_for_status()
        return response.json()
    source = "synapse-acceptance-" + str(uuid.uuid4()) + ".txt"
    conversation = None
    job = None
    content = b"The Borealis acceptance release has a budget of exactly 12500 rupees. Mira is the owner of the release."
    try:
        assert session.get(BACKEND + "/sources", headers={"Authorization": None}, timeout=5).status_code == 401
        assert call("GET", "/settings")["llm"]["ready"], "Start Ollama and select an installed model."
        job = call("POST", "/ingestion/jobs", files={"file": (source, content, "text/plain")})["id"]
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            result = call("GET", "/jobs/" + job)
            if result["status"] in ("completed", "failed", "cancelled"):
                break
            time.sleep(0.25)
        assert result["status"] == "completed", result
        conversation = call("POST", "/conversations")["id"]
        started = time.perf_counter()
        answer = call("POST", "/ask", json={"text": "What is the Borealis release budget?", "selected_sources": [source], "conversation_id": conversation})
        elapsed = round(time.perf_counter() - started, 2)
        assert answer["citations"] and all(c["source"] == source for c in answer["citations"])
        assert re.search(r"\[\d+\]", answer["answer"]), "Answer omitted its generated citation."
        assert "12500" in answer["answer"] or "12,500" in answer["answer"]
        assert len(call("GET", "/conversations/" + conversation)) == 2
        follow = call("POST", "/ask", json={"text": "Who owns it?", "selected_sources": [source], "conversation_id": conversation})
        assert "Mira" in follow["answer"]
        assert follow["citations"] and all(c["source"] == source for c in follow["citations"])
        assert re.search(r"\[\d+\]", follow["answer"]), "Follow-up omitted its generated citation."
        duplicate = call("POST", "/upload", files={"file": (source, content, "text/plain")})
        assert duplicate["unchanged"]
        print(f"PASS: real embeddings/Ollama, citation source, persisted follow-up, deduplication; sample answer latency {elapsed}s")
    finally:
        if job:
            status = call("GET", "/jobs/" + job)["status"]
            if status in ("queued", "running"):
                call("DELETE", "/jobs/" + job)
                for _ in range(240):
                    if call("GET", "/jobs/" + job)["status"] not in ("queued", "running"):
                        break
                    time.sleep(0.25)
                else:
                    raise RuntimeError("Import has not stopped; check the synthetic acceptance source before manual cleanup.")
        if conversation:
            call("DELETE", "/conversations/" + conversation)
        call("DELETE", "/source", params={"name": source})
        session.close()
        print("Synthetic acceptance source and conversation removed")


def verify_setup(token):
    """Explicitly check both local models, preserving saved preferences."""
    with requests.Session() as session:
        session.trust_env = False
        session.headers["Authorization"] = "Bearer " + token
        settings_response = session.get(BACKEND + "/settings", timeout=10)
        settings_response.raise_for_status()
        before = settings_response.json()
        response = session.get(BACKEND + "/health/ready", timeout=180)
        assert response.status_code in (200, 503), response.status_code
        result = response.json()
        assert isinstance(result["llm"]["ready"], bool)
        assert isinstance(result["embeddings"]["ready"], bool)
        assert result["ready"] == (result["llm"]["ready"] and result["embeddings"]["ready"])
        assert (response.status_code == 200) == result["ready"]
        after_response = session.get(BACKEND + "/settings", timeout=10)
        after_response.raise_for_status()
        after = after_response.json()
        for key in ("model", "ollama_url", "network_enabled", "retrieval_max_distance"):
            assert before[key] == after[key], "Setup check changed saved preferences: " + key
        print(f"PASS: independent model diagnostics; generation={result['llm']['ready']}, embeddings={result['embeddings']['state']}; preferences unchanged")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--with-inference", action="store_true")
    parser.add_argument("--check-setup", action="store_true", help="Explicitly load/check the local document model and inspect generation readiness; never downloads assets.")
    args = parser.parse_args()
    token = (DATA_DIR / "api-token").read_text(encoding="utf-8").strip()
    verify_frontend(token)
    if args.check_setup:
        verify_setup(token)
    if args.with_inference:
        verify_inference(token)
