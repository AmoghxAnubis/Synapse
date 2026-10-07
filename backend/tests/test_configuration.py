import os
import subprocess
import sys
from pathlib import Path
from app.core.config import BACKEND_DIR, resolve_data_dir


def test_relative_data_path_is_independent_of_working_directory(tmp_path, monkeypatch):
    expected = BACKEND_DIR / "custom-data"
    for directory in [tmp_path, BACKEND_DIR, BACKEND_DIR.parent]:
        monkeypatch.chdir(directory)
        assert resolve_data_dir("custom-data") == expected.resolve()
    assert resolve_data_dir(str(tmp_path)) == tmp_path.resolve()


def test_dotenv_loads_before_data_path_is_derived(tmp_path):
    # Inject dotenv in a fresh interpreter: no edit to the user's real .env.
    script = """
import os, sys, types
from pathlib import Path
module = types.ModuleType("dotenv")
def load_dotenv(path):
    assert Path(path).name == ".env"
    os.environ["SYNAPSE_DATA_DIR"] = "from-dotenv"
module.load_dotenv = load_dotenv
sys.modules["dotenv"] = module
from app.core.config import DATA_DIR, BACKEND_DIR
assert DATA_DIR == BACKEND_DIR / "from-dotenv"
"""
    env = dict(os.environ, PYTHONPATH=str(BACKEND_DIR))
    result = subprocess.run([sys.executable, "-c", script], cwd=tmp_path, env=env, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
