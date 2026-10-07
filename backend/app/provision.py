"""Explicit network-enabled model provisioning, never performed at startup."""
import json
from huggingface_hub import HfApi, snapshot_download
from .core.config import DATA_DIR, prepare_data_dir


def main():
    prepare_data_dir()
    repo = "optimum/all-MiniLM-L6-v2"
    revision = HfApi().model_info(repo).sha
    directory = DATA_DIR / "models" / "minilm"
    snapshot_download(repo_id=repo, revision=revision, local_dir=directory,
                      allow_patterns=["*.json", "*.txt", "model.onnx", "onnx/model.onnx"])
    (directory / "synapse-model.json").write_text(json.dumps({"repository": repo, "revision": revision}, indent=2), encoding="utf-8")
    print(f"Embedding model installed in {directory}. Core use requires no model downloads.")


if __name__ == "__main__":
    main()
