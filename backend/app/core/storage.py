"""Transactional metadata, conversations, and audit events."""
import json
import sqlite3
import time
import uuid
from contextlib import contextmanager
from .config import prepare_data_dir


class Storage:
    def __init__(self, path=None):
        self.path = path or prepare_data_dir() / "metadata.sqlite3"
        with self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY, title TEXT NOT NULL, updated REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL,
                    role TEXT NOT NULL, content TEXT NOT NULL, citations TEXT NOT NULL,
                    created REAL NOT NULL,
                    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
                );
                CREATE TABLE IF NOT EXISTS audit (
                    id INTEGER PRIMARY KEY, action TEXT NOT NULL, outcome TEXT NOT NULL, created REAL NOT NULL
                );
            """)
            db.execute("PRAGMA user_version = 1")

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=30)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys = ON")
        db.execute("PRAGMA journal_mode = WAL")
        try:
            with db:
                yield db
        finally:
            db.close()

    def get(self, key, default=None):
        with self.connect() as db:
            row = db.execute("SELECT value FROM kv WHERE key=?", (key,)).fetchone()
        return json.loads(row[0]) if row else default

    def set(self, key, value):
        with self.connect() as db:
            db.execute("INSERT INTO kv VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", (key, json.dumps(value)))

    def conversations(self):
        with self.connect() as db:
            return [dict(row) for row in db.execute("SELECT * FROM conversations ORDER BY updated DESC LIMIT 100")]

    def new_conversation(self, title="New conversation"):
        record = {"id": str(uuid.uuid4()), "title": title[:100], "updated": time.time()}
        with self.connect() as db:
            db.execute("INSERT INTO conversations VALUES (:id,:title,:updated)", record)
        return record

    def messages(self, conversation_id):
        with self.connect() as db:
            if not db.execute("SELECT 1 FROM conversations WHERE id=?", (conversation_id,)).fetchone():
                raise KeyError("Conversation not found")
            records = [dict(row) for row in db.execute("SELECT * FROM messages WHERE conversation_id=? ORDER BY created, rowid LIMIT 1000", (conversation_id,))]
        for row in records:
            row["citations"] = json.loads(row["citations"])
        return records

    def save_turn(self, conversation_id, question, answer, citations):
        with self.connect() as db:
            if not db.execute("SELECT 1 FROM conversations WHERE id=?", (conversation_id,)).fetchone():
                raise KeyError("Conversation not found")
            now = time.time()
            for role, content, refs in [("user", question, []), ("ai", answer, citations)]:
                db.execute("INSERT INTO messages VALUES (?,?,?,?,?,?,?)", (str(uuid.uuid4()), conversation_id, role, content, json.dumps(refs), now))
            db.execute("UPDATE conversations SET updated=?, title=CASE WHEN title='New conversation' THEN ? ELSE title END WHERE id=?", (now, question[:100], conversation_id))

    def delete_conversation(self, conversation_id):
        with self.connect() as db:
            return db.execute("DELETE FROM conversations WHERE id=?", (conversation_id,)).rowcount > 0

    def audit(self, action, outcome):
        with self.connect() as db:
            db.execute("INSERT INTO audit(action,outcome,created) VALUES (?,?,?)", (action[:200], outcome[:200], time.time()))

    def audit_log(self):
        with self.connect() as db:
            return [dict(row) for row in db.execute("SELECT * FROM audit ORDER BY id DESC LIMIT 100")]

    def backup(self, destination):
        with self.connect() as source:
            target = sqlite3.connect(destination)
            try:
                source.backup(target)
            finally:
                target.close()
