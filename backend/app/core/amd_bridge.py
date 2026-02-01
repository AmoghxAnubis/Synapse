import onnxruntime as ort
import os
from huggingface_hub import hf_hub_download

class AMDBridge:
    def __init__(self):
        print("--- 🧠 SYNAPSE HARDWARE CHECK ---")
        self.providers = ort.get_available_providers()
        
        # 1. Check for Ryzen AI NPU
        if 'VitisAIExecutionProvider' in self.providers:
            print("✅ SUCCESS: AMD Ryzen AI (NPU) Detected.")
            self.execution_providers = ['VitisAIExecutionProvider']
            self.hardware_mode = "NPU"
            
        # 2. Check for AMD ROCm GPU
        elif 'ROCMExecutionProvider' in self.providers:
            print("✅ SUCCESS: AMD ROCm (GPU) Detected.")
            self.execution_providers = ['ROCMExecutionProvider']
            self.hardware_mode = "GPU"
            
        # 3. Fallback to CPU (Your Intel Laptop)
        else:
            print("⚠️ WARNING: AMD Hardware not found.")
            print("🔄 ACTIVATE: Compatibility Mode (CPU Fallback).")
            self.execution_providers = ['CPUExecutionProvider']
            self.hardware_mode = "CPU_MOCK"

        # Initialize the model
        self.model_path = self._get_model()
        self.session = ort.InferenceSession(self.model_path, providers=self.execution_providers)

    def _get_model(self):
        """Downloads the ONNX model automatically if missing."""
        print(f"📥 Loading Embedding Model on {self.hardware_mode}...")
        
        # We download a specific quantized ONNX model optimized for speed
        model_path = hf_hub_download(
            repo_id="optimum/all-MiniLM-L6-v2", 
            filename="model.onnx"
        )
        return model_path

    def embed_text(self, text):
        """
        Converts text to vector. 
        In Prod: Runs on NPU. 
        In Dev: Runs on CPU.
        """
        # Note: In a full implementation, we need a tokenizer here. 
        # For this MVP step, we will return a mock vector or add the tokenizer next.
        # This is just to test the Hardware connection.
        return [0.1, 0.2, 0.3] # Placeholder until we add Tokenizer in Step 4

# Simple test to run directly
if __name__ == "__main__":
    bridge = AMDBridge()
    print(f"System ready on: {bridge.hardware_mode}")