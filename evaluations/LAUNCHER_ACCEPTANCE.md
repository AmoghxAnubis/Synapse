# Windows launcher acceptance - 12 October 2026

The foreground prototype ran against the real installed backend and production frontend on this Windows machine. All test data was isolated under ignored `.tmp`; existing workspace data was not migrated or modified.

## Results

| Check | Result |
| --- | --- |
| Runtime validation | Unrestricted-shell PATH selected Node 22.12.0; launcher refused it. Explicit `C:\Program Files\nodejs\node.exe` selected the supported runtime and passed |
| Real startup | Backend returned expected unauthenticated HTTP 401; frontend returned HTTP 200 |
| Shutdown/restart | Two `scripts/verify_launcher.py` cycles passed; both service ports were released each time |
| Data preservation | A synthetic SQLite record and the pairing-token hash remained unchanged after restart |
| Port conflict | A test listener on 3000 was retained; launcher refused startup with exit 1 |
| User interruption | Both Start-Synapse.cmd and direct Python invocation stopped services on Ctrl+C; backend logs show application shutdown complete. Direct invocation's final backend shutdown has no interrupt traceback |
| Model absence | The two automated cycles used unprovisioned temporary model directories; startup/settings readiness worked and model absence was reported. A separate smoke used existing embeddings |

The first verification completed lifecycle assertions but failed temporary-directory cleanup because the verifier itself retained a SQLite connection. It was corrected with an explicit close; the rerun returned exit 0. This was a test-harness failure, not an accepted failed run.

Reproduce with `backend/venv/Scripts/python.exe scripts/verify_launcher.py --node YOUR_NODE_EXECUTABLE` from the checkout root with free ports. It uses disposable data and does not open a browser or perform inference. Logs/readiness are lifecycle evidence only.

Installer/runtime bundling, execution on a second machine, crash recovery, signing, auto-update and rollback remain open under D01-D03. No new frontend/backend application behavior or dependencies were changed; frontend checks were not repeated for these launcher-only changes.
