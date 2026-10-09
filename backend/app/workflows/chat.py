"""Scoped RAG with explicit generation/abstention branches and API-compatible events.

Conversation storage remains owned by the API. No execution checkpoints are
written: interrupted answers must not resume or persist a partial turn.
"""
import threading
import re
from typing import Any, TypedDict
from fastapi import HTTPException
from langgraph.config import get_stream_writer
from langgraph.graph import END, START, StateGraph
from langsmith import tracing_context
from ..ai.retriever import citation, retrieve_documents

ABSTENTION = "I couldn't find supporting information in the selected sources. Add a relevant document or choose a different source."


class ChatTokens:
    """Close the graph even when a client leaves before requesting a token."""
    def __init__(self, events):
        self.events = events

    def __iter__(self):
        return self

    def __next__(self):
        for event in self.events:
            if event["type"] == "token":
                return event["text"]
        raise StopIteration

    def close(self):
        self.events.close()


class ChatState(TypedDict, total=False):
    agent: Any
    history: list
    chosen: list[str] | None
    retrieval_query: str
    citations: list[dict]
    context: str
    used: list[str]


def stream_chat(query, services):
    """Create request-local state and cooperatively stop generation on close."""
    cancelled = threading.Event()

    def scope(state):
        agent = services.agent(query.agent_id)
        history = services.storage.messages(query.conversation_id) if query.conversation_id else []
        chosen = query.selected_sources or None
        restricted = agent.get("linked_sources") if agent else None
        if restricted:
            chosen = [source for source in restricted if chosen is None or source in chosen]
        previous = next((m["content"] for m in reversed(history) if m["role"] == "user"), "")
        referential = re.search(r"\b(?:it|its|that|those|their|they|this|them)\b", query.text, re.I)
        retrieval_query = query.text + ("\n" + previous[:1000] if previous and referential and len(query.text.split()) < 12 else "")
        return {"agent": agent, "history": history, "chosen": chosen, "retrieval_query": retrieval_query}

    def retrieve(state):
        documents = retrieve_documents(services.memory, state["retrieval_query"], state["chosen"], services.settings.retrieval_max_distance)
        citations = [citation(document) for document in documents]
        used = []
        if query.allow_web:
            services.network()
            capabilities = state["agent"].get("capabilities", {}) if state["agent"] else {}
            if not capabilities.get("web_search"):
                raise HTTPException(403, "Select an agent with web search enabled.")
            from ddgs import DDGS
            results = list(DDGS(timeout=15).text(query.text, max_results=3))
            citations.extend({"id": r["href"], "source": r["title"], "page": 1, "chunk": 1, "url": r["href"], "text": r["body"], "distance": 0} for r in results)
            used.append("web_search")
        context = "\n\n".join(f"[{i+1}] {c['source']} (page {c['page']})\n{c['text']}" for i, c in enumerate(citations))
        get_stream_writer()({"type": "sources", "citations": citations, "capabilities_used": used})
        return {"citations": citations, "context": context, "used": used}

    def generate(state):
        if cancelled.is_set():
            return {}
        agent = state["agent"]
        tokens = services.llm.stream_answer(state["context"], query.text,
                                           agent.get("system_instruction") if agent else None, state["history"])
        try:
            for token in tokens:
                if cancelled.is_set():
                    break
                get_stream_writer()({"type": "token", "text": token})
        finally:
            tokens.close()
        return {}

    def abstain(state):
        if not cancelled.is_set():
            get_stream_writer()({"type": "token", "text": ABSTENTION})
        return {}

    builder = StateGraph(ChatState)
    builder.add_node("scope", scope)
    builder.add_node("retrieve", retrieve)
    builder.add_node("generate", generate)
    builder.add_node("abstain", abstain)
    builder.add_edge(START, "scope")
    builder.add_edge("scope", "retrieve")
    builder.add_conditional_edges("retrieve", lambda state: "generate" if state["citations"] else "abstain")
    builder.add_edge("generate", END)
    builder.add_edge("abstain", END)
    # Explicitly suppress inherited cloud tracing for private local evidence.
    with tracing_context(enabled=False):
        events = builder.compile().stream({}, stream_mode="custom")
        try:
            # Do not delegate close with yield-from: set cancellation before
            # LangGraph waits for its running generation node to finish.
            for event in events:
                yield event
        finally:
            cancelled.set()
            events.close()
