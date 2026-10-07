"""Offline ONNX embeddings; model acquisition is an explicit setup step."""
import os
from pathlib import Path
import numpy as np
import onnxruntime as ort
os.environ.setdefault("USE_TORCH", "0")
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("USE_FLAX", "0")
from transformers import AutoTokenizer
from .config import DATA_DIR


class AMDBridge:
    def __init__(self, model_dir=None):
        directory = Path(model_dir or os.getenv("SYNAPSE_EMBEDDING_DIR", str(DATA_DIR / "models" / "minilm")))
        model_path = directory / "model.onnx"
        if not model_path.exists():
            model_path = directory / "onnx" / "model.onnx"
        if not model_path.exists():
            raise RuntimeError("Embedding model is not installed. Run: python -m app.provision")
        available = ort.get_available_providers()
        requested = os.getenv("SYNAPSE_ONNX_PROVIDER", "CPUExecutionProvider")
        if requested not in available:
            raise RuntimeError(f"Requested ONNX provider {requested} is unavailable. Available: {available}")
        self.session = ort.InferenceSession(str(model_path), providers=[requested, "CPUExecutionProvider"] if requested != "CPUExecutionProvider" else [requested])
        self.providers = self.session.get_providers()
        self.hardware_mode = {"CPUExecutionProvider": "CPU", "ROCMExecutionProvider": "GPU", "VitisAIExecutionProvider": "NPU", "DmlExecutionProvider": "GPU"}.get(self.providers[0], self.providers[0])
        self.tokenizer = AutoTokenizer.from_pretrained(str(directory), local_files_only=True)

    def embed_text(self, text):
        inputs = self.tokenizer(text, return_tensors="np", padding=True, truncation=True, max_length=256)
        if "token_type_ids" not in inputs:
            inputs["token_type_ids"] = np.zeros_like(inputs["input_ids"])
        feed = {spec.name: inputs[spec.name].astype(np.int64) for spec in self.session.get_inputs()}
        outputs = self.session.run(None, feed)
        hidden = outputs[0]
        if hidden.ndim == 3:
            mask = inputs["attention_mask"][..., None]
            vector = (hidden * mask).sum(axis=1) / np.clip(mask.sum(axis=1), 1e-9, None)
        else:
            vector = hidden
        normalized = vector / np.clip(np.linalg.norm(vector, axis=1, keepdims=True), 1e-9, None)
        return normalized[0].tolist()
