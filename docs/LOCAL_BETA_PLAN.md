# Synapse local beta execution plan

Prepared 15 October 2026 from the [readiness assessment](PRODUCT_READINESS_2026-10-15.md). Current implementation includes PR #35; planning started at `5c064aa` on `main`. This plan organizes existing [tracker tasks](../PROJECT_TRACKER.md); it does not add completed tasks or raise readiness.

## Target and confirmed constraints

The next deliverable is a private Windows x64, single-user beta that reliably imports supported documents, answers with supporting evidence using an evaluated local model, retains conversations, performs explicitly approved supported actions, syncs selected GitHub sources, and preserves and recovers user data through the supported lifecycle.

User decisions on 15 October:

- **GitHub is the first connector to validate.** Other providers remain implemented but outside the first beta's accepted connector scope.
- **No second Windows computer or independent tester is available yet.** Clean second-machine acceptance (D01), independent quality review and human first-use acceptance remain pending dependencies. Local checks can prepare the candidate but cannot close those gates.

Use `llama3:latest` as the initial evaluation candidate because it met the recorded sample quality gates. Record its installed digest, hardware and generation configuration before running acceptance; the mutable tag alone is insufficient. Do not silently replace the user's saved model. A different model needs its own evidence against the same gates.

Cloudflare migration, other live connector tracks, window arrangement, notification control, audio transcription, new MCP transport and hardware acceleration remain deferred from this milestone. Preserve the original landing design and existing local inference architecture.

## Ordered work packages

Effort ranges are allocations within the existing 40-85-hour one-connector beta estimate, not additional hours. External waits and major newly discovered defects are excluded.

| Sequence | Existing task mapping | Work and concrete output | Completion condition | Focused effort |
| --- | --- | --- | --- | --- |
| 1. Prepare acceptance | Q01, V03, D01, C03 | Record candidate scope/model/environment; assemble representative files and expected evidence; prepare tester and machine instructions; establish a pass/fail register | Inputs/checks frozen before evaluation; missing external dependencies visible | 1-2 hours |
| 2. Quality and performance | Q01-Q03 | Evaluate current code on longer PDF/DOCX/Markdown, multi-source, conflict, source-change follow-up and unsupported questions; save answers/citations; repair demonstrated defects and use fresh holdouts; measure current compound buffering, frontend timing, imports and sustained sessions | Technical diagnostics meet agreed gates; human claim review remains pending until a reviewer is available; measured limits documented | 10-20 hours |
| 3. Essential browser journey | L01/L04, V01-V03, A02 UI follow-up | Verify pairing, model readiness, import, scoped answer/evidence, reload/history, cancellation, pending-action restart/expiry and error recovery; fix observed usability issues and finish bounded dashboard alignment | Essential desktop/narrow-screen and keyboard paths pass; human first-use/design review remains pending | 6-12 hours |
| 4. GitHub acceptance | I01 | Validate the application's own GitHub connector on dedicated selected resources, including scope, sync lifecycle, permission errors and disconnect; separately exercise explicitly authorized issue writes | Stored live-provider evidence covers the supported read/write scope; mocks remain supplementary | 3-6 hours |
| 5. Current Windows candidate | D01-D03 | Build from the accepted revision/locks; verify bundled native dependencies and assets; test installed restart, backup/restore, pending approval invalidation, uninstall/data retention and a documented upgrade/rollback procedure | Same-machine candidate checks pass; exact package/hash and pending second-machine checklist recorded; D01 closes only on a separate Windows machine | 10-20 hours |
| 6. Release groundwork and feedback | C01-C03 | Resolve/dispose of dependency findings; inventory licensing/history privacy; document privacy, export/deletion, support and known limits; prepare private beta and review observed usage once testers exist | All first-beta gates pass, external reviews are recorded and the release decision is documented | 6-12 hours plus feedback |

The allocations total 36-72 hours before integration/defect contingency; retain the existing **40-85-hour planning envelope**. This is not a date commitment. At 20 focused hours per week it represents approximately 2-4.25 working weeks, plus unresolved hardware/tester/account waits. All-five-provider acceptance remains a separate 55-110-hour scope. A paid launch requires a new estimate after beta results.

Prepare machine/reviewer access in package 1. Packages 2-4 can advance independently when their inputs exist; controlled model benchmarks must run without competing model/test loads. Build the final installer only after the candidate's feature and dependency changes settle. A later product or dependency change invalidates affected evidence and requires rebuilding/rechecking the affected release paths.

## First implementation work package

Start with **model setup and the core browser journey**, using disposable data and existing model assets. This is a bounded first work package within sequences 2 and 3, expected to occupy roughly 4-8 focused hours including fixes, depending on findings.

1. Inspect installed Ollama/model readiness without changing saved preferences. Record model digest and effective configuration in evaluation evidence. Walk the missing-Ollama, missing-generation-model and missing-embedding paths; Settings and source administration must remain usable where supported.
2. Exercise the real production browser flow: pair, explicitly select the evaluation model in disposable settings, import a representative fixture, select a source, request an answer, inspect its evidence, reload history and cancel a second answer. Report setup failures separately from unsupported-answer behavior.
3. Exercise restored pending local actions after backend restart: original deadline retained, keyboard Review/Cancel reachable, expired approval disabled and rejected, duplicate approval rejected, removed permission respected. Use mocked launching for most regressions; any real launch must be a deliberate supported-app test. This user choice of GitHub does not authorize external issue/message creation.
4. Fix observed failures with changes limited to the affected flow. Add meaningful regression coverage for behavior changes; avoid tests that just mirror markup or repeat existing coverage. Run targeted checks, then the required backend/frontend gates for the final changed state.
5. Save case results, defects, code revision and logs/screenshots without secrets; identify what still needs human acceptance. Re-estimate before expanding scope.

Likely code surfaces, only if findings require changes: `frontend/app/dashboard/settings/page.tsx`, `frontend/app/dashboard/actions/page.tsx`, `frontend/app/dashboard/chat/page.tsx`, `frontend/components/MessageBubble.tsx`, `backend/app/core/llm.py`, `backend/app/workflows/chat.py` and `backend/tests/test_action_workflow.py`. Extend existing evaluators/browser procedures rather than introducing a new framework.

No application implementation is included in this planning session. Start the implementation on a dedicated branch from current `main`; preserve unexpected concurrent changes and the user's data. The earlier main instruction applied to synchronization; commit/push/release decisions are separate from this plan.

## Acceptance rules

### Answers and performance

- Preserve the approved gates: 100% selected-source scope compliance; 100% citation-reference validity; at least 90% complete supported answers with supporting citations; at least 90% correct abstentions.
- Freeze questions, expected facts and supporting passages before the first run. Score supported completeness and abstention separately; include contradictions and unsupported extra claims. Citation-number presence alone does not establish support.
- Include supported long-format files, cross-document questions, conflicting versions, embedded instructions, source-change follow-ups and negative questions. Exercise real parsers as well as the retrieval/generation path. Private documents remain outside Git; only approved sanitized fixtures or reproducible public/synthetic inputs are committed.
- Reuse `scripts/evaluate_answers.py` and `scripts/benchmark_rag.py` where appropriate. Preserve first failures and original scoring; do not repeatedly tune against one sample and call it independent acceptance.
- Record model digest, source revision, input/check hashes and environment. Include frontend first-output/total time, the buffered compound-answer path, varied persisted sessions, mixed-format import timing and resource observations. Establish target-machine latency expectations from those measurements; there is no new universal speed promise in this plan.

### GitHub

- Test the **Synapse application connector**, whose credentials/configuration are separate from the GitHub connector available in this chat.
- Use a dedicated repository and user-supplied app credential with explicit selected scope. Verify actual README/issues/PR descriptions/comments, source links, unchanged reimport, changed/deleted content reconciliation, pagination, denied scope, invalid/revoked credentials and disconnect. Record live versus simulated rate-limit/error coverage honestly.
- Temporary SQLite/vector storage does not isolate the current OS keyring namespace. Inspect existing configuration first; avoid overwriting or removing the user's stored GitHub credential. Prepare a test namespace or supervised resource arrangement if required.
- A selected provider does not authorize creating real issues. Prepare the exact test destination/title/body and obtain explicit authorization before live write acceptance. Mocked writes cannot close that part of I01.

### Packaging and recovery

- Build the exact candidate with manifests/hashes, locked dependencies and no private data/secrets. The older 12 October installer does not validate PR #35.
- Follow and extend [second-machine acceptance](SECOND_MACHINE_ACCEPTANCE.md) for the **installed bundle**, including a machine without development Python/Node, explicit model provisioning, pairing, import/answer, restart, offline core operation, backup/restore, unfinished-approval invalidation and retained-data uninstall.
- Same-machine fresh folders/users or a VM can expose additional defects if available. Label them accurately; they do not supply independent human review or prove behavior on different hardware, and do not close D01 under its present criterion.
- For a private beta, document the installer trust state and a tested manual upgrade/rollback/data-recovery procedure. Before broader distribution, settle signing and the maintenance/update path. Signed production auto-update engineering remains outside this beta estimate.

## Gate register

All entries start open; a plan or checklist is not acceptance evidence.

| Gate | Current position | Evidence needed to close |
| --- | --- | --- |
| Representative answer quality/model | Small prior samples; broader review open | Frozen representative run, claim review and agreed threshold results for the actual candidate model |
| Current first-use/actions UI | Prior core journeys passed; latest interaction gaps remain | Current browser/keyboard/error-path evidence plus independent first-use review |
| GitHub live connector | User selected; account/test-resource setup pending | App-specific live sync lifecycle and explicitly authorized write evidence |
| Current package/recovery | Old package passed local checks | Rebuilt candidate, installed lifecycle/recovery results and hashes |
| Clean second Windows machine | **Unavailable; D01 stays WAITING** | Separate-machine result with runtime/hardware/install logs |
| Independent reviewer/tester | **Unavailable** | Human first-use and representative-answer review; assistant review alone does not close it |
| Dependencies/privacy/licensing/support | Groundwork open; five high dev-chain npm entries | Compatible remediation or recorded disposition; inventories, user-facing policies and support/feedback workflow |

Without machine/tester access, the attainable checkpoint is **a locally verified beta candidate with external acceptance pending**. Do not label it release accepted or increase readiness solely because implementation checks pass. Complete independent work while those dependencies remain open; revise the release decision when actual evidence arrives.

Each result should identify task/case, candidate revision, model/package identity as relevant, expected outcome, actual outcome, pass/fail/pending, evidence location and any defect. Close all release-blocking data-loss, permission/scope, action-execution, setup and recovery defects before private beta distribution. Release availability and exact public claims must match the recorded accepted scope.
