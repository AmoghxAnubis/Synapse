"""
MCP (Model Context Protocol) Notion Server
==========================================
This server provides comprehensive Notion API operations through MCP protocol.
Supports:
- Pages: create, get, update, delete, list
- Databases: create, query, get
- Blocks: append, get
- Search: search pages and databases
"""

import os
import json
from typing import Dict, Any, Optional, List

try:
    from notion_client import Client
    NOTION_CLIENT_AVAILABLE = True
except ImportError:
    NOTION_CLIENT_AVAILABLE = False


class MCPNotionServer:
    """
    MCP Server for Notion operations.
    Implements the Model Context Protocol for Notion API interactions.
    """
    
    def __init__(self, token: str = None):
        """
        Initialize MCP Notion Server.
        
        Args:
            token: Notion Integration Token. Falls back to NOTION_TOKEN env var.
        """
        self.token = token or os.getenv("NOTION_TOKEN")
        self.client = None
        self._connected = False
        
        if self.token:
            self._connect()
    
    def _connect(self):
        """Establish connection to Notion API."""
        if not NOTION_CLIENT_AVAILABLE:
            print("⚠️ notion-client not installed. Install with: pip install notion-client")
            self._connected = False
            return False
            
        try:
            self.client = Client(auth=self.token)
            self._connected = True
            print("✅ MCP Notion Server connected successfully!")
            return True
        except Exception as e:
            print(f"❌ Failed to connect to Notion: {e}")
            self._connected = False
            return False
    
    def is_connected(self) -> bool:
        """Check if server is connected to Notion."""
        return self._connected and self.client is not None
    
    def get_status(self) -> dict:
        """Get server connection status."""
        if not NOTION_CLIENT_AVAILABLE:
            return {
                "status": "error",
                "message": "notion-client package not installed. Run: pip install notion-client"
            }
        
        if not self.is_connected():
            return {
                "status": "disconnected",
                "message": "Notion token missing. Please set NOTION_TOKEN environment variable."
            }
        
        return {
            "status": "connected",
            "message": "Connected to Notion"
        }
    
    # ==================== PAGE OPERATIONS ====================
    
    def create_page(self, title: str, content: str = "", 
                    parent_page_id: str = None, parent_database_id: str = None) -> dict:
        """
        Create a new Notion page.
        
        Args:
            title: Page title
            content: Page content (will be added as paragraph block)
            parent_page_id: Parent page ID (for child pages)
            parent_database_id: Parent database ID (for database entries)
            
        Returns:
            dict: Page creation result
        """
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Notion"}
        
        try:
            # Build properties
            properties = {"title": [{"text": {"content": title}}]}
            
            # Determine parent
            if parent_database_id:
                # Creating a page in a database
                new_page = self.client.pages.create(
                    parent={"database_id": parent_database_id},
                    properties={
                        "Name": {"title": [{"text": {"content": title}}]}
                    }
                )
            elif parent_page_id:
                # Creating a child page
                new_page = self.client.pages.create(
                    parent={"page_id": parent_page_id},
                    properties={"title": {"title": [{"text": {"content": title}}]}}
                )
            else:
                # Creating a top-level page (requires workspace access)
                new_page = self.client.pages.create(
                    properties={"title": {"title": [{"text": {"content": title}}]}}
                )
            
            page_id = new_page["id"]
            
            # Add content if provided
            if content:
                self.client.blocks.children.append(
                    page_id,
                    children=[{
                        "object": "block",
                        "type": "paragraph",
                        "paragraph": {
                            "rich_text": [{"type": "text", "text": {"content": content}}]
                        }
                    }]
                )
            
            return {
                "success": True,
                "message": f"✅ Page '{title}' created successfully!",
                "page_id": page_id,
                "page_url": f"https://notion.so/{page_id.replace('-', '')}"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_page(self, page_id: str) -> dict:
        """Get a page by ID."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Notion"}
        
        try:
            page = self.client.pages.retrieve(page_id)
            
            # Extract title
            title = "Untitled"
            if "properties" in page:
                title_prop = page["properties"].get("title") or page["properties"].get("Name")
                if title_prop and "title" in title_prop:
                    if title_prop["title"]:
                        title = title_prop["title"][0].get("text", {}).get("content", "Untitled")
            
            return {
                "success": True,
                "page_id": page["id"],
                "title": title,
                "url": page.get("url", ""),
                "created_time": page.get("created_time", ""),
                "last_edited_time": page.get("last_edited_time", "")
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def update_page(self, page_id: str, title: str = None) -> dict:
        """Update a page title."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Notion"}
        
        try:
            properties = {}
            if title:
                properties["title"] = {"title": [{"text": {"content": title}}]}
            
            if properties:
                self.client.pages.update(page_id, properties=properties)
                return {"success": True, "message": f"✅ Page updated!"}
            else:
                return {"success": False, "error": "No properties to update"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def delete_page(self, page_id: str) -> dict:
        """Archive (delete) a page."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Notion"}
        
        try:
            self.client.pages.update(page_id, archived=True)
            return {"success": True, "message": "✅ Page archived!"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def list_pages(self, parent_page_id: str = None) -> dict:
        """List all pages."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Notion"}
        
        try:
            if parent_page_id:
                # Get child pages
                blocks = self.client.blocks.children.list(parent_page_id)
                pages = []
                for block in blocks["results"]:
                    if block.get("type") == "child_page":
                        pages.append({
                            "id": block["id"],
                            "title": block.get("title", "Untitled"),
                            "url": block.get("url", "")
                        })
            else:
                # Search for all pages
                search_results = self.client.search(
                    filter={"value": "page", "property": "object"},
                    sort_direction="descending"
                )
                pages = []
                for page in search_results["results"]:
                    title = "Untitled"
                    if "properties" in page and "title" in page["properties"]:
                        if page["properties"]["title"]["title"]:
                            title = page["properties"]["title"]["title"][0].get("text", {}).get("content", "Untitled")
                    pages.append({
                        "id": page["id"],
                        "title": title,
                        "url": page.get("url", "")
                    })
            
            return {
                "success": True,
                "pages": pages,
                "count": len(pages)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ==================== DATABASE OPERATIONS ====================
    
    def create_database(self, title: str, parent_page_id: str = None,
                        properties: dict = None) -> dict:
        """
        Create a new Notion database.
        
        Args:
            title: Database title
            parent_page_id: Parent page ID
            properties: Database properties schema
            
        Returns:
            dict: Database creation result
        """
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Notion"}
        
        try:
            # Default properties
            if not properties:
                properties = {
                    "Name": {"title": {}},
                    "Tags": {"multi_select": {"options": [{"name": "Tag1"}, {"name": "Tag2"}]}},
                    "Date": {"date": {}}
                }
            
            if parent_page_id:
                database = self.client.databases.create(
                    parent={"page_id": parent_page_id},
                    title=[{"text": {"content": title}}],
                    properties=properties
                )
            else:
                return {"success": False, "error": "parent_page_id required for database creation"}
            
            return {
                "success": True,
                "message": f"✅ Database '{title}' created!",
                "database_id": database["id"],
                "database_url": database.get("url", "")
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def query_database(self, database_id: str, filter: dict = None) -> dict:
        """Query a database."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Notion"}
        
        try:
            results = self.client.databases.query(database_id, filter=filter)
            
            items = []
            for page in results["results"]:
                title = "Untitled"
                if "properties" in page:
                    name_prop = page["properties"].get("Name") or page["properties"].get("title")
                    if name_prop and "title" in name_prop:
                        if name_prop["title"]:
                            title = name_prop["title"][0].get("text", {}).get("content", "Untitled")
                
                items.append({
                    "id": page["id"],
                    "title": title,
                    "url": page.get("url", "")
                })
            
            return {
                "success": True,
                "results": items,
                "count": len(items)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_database(self, database_id: str) -> dict:
        """Get database info."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Notion"}
        
        try:
            database = self.client.databases.retrieve(database_id)
            
            title = "Untitled"
            if "title" in database:
                if database["title"]:
                    title = database["title"][0].get("text", {}).get("content", "Untitled")
            
            return {
                "success": True,
                "database_id": database["id"],
                "title": title,
                "url": database.get("url", ""),
                "properties": list(database.get("properties", {}).keys())
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ==================== BLOCK OPERATIONS ====================
    
    def append_blocks(self, page_id: str, content: str) -> dict:
        """Append blocks (content) to a page."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Notion"}
        
        try:
            blocks = []
            
            # Split content by newlines and create paragraph blocks
            for line in content.split('\n'):
                if line.strip():
                    blocks.append({
                        "object": "block",
                        "type": "paragraph",
                        "paragraph": {
                            "rich_text": [{"type": "text", "text": {"content": line}}]
                        }
                    })
            
            if blocks:
                self.client.blocks.children.append(page_id, children=blocks)
                return {
                    "success": True,
                    "message": f"✅ Added {len(blocks)} blocks to page!"
                }
            else:
                return {"success": False, "error": "No content to add"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_blocks(self, page_id: str) -> dict:
        """Get blocks from a page."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Notion"}
        
        try:
            blocks = self.client.blocks.children.list(page_id)
            
            block_list = []
            for block in blocks["results"]:
                block_type = block.get("type", "")
                text = ""
                if block_type in block:
                    content = block[block_type]
                    if "rich_text" in content and content["rich_text"]:
                        text = content["rich_text"][0].get("text", {}).get("content", "")
                
                block_list.append({
                    "id": block["id"],
                    "type": block_type,
                    "content": text
                })
            
            return {
                "success": True,
                "blocks": block_list,
                "count": len(block_list)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ==================== SEARCH ====================
    
    def search(self, query: str = "") -> dict:
        """Search pages and databases in Notion."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Notion"}
        
        try:
            if query:
                results = self.client.search(query=query)
            else:
                results = self.client.search(
                    sort_direction="descending"
                )
            
            items = []
            for item in results["results"]:
                item_type = item.get("object", "unknown")
                title = "Untitled"
                
                if item_type == "page":
                    if "properties" in item and "title" in item["properties"]:
                        if item["properties"]["title"]["title"]:
                            title = item["properties"]["title"]["title"][0].get("text", {}).get("content", "Untitled")
                elif item_type == "database":
                    if "title" in item:
                        if item["title"]:
                            title = item["title"][0].get("text", {}).get("content", "Untitled")
                
                items.append({
                    "id": item["id"],
                    "type": item_type,
                    "title": title,
                    "url": item.get("url", "")
                })
            
            return {
                "success": True,
                "results": items,
                "count": len(items)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    # ==================== MCP PROTOCOL HANDLER ====================
    
    def execute_command(self, command: dict) -> dict:
        """
        Execute a command through MCP protocol.
        
        Args:
            command: dict with 'operation' and parameters
            
        Returns:
            dict: Result of the operation
        """
        if not self.is_connected():
            if not NOTION_CLIENT_AVAILABLE:
                return {"success": False, "error": "notion-client package not installed. Run: pip install notion-client"}
            return {"success": False, "error": "Not connected to Notion. Please configure NOTION_TOKEN."}
        
        operation = command.get("operation", "").lower()
        
        # Map operations to methods
        operations_map = {
            # Pages
            "create_page": lambda: self.create_page(
                command.get("title", "Untitled"),
                command.get("content", ""),
                command.get("parent_page_id"),
                command.get("parent_database_id")
            ),
            "get_page": lambda: self.get_page(command.get("page_id")),
            "update_page": lambda: self.update_page(
                command.get("page_id"),
                command.get("title")
            ),
            "delete_page": lambda: self.delete_page(command.get("page_id")),
            "list_pages": lambda: self.list_pages(command.get("parent_page_id")),
            
            # Databases
            "create_database": lambda: self.create_database(
                command.get("title", "New Database"),
                command.get("parent_page_id"),
                command.get("properties")
            ),
            "query_database": lambda: self.query_database(
                command.get("database_id"),
                command.get("filter")
            ),
            "get_database": lambda: self.get_database(command.get("database_id")),
            
            # Blocks
            "append_blocks": lambda: self.append_blocks(
                command.get("page_id"),
                command.get("content", "")
            ),
            "get_blocks": lambda: self.get_blocks(command.get("page_id")),
            
            # Search
            "search": lambda: self.search(command.get("query", "")),
            
            # Status
            "status": lambda: self.get_status()
        }
        
        if operation in operations_map:
            try:
                return operations_map[operation]()
            except Exception as e:
                return {"success": False, "error": f"Operation failed: {str(e)}"}
        else:
            return {
                "success": False,
                "error": f"Unknown operation: {operation}. Available: {', '.join(operations_map.keys())}"
            }
    
    def get_available_operations(self) -> list:
        """Return list of available operations."""
        return [
            # Pages
            "create_page", "get_page", "update_page", "delete_page", "list_pages",
            # Databases
            "create_database", "query_database", "get_database",
            # Blocks
            "append_blocks", "get_blocks",
            # Search
            "search",
            # Status
            "status"
        ]


def create_mcp_notion_server(token: str = None) -> MCPNotionServer:
    """Create and return an MCP Notion Server instance."""
    return MCPNotionServer(token)


if __name__ == "__main__":
    # Quick test
    server = MCPNotionServer()
    print(json.dumps(server.get_status(), indent=2))
    print("Available operations:", server.get_available_operations())
