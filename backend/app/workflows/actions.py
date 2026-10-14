"""Durable local-app approval interrupt; no LLM or automatic tool dispatch."""
import sqlite3
from typing import TypedDict

from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt
from langsmith import tracing_context


class ActionState(TypedDict, total=False):
    record: dict
    approved: bool
    result: dict


def run_action(storage, identifier, *, record=None, approved=None, execute=None):
    """Open/close a request-local saver in the metadata DB (included in backups).

    The approval node has no side effects before interrupt because LangGraph
    replays that node on resume. The service's durable ledger, not graph replay,
    grants permission to attempt a side effect at most once in this database.
    """
    def approval(state):
        decision = interrupt(state["record"])
        if type(decision) is not bool:
            raise ValueError("Approval must be a boolean.")
        return {"approved": decision}

    def execution(state):
        if execute is None:
            raise RuntimeError("Execution is unavailable outside explicit approval.")
        return {"result": execute(state["record"])}

    builder = StateGraph(ActionState)
    builder.add_node("approval", approval)
    builder.add_node("execute", execution)
    builder.add_edge(START, "approval")
    builder.add_conditional_edges("approval", lambda state: "execute" if state["approved"] else END)
    builder.add_edge("execute", END)
    connection = sqlite3.connect(storage.path, timeout=30, check_same_thread=False)
    try:
        graph = builder.compile(checkpointer=SqliteSaver(connection))
        config = {"configurable": {"thread_id": "local-action:" + identifier}}
        with tracing_context(enabled=False):
            if record is not None:
                result = graph.invoke({"record": record}, config, durability="sync")
                if not result.get("__interrupt__"):
                    raise RuntimeError("Action did not pause for approval.")
                return result
            snapshot = graph.get_state(config)
            if not any(task.interrupts for task in snapshot.tasks):
                raise ValueError("No pending approval checkpoint.")
            return graph.invoke(Command(resume=approved), config, durability="sync")
    finally:
        connection.close()
