"""Inspect local embedding files without importing or initializing a model."""
import os
from pathlib import Path
from .config import BACKEND_DIR, DATA_DIR


def embedding_directory():
    directory = Path(os.getenv("SYNAPSE_EMBEDDING_DIR", str(DATA_DIR / "models" / "minilm"))).expanduser()
    return (directory if directory.is_absolute() else BACKEND_DIR / directory).resolve()


def embedding_file_status():
    directory = embedding_directory()
    files_present = any((directory / filename).is_file() for filename in ("model.onnx", "onnx/model.onnx"))
    return {"ready": False, "state": "not_loaded" if files_present else "missing", "directory": str(directory),
            "files_present": files_present, "hardware": None,
            "error": None if files_present else "Install the document model using the model setup steps, then check setup again."}
