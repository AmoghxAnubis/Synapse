import httpx
from ollama import ResponseError
from langchain_ollama import ChatOllama
from langsmith import tracing_context
from ..ai.prompts import answer_messages
from ..schemas import Settings
import requests


class LocalLLM:
    def __init__(self, model="llama3.2:3b", base_url="http://127.0.0.1:11434"):
        self.model = model
        self.base_url = Settings(ollama_url=base_url).ollama_url
        self.session = requests.Session()
        self.session.trust_env = False

    def status(self):
        status = {"ready": False, "models": [], "model": self.model, "base_url": self.base_url,
                  "resolved_model": None, "model_digest": None, "state": "unavailable",
                  "error": "Start Ollama on this computer, then check setup again."}
        try:
            response = self.session.get(self.base_url + "/api/tags", timeout=3, allow_redirects=False)
            response.raise_for_status()
            if response.status_code != 200:
                return status
            payload = response.json()
            models = payload.get("models") if isinstance(payload, dict) else None
            if not isinstance(models, list) or any(not isinstance(m, dict) or not isinstance(m.get("name"), str) for m in models):
                raise ValueError("Invalid model inventory")
            selected = next((m for m in models if m["name"] == self.model), None)
            if selected is None:
                selected = next((m for m in models if m["name"] == self.model + ":latest"), None)
            digest = selected.get("digest") if selected else None
            status.update(ready=selected is not None, models=[m["name"] for m in models],
                          resolved_model=selected["name"] if selected else None,
                          model_digest=digest if isinstance(digest, str) else None,
                          state="ready" if selected else "missing_model",
                          error=None if selected else "Install the selected model in Ollama, or choose an installed model and save Settings.")
        except (ValueError, TypeError):
            status.update(state="invalid_response", error="Ollama returned an invalid model list. Check the local address and Ollama, then try again.")
        except requests.RequestException:
            pass
        return status

    def chat_model(self):
        return ChatOllama(model=self.model, base_url=self.base_url, temperature=0.1,
                          num_predict=2048, num_ctx=8192,
                          client_kwargs={"trust_env": False, "follow_redirects": False,
                                         "timeout": httpx.Timeout(120, connect=5)})

    def stream_answer(self, context, question, system_prompt=None, history=None):
        model = self.chat_model()
        stream = None
        try:
            with tracing_context(enabled=False):
                stream = model.stream(answer_messages(context, question, system_prompt, history))
                for chunk in stream:
                    if isinstance(chunk.content, str) and chunk.content:
                        yield chunk.content
        except (httpx.HTTPError, ResponseError, ConnectionError) as exc:
            raise RuntimeError("Local generation failed. Check Ollama, the selected model, and available memory.") from exc
        finally:
            if stream is not None:
                stream.close()
            # ChatOllama/Ollama currently expose no public synchronous close API.
            # Keep this version-specific cleanup confined to the adapter.
            model._client._client.close()
            self.session.close()

    def generate_answer(self, context, question, system_prompt=None, history=None):
        return "".join(self.stream_answer(context, question, system_prompt, history))
