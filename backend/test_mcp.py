import requests
import json

# Test create issue
r = requests.post('http://localhost:8000/ask', json={'text': 'create issue in repo mcpcheck with title "Test Issue" and description "This is a test issue from MCP Server"'})
print("Create Issue:")
print(json.dumps(r.json(), indent=2))
print()

# Test list issues
r2 = requests.post('http://localhost:8000/ask', json={'text': 'list issues in repo mcpcheck'})
print("List Issues:")
print(json.dumps(r2.json(), indent=2))
