"""Configuration with a launch-directory-independent data boundary."""
import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = Path(os.getenv("SYNAPSE_DATA_DIR", str(BACKEND_DIR / ".synapse"))).expanduser().resolve()
MAX_UPLOAD_BYTES = 20 * 1024 * 1024
MAX_TEXT_CHARS = 2_000_000
PLATFORMS = ("github", "notion", "jira", "slack", "discord")


def prepare_data_dir():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    try:
        DATA_DIR.chmod(0o700)
    except OSError:
        pass
    return DATA_DIR
