# Persistent local-action approvals

Implemented 14 October 2026 on `ayush_lang`, after fast-forwarding to updated `main` at `4f6ef83` (including the integrated PR #34 work).

Local app previews now survive a backend restart. The Actions screen lists saved pending local previews; select **Review**, inspect the saved app description and original expiry, then approve or cancel. Approval still expires five minutes after preview creation; reopening the screen does not extend it. Ordinary chat does not create, approve or run actions.

The first workflow covers the existing `open_app` allowlist: Calculator, Notepad and Paint on Windows. GitHub/Slack/Discord approvals retain their existing in-memory flow. No external writes or real app launches were used in verification.

## Implementation

- `backend/app/workflows/actions.py` defines a deterministic LangGraph approval interrupt followed by an execution node. It resumes with `Command(resume=True/False)` using a stable local-action thread ID. LangSmith tracing is explicitly disabled. No model call is required.
- The official SQLite saver writes graph checkpoints/writes to the existing metadata SQLite file. Each invocation owns and closes its saver connection. Synchronous durability persists the interrupt before the preview becomes approvable. Existing SQLite metadata backups include both checkpoints and the action ledger.
- `ActionService` stores the immutable preview in `action_runs`, initially `preparing`, then `pending`. Approval atomically changes `pending` to `resuming` in a `BEGIN IMMEDIATE` transaction. Only one competing service/request can claim it. The execution node rechecks current agent permission, Windows support, saved parameters and the original deadline before atomically reserving `executing` and calling the fixed app command with `shell=False`.
- Success records `completed` plus its result; known failures record `failed`. Audit events retain the approval decision and outcome. Cancellation consumes a pending approval before resuming the rejection branch; it cannot cancel an already consumed/executing action.
- `GET /actions/pending` returns unexpired durable local previews; `GET /actions/{id}` returns saved status/result. Both require the existing pairing session. Existing preview/approve/delete routes and successful approval response shape are preserved. The Actions page reloads pending local previews after navigation/restart.

LangGraph restarts an interrupted node on resume; the approval node therefore does not perform side effects before `interrupt`. Checkpoints alone cannot guarantee exactly-once process launching: the process may start before its completion checkpoint is saved. The separate ledger consumes the approval **before** launching, deliberately allowing at most one launch attempt per approval in the current database. See the official [interrupt documentation](https://docs.langchain.com/oss/python/langgraph/interrupts) and [SQLite checkpoint reference](https://reference.langchain.com/python/langgraph/checkpoints).

## Recovery and limits

If the backend stops after consuming approval, the saved state may remain `resuming` or `executing`; `interrupted` records a caught workflow error with uncertain execution outcome. These states cannot resume or launch automatically. Inspect the app and `GET /actions/{id}` before creating a fresh preview. A completed ledger result remains inspectable even if a later graph checkpoint fails. This trades automatic retry for avoiding duplicate side effects; it is not an exactly-once delivery promise.

Portable `app.backup restore` cancels all unfinished saved approvals. An older backup may predate a previous launch, so restoring its approvals would risk replay. Completed history remains available; create a fresh preview after restore. Manually copying or rolling back SQLite outside this restore command bypasses that safeguard.

Expired previews are omitted from the pending list and cannot be approved. They report `expired` when inspected and are marked expired durably when approval is attempted. Action history and checkpoints remain in the local database; no automatic retention cleanup is implemented. This workflow is for the current single-user local backend. It does not add hosted users, distributed workers or Kafka. Existing installer bundles must be rebuilt with the updated backend dependency lock before including this feature.

## Verification

The full backend suite passed **107 tests**, including real offline ONNX embeddings and twelve new workflow tests. New coverage uses real temporary SQLite/LangGraph and mocks process launching: service/API restart recovery, cancellation, expiry, permission removal, concurrent approvals, crash during launch, launch failure, checkpoint failure after success, missing-checkpoint rejection, metadata backup inclusion, portable restore invalidation and authenticated pending/status routes. These establish state/approval behavior without opening real apps.

Frontend strict lint, TypeScript checks and production build passed. The sandbox initially blocked Next.js worker creation; the approved rerun passed. The existing multiple-lockfile workspace-root warning remains. New pending-preview controls have not had live browser/keyboard acceptance, and the Windows installer has not been rebuilt or reaccepted for this change. Q01-Q03, existing visual acceptance and second-machine/package gates remain open.

## Live continuation - 14 October 2026

Actual loopback API/process checks recovered a Calculator preview after restart without changing its deadline. Approval completed and saved its result; replay was rejected, with Calculator window inventory changing from zero to one. Cancellation, removed permission and app allowlist checks passed using a temporary test agent, which was removed. An earlier isolated run also rejected a real five-minute expiry after restart. Clean locked lint exposed render-time Date.now; the UI now uses an effect-driven clock to disable expired controls and show the actual deadline. Interactive browser/countdown and refreshed installer acceptance remain open because native UI input/capture could not be verified reliably. See [the beta report](../evaluations/BETA_VERIFICATION.md).
