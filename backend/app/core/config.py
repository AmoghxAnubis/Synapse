"""Configuration with a launch-directory-independent data boundary."""
import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")


def resolve_data_dir(value=None):
    selected = Path(value or ".synapse").expanduser()
    return (selected if selected.is_absolute() else BACKEND_DIR / selected).resolve()


DATA_DIR = resolve_data_dir(os.getenv("SYNAPSE_DATA_DIR"))
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
