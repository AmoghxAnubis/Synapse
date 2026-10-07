import socket
import pytest
from app.core.url_fetch import public_address
from app.core.integrations import IntegrationService


@pytest.mark.parametrize("url", ["http://127.0.0.1", "http://[::1]", "http://169.254.169.254", "http://10.0.0.1", "file:///etc/passwd", "https://user:pass@example.com", "https://example.com:8080"])
def test_private_and_invalid_urls_rejected(url, monkeypatch):
    monkeypatch.setattr(socket, "getaddrinfo", lambda *a, **kw: [(socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", 80))])
    with pytest.raises(ValueError): public_address(url)


def test_scoped_github_content_and_comments(storage, monkeypatch):
    service = IntegrationService(storage)
    storage.set("integration:github", {"connected": True, "resources": ["owner/repo"]})
    calls = []
    def request(platform, path, **kwargs):
        calls.append(path)
        if path == "/repos/owner/repo":
            return {"html_url": "https://github.com/owner/repo", "name": "Repo", "description": "Work"}
        if path.endswith("/readme"):
            import base64
            return {"html_url": "https://github.com/owner/repo/README", "content": base64.b64encode(b"Important repository documentation").decode()}
        if path.endswith("/comments"):
            return [{"body": "Actual review comment"}]
        return [{"number": 1, "title": "Issue title", "body": "Actual issue content", "comments": 1, "html_url": "https://github.com/owner/repo/issues/1"}]
    monkeypatch.setattr(service, "request", request)
    docs = service.documents("github")
    assert len(docs) == 3
    assert "Actual issue content" in docs[2]["text"]
    assert "Actual review comment" in docs[2]["text"]
    assert all("owner/repo" in call for call in calls)


def test_failed_sync_cannot_be_empty_success(storage, monkeypatch):
    service = IntegrationService(storage)
    storage.set("integration:github", {"connected": True, "resources": ["owner/repo"]})
    monkeypatch.setattr(service, "request", lambda *a, **kw: (_ for _ in ()).throw(ValueError("HTTP 403")))
    with pytest.raises(ValueError): service.documents("github")


def test_connect_validates_before_persisting_secret(storage, monkeypatch):
    service = IntegrationService(storage)
    monkeypatch.setattr(service, "request", lambda *a, **kw: (_ for _ in ()).throw(ValueError("HTTP 401")))
    with pytest.raises(ValueError): service.connect("github", "invalid", ["owner/repo"])
    assert not service.config("github")["connected"]


def test_resource_scope_is_enforced_on_writes(storage):
    service = IntegrationService(storage)
    storage.set("integration:github", {"connected": True, "resources": ["owner/repo"]})
    with pytest.raises(ValueError): service.execute_write("github.create_issue", {"repository": "other/repo", "title": "No"})


def test_jira_configuration_is_validated(storage):
    service = IntegrationService(storage)
    with pytest.raises(ValueError): service.connect("jira", "token", ["PROJ"], "http://127.0.0.1", "person@example.com")
