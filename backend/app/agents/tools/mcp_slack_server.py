"""
MCP (Model Context Protocol) Slack Server
=========================================
This server provides comprehensive Slack API operations through MCP protocol.
Supports:
- Channels: list, create, join
- Messages: send, list, update, delete
- Users: list, info
- Files: upload
"""

import os
import json
from typing import Dict, Any, Optional, List

try:
    from slack_sdk import WebClient
    from slack_sdk.errors import SlackApiError
    SLACK_AVAILABLE = True
except ImportError:
    SLACK_AVAILABLE = False


class MCPSlackServer:
    """
    MCP Server for Slack operations.
    Implements the Model Context Protocol for Slack API interactions.
    """
    
    def __init__(self, token: str = None):
        """
        Initialize MCP Slack Server.
        
        Args:
            token: Slack Bot User OAuth Token. Falls back to SLACK_TOKEN env var.
        """
        self.token = token or os.getenv("SLACK_TOKEN")
        self.client = None
        self._connected = False
        
        if self.token:
            self._connect()
    
    def _connect(self):
        """Establish connection to Slack API."""
        if not SLACK_AVAILABLE:
            print("⚠️ slack-sdk package not installed. Install with: pip install slack-sdk")
            self._connected = False
            return False
        
        if not self.token:
            print("⚠️ Slack token missing. Set SLACK_TOKEN environment variable.")
            self._connected = False
            return False
            
        try:
            self.client = WebClient(token=self.token)
            # Test connection
            self.client.auth_test()
            self._connected = True
            print("✅ MCP Slack Server connected successfully!")
            return True
        except SlackApiError as e:
            print(f"❌ Failed to connect to Slack: {e.response['error']}")
            self._connected = False
            return False
        except Exception as e:
            print(f"❌ Failed to connect to Slack: {e}")
            self._connected = False
            return False
    
    def is_connected(self) -> bool:
        """Check if server is connected to Slack."""
        return self._connected and self.client is not None
    
    def get_status(self) -> dict:
        """Get server connection status."""
        if not SLACK_AVAILABLE:
            return {
                "status": "error",
                "message": "slack-sdk package not installed. Run: pip install slack-sdk"
            }
        
        if not self.token:
            return {
                "status": "disconnected",
                "message": "Slack token missing. Please set SLACK_TOKEN environment variable."
            }
        
        if not self.is_connected():
            return {
                "status": "disconnected",
                "message": "Failed to connect to Slack."
            }
        
        return {
            "status": "connected",
            "message": "Connected to Slack"
        }
    
    # ==================== CHANNEL OPERATIONS ====================
    
    def list_channels(self) -> dict:
        """List all accessible channels."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Slack"}
        
        try:
            response = self.client.conversations_list(types="public_channel,private_channel")
            channels = response['channels']
            
            channel_list = []
            for channel in channels:
                channel_list.append({
                    "id": channel['id'],
                    "name": channel['name'],
                    "is_private": channel.get('is_private', False),
                    "member_count": channel.get('num_members', 0)
                })
            
            return {
                "success": True,
                "channels": channel_list,
                "count": len(channel_list)
            }
        except SlackApiError as e:
            return {"success": False, "error": str(e)}
    
    def create_channel(self, name: str, is_private: bool = False) -> dict:
        """Create a new channel."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Slack"}
        
        try:
            response = self.client.conversations_create(
                name=name,
                is_private=is_private
            )
            channel = response['channel']
            
            return {
                "success": True,
                "message": f"✅ Channel #{name} created!",
                "channel_id": channel['id'],
                "channel_name": channel['name']
            }
        except SlackApiError as e:
            return {"success": False, "error": str(e)}
    
    def join_channel(self, channel_id: str = None, channel_name: str = None) -> dict:
        """Join a channel."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Slack"}
        
        try:
            # Get channel ID from name if name provided
            if channel_name and not channel_id:
                channels_response = self.client.conversations_list()
                for ch in channels_response['channels']:
                    if ch['name'] == channel_name:
                        channel_id = ch['id']
                        break
            
            if not channel_id:
                return {"success": False, "error": "Channel not found"}
            
            response = self.client.conversations_join(channel=channel_id)
            
            return {
                "success": True,
                "message": f"✅ Joined channel!",
                "channel_id": channel_id
            }
        except SlackApiError as e:
            return {"success": False, "error": str(e)}
    
    # ==================== MESSAGE OPERATIONS ====================
    
    def send_message(self, channel: str, text: str, thread_ts: str = None) -> dict:
        """
        Send a message to a channel.
        
        Args:
            channel: Channel ID or name (with # prefix)
            text: Message text
            thread_ts: Thread timestamp to reply in a thread
            
        Returns:
            dict: Message send result
        """
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Slack"}
        
        try:
            # Add # prefix if not present
            if not channel.startswith('#') and not channel.startswith('C'):
                channel = f"#{channel}"
            
            message_kwargs = {
                'channel': channel,
                'text': text
            }
            
            if thread_ts:
                message_kwargs['thread_ts'] = thread_ts
            
            response = self.client.chat_postMessage(**message_kwargs)
            message = response['message']
            
            return {
                "success": True,
                "message": f"✅ Message sent!",
                "message_ts": message['ts'],
                "channel": message['channel']
            }
        except SlackApiError as e:
            return {"success": False, "error": str(e)}
    
    def list_messages(self, channel: str, limit: int = 10) -> dict:
        """List messages from a channel."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Slack"}
        
        try:
            # Add # prefix if not present
            if not channel.startswith('#') and not channel.startswith('C'):
                channel = f"#{channel}"
            
            response = self.client.conversations_history(
                channel=channel,
                limit=limit
            )
            
            messages = []
            for msg in response['messages']:
                messages.append({
                    "ts": msg['ts'],
                    "text": msg.get('text', ''),
                    "user": msg.get('user', ''),
                    "timestamp": msg.get('ts', '')
                })
            
            return {
                "success": True,
                "messages": messages,
                "count": len(messages)
            }
        except SlackApiError as e:
            return {"success": False, "error": str(e)}
    
    def update_message(self, channel: str, ts: str, text: str) -> dict:
        """Update a message."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Slack"}
        
        try:
            response = self.client.chat_update(
                channel=channel,
                ts=ts,
                text=text
            )
            
            return {
                "success": True,
                "message": f"✅ Message updated!"
            }
        except SlackApiError as e:
            return {"success": False, "error": str(e)}
    
    def delete_message(self, channel: str, ts: str) -> dict:
        """Delete a message."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Slack"}
        
        try:
            self.client.chat_delete(
                channel=channel,
                ts=ts
            )
            
            return {
                "success": True,
                "message": f"✅ Message deleted!"
            }
        except SlackApiError as e:
            return {"success": False, "error": str(e)}
    
    # ==================== USER OPERATIONS ====================
    
    def list_users(self) -> dict:
        """List all users."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Slack"}
        
        try:
            response = self.client.users_list()
            users = response['members']
            
            user_list = []
            for user in users:
                if not user.get('deleted', False):  # Skip deleted users
                    user_list.append({
                        "id": user['id'],
                        "name": user['name'],
                        "real_name": user.get('real_name', ''),
                        "is_bot": user.get('is_bot', False)
                    })
            
            return {
                "success": True,
                "users": user_list,
                "count": len(user_list)
            }
        except SlackApiError as e:
            return {"success": False, "error": str(e)}
    
    def get_user_info(self, user_id: str = None, email: str = None) -> dict:
        """Get user info by ID or email."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Slack"}
        
        try:
            if email:
                # Look up user by email
                response = self.client.users_lookupByEmail(email=email)
                user = response['user']
            elif user_id:
                response = self.client.users_info(user=user_id)
                user = response['user']
            else:
                return {"success": False, "error": "Provide user_id or email"}
            
            return {
                "success": True,
                "user": {
                    "id": user['id'],
                    "name": user['name'],
                    "real_name": user.get('real_name', ''),
                    "email": user.get('profile', {}).get('email', ''),
                    "is_bot": user.get('is_bot', False)
                }
            }
        except SlackApiError as e:
            return {"success": False, "error": str(e)}
    
    # ==================== FILE OPERATIONS ====================
    
    def upload_file(self, channel: str, file_path: str, title: str = None, 
                   comment: str = None) -> dict:
        """Upload a file to a channel."""
        if not self.is_connected():
            return {"success": False, "error": "Not connected to Slack"}
        
        try:
            response = self.client.files_upload(
                channels=channel,
                file=file_path,
                title=title,
                initial_comment=comment
            )
            
            file_info = response['file']
            
            return {
                "success": True,
                "message": f"✅ File uploaded!",
                "file_id": file_info['id'],
                "file_url": file_info['url_private'],
                "file_name": file_info['name']
            }
        except SlackApiError as e:
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
            if not SLACK_AVAILABLE:
                return {"success": False, "error": "slack-sdk package not installed. Run: pip install slack-sdk"}
            return {"success": False, "error": "Not connected to Slack. Please configure SLACK_TOKEN."}
        
        operation = command.get("operation", "").lower()
        
        # Map operations to methods
        operations_map = {
            # Channels
            "list_channels": lambda: self.list_channels(),
            "create_channel": lambda: self.create_channel(
                command.get("name"),
                command.get("is_private", False)
            ),
            "join_channel": lambda: self.join_channel(
                command.get("channel_id"),
                command.get("channel_name")
            ),
            
            # Messages
            "send_message": lambda: self.send_message(
                command.get("channel"),
                command.get("text"),
                command.get("thread_ts")
            ),
            "list_messages": lambda: self.list_messages(
                command.get("channel"),
                command.get("limit", 10)
            ),
            "update_message": lambda: self.update_message(
                command.get("channel"),
                command.get("ts"),
                command.get("text")
            ),
            "delete_message": lambda: self.delete_message(
                command.get("channel"),
                command.get("ts")
            ),
            
            # Users
            "list_users": lambda: self.list_users(),
            "get_user_info": lambda: self.get_user_info(
                command.get("user_id"),
                command.get("email")
            ),
            
            # Files
            "upload_file": lambda: self.upload_file(
                command.get("channel"),
                command.get("file_path"),
                command.get("title"),
                command.get("comment")
            ),
            
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
            # Channels
            "list_channels", "create_channel", "join_channel",
            # Messages
            "send_message", "list_messages", "update_message", "delete_message",
            # Users
            "list_users", "get_user_info",
            # Files
            "upload_file",
            # Status
            "status"
        ]


def create_mcp_slack_server(token: str = None) -> MCPSlackServer:
    """Create and return an MCP Slack Server instance."""
    return MCPSlackServer(token)


if __name__ == "__main__":
    # Quick test
    server = MCPSlackServer()
    print(json.dumps(server.get_status(), indent=2))
    print("Available operations:", server.get_available_operations())
