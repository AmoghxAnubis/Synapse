# Synapse developer handover

## Framework continuation — 8 October 2026

A01 is implemented on `ayush_lang`: `core/llm.py` adapts LangChain ChatOllama; `ai/prompts.py` preserves evidence/history bounds; `ai/retriever.py` wraps current ONNX/Chroma retrieval; `workflows/chat.py` implements deterministic scope/retrieval/generate-or-abstain nodes with custom streaming. The API still owns SQLite conversation persistence and SSE formatting. Graph execution checkpoints, action workflow changes and Kafka are outside this initial integration. Tracing is explicitly disabled for private model/graph calls.

Verification: 71 backend tests passed, 1 skipped (unprovisioned real embedding model), and uv dependency consistency passed in isolated Python 3.12.13 under `.tmp/langgraph-venv`. Existing `backend/venv` is Python 3.13.5 and was not overwritten; install the updated lock in a supported Python 3.12 environment before starting the app. Existing locked package versions were retained.

The tracked `scripts/verify_chat_workflow.py --model llama3.2:latest` exercises actual Ollama with synthetic retrieval/temporary SQLite. API/SSE, first cited budget answer and both persisted turns worked. The follow-up omitted its citation, so the script exits 1 for the quality diagnostic; do not report it as full acceptance. Q01 remains open and full real-ONNX evaluation is not available in this checkout. Preserve the evidence-only/action separation while investigating citation behavior. See IMPLEMENTATION_STATUS.md for exact verification limits.

The user authorized committing completed work on 8 October 2026. Keep the relevant Markdown context/status files updated as work progresses, and commit completed, verified changes on `ayush_lang`. Do not make development commits on `main`. Commit IDs are recorded in Git history; pushing is not implied by this instruction.

Prepared 7 October 2026. This is the technical and product context needed to continue the project without the original conversation. It records decisions, implementation, verification and unresolved work; it does not contain credentials or private document content.

## Start here

1. Read this document for architecture and decisions.
2. Read [PROJECT_TRACKER.md](PROJECT_TRACKER.md) for task status, dependencies and estimates.
3. Read [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for repair evidence and release limits.
4. Read [BASELINE_REVIEW.md](BASELINE_REVIEW.md) for the original audit.
5. Use [README.md](README.md) for setup and operation.

As of 8 October 2026, the user has resumed the tracker and deferred Cloudflare until the local product work is complete. The previous session repaired the baseline, restored the landing composition and wrote this handover. The longer-term goal is a useful product people might pay for. Preserve the user's original landing-page identity and grow from verified workflows.

## Product intent and scope

Synapse was conceived as a local-first AI desktop companion with memory, chat, connected workspace context and OS workflows. The original implementation and marketing exceeded what actually worked. The repair strategy was to retain useful Next.js/FastAPI/ONNX/Chroma/Ollama foundations and establish this initial promise:

**Import context, ask questions with inspectable evidence, retain conversations, and explicitly approve supported actions using local inference.**

The current product is a single-user local application. It has no hosted multi-user ownership model, cloud account system or billing. It is not a replacement operating system. The original "Your personal AI operating system" headline is retained as the user's product positioning; surrounding copy explains current behavior and identifies planned features.

Supported today:

- PDF/TXT/MD/PY/DOCX import, source reading/deletion, scoped semantic retrieval.
- Local Ollama answers with retrieved passages, source references, conversation history and streaming.
- Selected GitHub, Notion, Jira Cloud, Slack and Discord content imports through a shared REST pipeline.
- Preview/approval for launching Notepad/Calculator/Paint, creating GitHub issues, and sending Slack/Discord messages.
- Manual meeting notes/tasks, saved workflow preferences, settings/readiness and fixed diagnostic commands.

Not implemented: window tiling, notification suppression, meeting recording/transcription, interoperable MCP transport, production installer/updates, billing or hosted account isolation. Do not advertise these as operational.

## How work proceeded

| Stage | Method and outcome |
| --- | --- |
| Baseline audit | Inspected source, Git/GitHub state, dependency declarations, frontend checks and unsafe routing. Recorded findings before editing. Baseline revision: cc596f4ca0ad7a594f9d72cd228ddecdece6453b. |
| Establish boundaries | Replaced unauthenticated API and unrestricted shell access with local pairing, typed requests, scoped permissions and explicit one-use action approval. Ordinary chat no longer dispatches tools. |
| Preserve state | Backed up both legacy vector stores; migrated text without overwriting originals. Replaced JSON rewrites with SQLite transactions and removed runtime state from Git tracking. |
| Complete core workflow | Provisioned local ONNX embeddings, improved chunking/dedup/retrieval/provenance, added persisted conversations/history/streaming, validated with real Ollama. |
| Connect truthful services | Built credential validation/keyring/scoped REST reads and truthful jobs, errors and sync state. External behavior remains mocked until live acceptance. |
| Verify | Added isolated tests, a real offline embedding test, production HTTP checks and portable backup/restore. Retired tests that used to create live resources. |
| Correct design overreach | The repair initially replaced the landing page with a simpler implementation-oriented page. The user rejected that direction and selected the previous landing page as the main product design. Restored the original composition from Git, keeping targeted behavior/copy corrections. |
| Final baseline pass | Fixed dotenv/path initialization, retired five old execution entry points, bounded proxy body reads, verified clean dependency installation, and added a reproducible local smoke script. |

Do not interpret the existing repair as a request for another visual redesign or framework rewrite. Future changes should have a concrete product or measured reliability reason.

## Architecture and important files

| Responsibility | Files |
| --- | --- |
| API composition and lifecycle | backend/app/main.py; backend/app/schemas.py |
| Stable configuration and pairing | backend/app/core/config.py; security.py |
| Metadata and conversation persistence | backend/app/core/storage.py; agent_store.py |
| Parsing and chunks | backend/app/core/ingester.py |
| Local embeddings | backend/app/core/amd_bridge.py; backend/app/provision.py |
| Vector source replacement/retrieval | backend/app/core/memory.py |
| Ollama connection and prompt/history | backend/app/core/llm.py |
| Bounded ingestion/sync jobs | backend/app/core/jobs.py |
| Scoped provider APIs and credentials | backend/app/core/integrations.py |
| Typed previews, approval and audit | backend/app/core/actions.py |
| Fixed diagnostics and safe URL fetch | backend/app/core/terminal_tool.py; url_fetch.py |
| Preservation/recovery CLIs | backend/app/migrate.py; backend/app/backup.py |
| Frontend local session/proxy | frontend/app/api/session/route.ts; frontend/app/api/backend/[[...path]]/route.ts |
| Origin and body boundaries | frontend/lib/server-security.ts; frontend/proxy.ts |
| Client API and streaming | frontend/lib/api.ts |
| Original landing composition | frontend/app/page.tsx; frontend/components/Landing; frontend/components/Footer |
| Implementation-page reference | docs/reference/implementation-landing.tsx |
| Regression checks and CI | backend/tests; backend/pytest.ini; .github/workflows/ci.yml |
| Reproducible running-app checks | scripts/verify_local.py |

### Request and inference flow

Browser -> same-origin Next.js API -> fixed loopback FastAPI API -> SQLite/Chroma -> local ONNX retrieval -> local Ollama.

The browser pairs with a local bearer token. Next.js stores it in an HttpOnly, SameSite=Strict one-day cookie and forwards it server-side. The token is never put in a NEXT_PUBLIC variable. Mutation routes enforce local hosts and matching origin. Backend routes require the bearer token except public /health/live.

Imports run in a two-worker background queue with four slots. Parsing produces bounded text/page records. Token-aware chunks have overlap; normalized 384-dimensional embeddings are stored with deterministic source/chunk identities and content hashes. Unchanged imports are deduplicated; replacements remove stale chunks.

Chat applies the intersection of user selection and agent source restrictions, recalls relevant passages with a cosine threshold, passes bounded evidence/history to Ollama, and persists completed turns. No supporting passages produces an abstention. Streaming events are sources/token/done/error. The current backend permits one answer at a time through a lock.

Evidence is untrusted context, not an instruction source. The model cannot directly execute actions. This limits action risks but does not prove generated answers or citations are always correct.

### Actions and connectors

Actions go through /actions/preview, /actions/{id}/approve or cancellation. Previews disclose destination and content, expire after five minutes and are consumed once. Permissions and network policy are checked again at approval. App launch is restricted to three fixed executable choices; diagnostics accept fixed argv choices with shell=False.

Integration credentials use the OS keyring with no plaintext fallback. Configuration includes selected resources; Jira additionally requires Cloud URL/email. Requests recheck connected-feature policy, do not inherit proxy settings, and have bounded timeouts/retries/request budgets. Full scoped fetch must succeed before source reconciliation. Limits produce failures instead of silent partial success.

Imports currently include README and issue/PR conversation text, Notion nested text blocks, Jira descriptions/status/available comments, and channel message history. Binary attachments, Slack threads, inline GitHub review comments and very large workspaces are not fully supported. Live acceptance tasks I01-I05 remain.

The /mcp/status alias is compatibility naming only. It is not proof of an MCP server/transport.

### Retired prototype code

The following constructors now fail closed with a message directing callers to Actions:

- app.agents.agent_manager.AgentManager
- app.agents.agent_manager_new.AgentManager
- app.agents.tools.app_launcher.AppLauncher
- app.agents.tools.mcp_combo_client.MCPComboClient
- app.core.orchestrator.Orchestrator

Their historical implementations remain in Git. Some old provider wrappers remain as unused source. Do not wire them into chat or bypass the active policy/approval layer. The new tests cover the five retired constructors.

## Landing-page restoration

The user supplied a protected Vercel deployment, then an authorized share link. The share link allowed reading server HTML. Its headline/navigation matched the original Git page. No connected browser was available, so pixel-level equivalence, interactions and exact deployment revision remain unverified.

Restored:

- Original centered headline, neural hero illustration, fixed navigation and theme toggle.
- Three pillars, comparison, architecture, horizontal stack section and selected-source integrations.
- Original interactive footer and section styling.

Limited corrections:

- Replaced absolute privacy/instant-response/NPU claims with supported local-inference and conditional-hardware descriptions.
- Described real imports and explicitly approved actions; labelled advanced desktop/audio capabilities as planned.
- Removed public-page backend probing and fake "core online"/hardware initialization messages.
- Kept a short branded intro with skip/Escape behavior; added reduced-motion handling and animation cleanup.
- Retained section content/anchors in initial HTML instead of hiding them until intersection.
- Corrected theme-toggle system-theme behavior, scrolled dark-navigation contrast, CTA contrast, footer wrapping and icon labels.
- Preserved local authentication; did not restore Clerk merely to match old login buttons.
- Kept local system fonts so a core build does not require fetching Google fonts. Typography parity with the old deployment should be reviewed before deciding whether to bundle licensed font files.

The newer page is saved as a non-routed source reference under docs/reference. It is not the public homepage. L04 is still awaiting browser visual acceptance/user review. Do not mark it complete on build/HTTP evidence alone.

## Setup and operation

Supported baseline: Windows, Python 3.12, Node >=22.13. Python 3.15 alpha in the root .venv is not supported for ONNX. Use backend/venv for the app.

From project root:

~~~powershell
py -3.12 -m venv backend/venv
backend/venv/Scripts/python.exe -m pip install -r backend/requirements.lock.txt
cd backend
./venv/Scripts/python.exe -m app.provision
cd ../frontend
npm ci
npm run build
~~~

Provisioning is an explicit network download; startup/retrieval should use cached model files. Ollama is a separate installed local service. Start it and pull a suitable model if none is installed.

Start backend and frontend in separate terminals:

~~~powershell
# backend terminal
cd backend
./venv/Scripts/python.exe -m app.main

# frontend terminal
cd frontend
npm run start
~~~

Open http://127.0.0.1:3000. Pair using the local token file, then confirm the installed model in Settings. Do not publish or paste the token into shared logs.

Useful API groups:

| Group | Backend paths |
| --- | --- |
| Health/configuration | /health/live, /health/ready, /, /settings |
| Import jobs and sources | /ingestion/jobs, /jobs/{id}, /upload, /sources, /source |
| Conversations | /conversations, /conversations/{id}, /ask, /ask/stream |
| Agent administration | /agents, /agents/{id} |
| Scoped tools/actions | /tools/terminal, /tools/web-search, /actions/preview, /actions/{id}/approve, /audit |
| Provider operations | /integrations/status, /integrations/{platform}/connect, /integrations/{platform}/sync |
| Other workspace state | /meetings, /set_mode, /ingest/url |

Configuration examples are backend/.env.example and frontend/.env.example. Backend .env loads before resolving DATA_DIR; relative SYNAPSE_DATA_DIR is anchored to backend, regardless of launch directory. Environment variables take precedence over dotenv defaults. Frontend SYNAPSE_BACKEND_URL is server-only and constrained to loopback.

This workstation already has Ollama 0.40.0 and llama3:latest installed. The repair used that existing model, rather than requiring another multi-GB download. Default model preference is llama3.2:3b; when no setting exists and it is absent, the app selects an available installed model. Do not overwrite a user's saved preference just to run a test.

Observed hardware: 16 GB RAM, Intel UHD, NVIDIA RTX 3050 Laptop GPU with 6 GB VRAM. Embedding verification used CPU. No GPU/NPU speed claim is substantiated.

## Data preservation and recovery

Default active data directory: backend/.synapse.

- api-token: local pairing secret, excluded from Git/backups.
- metadata.sqlite3: agents/settings/conversations/meetings/jobs/audit.
- vectors: Chroma persistent memory.
- models/minilm: provisioned ONNX/tokenizer files and snapshot manifest.
- backups: private archives and legacy copies.

Original runtime files were untracked after preservation, not deleted. Legacy JSON metadata is imported once when corresponding SQLite records are absent. Both original memory directories were backed up and their text re-embedded with prefixed source identity to avoid collisions. Historical page provenance cannot be reconstructed.

Local preservation artifacts from the repair:

- backend/.synapse/backups/legacy-20261007T123229
- backend/.synapse/backups/product-baseline.zip
- backend/.synapse/restore-check

These are machine-local and ignored. A new checkout will not contain them. Coordinate private transfer separately if another developer needs the data.

Stop the backend before backup/migration:

~~~powershell
cd backend
./venv/Scripts/python.exe -m app.backup create E:/SynapseBackup.zip
./venv/Scripts/python.exe -m app.backup restore E:/SynapseBackup.zip --target E:/SynapseRestored
~~~

Restore requires a new target, validates archive contents, and resets connected credentials/configuration and interrupted jobs. Model binaries and tokens are excluded. Set SYNAPSE_DATA_DIR to the new directory, provision there, and verify before retiring original data.

Synapse does not encrypt databases or document text at rest. Protect the OS account/disk and backups. SQLite metadata is transactional; multi-batch Chroma replacement is not an application-wide transaction. Back up before migrations or critical vector/schema changes.

## Verification and reproducibility

Final baseline checks:

- **56 backend tests passed** in a fresh Python 3.12 environment installed from requirements.lock.txt.
- pip check passed in that environment.
- Fresh npm ci succeeded using explicit isolated Node 22.13.1; strict lint and production build passed.
- Full npm audit JSON reported zero vulnerabilities at the final explicit-runtime check.
- Production smoke covers restored headline/section anchors, page responses, auth/cookies/origin protection, malformed/oversized pairing input, chunked proxy request limits and logout.
- Actual embeddings/Ollama smoke covers cited synthetic answer, persisted follow-up and unchanged reimport. It removes only its synthetic source/conversation.
- Actual legacy migration and portable restore succeeded earlier.

Commands:

~~~powershell
backend/venv/Scripts/python.exe -m pytest -c backend/pytest.ini backend/tests -q
backend/venv/Scripts/python.exe -m pip check
cd frontend
npm run lint -- --max-warnings=0
npm run build
npm audit --audit-level=high
cd ..
backend/venv/Scripts/python.exe scripts/verify_local.py
# Optional: running local models required; imports and removes synthetic data.
backend/venv/Scripts/python.exe scripts/verify_local.py --with-inference
~~~

The backend test suite isolates metadata/vector state and mocks provider writes. The real embedding test uses only an already-provisioned local model and blocks socket connections; CI skips it if assets are absent. Tests never create real GitHub issues or send real channel messages. Retired import-time live mutation scripts are inert.

One Starlette/httpx test-client deprecation warning remains. It is not a failing check.

An initial install-time npm summary reported five high-severity findings while subsequent full audit JSON returned zero. The discrepancy was not attributed to a confirmed cause. Record audits with timestamps/tool versions and inspect advisories if it recurs; do not blindly run audit fix --force.

Real-answer samples were 50.79 seconds cold, 11.57 seconds on a later repeat, and 17.65 seconds in the final tracked smoke check. They are not controlled performance comparisons. First-token latency, latency distributions, peak RAM and sustained usage still need Q01-Q03.

### Environment lessons

Windows npm.ps1 can select its adjacent system node.exe despite a prepended PATH. The host system Node is 22.12.0. Verification used an isolated 22.13.1 binary invoking npm-cli.js explicitly; no global Node replacement was performed. For another developer, install a supported stable Node version normally.

The host inherited NODE_TLS_REJECT_UNAUTHORIZED=0. It was removed in verification child shells; do not use disabled TLS as a dependency-download fix.

Fresh verification environment .tmp/baseline-venv and earlier .tmp scripts are ignored, disposable helpers. scripts/verify_local.py is the tracked reproducible check. Do not rely on unpublished helpers for future validation.

This coding environment required approved shell execution because default process creation failed. That is an environment restriction, not an application setup requirement.

## Git/GitHub and collaboration

Repository: https://github.com/AmoghxAnubis/Synapse

Baseline main was verified against live GitHub with no open PRs/issues or index conflicts at that point. The latest implementation check matched local HEAD and live main at 12d3dad515d4e4dc7a880201a3882c6bfbc5687d, with no unresolved index conflicts. Further documentation/smoke-script commits may advance that revision.

Another process committed/published repository changes during the coding session. This coding session did not itself issue commit or push commands. Check status/log/remote before starting; do not reset, rebase, or overwrite unexplained changes. Other historical branches were not comprehensively reconciled.

Current tracked runtime/common credential-pattern scans found no matches, but that is not a Git-history privacy audit. Previously tracked runtime content can still exist in historical commits. Assess actual exposure before deciding on coordinated history rewriting or credential rotation.

No license decision has been made. No cloud hosting cutover or DNS modification has been performed.

## Cloudflare plan

The user intends to move the public deployment from Vercel to Cloudflare, but explicitly deferred that work on 8 October 2026. Finish local beta acceptance first. When resumed, start with marketing/docs/onboarding pages. Preserve the original landing design and keep Vercel available for rollback.

A cloud server's 127.0.0.1 is not a customer's computer. The current local BFF/pairing architecture must not be deployed unchanged and expected to reach user Ollama/FastAPI. Public marketing and local app distribution need explicit separation.

Inventory routes and server dependencies, then choose a static export or supported Workers approach. Cloudflare's current guidance distinguishes static Pages from full-stack Workers; verify adapters and runtime compatibility with this project's Next.js version. No adapter has been selected or installed.

References: [Cloudflare Next.js overview](https://developers.cloudflare.com/pages/framework-guides/nextjs/) and [Workers Next.js guidance](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/). Account access, domain details and preview acceptance remain future dependencies.

## Outstanding work and next developer actions

1. Visually compare the restored local page with the authorized deployment: desktop/mobile, dark/light, animations, canvas fallback, navigation and keyboard. Finish L01/L04 honestly; browser access was unavailable.
2. Verify fresh install on a second Windows machine (D01). Same-machine clean environments are evidence, not cross-machine acceptance.
3. Define a representative evaluation corpus and thresholds; benchmark quality/resource use before choosing smaller models or retrieval complexity.
4. Run dedicated, scoped live connector acceptance. Require explicit authorization before creating external resources.
5. Align dashboard design to the restored landing page after visual acceptance.
6. Inventory public-site deployment and prepare Cloudflare preview; no production domain cutover before a validated preview and rollback.
7. Design beta packaging, startup/shutdown, model onboarding, private per-user data and update/recovery.
8. Complete historical privacy/licensing groundwork, support/export/deletion expectations and beta feedback.
9. Revisit original advanced features only after requirements and usefulness are clear.

Additional limitations worth preserving in planning: streaming cancellation is cooperative and may wait for a local model read/timeout; no full process-level traffic audit has been completed; generated citations need evaluation; OS keyring/provider permissions need real-machine acceptance; packaging estimates cover a beta prototype, not a fully signed production updater.

Use PROJECT_TRACKER.md as the canonical queue. Mark active tasks, add evidence on completion, explain blockers and revise estimates. Checklist counts and readiness estimates are different measures. Original estimates for landing/hosting were 14-28 focused hours and complete beta preparation 73-146 hours; re-estimate remaining work rather than repeating the original total after tasks are done.

## Working agreements to preserve

- The original landing design is the approved direction; only limited, purposeful changes.
- Preserve private data and user preferences. Do not delete original stores to obtain a clean test.
- Keep ordinary questions separate from actions; enforce policy independently of model output.
- Treat external writes as explicitly authorized operations. Mock tests do not authorize real messages/issues.
- Make public claims match verified behavior; no unmeasured instant response, guaranteed NPU acceleration or absolute no-network claims.
- Keep tracked source/configuration separate from runtime state, credentials and share tokens.
- Prefer meaningful regression checks and reproducible evidence over architecture churn.
- No secret values or share-link tokens belong in this handover, tracker or screenshots.

This handover records the context and decisions needed to continue safely. It does not claim the full original feature vision or commercial release is complete.

## Continuation update - 8 October 2026

Cloudflare tasks H01-H04 are deferred after the local beta gates; they are excluded from active estimates. Q01 has started with evaluations/corpus.json, a synthetic 16-case corpus, and scripts/evaluate_retrieval.py using temporary vector storage. This measures retrieval and scope behavior only; generated answer correctness, citation support, abstention and conversational follow-ups remain pending. See evaluations/README.md and PROJECT_TRACKER.md. Browser surfaces remain unavailable at this session's inventory check, so visual acceptance is still pending.

Synthetic retrieval baseline passed 8/8 supported evidence checks, 8/8 top-one checks, 4/4 scope checks and 3/3 unrelated empty-retrieval checks at distance 0.65. Results are in evaluations/results/retrieval-baseline.json. These small synthetic results do not establish answer accuracy. The evaluation runs in a child process so Windows closes Chroma mappings before temporary storage cleanup. Backend suite now has 58 passing tests.

## Real-answer evaluation continuation - 8 October 2026

scripts/evaluate_answers.py runs the real API, ONNX and installed Ollama with isolated storage/token/agents/settings and no live provider writes. Sixteen cases completed; nine answerable cases had expected facts and cited evidence, seven unsupported/excluded cases abstained, four scope boundaries held, and all conversation turns persisted. The coding assistant reviewed the saved answers; this is not independent acceptance or general accuracy evidence. A lexical abstention mismatch was corrected without changing product behavior. Original and rescored artifacts remain separate. See evaluations/ANSWER_BASELINE.md for limits and reproduction. Q01 still requires harder representative cases and agreed thresholds; Q02 still requires real streaming/resource measurements.


## Harder quality repair continuation - 8 October 2026

See evaluations/HARDER_BASELINE.md for the complete corpus, failed/intermediate/final runs, scoring corrections, manual review and reproduction. The 14-case harder corpus adds long multi-chunk sources, conflicting versions, ambiguity, embedded instructions/fake roles, follow-ups with source/topic changes and a repository README snapshot. Original before answers were preserved and explicitly rescored using the final checks: facts/evidence 9/11 before versus 11/11 after; forbidden claims absent 2/4 before versus 4/4 after. These are small-corpus diagnostics, not general semantic accuracy.

LocalLLM now serializes evidence as one quoted JSON string, keeps the current question in plain text after it, and adds evidence/citation/history/version guidance. The initial JSON-question attempt regressed follow-ups; that artifact remains preserved. main.py appends the previous question for retrieval only on short referential questions, not every short topic change. It is an English reference-word heuristic, not full question rewriting. Chat still cannot execute actions.

FileIngester uses production's fast-tokenizer character offsets to retain original case, punctuation, Markdown and internal whitespace within bounded overlapping chunks. Slow/custom fallback remains. MemoryBank records chunk_format=2 and refreshes earlier-format chunks on the next explicit import/sync even when the content hash is unchanged; subsequent imports deduplicate. No automatic user-store migration or deletion occurred. Old normalized passages require the original source to recover formatting. The tokenizer's misleading whole-document length warning is avoided on the offset path without truncating document tails.

The evaluator accepts --corpus/--checks and explicit --updated-checks for rescoring. Original corpus/checks hashes are validated before revised checks are applied; original answers/metrics/hash and updated checker hash are preserved. Historical hashes cover raw bytes, so Git newline conversions can invalidate a comparison. Scoring snapshots match saved run hashes in this checkout. A post-run runtime-observation.json records Ollama 0.40.0 and the installed llama3:latest digest; runs did not pin/verify it at startup.

Final checks: 70 backend tests passed; original retrieval diagnostics remain 8/8 evidence and top-one, 4/4 scope, 3/3 unrelated empty. Original 16-case answer diagnostics passed (9/9 facts/evidence, 7/7 abstentions, 4/4 scope, 16/16 persistence). The local backend was restarted only after checking no imports were active. Production verify_local.py --with-inference passed pairing/origin/body limits, restored landing HTML/anchors, cited answer, persisted follow-up and deduplication; the synthetic source/conversation were removed. Production answer sample: 6.56 seconds, not a controlled benchmark. Frontend was not changed in this quality continuation.

Do not mark Q01/Q03 complete: manual original-corpus review found the approval answer correctly states single use but then incorrectly says reuse is undocumented. Answers also repeat themselves and some related-topic abstentions mention background facts without inline citations. Fact-presence checks miss contradictions. Prior conversation history is still sent to the model; source changes filter retrieval, not erase history. The scoped follow-up passed this sample, but history-grounding and injection need broader evaluation. Next add unseen claim-support/contradiction/history cases and representative approved documents, agree release thresholds, then measure real HTTP streaming/cancellation/resource distributions under Q02. Browser acceptance and live connectors remain pending. Cloudflare stays deferred. Checklist remains 18/46 (39%); readiness assessments remain baseline about 95%, small beta about 65%, paid release about 30%.
