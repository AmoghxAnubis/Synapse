# Synapse AI Architecture Unification TODO

## Overview
Implementing unified pipeline: Orchestrator → Memory → AgentManager → Tools → Memory → LLM.

**Status: In Progress**

## Steps

### 1. ✅ Create this TODO.md [DONE]

### 2. ✅ Enhance backend/app/core/orchestrator.py [DONE]
- Add detect_mode(user_input) → {'mode': str, 'intent': str}
- Integrate mode keywords (MEETING, RESEARCH, FOCUS, WORKFLOW)
- Add get_context(mode)

### 3. ✅ Update backend/app/core/memory.py [DONE]
- Add mode param to recall/memorize (metadata filter)
- Test mode-based retrieval

### 4. ✅ Enhance backend/app/core/llm.py [DONE]
- Update generate_answer(user_input, context, mode, tool_result)
- Richer system prompt with all inputs

### 5. ✅ Update backend/app/agents/agent_manager.py [DONE]
- Add decide(user_input, context, mode) → action_plan dict
- Enhance execute(action_plan) using context/mode
- Preserve existing route_request as fallback

### 6. ✅ Refactor backend/app/main.py /ask endpoint [DONE]
- Implement full pipeline sequence
- Merge response types (action + reasoning)
- Update health_check to show pipeline status

### 7. Check dependencies


### 3. Update backend/app/core/memory.py
- Add mode param to recall/memorize (metadata filter)
- Test mode-based retrieval

### 4. Enhance backend/app/core/llm.py
- Update generate_answer(user_input, context, mode, tool_result)
- Richer system prompt with all inputs

### 5. Update backend/app/agents/agent_manager.py
- Add decide(user_input, context, mode) → action_plan dict
- Enhance execute(action_plan) using context/mode
- Preserve existing route_request as fallback

### 6. Refactor backend/app/main.py /ask endpoint
- Implement full pipeline sequence
- Merge response types (action + reasoning)
- Update health_check to show pipeline status

### 7. Check dependencies
- read_file backend/app/core/amd_bridge.py
- Minor tool updates if needed (mcp_combo_client.py)

### 8. Testing
- execute_command uvicorn backend.app.main:app --reload
- Test examples: meeting notes, Jira+Slack workflow, memory summary + GitHub action

### 9. Frontend compatibility
- Verify /ask response format
- Optional: Enhance frontend to show mode/tool_result

### 10. Completion
- attempt_completion with demo commands
