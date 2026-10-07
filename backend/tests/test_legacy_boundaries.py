import importlib
import pytest


@pytest.mark.parametrize("module, name", [
    ("app.agents.agent_manager", "AgentManager"),
    ("app.agents.agent_manager_new", "AgentManager"),
    ("app.agents.tools.app_launcher", "AppLauncher"),
    ("app.agents.tools.mcp_combo_client", "MCPComboClient"),
    ("app.core.orchestrator", "Orchestrator"),
])
def test_legacy_execution_paths_fail_closed(module, name):
    imported = importlib.import_module(module)
    with pytest.raises(RuntimeError, match="retired"):
        getattr(imported, name)()
