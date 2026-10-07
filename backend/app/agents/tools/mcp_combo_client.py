"""Retired prototype entry point. Historical implementation remains in Git.

Use app.core.actions.ActionService and the authenticated /actions endpoints.
Natural-language routing must never bypass explicit permissions and approval.
"""


class MCPComboClient:
    def __init__(self, *args, **kwargs):
        raise RuntimeError("This legacy execution path is retired. Use the authenticated Actions workflow.")
