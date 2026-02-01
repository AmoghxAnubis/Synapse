import requests
import json

class LocalLLM:
    def __init__(self, model="llama3"):
        self.model = model
        self.api_url = "http://localhost:11434/api/generate"

    def generate_answer(self, context, question):
        """
        Uses the Local LLM (Simulating AMD ROCm) to answer.
        """
        prompt = f"""
        You are Synapse, an intelligent OS assistant. 
        Use the following retrieved context to answer the user's question.
        
        CONTEXT:
        {context}
        
        USER QUESTION: 
        {question}
        
        ANSWER (Keep it concise and technical):
        """
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }
        
        try:
            response = requests.post(self.api_url, json=payload)
            data = response.json()
            return data.get("response", "Error generating response.")
        except Exception as e:
            return f"LLM Connection Failed: {str(e)}"