"""
Test script for Notion API and MCP Notion Server
"""
import os
import sys

print("=" * 60)
print("🔍 THOROUGH NOTION API & MCP TEST")
print("=" * 60)

# Test 1: Check NOTION_TOKEN environment variable
print("\n📋 TEST 1: Environment Variables")
print("-" * 40)
notion_token = os.getenv("NOTION_TOKEN")
if notion_token:
    print(f"✅ NOTION_TOKEN is set: {notion_token[:10]}...{notion_token[-4:]}")
else:
    print("❌ NOTION_TOKEN is NOT set in environment variables")
    print("   Please set NOTION_TOKEN to test Notion integration")

# Test 2: Check notion-client package
print("\n📋 TEST 2: Package Availability")
print("-" * 40)
try:
    from notion_client import NotionClient
    print("✅ notion-client package is installed")
except ImportError:
    print("❌ notion-client package NOT installed")
    print("   Run: pip install notion-client")
    sys.exit(1)

# Test 3: Test MCPNotionServer initialization
print("\n📋 TEST 3: MCP Notion Server Initialization")
print("-" * 40)
try:
    from app.agents.tools.mcp_notion_server import MCPNotionServer
    server = MCPNotionServer()
    status = server.get_status()
    print(f"Status: {status}")
except Exception as e:
    print(f"❌ MCPNotionServer initialization failed: {e}")
    sys.exit(1)

# Test 4: Test connection if token is available
print("\n📋 TEST 4: Notion API Connection")
print("-" * 40)
if notion_token:
    try:
        server = MCPNotionServer(token=notion_token)
        if server.is_connected():
            print("✅ Successfully connected to Notion API!")
            
            # Test 5: Get user info
            print("\n📋 TEST 5: API Functionality")
            print("-" * 40)
            
            # Test search
            search_result = server.search("")
            print(f"Search operation: {search_result}")
            
            # Test list pages
            list_result = server.list_pages()
            print(f"List pages operation: {list_result}")
            
            # Get status
            status = server.get_status()
            print(f"Final status: {status}")
            
        else:
            print("❌ Failed to connect to Notion API")
            print(f"Error details: {server.get_status()}")
    except Exception as e:
        print(f"❌ Notion API test failed: {e}")
        import traceback
        traceback.print_exc()
else:
    print("⚠️ Skipping connection test - no NOTION_TOKEN")

# Test 6: Test MCP Combo Client
print("\n📋 TEST 6: MCP Combo Client")
print("-" * 40)
try:
    from app.agents.tools.mcp_combo_client import MCPComboClient
    
    client = MCPComboClient(notion_server=server if notion_token else None)
    
    # Test parsing commands
    test_commands = [
        "search Notion for 'test'",
        "list pages in Notion",
        "create page in Notion called 'Test Page'",
        "check Notion status"
    ]
    
    for cmd in test_commands:
        parsed = client.parse_natural_command(cmd)
        print(f"Command: '{cmd}'")
        print(f"Parsed: {parsed}")
        print()
    
except Exception as e:
    print(f"❌ MCP Combo Client test failed: {e}")
    import traceback
    traceback.print_exc()

# Test 7: Test through AgentManager
print("\n📋 TEST 7: AgentManager Integration")
print("-" * 40)
try:
    from app.agents.agents.agent_manager import AgentManager
    print("Note: AgentManager import path may differ")
except ImportError as e:
    print(f"Note: Could not import AgentManager: {e}")

print("\n" + "=" * 60)
print("✅ NOTION TEST COMPLETE")
print("=" * 60)
