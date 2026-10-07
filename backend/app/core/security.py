"""Single-user local pairing; all data and actions require a session."""
import hmac
import os
import secrets
import threading
from fastapi import HTTPException, Request
from .config import prepare_data_dir

_token = None
_lock = threading.Lock()


def api_token():
    global _token
    with _lock:
        if _token is None:
            configured = os.getenv("SYNAPSE_API_TOKEN")
            if configured and len(configured) < 32:
                raise RuntimeError("SYNAPSE_API_TOKEN must contain at least 32 characters")
            token_path = prepare_data_dir() / "api-token"
            if configured:
                _token = configured
            else:
                try:
                    with token_path.open("x", encoding="utf-8") as file:
                        file.write(secrets.token_urlsafe(48))
                    token_path.chmod(0o600)
                except FileExistsError:
                    pass
                _token = token_path.read_text(encoding="utf-8").strip()
                if len(_token) < 32:
                    raise RuntimeError("Invalid local pairing token; restore or regenerate it")
        return _token


def require_session(request: Request):
    supplied = request.headers.get("authorization", "")
    if not supplied.startswith("Bearer ") or not hmac.compare_digest(supplied[7:].encode("utf-8"), api_token().encode("utf-8")):
        raise HTTPException(401, "Pair this browser with your local Synapse backend.")
