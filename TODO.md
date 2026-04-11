# Discord MCP Integration TODO

## Overview
✅ Plan approved. Implementing Discord MCP server like existing (slack/notion/etc.).

## Steps
- [x] 1. Create `backend/app/agents/tools/mcp_discord_server.py` (Discord REST API for channels/messages/guilds)
- [x] 2. Update `backend/app/agents/tools/mcp_combo_client.py` (add discord_server param, natural lang parsing, execute route)
- [x] 3. Update `backend/app/agents/agent_manager.py` (import/init discord server, pass to combo client, keyword routing)
- [x] 4. Update `frontend/app/settings/integrations/page.tsx` (add Discord to integrations list/states)
- [x] 5. No new deps needed (uses requests)
- [x] 6. No api.ts changes needed

- [ ] 5. Add `discord.py` to `backend/requirements.txt`
- [ ] 6. Verify/update `frontend/lib/api.ts` Platform type
- [ ] 7. Test: pip install, set DISCORD_TOKEN, frontend connect/sync, agent "send discord message"

## Notes
- Env: Add `DISCORD_TOKEN=your_bot_token` to backend/.env
- Bot needs: Message Content Intent enabled in Discord Developer Portal
- No design changes - reuse MessageSquare icon, indigo accent

**Complete ✅ Discord MCP integrated!**

Test:
1. Add DISCORD_TOKEN=your_bot_token to backend/.env (Bot with Message Content intent)
2. Backend restart
3. Frontend /settings/integrations -> Discord card -> Connect
4. Agent: "send discord message to CHANNEL_ID Hello from Synapse"
