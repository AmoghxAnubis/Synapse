import io
import json
import threading
import zipfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import httpx
import pytest
from app.core.ingester import FileIngester
from app.core.integrations import IntegrationService
from app.core.llm import LocalLLM


def test_local_generation_ignores_proxy_environment(monkeypatch):
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            payload = json.dumps({"models": [{"name": "local-test"}]}).encode()
            self.send_response(200)
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        def log_message(self, *args):
            pass
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    worker = threading.Thread(target=server.serve_forever, daemon=True)
    worker.start()
    monkeypatch.setenv("HTTP_PROXY", "http://127.0.0.1:1")
    monkeypatch.setenv("ALL_PROXY", "http://127.0.0.1:1")
    monkeypatch.setenv("NO_PROXY", "")
    llm = LocalLLM("local-test", f"http://127.0.0.1:{server.server_port}")
    try:
        assert llm.status()["ready"]
    finally:
        llm.session.close()
        server.shutdown()
        server.server_close()
        worker.join()


def test_connector_request_budget_and_cancellation(storage, monkeypatch):
    storage.set("settings", {"network_enabled": True})
    service = IntegrationService(storage)
    calls = []
    def request(*args, **kwargs):
        calls.append(args)
        return httpx.Response(200, json={"ok": True})
    monkeypatch.setattr(httpx, "request", request)
    service.scope.budget = 1
    assert service.request("github", "/user", key="test") == {"ok": True}
    with pytest.raises(ValueError, match="request limit"):
        service.request("github", "/user", key="test")
    service.scope.budget = None
    service.scope.cancel = threading.Event()
    service.scope.cancel.set()
    with pytest.raises(InterruptedError):
        service.request("github", "/user", key="test")
    assert len(calls) == 1


def test_docx_decompression_limit():
    content = io.BytesIO()
    with zipfile.ZipFile(content, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("word/document.xml", b"x" * (20 * 1024 * 1024 + 1))
    with pytest.raises(ValueError, match="expanded"):
        FileIngester.parse_bytes("large.docx", content.getvalue())


def test_pdf_page_limit(monkeypatch):
    import pypdf
    class Reader:
        is_encrypted = False
        pages = [None] * 1001
    monkeypatch.setattr(pypdf, "PdfReader", lambda *args: Reader())
    with pytest.raises(ValueError, match="1,000"):
        FileIngester.parse_bytes("large.pdf", b"placeholder")
