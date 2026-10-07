"""Retired demo workflow engine; modes are saved preferences in the active API.

App launching must use the authenticated, explicitly approved Actions workflow.
"""


class Orchestrator:
    def __init__(self, *args, **kwargs):
        raise RuntimeError("This legacy execution path is retired. Use the authenticated Actions workflow.")
