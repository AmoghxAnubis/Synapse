"""
MCP (Model Context Protocol) Discord Server
===========================================
This server provides comprehensive Discord API operations through MCP protocol.
Supports:
- Guilds (servers): list, info
- Channels: list, send message, list messages, delete
- Users: list, info
"""

import os
import json
import requests
from typing import Dict, Any, List, Optional

DISCORD_AVAILABLE = True  # requests always available


class MCPDiscordServer:
    """
    MCP Server for Discord operations.
    Implements the Model Context Protocol for Discord Bot API interactions.
    """
    
    def __init__(self, token: str = None):
        """
        Initialize MCP Discord Server.
        
        Args:
            token: Discord Bot Token. Falls back to DISCORD_TOKEN env var.
        """
        self.token = token or os.getenv("DISCORD_TOKEN")
        self.session: Optional[requests.Session] = None
        self.base_url = "https://discord.com/api/v10"
        self._connected = False
        
        if self.token:
            self._connect()
    
    def _connect(self) -> bool:
        """Establish connection to Discord API."""
        if not self.token:
            print("⚠️ Discord token missing. Set DISCORD_TOKEN environment variable.")
            self._connected = False
            return False
        
        try:
            self.session = requests.Session()
            self.session.headers.update({
                "Authorization": f"Bot {self.token}",
                "Content-Type": "application/json",
                "User-Agent": "SynapseMCP (https://synapse.ai, 1.0)"
            })
            
            # Test connection - get current user
            response = self.session.get(f"{self.base_url}/users/@me")
            response.raise_for_status()
            
            self._connected = True
            print("✅ MCP Discord Server connected successfully!")
            return True
            
        except requests.RequestException as e:
            print(f"❌ Failed to connect to Discord: {e}")
            self._connected = False
            return False
        except Exception as e:
            print(f"❌ Discord connection error: {e}")
            self._connected = False
            return False
    
    def is_connected(self) -> bool:
        """Check if server is connected to Discord."""
        return self._connected and self.session is not None
    
    def get_status(self) -> dict:
        """Get server connection status."""
        if not self.token:
            return {
                "status": "disconnected",
                "message": "Discord token missing. Please set DISCORD_TOKEN environment variable."
            }
        
        if not self.is_connected():
            return {
                "status": "disconnected",
                "message": "Failed to connect to Discord."
            }
        
        return {
            "status": "connected",
            "message": "Connected to Discord"
        }
    
    # ==================== GUILD OPERATIONS ====================
    
    def list_guilds(self) -> dict:
        """List all accessible guilds (servers)."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Discord"}
        
        try:
            response = self.session.get(f"{self.base_url}/users/@me/guilds")
            response.raise_for_status()
            guilds = response.json()
            
            guild_list = []
            for guild in guilds:
                guild_list.append({
                    "id": guild['id'],
                    "name": guild['name'],
                    "icon": guild.get('icon'),
                    "member_count": guild.get('approximate_member_count', 0),
                    "owner": guild.get('owner', False)
                })
            
            return {
                "success": True,
                "guilds": guild_list,
                "count": len(guild_list)
            }
        except requests.RequestException as e:
            return {"success": False, "error": str(e)}
    
    def get_guild_info(self, guild_id: str) -> dict:
        """Get guild info."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Discord"}
        
        try:
            response = self.session.get(f"{self.base_url}/guilds/{guild_id}")
            response.raise_for_status()
            guild = response.json()
            
            return {
                "success": True,
                "guild": {
                    "id": guild['id'],
                    "name": guild['name'],
                    "description": guild.get('description', ''),
                    "member_count": guild.get('approximate_member_count'),
                    "icon": guild.get('icon')
                }
            }
        except requests.RequestException as e:
            return {"success": False, "error": str(e)}
    
    # ==================== CHANNEL OPERATIONS ====================
    
    def list_channels(self, guild_id: str) -> dict:
        """List channels in a guild."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Discord"}
        
        try:
            response = self.session.get(f"{self.base_url}/guilds/{guild_id}/channels")
            response.raise_for_status()
            channels = response.json()
            
            channel_list = []
            for channel in channels:
                if channel['type'] == 0:  # Text channels
                    channel_list.append({
                        "id": channel['id'],
                        "name": channel['name'],
                        "type": "text",
                        "position": channel.get('position', 0),
                        "parent_id": channel.get('parent_id')
                    })
            
            return {
                "success": True,
                "channels": channel_list,
                "count": len(channel_list)
            }
        except requests.RequestException as e:
            return {"success": False, "error": str(e)}
    
    def send_message(self, channel_id: str, content: str) -> dict:
        """
        Send a message to a channel.
        
        Args:
            channel_id: Channel ID
            content: Message text (max 2000 chars)
        """
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Discord"}
        
        if len(content) > 2000:
            return {"success": False, "error": "Message too long (max 2000 chars)"}
        
        try:
            data = {"content": content}
            response = self.session.post(
                f"{self.base_url}/channels/{channel_id}/messages",
                json=data
            )
            response.raise_for_status()
            message = response.json()
            
            return {
                "success": True,
                "message": "✅ Message sent!",
                "message_id": message['id'],
                "channel_id": message['channel_id'],
                "timestamp": message['timestamp']
            }
        except requests.RequestException as e:
            return {"success": False, "error": str(e)}
    
    def list_messages(self, channel_id: str, limit: int = 10) -> dict:
        """List recent messages from a channel."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Discord"}
        
        try:
            params = {"limit": min(limit, 100)}
            response = self.session.get(
                f"{self.base_url}/channels/{channel_id}/messages",
                params=params
            )
            response.raise_for_status()
            messages = response.json()
            
            message_list = []
            for msg in messages:
                message_list.append({
                    "id": msg['id'],
                    "content": msg.get('content', ''),
                    "author": msg['author']['username'] if msg['author'] else 'Unknown',
                    "timestamp": msg['timestamp']
                })
            
            return {
                "success": True,
                "messages": message_list,
                "count": len(message_list)
            }
        except requests.RequestException as e:
            return {"success": False, "error": str(e)}
    
    def delete_message(self, channel_id: str, message_id: str) -> dict:
        """Delete a message (bot must have permissions)."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Discord"}
        
        try:
            response = self.session.delete(
                f"{self.base_url}/channels/{channel_id}/messages/{message_id}"
            )
            response.raise_for_status()
            
            return {
                "success": True,
                "message": "✅ Message deleted!"
            }
        except requests.RequestException as e:
            return {"success": False, "error": str(e)}
    
    # ==================== USER OPERATIONS ====================
    
    def get_current_user(self) -> dict:
        """Get current bot user info."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Discord"}
        
        try:
            response = self.session.get(f"{self.base_url}/users/@me")
            response.raise_for_status()
            user = response.json()
            
            return {
                "success": True,
                "user": {
                    "id": user['id'],
                    "username": user['username'],
                    "discriminator": user.get('discriminator'),
                    "avatar": user.get('avatar'),
                    "bot": user.get('bot', False)
                }
            }
        except requests.RequestException as e:
            return {"success": False, "error": str(e)}
    
    # ==================== MCP PROTOCOL HANDLER ====================
    
    def execute_command(self, command: dict) -> dict:
        """
        Execute a command through MCP protocol.
        """
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Discord. Please configure DISCORD_TOKEN."}
        
        operation = command.get("operation", "").lower()
        
        # Map operations to methods
        operations_map = {
            # Guilds
            "list_guilds": lambda: self.list_guilds(),
            "get_guild_info": lambda: self.get_guild_info(command.get("guild_id")),
            
            # Channels
            "list_channels": lambda: self.list_channels(command.get("guild_id")),
            "send_message": lambda: self.send_message(
                command.get("channel_id"),
                command.get("content")
            ),
            "list_messages": lambda: self.list_messages(
                command.get("channel_id"),
                command.get("limit", 10)
            ),
            "delete_message": lambda: self.delete_message(
                command.get("channel_id"),
                command.get("message_id")
            ),
            
            # User
            "get_current_user": lambda: self.get_current_user(),
            
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
                "error": f"Unknown operation: {operation}. Available: {list(operations_map.keys())}"
            }
    
    def get_available_operations(self) -> list:
        """Return list of available operations."""
        return [
            # Guilds
            "list_guilds", "get_guild_info",
            # Channels
            "list_channels", "send_message", "list_messages", "delete_message",
            # User
            "get_current_user",
            # Status
            "status"
        ]


def create_mcp_discord_server(token: str = None) -> MCPDiscordServer:
    """Create and return an MCP Discord Server instance."""
    return MCPDiscordServer(token)


if __name__ == "__main__":
    # Quick test
    server = MCPDiscordServer()
    print(json.dumps(server.get_status(), indent=2))
    print("Available operations:", server.get_available_operations())

