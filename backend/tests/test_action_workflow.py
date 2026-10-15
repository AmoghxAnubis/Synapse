"""Real SQLite/LangGraph recovery; process launching is always mocked."""
from concurrent.futures import ThreadPoolExecutor
import json
import time

import pytest
from fastapi.testclient import TestClient

from app.core import actions
from app.core.actions import ActionService
from app.core.agent_store import AgentStore
from app.core.storage import Storage
from app.main import create_app
from app.workflows.actions import run_action
from conftest import LLM


@pytest.fixture
def local_action(storage, monkeypatch):
    calls = []
    monkeypatch.setattr(actions.platform, "system", lambda: "Windows")
    monkeypatch.setattr(actions.subprocess, "Popen", lambda *args, **kwargs: calls.append((args, kwargs)))
    agents = AgentStore(storage)
    service = ActionService(storage, None)
    record = service.preview("open_app", {"app": "calculator"}, agents.get_agent_by_id(2))
    assert not calls
    return service, record, agents, calls


def test_checkpoint_and_approval_survive_service_restart(storage, local_action):
    _, record, agents, calls = local_action
    restarted = ActionService(Storage(storage.path), None)
    assert restarted.list_pending() == [record]
    assert restarted.approve(record["id"], agents, False) == {"message": "App opened."}
    assert len(calls) == 1 and calls[0][0][0] == ["calc.exe"]
    assert calls[0][1] == {"shell": False}
    assert restarted.status(record["id"])["status"] == "completed"
    assert restarted.list_pending() == []
    with pytest.raises(ValueError):
        ActionService(Storage(storage.path), None).approve(record["id"], agents, False)


def test_reject_after_restart_cannot_execute(storage, local_action):
    _, record, agents, calls = local_action
    restarted = ActionService(Storage(storage.path), None)
    assert restarted.cancel(record["id"])
    assert not restarted.cancel(record["id"])
    assert restarted.status(record["id"])["status"] == "cancelled"
    with pytest.raises(ValueError):
        restarted.approve(record["id"], agents, False)
    assert not calls


def test_expiration_survives_restart_and_never_refreshes(storage, local_action):
    _, record, agents, calls = local_action
    record["expires"] = time.time() - 1
    with storage.connect() as db:
        db.execute("UPDATE action_runs SET record=? WHERE id=?", (json.dumps(record), record["id"]))
    restarted = ActionService(storage, None)
    assert not restarted.list_pending()
    with pytest.raises(ValueError):
        restarted.approve(record["id"], agents, False)
    assert restarted.status(record["id"])["status"] == "expired"
    assert not calls


def test_current_permission_checked_on_resumption(storage, local_action):
    _, record, agents, calls = local_action
    agents.update_agent(2, {"capabilities": {"terminal": False}})
    with pytest.raises(PermissionError):
        ActionService(storage, None).approve(record["id"], agents, False)
    assert not calls
    assert ActionService(storage, None).status(record["id"])["status"] == "failed"


def test_concurrent_services_only_one_launch(storage, local_action):
    _, record, agents, calls = local_action
    def approve(_):
        try:
            return ActionService(Storage(storage.path), None).approve(record["id"], agents, False)
        except ValueError:
            return None
    with ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = list(pool.map(approve, range(2)))
    assert sum(result is not None for result in outcomes) == 1
    assert len(calls) == 1


def test_crash_after_claim_never_replays_launch(storage, local_action, monkeypatch):
    service, record, agents, calls = local_action
    class SimulatedCrash(BaseException):
        pass
    def launch(*args, **kwargs):
        calls.append(args)
        raise SimulatedCrash()
    monkeypatch.setattr(actions.subprocess, "Popen", launch)
    with pytest.raises(SimulatedCrash):
        service.approve(record["id"], agents, False)
    restarted = ActionService(Storage(storage.path), None)
    assert restarted.status(record["id"])["status"] == "executing"
    with pytest.raises(ValueError):
        restarted.approve(record["id"], agents, False)
    assert len(calls) == 1


def test_launch_failure_consumes_approval(local_action, monkeypatch):
    service, record, agents, calls = local_action
    def fail(*args, **kwargs):
        raise OSError("missing app")
    monkeypatch.setattr(actions.subprocess, "Popen", fail)
    with pytest.raises(RuntimeError, match="fresh preview"):
        service.approve(record["id"], agents, False)
    assert service.status(record["id"])["status"] == "failed"
    with pytest.raises(ValueError):
        service.approve(record["id"], agents, False)


def test_checkpoint_error_after_success_preserves_durable_result(local_action, monkeypatch):
    service, record, agents, calls = local_action
    original = actions.run_action
    def fail_after_result(*args, **kwargs):
        result = original(*args, **kwargs)
        if kwargs.get("approved"):
            raise RuntimeError("checkpoint unavailable after execution")
        return result
    monkeypatch.setattr(actions, "run_action", fail_after_result)
    with pytest.raises(RuntimeError):
        service.approve(record["id"], agents, False)
    assert service.status(record["id"])["result"] == {"message": "App opened."}
    assert service.status(record["id"])["status"] == "completed"
    with pytest.raises(ValueError):
        service.approve(record["id"], agents, False)
    assert len(calls) == 1


def test_resume_without_checkpoint_does_not_execute(storage):
    calls = []
    with pytest.raises(ValueError, match="checkpoint"):
        run_action(storage, "missing", approved=True, execute=lambda _: calls.append(1))
    assert not calls


def test_backup_contains_checkpoint_and_ledger(storage, local_action, tmp_path):
    _, record, agents, calls = local_action
    destination = tmp_path / "restored.sqlite3"
    storage.backup(destination)
    restored = ActionService(Storage(destination), None)
    assert restored.approve(record["id"], agents, False)["message"] == "App opened."
    assert len(calls) == 1


def test_portable_restore_invalidates_stale_approval(storage, local_action, tmp_path):
    from app.backup import restore_backup
    import zipfile
    _, record, agents, calls = local_action
    snapshot = tmp_path / "snapshot.sqlite3"
    storage.backup(snapshot)
    archive = tmp_path / "snapshot.zip"
    with zipfile.ZipFile(archive, "w") as output:
        output.write(snapshot, "metadata.sqlite3")
        output.writestr("manifest.json", json.dumps({"version": 1, "embedding": "all-MiniLM-L6-v2/384"}))
        output.writestr("vectors.json", json.dumps({"ids": [], "documents": [], "metadatas": [], "embeddings": []}))
    target = restore_backup(archive, tmp_path / "restored")
    restored = ActionService(Storage(target / "metadata.sqlite3"), None)
    assert restored.status(record["id"])["status"] == "cancelled"
    assert not restored.list_pending()
    with pytest.raises(ValueError):
        restored.approve(record["id"], agents, False)
    assert not calls


def test_real_api_restart_pending_status_and_approval(storage, memory, headers, monkeypatch):
    monkeypatch.setattr(actions.platform, "system", lambda: "Windows")
    calls = []
    monkeypatch.setattr(actions.subprocess, "Popen", lambda *a, **kw: calls.append(a))
    def app():
        return create_app(storage=Storage(storage.path), memory_factory=lambda: memory, llm_factory=LLM)
    with TestClient(app()) as api:
        record = api.post("/actions/preview", headers=headers, json={"action": "open_app", "agent_id": 2, "params": {"app": "calculator"}}).json()
    with TestClient(app()) as api:
        path = "/actions/" + record["id"]
        assert api.get("/actions/pending").status_code == 401
        assert api.get(path).status_code == 401
        assert api.get("/actions/pending", headers=headers).json() == [record]
        assert api.get(path, headers=headers).json()["status"] == "pending"
        assert api.post(path + "/approve", headers=headers).status_code == 200
        assert api.get(path, headers=headers).json()["status"] == "completed"
        assert api.post(path + "/approve", headers=headers).status_code == 400
        assert api.get("/actions/missing", headers=headers).status_code == 404
    assert len(calls) == 1
