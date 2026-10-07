import json, pathlib, sys
root = pathlib.Path(__file__).resolve().parents[1]
for name, content in json.load(sys.stdin).items():
    target = (root / name).resolve()
    if not target.is_relative_to(root):
        raise ValueError('Target outside workspace')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding='utf-8')
    print(name)
