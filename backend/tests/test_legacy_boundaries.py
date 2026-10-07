import importlib
import pytest


@pytest.mark.parametrize("module", [
    "app.agents.agent_manager",
    "app.agents.agent_manager_new",
    "app.agents.tools.app_launcher",
    "app.agents.tools.mcp_combo_client",
])
def test_legacy_execution_paths_fail_closed(module):
    imported = importlib.import_module(module)
    constructor = getattr(imported, "AgentManager", None) or getattr(imported, "AppLauncher", None) or imported.MCPComboClient
    with pytest.raises(RuntimeError, match="retired"):
        constructor()
