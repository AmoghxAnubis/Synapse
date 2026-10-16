"""Verify approval/recovery across fresh interpreters using disposable data.

Real SQLite/LangGraph/Chroma and portable backup/restore; app launches are mocked.
No live provider calls, credentials, user workspace or Windows input automation.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import subprocess
import sys
import tempfile
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))


def worker(args):
    from app.core.config import DATA_DIR
    from app.core.storage import Storage
    from app.core.agent_store import AgentStore
    from app.core.actions import ActionService
    from app import backup
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    storage = Storage()
    journal_path = args.root / "journal.json"
    journal = json.loads(journal_path.read_text()) if journal_path.exists() else {}
    if args.worker == "prepare":
        # Suppress legacy imports from the developer's backend directory.
        storage.set("agents", [])
        storage.set("meetings", {"notes": "Recovery fixture note", "tasks": []})
        storage.set("settings", {"model": "fixture-model", "network_enabled": False})
        storage.set("integration:github", {"connected": True, "resources": ["fixture/only"]})
        agents = AgentStore(storage)
        agent = agents.add_agent({"name": "Recovery fixture", "capabilities": {"terminal": True}})
        service = ActionService(storage, None)
        journal["agent_id"] = agent["id"]
        with patch("app.core.actions.platform.system", return_value="Windows"), patch("app.core.actions.subprocess.Popen") as launch:
            for name in ("approved", "cancelled", "revoked", "expired", "restore_pending"):
                journal[name] = service.preview("open_app", {"app": "calculator"}, agent)
            assert launch.call_count == 0
        conversation = storage.new_conversation()
        storage.save_turn(conversation["id"], "Who owns this fixture?", "Mira [1].", [{"source": "recovery.md", "page": 1}])
        journal["conversation_id"] = conversation["id"]
        import chromadb
        from chromadb.config import Settings
        collection = chromadb.PersistentClient(path=str(DATA_DIR / "vectors"), settings=Settings(anonymized_telemetry=False)).get_or_create_collection("synapse_v1", metadata={"hnsw:space": "cosine"})
        collection.upsert(ids=["recovery:0"], documents=["Recovery fixture owner is Mira."], embeddings=[[1.0] + [0.0] * 383], metadatas=[{"source": "recovery.md", "page": 1}])
        journal["prepared_without_launch"] = True
    elif args.worker == "resume":
        agents = AgentStore(storage)
        service = ActionService(storage, None)
        for name in ("approved", "cancelled", "revoked", "expired", "restore_pending"):
            assert service.status(journal[name]["id"])["expires"] == journal[name]["expires"]
        with patch("app.core.actions.platform.system", return_value="Windows"), patch("app.core.actions.subprocess.Popen") as launch:
            assert service.approve(journal["approved"]["id"], agents, False)["message"] == "App opened."
            assert launch.call_count == 1
            assert launch.call_args.kwargs == {"shell": False}
            assert service.cancel(journal["cancelled"]["id"])
            agents.update_agent(journal["agent_id"], {"capabilities": {"terminal": False}})
            try:
                service.approve(journal["revoked"]["id"], agents, False)
                raise AssertionError("Removed permission executed")
            except PermissionError:
                pass
            agents.update_agent(journal["agent_id"], {"capabilities": {"terminal": True}})
            with patch("app.core.actions.time.time", return_value=journal["expired"]["expires"] + 1):
                try:
                    service.approve(journal["expired"]["id"], agents, False)
                    raise AssertionError("Expired action executed")
                except ValueError:
                    pass
            assert launch.call_count == 1
        journal["restart_deadlines_preserved"] = True
        journal["approved_attempts"] = 1
        journal["cancel_permission_expiry_blocked"] = True
    elif args.worker == "replay":
        service = ActionService(storage, None)
        agents = AgentStore(storage)
        with patch("app.core.actions.subprocess.Popen") as launch:
            for name, expected in (("approved", "completed"), ("cancelled", "cancelled"), ("revoked", "failed"), ("expired", "expired")):
                assert service.status(journal[name]["id"])["status"] == expected
                try:
                    service.approve(journal[name]["id"], agents, False)
                    raise AssertionError("Consumed approval replayed")
                except ValueError:
                    pass
            assert launch.call_count == 0
        assert service.status(journal["restore_pending"]["id"])["status"] == "pending"
        journal["replay_blocked_after_second_restart"] = True
    elif args.worker == "backup":
        journal["archive"] = str(backup.create_backup(args.root / "fixture-backup.zip"))
    elif args.worker == "restore":
        restored = backup.restore_backup(journal["archive"], args.root / "restored")
        recovered = Storage(restored / "metadata.sqlite3")
        service = ActionService(recovered, None)
        assert service.status(journal["restore_pending"]["id"])["status"] == "cancelled"
        assert service.status(journal["approved"]["id"])["status"] == "completed"
        assert recovered.get("settings")["model"] == "fixture-model"
        assert recovered.get("meetings")["notes"] == "Recovery fixture note"
        assert recovered.get("integration:github") is None
        assert len(recovered.messages(journal["conversation_id"])) == 2
        with patch("app.core.actions.subprocess.Popen") as launch:
            try:
                service.approve(journal["restore_pending"]["id"], AgentStore(recovered), False)
                raise AssertionError("Restored approval replayed")
            except ValueError:
                pass
            assert launch.call_count == 0
        import chromadb
        from chromadb.config import Settings
        data = chromadb.PersistentClient(path=str(restored / "vectors"), settings=Settings(anonymized_telemetry=False)).get_collection("synapse_v1").get(include=["documents"])
        assert data["documents"] == ["Recovery fixture owner is Mira."]
        journal["portable_restore_preserves_data"] = True
        journal["portable_restore_cancels_pending_approval"] = True
        journal["portable_restore_disconnects_integrations"] = True
    journal_path.write_text(json.dumps(journal, indent=2), encoding="utf-8")
    print("PASS:", args.worker, flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--worker", choices=["prepare", "resume", "replay", "backup", "restore"], help=argparse.SUPPRESS)
    parser.add_argument("--root", type=Path, help=argparse.SUPPRESS)
    args = parser.parse_args()
    if args.worker:
        if args.root is None:
            parser.error("Internal workers require an isolated root")
        worker(args)
        return
    if args.output is None or args.output.exists():
        parser.error("Choose a new --output artifact; previous results are preserved")
    scratch = ROOT / ".tmp"
    scratch.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="action-recovery-", dir=scratch) as directory:
        path = Path(directory)
        env = dict(os.environ, SYNAPSE_DATA_DIR=str(path / "data"), HF_HUB_OFFLINE="1", ANONYMIZED_TELEMETRY="False")
        for phase in ("prepare", "resume", "replay", "backup", "restore"):
            subprocess.run([sys.executable, str(Path(__file__).resolve()), "--worker", phase, "--root", str(path)], env=env, check=True)
        journal = json.loads((path / "journal.json").read_text())
        result = {"source_revision": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip(),
                  "script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                  "python": platform.python_version(), "platform": platform.platform(),
                  "method": "Five fresh Python processes; real metadata/checkpoints/vectors/backup; process launches mocked; expiry uses a simulated clock",
                  "checks": {key: journal[key] for key in ("prepared_without_launch", "restart_deadlines_preserved", "cancel_permission_expiry_blocked", "replay_blocked_after_second_restart", "portable_restore_preserves_data", "portable_restore_cancels_pending_approval", "portable_restore_disconnects_integrations")},
                  "approved_launch_attempts_mocked": journal["approved_attempts"], "real_app_launches": 0,
                  "independent_or_second_machine_acceptance": False}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print("PASS: separate-process approval/recovery checkpoint; disposable data removed")


if __name__ == "__main__":
    main()
