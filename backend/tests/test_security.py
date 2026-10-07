import pytest


@pytest.mark.parametrize("method,path", [
    ("get", "/"), ("get", "/sources"), ("get", "/agents"), ("get", "/settings"),
    ("get", "/meetings"), ("get", "/integrations/status"), ("get", "/conversations"),
    ("post", "/ask"), ("post", "/tools/terminal"), ("post", "/actions/preview"),
    ("post", "/integrations/github/connect"), ("delete", "/source?name=x"),
])
def test_data_and_actions_require_pairing(api, method, path):
    assert getattr(api, method)(path).status_code == 401


def test_public_health_contains_no_private_data(api):
    assert api.get("/health/live").json() == {"status": "alive"}


def test_terminal_permission_and_command_allowlist(api, headers):
    assert api.post("/tools/terminal", headers=headers, json={"command": "python-version", "agent_id": 3}).status_code == 403
    for command in ["echo harmless", "python -c print(1)", "git-status && whoami", "rm -rf ."]:
        result = api.post("/tools/terminal", headers=headers, json={"command": command, "agent_id": 2})
        assert result.json()["blocked"] is True


def test_network_is_disabled_by_default(api, headers):
    assert api.post("/ingest/url", headers=headers, json={"url": "https://example.com"}).status_code == 403
    assert api.post("/integrations/github/sync", headers=headers).status_code == 403
    assert api.post("/actions/preview", headers=headers, json={"action": "github.create_issue", "agent_id": 2, "params": {"repository": "a/b", "title": "title"}}).status_code == 403


def test_settings_reject_remote_inference(api, headers):
    for url in ["https://example.com", "http://192.168.1.2:11434", "http://localhost:11434/private", "http://user:pass@localhost:11434"]:
        assert api.put("/settings", headers=headers, json={"ollama_url": url}).status_code == 422


def test_strict_agent_validation(api, headers):
    assert api.post("/agents", headers=headers, json={"name": "Bad", "id": 1}).status_code == 422
    assert api.patch("/agents/2", headers=headers, json={"capabilities": {"terminal": True, "unknown": True}}).status_code == 422


def test_approval_cannot_be_replayed(api, headers, monkeypatch):
    import app.core.actions as actions
    called = []
    monkeypatch.setattr(actions.subprocess, "Popen", lambda *a, **kw: called.append(a))
    preview = api.post("/actions/preview", headers=headers, json={"action": "open_app", "agent_id": 2, "params": {"app": "notepad"}})
    if preview.status_code == 400:  # non-Windows CI
        monkeypatch.setattr(actions.platform, "system", lambda: "Windows")
        preview = api.post("/actions/preview", headers=headers, json={"action": "open_app", "agent_id": 2, "params": {"app": "notepad"}})
    identifier = preview.json()["id"]
    assert not called
    assert api.post(f"/actions/{identifier}/approve", headers=headers).status_code == 200
    assert api.post(f"/actions/{identifier}/approve", headers=headers).status_code == 400
    assert len(called) == 1


def test_permission_removal_invalidates_approval(api, headers, monkeypatch):
    import app.core.actions as actions
    monkeypatch.setattr(actions.platform, "system", lambda: "Windows")
    preview = api.post("/actions/preview", headers=headers, json={"action": "open_app", "agent_id": 2, "params": {"app": "notepad"}})
    api.patch("/agents/2", headers=headers, json={"capabilities": {"terminal": False}})
    assert api.post("/actions/" + preview.json()["id"] + "/approve", headers=headers).status_code == 403
