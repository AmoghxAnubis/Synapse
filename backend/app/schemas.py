from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator
import ipaddress
from urllib.parse import urlsplit
from .core.config import PLATFORMS

Platform = Literal["github", "notion", "jira", "slack", "discord"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Capabilities(StrictModel):
    web_search: bool = False
    terminal: bool = False


class AgentCreate(StrictModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=1000)
    icon: str = Field(default="Bot", max_length=40)
    system_instruction: str = Field(default="", max_length=10000)
    capabilities: Capabilities = Field(default_factory=Capabilities)
    linked_sources: list[str] = Field(default_factory=list, max_length=100)
    integrations: list[Platform] = Field(default_factory=list)


class AgentUpdate(StrictModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=1000)
    icon: str | None = Field(default=None, max_length=40)
    system_instruction: str | None = Field(default=None, max_length=10000)
    capabilities: Capabilities | None = None
    linked_sources: list[str] | None = Field(default=None, max_length=100)
    integrations: list[Platform] | None = None


class Query(StrictModel):
    text: str = Field(min_length=1, max_length=8000)
    selected_sources: list[str] = Field(default_factory=list, max_length=100)
    agent_id: int | None = None
    conversation_id: str | None = Field(default=None, max_length=100)
    allow_web: bool = False

    @field_validator("text")
    @classmethod
    def nonblank(cls, value):
        if not value.strip():
            raise ValueError("Enter a question.")
        return value.strip()


class Settings(StrictModel):
    ollama_url: str = "http://127.0.0.1:11434"
    model: str = Field(default="llama3", min_length=1, max_length=100, pattern=r"^[A-Za-z0-9_.:/-]+$")
    network_enabled: bool = False
    retrieval_max_distance: float = Field(default=0.65, ge=0, le=2)

    @field_validator("ollama_url")
    @classmethod
    def local_ollama(cls, value):
        parsed = urlsplit(value)
        if parsed.scheme != "http" or parsed.username or parsed.password or parsed.path not in ("", "/") or parsed.query or parsed.fragment:
            raise ValueError("Use a local HTTP Ollama address without a path.")
        if parsed.hostname != "localhost":
            try:
                if not ipaddress.ip_address(parsed.hostname or "").is_loopback:
                    raise ValueError()
            except ValueError:
                raise ValueError("Ollama must run on a loopback address.")
        return value.rstrip("/")


class IntegrationConnect(StrictModel):
    key: str = Field(min_length=1, max_length=4000)
    resources: list[str] = Field(min_length=1, max_length=20)
    server: str = Field(default="", max_length=300)
    email: str = Field(default="", max_length=300)


class URLIngest(StrictModel):
    url: str = Field(min_length=1, max_length=2000)


class SearchRequest(StrictModel):
    query: str = Field(min_length=1, max_length=8000)
    agent_id: int
    consent: bool = False
    max_results: int = Field(default=3, ge=1, le=5)


class TerminalRequest(StrictModel):
    command: str = Field(min_length=1, max_length=100)
    agent_id: int


class ActionPreview(StrictModel):
    action: Literal["open_app", "github.create_issue", "slack.send_message", "discord.send_message"]
    params: dict[str, str]
    agent_id: int


class ModeRequest(StrictModel):
    mode: Literal["FOCUS", "MEETING", "RESEARCH"]


class Task(StrictModel):
    id: int
    text: str = Field(max_length=2000)
    completed: bool = False


class Meetings(StrictModel):
    notes: str = Field(default="", max_length=200000)
    tasks: list[Task] = Field(default_factory=list, max_length=1000)
