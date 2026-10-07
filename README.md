# Synapse

A local AI workspace for document memory, cited answers, persistent conversations, selected workspace sources, and explicitly approved actions.

Synapse uses Next.js, FastAPI, local ONNX embeddings, Chroma vectors, transactional SQLite metadata, and Ollama. CPU execution is supported. GPU/NPU use requires an installed compatible provider and is reported from the actual runtime.

## Supported product scope

- PDF, TXT, MD, PY, and DOCX imports, with size validation, background jobs, cancellation, overlapping token-aware chunks, page provenance, and deduplicated replacement.
- Local, streamed, evidence-grounded chat with persisted conversations and source restrictions.
- Optional selected GitHub repositories, Notion pages, Jira Cloud projects, Slack channels, and Discord channels. API credentials stay in the OS credential store.
- Explicit approval for local app launching, GitHub issue creation, and Slack/Discord messages. Chat cannot execute actions.
- Local meeting notes and tasks. Live audio capture/transcription, window tiling, notification suppression, and interoperable MCP transport are not implemented.

This is a single-user local application, not a multi-user hosted service. Model quality and hardware performance require evaluation before commercial release.

## Setup on Windows

Use stable Python **3.12** and Node **22.13 or newer**. Prerelease Python 3.15 is not supported by ONNX Runtime.

From the project root:

~~~powershell
py -3.12 -m venv backend/venv
backend/venv/Scripts/python.exe -m pip install -r backend/requirements.lock.txt
cd backend
./venv/Scripts/python.exe -m app.provision
cd ../frontend
npm ci
npm run build
~~~

Model provisioning is the explicit network step; it downloads a pinned snapshot into the local data directory. Installation also downloads dependencies.

Install and start [Ollama for Windows](https://docs.ollama.com/windows). Choose a model appropriate for your hardware. The [Llama 3.2 model page](https://ollama.com/library/llama3.2) lists its supported sizes; the 3B variant is about 2 GB.

~~~powershell
ollama pull llama3.2:3b
~~~

Start the backend in one terminal:

~~~powershell
cd backend
./venv/Scripts/python.exe -m app.main
~~~

Start the frontend in another:

~~~powershell
cd frontend
npm run start
~~~

Both services bind to loopback through the supplied scripts. Open http://localhost:3000, copy the local pairing token from `backend/.synapse/api-token`, and pair your browser. The token is a secret; do not share it or paste it into public logs. A paired browser receives an HttpOnly, SameSite=Strict cookie with a one-day lifetime.

When no model setting has been saved, Synapse selects an available installed Ollama model if the default is absent. In Settings, confirm or change that selection. Import a document in Knowledge, ask a question in Chat, and inspect its evidence. Settings and source administration remain available when models are unavailable. Knowledge requires the embedding model.

For development, use `npm run dev`. Environment examples contain only non-secret placeholders.

## Privacy and connected features

Core embedding and generation calls use local models. Authentication requires no cloud account. Connected features default to **off**. Enable them in Settings only when needed.

- Integration sync contacts the selected provider and pulls selected content into local memory.
- Web search sends the current question to a search provider and requires an additional chat checkbox.
- URL import contacts the specified public site; private/loopback destinations and unsafe redirects are blocked.
- External writes display their destination and content and require explicit, single-use approval.
- Disconnect removes the credential; imported content remains until you delete its sources.

Local data is not encrypted by Synapse at rest. Protect your OS account, disk, browser profile, pairing token, and backups. Embedding telemetry is disabled. No model downloads occur during ordinary startup or retrieval.

## Integrations

Enable connected features, open Connected Sources, enter a token and explicit source IDs, then validate and sync:

| Platform | Selected sources | Imported content |
| --- | --- | --- |
| GitHub | owner/repository | README, issue/PR titles and descriptions, issue conversation comments |
| Notion | Shared page IDs | Page title and nested text blocks |
| Jira Cloud | Project keys, workspace URL, account email | Issue summary, description, status, available comments |
| Slack | Channel IDs accessible to the bot | Channel message history |
| Discord | Channel IDs accessible to the bot | Message text available to the bot |

The connector checks have mocked API coverage; live account permissions and full vendor behavior still require acceptance testing. Channel threads, attachments, binary files, inline code-review comments, and very large workspaces are outside this initial scope. Limits produce errors instead of silently incomplete success. Bot scopes/intents and workspace policies must permit reads. Sync compares content hashes and reconciles removed sources only after the complete scoped fetch succeeds.

## Data preservation, migration, and backups

Paths are independent of the launch directory. The default is `backend/.synapse`; override `SYNAPSE_DATA_DIR` in backend/.env to choose another location. Runtime data is excluded from Git. Original legacy stores are preserved.

Stop the backend before migration or backup. To preserve both original memory databases and re-embed their text into the stable store:

~~~powershell
cd backend
./venv/Scripts/python.exe -m app.migrate
~~~

Agent and meeting JSON metadata are imported into SQLite on first startup. Vector migration prefixes original source identities to preserve collisions between the two old databases. Migration cannot reconstruct missing historical page references.

Create a portable backup and restore into a **new** directory:

~~~powershell
./venv/Scripts/python.exe -m app.backup create E:/SynapseBackup.zip
./venv/Scripts/python.exe -m app.backup restore E:/SynapseBackup.zip --target E:/SynapseRestored
~~~

Backups contain private document text, vectors, conversations, settings, and metadata. They exclude credential-store secrets, pairing tokens, and model binaries. Restore resets integrations to disconnected. Point SYNAPSE_DATA_DIR at the restored directory and provision the embedding model there before use. Keep the original data until the restored copy is verified.

## Verification

~~~powershell
backend/venv/Scripts/python.exe -m pytest -c backend/pytest.ini backend/tests
backend/venv/Scripts/python.exe -m pip check
cd frontend
npm run lint -- --max-warnings=0
npm run build
npm audit --audit-level=high
~~~

Tests never send real messages or create GitHub issues. The real embedding test runs only when its local model is already provisioned; CI skips it without downloading assets. Existing import-time live mutation scripts were retired.

See [BASELINE_REVIEW.md](BASELINE_REVIEW.md) for the original audit and [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for completed changes, validation evidence, and remaining release work.

Use [PROJECT_TRACKER.md](PROJECT_TRACKER.md) for the current task list, progress, priorities, time estimates, and activity log.

Start with [DEVELOPER_HANDOVER.md](DEVELOPER_HANDOVER.md) for complete developer continuation context and verified limitations.
