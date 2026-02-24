import os

script_dir = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(script_dir, 'mcp_github_server.py')

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the get_repos issue
old_code = '''            repos = self.user.get_repos(sort=sort, per_page=per_page)
            repo_list = []
            for repo in repos:
                repo_list.append({'''

new_code = '''            repos = self.user.get_repos(sort=sort)
            repo_list = []
            count = 0
            for repo in repos:
                if count >= per_page:
                    break
                repo_list.append({'''

content = content.replace(old_code, new_code)

# Add count increment after the dict
old_dict_end = '''"updated_at": str(repo.updated_at)
                })
            
            return {'''

new_dict_end = '''"updated_at": str(repo.updated_at)
                })
                count += 1
            
            return {'''

content = content.replace(old_dict_end, new_dict_end)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed!')
