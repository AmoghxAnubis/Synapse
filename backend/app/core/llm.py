import requests
import json
from typing import Optional, Any, Dict, Union
from pydantic import BaseModel

class LLMResponse(BaseModel):
    message: str
    sources: list[str] = []

class LocalLLM:
    def __init__(self, model: str = "llama3"):
        self.model = model
        self.api_url = "http://localhost:11434/api/generate"

    def generate_answer(
        self, 
        user_input: str, 
        context: str = "", 
        mode: str = "DEFAULT", 
        tool_result: Optional[Union[str, Dict[str, Any]]] = None
    ) -> str:
        """
        Unified LLM reasoning with full pipeline context.
        """
        # Format tool_result if present
        tool_section = ""
        if tool_result:
            if isinstance(tool_result, dict):
                tool_str = json.dumps(tool_result, indent=2)
            else:
                tool_str = str(tool_result)
            tool_section = f"""
TOOL EXECUTION RESULT:
{tool_str}

IMPORTANT: Reference this result in your response if relevant."""

        prompt = f"""
You are Synapse, a local-first AI OS assistant and agent orchestrator.

SYSTEM CONTEXT:
- Active Mode: {mode.upper()}
- Conversation Context: {context}
{tool_section}

USER INPUT: {user_input}

INSTRUCTIONS:
- Respond concisely and actionably.
- Reference CONTEXT and TOOL RESULT where relevant.
- For {mode} mode, prioritize related actions/workflows.
- Structure response: Explanation → Next Steps → Summary.
- If tools were used, confirm success and suggest follow-ups.

FINAL RESPONSE:"""

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "top_p": 0.9
            }
        }
        
        try:
            response = requests.post(self.api_url, json=payload, timeout=60)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "Error generating response.").strip()
        except Exception as e:
            return f"LLM Connection Failed: {str(e)}. Check if Ollama is running with 'ollama serve'."

# TEST RUNNER
if __name__ == "__main__":
    llm = LocalLLM("llama3")
    print(llm.generate_answer(
        user_input="Summarize the meeting notes",
        context="Notes about team sync...",
        mode="MEETING",
        tool_result={"action": "retrieved_notes", "count": 5}
    ))

