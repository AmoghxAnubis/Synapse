import onnxruntime as ort
import numpy as np
from huggingface_hub import hf_hub_download
from transformers import AutoTokenizer
import os

class AMDBridge:
    def __init__(self):
        print("\n--- 🧠 SYNAPSE HARDWARE CHECK ---")
        self.providers = ort.get_available_providers()
        
        # 1. Hardware Detection Logic
        if 'VitisAIExecutionProvider' in self.providers:
            print("✅ SUCCESS: AMD Ryzen AI (NPU) Detected.")
            self.execution_providers = ['VitisAIExecutionProvider']
            self.hardware_mode = "NPU"
        elif 'ROCMExecutionProvider' in self.providers:
            print("✅ SUCCESS: AMD ROCm (GPU) Detected.")
            self.execution_providers = ['ROCMExecutionProvider']
            self.hardware_mode = "GPU"
        else:
            print("⚠️ AMD Hardware not found.")
            print("🔄 ACTIVATE: Compatibility Mode (CPU Fallback).")
            self.execution_providers = ['CPUExecutionProvider']
            self.hardware_mode = "CPU_MOCK"

        # 2. Load the Model (ONNX)
        self.model_name = "optimum/all-MiniLM-L6-v2"
        self.model_path = self._get_model()
        self.session = ort.InferenceSession(self.model_path, providers=self.execution_providers)
        
        # 3. Load the Tokenizer
        print("📖 Loading Tokenizer...")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)

    def _get_model(self):
        return hf_hub_download(repo_id=self.model_name, filename="model.onnx")

    def embed_text(self, text):
        """
        Real vectorization logic with robust input handling.
        """
        # A. Tokenize the text
        inputs = self.tokenizer(text, return_tensors="np", padding=True, truncation=True)
        
        # B. PREPARE INPUTS (The Fix: Handle missing token_type_ids)
        # Some tokenizers don't return token_type_ids for single sentences, 
        # but the ONNX model expects them. We create them manually if missing.
        
        input_ids = inputs['input_ids'].astype(np.int64)
        attention_mask = inputs['attention_mask'].astype(np.int64)
        
        if 'token_type_ids' in inputs:
            token_type_ids = inputs['token_type_ids'].astype(np.int64)
        else:
            # Create a matrix of zeros with the same shape as input_ids
            token_type_ids = np.zeros_like(input_ids).astype(np.int64)

        ort_inputs = {
            'input_ids': input_ids,
            'attention_mask': attention_mask,
            'token_type_ids': token_type_ids
        }
        
        # C. Run Inference
        outputs = self.session.run(None, ort_inputs)
        
        # D. Mean Pooling
        last_hidden_state = outputs[0]
        embedding = self._mean_pooling(last_hidden_state, attention_mask)
        
        return embedding[0].tolist()

    def _mean_pooling(self, model_output, attention_mask):
        token_embeddings = model_output
        input_mask_expanded = np.expand_dims(attention_mask, -1)
        input_mask_expanded = np.broadcast_to(input_mask_expanded, token_embeddings.shape)
        sum_embeddings = np.sum(token_embeddings * input_mask_expanded, axis=1)
        sum_mask = np.clip(input_mask_expanded.sum(axis=1), a_min=1e-9, a_max=None)
        return sum_embeddings / sum_mask

# TEST RUNNER
if __name__ == "__main__":
    bridge = AMDBridge()
    test_sentence = "AMD Ryzen AI is powerful."
    vector = bridge.embed_text(test_sentence)
    
    print(f"\n🧪 TEST: Text converted to vector successfully.")
    print(f"📏 Vector Dimensions: {len(vector)}") # Should be 384
    print(f"🔢 First 5 numbers: {vector[:5]}")