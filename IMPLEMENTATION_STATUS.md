# Synapse implementation status

## Answer-quality continuation — 10 October 2026

Ten additional synthetic real-API/ONNX/Ollama cases exposed changed-source history contamination and incomplete regional answers. The workflow now drops old generation history when source selection changes while retaining the previous question for retrieval. Stronger checks require both sources in two-document answers and label each regional value. Two final ten-case runs, the original/harder corpus regressions, and 84 backend tests passed. This remains development-corpus evidence rather than independent holdout acceptance; Q01/Q03 and Q02 are still open. See [the additional quality report](evaluations/UNSEEN_QUALITY.md).

## LangChain/LangGraph continuation — 8 October 2026

The initial framework integration is implemented on `ayush_lang`. `LocalLLM` now uses LangChain's `ChatOllama`; `app/ai/prompts.py` retains the existing bounded evidence-only prompt/history and `app/ai/retriever.py` converts existing memory records to LangChain Documents. `app/workflows/chat.py` runs agent/source scope, follow-up retrieval, optional explicitly consented web context, and generation/abstention through LangGraph. Both API endpoints retain existing response/SSE contracts and save completed conversation turns through existing SQLite storage.

Existing ONNX embeddings, Chroma identity/thresholds, imports, credentials, action approvals and frontend remain in place. There are no chat action nodes, execution checkpoints or Kafka services. Cloud LangSmith tracing is explicitly suppressed for graph and model calls even when inherited environment settings enable it. Ollama remains constrained to loopback with proxy inheritance/redirects disabled and bounded connect/read timeouts. Cancellation signals the generation node before closing the graph; the model iterator and synchronous client are closed. Cancellation remains cooperative during an active Ollama read.

Verification in a fresh isolated Python **3.12.13** environment installed from the resolved lock: **71 passed, 1 skipped**. The skipped check requires provisioned ONNX assets absent in this checkout. `uv pip check` passed for 133 packages. Existing locked versions were preserved while adding framework dependencies. Tests cover real ChatOllama serialization through a mocked HTTP transport, evidence role isolation, prompt bounds, provider failures/redirect policy, tracing suppression, graph failure cleanup, cancellation, scoped retrieval and persisted streaming. Frontend files were not changed; frontend checks were not rerun.

`scripts/verify_chat_workflow.py --model llama3.2:latest` used temporary synthetic retrieval/SQLite with the installed real Ollama model. Streaming returned the correct 4200 USD answer with [1], source provenance and a saved turn. A factual follow-up also persisted, but its generated text omitted [1]. The tracked smoke correctly exits **1** for that citation diagnostic. This is an unresolved Q01 quality issue, not a passing citation acceptance gate. Single stream-answer samples were 44.11 seconds initially and 1.29 seconds on a later run; neither is a controlled benchmark or a first-token measurement. Full real-embedding evaluation remains pending provisioning; no model download or user-data migration occurred.

See A01 in PROJECT_TRACKER.md. Initial integration is complete; Q01-Q03 and beta acceptance remain open. The 8 October `ayush_lang` commit instruction applied to that integration; on 10 October the user selected `origin/main` for the post-merge quality work. Keep Markdown reports current and confirm the target branch for later tasks when it is not specified.

Updated 7 October 2026. This records the implementation following [the baseline review](BASELINE_REVIEW.md). The initial product is a single-user local AI workspace: import context, find evidence, ask cited questions, retain conversations, and explicitly approve supported actions.

## What changed

| Baseline finding | Implemented repair | Verification / limit |
| --- | --- | --- |
| Unauthenticated backend and unrestricted shell | Loopback services, local bearer pairing, same-origin authenticated frontend proxy, typed requests, fixed diagnostic commands; chat never dispatches actions | Authentication, permission, origin, and diagnostic regression checks |
| Ordinary questions could trigger writes | Separate explicit Actions workflow, destination/content preview, expiring one-use approvals, policy recheck and audit | No real external write was performed; approved-action behavior uses mocks |
| Broken build and incomplete environment | Next/React updates, lint/type fixes, declared and locked dependencies, Python 3.12 environment, CI, local fonts, removal of Clerk and unused CLI packages | Production build and strict lint pass; full npm audit found zero vulnerabilities at verification time |
| Fake connection/sync success | Awaited validated configuration, OS credential store, scoped REST imports, stable IDs/content hashes, pagination, retries, cancellation, bounded requests, truthful errors and status | Mocked coverage; live provider account acceptance remains required |
| Launch-directory data split / unsafe JSON rewrites | Stable data path, SQLite transactions, Chroma source replacement, legacy import, preserved database backups, portable backup/restore | Concurrent ID tests, dedup tests, actual legacy migration and portable restore succeeded |
| Tracked personal runtime state | Removed runtime files from Git tracking after preservation; ignore rules added | Originals remain locally; existing Git history still requires a separate privacy audit |
| Truncated vectors and ungrounded retrieval | Token-aware overlapping chunks, normalized embeddings, cosine threshold, source metadata, scoped retrieval and no-evidence abstention | Real ONNX retrieval plus isolated tests; relevance threshold and generated citations need broader evaluation |
| Ephemeral chat | Persisted conversations and bounded history, source restriction intersection, streamed answers, cancellation, citation/source reader | Actual Ollama answer and follow-up succeeded; persistence tests pass |
| Overbroad offline claims | No cloud sign-in, explicit model provisioning, local inference, proxy isolation, connected features off by default, per-query web consent | Actual offline embedding test blocks socket connections; complete process-level outbound-traffic measurement remains open |
| Fragile uploads, startup and URL fetches | Lazy model loading, liveness/readiness, bounded background jobs, upload/text/DOCX expansion/PDF page limits, public-IP-pinned URL fetch with redirect validation | Failure, cancellation, unsafe URL and input-limit tests |
| Misleading product UI | Real provider/readiness display, useful Settings, source administration, manual meeting notes, honest action and integration descriptions | Production routes and pairing checked by HTTP; visual browser acceptance remains open |

## Verification evidence

- Backend: **56 tests passed**, including real provisioned CPU ONNX embeddings, with the remaining tests isolated from user data and live services. One dependency deprecation warning remains.
- Backend dependency consistency: `pip check` passed.
- Frontend: strict lint with zero warnings and production build passed.
- Dependency audit: full `npm audit` reported **zero vulnerabilities** at verification time. This is a time-specific result, not a permanent security guarantee.
- Actual document-to-answer smoke test: imported a synthetic source, retrieved it, generated the correct budget answer with a citation through installed Ollama `llama3:latest`, persisted a follow-up, confirmed unchanged reimport deduplication, and removed the synthetic source/conversation afterwards.
- The first cold real answer took **50.79 seconds** on this machine. A final repeat after the connection/context changes completed correctly in **11.57 seconds**, including successful follow-up and deduplication checks. These single samples are not a controlled performance comparison. Streaming is implemented, but first-token latency, cold/warm distributions, peak RAM, and long-session performance have not yet been systematically benchmarked.
- Production HTTP checks: pairing produces an HttpOnly SameSite=Strict cookie; unpaired and cross-origin requests are blocked; workspace routes return successfully; logout removes API access. This caught and fixed a localhost/127.0.0.1 origin mismatch.
- Both original vector stores were backed up and their text migrated. A portable archive was created and restored into a new directory successfully.
- Current tracked runtime-file and common credential-pattern scans found no matching files/secrets. This is not a full history or credential audit.
- The host has Python 3.12.10 and system Node 22.12.0. Final clean installation and checks used an isolated supported Node 22.13.1 invoked explicitly, plus a fresh Python 3.12 environment. System Node was not replaced.

No connected browser was available for visual inspection. No live GitHub/Notion/Jira/Slack/Discord credentials were exercised. No real messages or issues were created by the verification suite. GPU/NPU acceleration was not claimed or benchmarked.

## Local data and recovery

The active store is `backend/.synapse`. The pairing token is `backend/.synapse/api-token`; do not publish it.

Legacy backups are under `backend/.synapse/backups/legacy-20261007T123229`. The tested portable backup is `backend/.synapse/backups/product-baseline.zip`; its test restore is `backend/.synapse/restore-check`. These paths are ignored by Git. Backups contain private content and should be protected like the original data.

Local databases are not encrypted by Synapse. OS account and disk security remain part of the single-user trust model. A remote hosted deployment would require a different authentication, ownership, authorization, and isolation design.

## GitHub status

The baseline main branch was verified against live GitHub with no open PRs/issues and no unresolved index conflicts. During implementation another process advanced and published repository commits; this coding session did not issue commit or push commands. Do not assume a quiet working tree proves that nothing changed. The final live remote check matched local HEAD to GitHub main at b8150828fc3088e6f1c220d7625815655831c7de, with no unresolved index conflicts or diff whitespace errors. Subsequent report commits may advance that revision; read this alongside the current Git log.

No repository license has been selected. Existing historical runtime content has not been rewritten or purged; assess it before deciding whether a coordinated history rewrite or credential rotation is necessary.

## Remaining release work, in order

1. **Product acceptance:** visually test pairing, imports, citation navigation, chat cancellation, agent scope, errors, narrow screens, keyboard and screen-reader use. Fix issues observed by actual users.
2. **Measured answer quality:** create a representative fixed corpus with supported, unsupported and follow-up questions. Record retrieval hit rate, citation support, wrong-answer rate and abstention. Calibrate retrieval thresholds; use reranking/hybrid retrieval only if the measurements justify it.
3. **Performance:** benchmark cold/warm first-token and complete-answer latency, memory use, ingestion throughput and multi-document sessions on target machines. Prefer a smaller installed model when it materially improves the experience without failing quality gates.
4. **Live connected-source acceptance:** test each intended provider with a dedicated test repository/page/project/channel and limited credentials. Verify permission denial, pagination, deletion, rate limiting, disconnect and approved writes. Current limits and exclusions are documented in README.
5. **Distribution and recovery:** validate a clean checkout on supported Node/Python and a second Windows machine, then choose an installer/desktop shell, signing, model onboarding, service lifecycle, updates and user-data location outside the checkout.
6. **Original desktop ambition:** real window tiling, notification control, meeting audio/transcription and interoperable MCP transport remain unimplemented. Current modes are saved preferences and meeting notes are manual. Design these as explicit permissioned features with recovery and privacy checks before advertising them.
7. **Commercial readiness:** choose a license and dependency/model license policy, complete historical privacy review, define support and deletion/export expectations, evaluate encryption needs, and establish beta feedback and willingness-to-pay evidence. Hosted accounts/billing should follow a clear product requirement and security design.

The confirmed baseline defects have substantial repairs and regression coverage. This is a working foundation for a beta, not a claim that every original feature or commercial release gate is complete.

## Baseline follow-up and landing restoration

The original landing composition was restored from cc596f4, retaining the user-selected hero, illustrations, sections and footer. Targeted changes correct claims/CTAs and improve anchors, animation cleanup, reduced-motion behavior and theme contrast. The replacement page is retained at docs/reference/implementation-landing.tsx. Exact deployed revision and visual parity remain unverified; no browser surface was available.

Fixed configuration initialization so backend .env loads before data-path resolution and relative paths anchor to backend. Retired five unused prototype execution constructors so unsafe routing/shell/demo workflows cannot be accidentally reconnected. Added bounded frontend request-body reads, including chunked requests, and useful malformed-pairing errors.

Final verification: 56 tests and pip check passed in a fresh locked Python environment; clean npm ci, strict lint, build and full audit JSON passed under isolated Node 22.13.1. The install-time audit summary and a subsequent audit initially differed; the final explicit-runtime JSON returned zero vulnerabilities, and no cause for the earlier discrepancy was established.

The tracked scripts/verify_local.py --with-inference passed production session/origin/body-limit checks, restored landing headline/anchors, real cited answer, saved follow-up and deduplication. The final answer sample took 17.65 seconds; synthetic source/conversation were removed. See DEVELOPER_HANDOVER.md for complete continuation context and PROJECT_TRACKER.md for current task status.


## Answer-quality follow-up - 8 October 2026

Added a fixed 14-case harder evaluation alongside the 16-case synthetic baseline. Observed failures drove stronger quoted-evidence/current-question handling, less topic carryover and preserved source formatting via tokenizer offsets. Old chunk-format records refresh on explicit import/sync without automatic user-data rewriting. Comparable harder facts/cited evidence improved from 9/11 to 11/11; four specified forbidden-claim checks all passed in the final run. Original and intermediate failures and checker changes remain auditable.

70 backend tests, final original-corpus diagnostics, real retrieval and production smoke passed. Synthetic smoke source/conversation were removed and the live backend runs the updated code. Manual review still found a contradictory approval/reuse answer despite passing automated facts; general semantic accuracy is not established. Q01/Q03 remain active, Q02 streaming/resource benchmarks and representative acceptance remain pending. No frontend or hosting change was made in this continuation. See evaluations/HARDER_BASELINE.md, PROJECT_TRACKER.md and DEVELOPER_HANDOVER.md.
