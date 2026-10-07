# Synapse baseline review

Reviewed 7 October 2026. Baseline commit: `cc596f4ca0ad7a594f9d72cd228ddecdece6453b`.

## Purpose and assessment

The README describes a local-first AI desktop companion with four responsibilities: ingest personal/workspace context, retain searchable memory, answer questions locally, and assist with OS workflows. The implementation contains meaningful foundations: Next.js dashboard routes, a shared API client, FastAPI endpoints, ONNX embeddings, persistent Chroma storage, Ollama generation, agent configuration, and external service wrappers.

The current implementation is a prototype with incomplete connections between those pieces. Several advertised behaviors exceed what the code implements. Improving it requires reliable end-to-end workflows, consistent privacy boundaries, and measured correctness before adding more features. Existing frameworks can remain; a wholesale rewrite is not justified by this review.

Recommended initial product promise: **Import documents, ask useful questions with verifiable citations, retain personal context, and perform explicitly authorized actions using local inference.** Hardware acceleration should be optional and measured.

## Git and GitHub

- Working tree was clean before and after validation commands. Local `main` and cached `origin/main` pointed to `cc596f4`.
- A live GitHub compare of `cc596f4` against `main` returned `identical`, zero commits ahead or behind. This verifies current main alignment independently of cached local refs.
- GitHub searches returned no open pull requests and no open issues in `AmoghxAnubis/Synapse`.
- `git ls-files -u` returned no unresolved index conflicts.
- Local `aditya_MCP` was two commits behind its cached upstream; `auth-first-stage` matched its cached upstream. Neither branch was merged or modified. Their current remote divergence and potential future merge conflicts were not comprehensively checked.
- Chroma SQLite/vector files in two directories, `backend/agents.json`, `backend/meetings_data.json`, and Clerk temporary state are tracked. Runtime state creates noisy changes, merge risks, and a potential private-data exposure path. The contents were not treated as a proven secret leak; perform a separate credential and history audit.
- No tracked GitHub Actions workflow or license file was found. No legal/licensing dispute assessment was performed.

Repository: https://github.com/AmoghxAnubis/Synapse

## Validation evidence and limits

| Check | Result |
| --- | --- |
| `npm run lint` | Failed: 6 errors and 15 warnings. Errors include explicit `any`, unescaped JSX apostrophes, and state updates within a chat input effect. |
| TypeScript, no emit | Failed: agent creation omits required `integrations`; generated `.next` types also referenced an absent `/auth` route. |
| `npm run build` | Compilation succeeded, then TypeScript failed on agent creation. This confirms a source-level production build blocker. |
| Python AST parsing | All 31 Python files outside virtual environments passed syntax checks. |
| Dependency discovery | `.venv`, `venv`, and `backend/venv` lacked the checked backend modules, including FastAPI, Chroma, ONNX Runtime, and Transformers. |
| Isolated routing check | `Summarize project requirements` matches `pr`; `How do I restart the application?` matches `star`. |
| Terminal regex compilation | Patterns compiled successfully; this does not establish effective command isolation. |

The backend was not started, model inference was not benchmarked, and external credentials were not exercised. Existing `backend/test_mcp.py` creates a real GitHub issue through `/ask`; it was deliberately not run. Full browser usability, model quality, clean installation, offline operation, hardware acceleration, and concurrent persistence remain unverified. Node commands warned that TLS verification was disabled in their execution environment; the origin of that setting was not established.

## Prioritized findings

### P0: Backend trust boundary and action execution

Evidence: `backend/app/main.py` has no API authentication/authorization dependencies, allows all CORS origins, and binds to `0.0.0.0` when run as documented. Clerk protects frontend routes only; `frontend/lib/api.ts` sends no authentication token. Data deletion, credential replacement, shell execution, and OS actions are backend endpoints. There is no user/workspace ownership partition for data.

`backend/app/core/terminal_tool.py` uses `subprocess.run(..., shell=True)` with a denylist, current working directory, and inherited process permissions. This is not an OS sandbox. The terminal endpoint does not enforce the selected agent's terminal capability. `/ask` routes tools before loading the agent, so integration selections/capabilities do not govern those actions either.

Repair: establish a single-user local trust model first: loopback binding, narrow origins, authenticated local sessions, validated requests, and explicit action permissions. Introduce typed, allowlisted tools, constrained paths, preview/approval for writes, time/output limits, and an action audit log. If multi-user access is intended, add ownership and isolation before exposing it. Disable unrestricted shell access until its execution boundary is designed and verified.

Acceptance: unauthenticated callers cannot read memory or trigger actions; disallowed capabilities cannot execute tools; external writes require explicit approval; approved local actions are logged and bounded.

### P1: Build and reproducible setup

Evidence: `frontend/app/dashboard/agents/create/page.tsx:35` omits `integrations`, required by `frontend/lib/api.ts`. Backend requirements are unpinned. Direct imports need `jira`, `slack_sdk`, and `bs4`, but those packages are not declared; `httpx` is also used directly without an explicit declaration. Web search optionally imports `duckduckgo_search` but does not declare it. There are multiple empty backend environments and no automated CI gate.

Repair: fix the source type contract and lint errors, select one supported Python environment, declare direct dependencies, lock a working dependency set, add redacted environment examples and startup diagnostics. Regenerate stale framework output rather than interpreting it as a source bug. Add CI for frontend lint/type/build and isolated backend tests. Verify a clean checkout installation.

Acceptance: a new checkout installs reproducibly, passes checks, and provides actionable messages when Ollama/models or optional connectors are unavailable.

### P1: Tool routing changes ordinary questions into actions

Evidence: `backend/app/agents/agent_manager.py` checks substring membership including `pr` and `star`. App launching also uses broad substring matching. The combined client uses regular expressions and defaults for missing parameters; Jira creation parsing appears before issue-list parsing. The router runs before agent selection and retrieval in `backend/app/main.py:116`.

Repair: distinguish answer/search requests from action requests, load agent policy before routing, use typed intents with validated required arguments, clarify ambiguity, and apply permissions independently of model/router decisions. Begin with deterministic explicit commands; evaluate a richer planner only once the action boundary works.

Acceptance: a regression set of normal questions reaches retrieval; read requests cannot become writes; malformed requests do not create resources with guessed defaults.

### P1: Integration connection and status are inconsistent

Evidence: `/integrations/{platform}/connect` only changes `os.environ`, returns `connected: true`, and neither validates nor persists credentials nor recreates connector instances. Wrappers cache credentials/clients at construction. Jira additionally requires server URL and email, which the single-key form does not collect. `/integrations/status` expects a `connected` boolean, while GitHub's `get_status()` returns a `status` string. `ConnectModal.tsx` waits a timer, calls an async callback without awaiting it, and immediately shows success.

Repair: use platform-specific validated configuration, OS credential storage, connector reinitialization, a consistent status schema, awaited UI requests, error feedback, disconnect, and persisted sync timestamps. Keep optional connector failures from preventing core startup.

Acceptance: connect works without restart; invalid credentials show failure; reload preserves truthful state; disconnect prevents subsequent connector operations.

### P1: Sync does not ingest promised content

Evidence: synchronization in `backend/app/main.py:327` saves short repository metadata, Notion titles/IDs, Jira project names, Slack channel topics, and Discord server names. It does not fetch the promised PR content, pages, tickets, or conversations. Fetch failures can be swallowed and reported as successful empty syncs. Every ingestion uses a random UUID, so repeated syncs duplicate records.

Repair: complete one connector first, preferably GitHub: user-selected repositories, relevant issue/PR/document contents, pagination, stable external IDs, content hashes, incremental upserts, deletion handling, rate-limit recovery, and truthful job results. Extend the proven pipeline to other services.

Acceptance: a question about actual selected source content can be answered with a source link; repeating an unchanged sync does not grow memory; failed syncs are distinguishable from empty results.

### P1: Memory storage is dependent on the launch directory

Evidence: Chroma uses `./synapse_memory_db`, agents use `./agents.json`, and meetings use `./meetings_data.json`. Two memory locations are already present. Agent/meeting writes use plain JSON rewrites without transaction or concurrency control; read errors may silently return empty data.

Repair: choose a stable per-user data directory outside the source checkout, back up both existing databases before deciding whether/how to migrate them, and keep application metadata in transactional SQLite. Preserve Chroma for vectors if it meets measured needs. Add schema/version migration, explicit corruption errors, export, backup, and restore. Remove tracked runtime artifacts from the index only after preservation; history cleanup is a separate decision if sensitive content is confirmed.

Acceptance: starting from either directory opens the same data; concurrent writes preserve records; backup/restore works; repository changes contain source/configuration rather than personal state.

### P1: Retrieval correctness and conversation quality

Evidence: ingestion chunks by 500 words while the embedding tokenizer truncates inputs; this can leave portions of a stored chunk unrepresented by its vector. Retrieval always requests three neighbors without a relevance cutoff. `/ask` returns document text as `sources`, rather than document/page/chunk provenance. Chat stores messages in component state and sends only the latest question; the LLM receives no conversation history. Agent-linked sources override the user's source selection.

Repair: use tokenizer-aware overlapping chunks, preserve stable document IDs/page or section references, normalize/evaluate embeddings and distance settings, calibrate relevance thresholds, and provide a grounded no-answer response. Define how user and agent source restrictions combine. Add persisted conversations, bounded history, real citations, streaming, and cancellation. Evaluate hybrid retrieval/reranking against a fixed corpus before adopting more complexity.

Acceptance: relevant text near the end of documents remains searchable; citations open the correct source location; unrelated questions do not invent support; follow-up questions retain context; source restrictions are testable.

### P1: Local/offline claims need an enforceable boundary

Evidence: inference is configured for local Ollama and ONNX, but Clerk authentication, Hugging Face model acquisition, external connectors, web search, and URL ingestion require network traffic. An agent with web search enabled sends its query outward automatically. Imported database files can also contain user context. Therefore the broad promise that data never leaves the OS is not established.

Repair: define offline and connected modes with visible data flows. Cache model artifacts, support core use without cloud sign-in, require consent before sending potentially sensitive queries to search, and document exactly what is transmitted for connectors. Evaluate local database telemetry/settings and secret handling. Preserve the useful narrower promise that inference can remain local, and verify it with network observation.

Acceptance: after explicit model provisioning, core ingestion and chat work with network blocked; connected actions disclose their destination; private source content is not automatically sent to web search.

### P2: Reliability, URL ingestion, and honest feature states

Evidence: backend initialization constructs model/database/connectors at import time. Ollama requests have no timeout or HTTP status check, and connection failures are returned as answer strings. The frontend times out after 30 seconds. Async upload handling performs synchronous parsing/embedding work. Uploads lack size limits and unsupported formats become the literal text `Unsupported file format.` in memory. URL ingestion accepts arbitrary targets and follows redirects without private-network restrictions, response status validation, or response-size limits.

Repair: FastAPI lifespan initialization, separate liveness/readiness, background ingestion jobs, bounded input/output and timeouts, explicit errors, safe URL validation including redirects, and cancellation/recovery. Distinguish real CPU execution from simulation: `CPU_MOCK` currently runs real embeddings. Report observed providers and Ollama readiness instead of hardcoded GPU/NPU flows.

Orchestrator modes currently open Notepad/Calculator or print a focus message; they do not implement window arrangement or notification control. The settings Ollama URL is disabled; meetings implements manual notes/tasks, with no transcription pipeline. Classes named MCP wrappers expose direct in-process methods; an interoperable MCP transport is not demonstrated. Several manager/client implementations overlap. Keep working UI pieces, consolidate execution paths, and label incomplete behavior accurately.

Acceptance: invalid/oversized uploads and unsafe URLs are rejected; missing models produce useful diagnostics; ingestion does not block core health; the UI describes observed behavior and never reports failed operations as successful.

## Repair sequence and completion gates

1. **Stabilize and protect.** Fix build/lint, lock setup, establish local authentication and tool permission boundaries, preserve runtime data, configure one data directory, and add CI. Gate: fresh installation works and unauthenticated actions are rejected.
2. **Complete the memory-to-answer workflow.** Improve ingestion, deduplication, provenance, retrieval evaluation, persisted chat, streaming, and offline startup. Gate: import a PDF, ask a supported question with an accurate citation, answer a follow-up, decline unsupported questions, and repeat after restart with network blocked.
3. **Complete one integration.** Implement GitHub connect/status/disconnect and real incremental content ingestion using the same document pipeline. Gate: selected repository contents are searchable; no duplicate vectors or false success on repeated/failed syncs.
4. **Implement controlled actions.** Add typed read tools first, then approved writes and constrained OS actions. Gate: permissions, ambiguity, failure, and cancellation scenarios pass without unexpected side effects.
5. **Expand and optimize.** Apply connector patterns to Notion/Jira/Slack/Discord, implement genuine workflow modes and meeting capture if desired, benchmark CPU/GPU/NPU paths, then package a desktop experience and polish accessibility/performance. Gate: measured quality, resource use, privacy, and usability targets are met on the user's actual hardware.

Avoid schedule promises until the backend runs, available hardware/RAM is known, and the initial product scope is agreed. A desktop shell, new vector database, cloud model fallback, and dedicated AMD deployment should each be justified by requirements and benchmarks rather than added preemptively.

## Baseline scorecard to establish during phase 2

Use a versioned test corpus and record retrieval hit rate, citation correctness, unsupported-question behavior, follow-up accuracy, duplicate count after reimport, restart/restore integrity, first-token latency, total response latency, peak RAM, ingestion throughput, and observed outbound traffic. Set numeric targets after measuring the first working baseline. Permission enforcement, clean checks, and data preservation are release gates from phase 1.

## Next implementation session

Start with the agent-creation build failure, the six lint errors, an explicit backend dependency manifest, and local API/tool protection. Keep changes small and reviewable. No production source code, credentials, Git history, remote branches, or external resources were changed as part of this review; this document is the audit deliverable.
