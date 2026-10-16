# F01: bounded window arrangement and restoration

Design started 16 October 2026. This is the next advanced OS development slice after the [local technical checkpoint](LOCAL_BETA_PLAN.md#transition-to-advanced-os-development). It does not add a runnable OS action or claim Windows app compatibility. Independent review, browser acceptance and second-machine acceptance remain open release gates.

## First prototype boundary

Arrange exactly two explicitly selected, visible, resizable, normal-state test windows side by side within one monitor's work area. Preserve their original placements for an explicitly approved restore. Start with controlled test windows, then validate selected Notepad/Paint windows before claiming those apps are supported. Exclude minimized/maximized, elevated, modal, system, terminal, browser and unrelated application windows from the first prototype. Do not launch, close, type into, read document contents from or change permissions on target applications.

Add a separate `window_layout` agent capability, default off; an existing diagnostics/app-launch permission must not implicitly grant layout access. Ordinary chat remains unable to execute actions. Layout preview, approval and restore use the existing authenticated Actions boundary and single-use ledger. No model output supplies native calls or arbitrary coordinates.

## Intended user flow

1. In Actions, choose an agent with explicit layout permission and refresh the eligible-window inventory.
2. Select two windows and a monitor; choose their left/right order. Show app identities and current placement alongside the proposed layout.
3. Create an immutable, five-minute preview. Preview creation captures original placement and monitor geometry; it does not move anything.
4. On approval, revalidate permission, identity, monitor geometry, current placement and deadline. Consume approval atomically before the first move. Reject stale previews with a clear instruction to refresh.
5. Report the verified outcome for each target. A completed action offers **Review restoration**, which creates a new expiring preview showing current and saved placement. Restoration also requires approval and revalidation.

The initial prototype permits only one active layout operation/preview per workspace. Serialize overlapping requests transactionally, including preparation; a per-request lock or a unique approval ID alone is insufficient. Expired pending previews can be retired without execution. An uncertain executing/interrupted operation must not be retried automatically or silently release the workspace for another conflicting layout; expose inspection/recovery before proceeding.

## Native adapter contract

Keep native Windows access behind a small adapter, separate from pure layout planning and the approval ledger:

- `inventory()` returns eligible identities and current placements; query only what is needed for layout.
- `monitor_snapshot()` returns monitor/work-area and coordinate-context information.
- `capture(identity)` revalidates identity and returns placement/state.
- `apply(identity, target)` performs one validated placement change and reports the observed result.
- `restore(identity, saved)` restores captured placement only after the action service has revalidated the restore preview.

An identity must include more than a raw window handle: capture the owning process and its creation identity plus the verified application identity. Recheck at approval and before each native call; reject closed/replaced/ineligible windows. Windows exposes the owning process through [GetWindowThreadProcessId](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowthreadprocessid). This identity policy is a proposed application safeguard, not a guarantee supplied by that API.

Keep coordinate systems explicit. Windows `WINDOWPLACEMENT` values normally use workspace coordinates and must not be passed directly to APIs expecting screen coordinates. Preserve the native placement structure for restoration through the matching placement API, and separately compute arrangement rectangles from the monitor work area. See [WINDOWPLACEMENT](https://learn.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-windowplacement) and [multiple-monitor positioning](https://learn.microsoft.com/en-us/windows/win32/gdi/positioning-objects-on-multiple-display-monitors). Capture a monitor-geometry fingerprint and reject a preview if its work area, display arrangement or coordinate context changed.

Validate DPI behavior before enabling native execution. An adapter may need a scoped thread DPI context, restoring its previous context afterward; do not change the whole application's DPI policy as an incidental API request side effect. Microsoft's [per-window DPI sample](https://learn.microsoft.com/en-us/samples/microsoft/windows-classic-samples/dpiawarenessperwindow-sample/) explains the distinction. Test mixed scaling and negative monitor coordinates before expanding beyond the first supported monitor configuration.

## Ledger, partial failure and recovery

Persist original placements, target placements, target identities and monitor fingerprint before making the preview approvable. Generalize action-type handling carefully: the current local ledger/audit helpers contain `open_app` assumptions. Keep old approval behavior and backups compatible; do not route layouts through the fixed app-launch executor.

Approval reserves the workspace operation and transitions pending to executing before native calls. Record per-target outcomes and enough information for manual inspection if the process stops between a move and its completion record. Checkpoints do not provide exactly-once native side effects. An interrupted action stays consumed and must not resume automatically after restart.

If the second move fails, attempt best-effort rollback of the first only when its identity and observed placement still match the move just made. Disclose that behavior in the original preview. If another actor moved the window or rollback fails, report an uncertain/partial outcome; do not overwrite an unreviewed newer placement or claim a successful restore.

A restore preview must capture the current state again, show what would change and reject intervening user moves. Portable backup restore must invalidate unfinished layout approvals and any operation reservations. Old saved coordinates are evidence for a fresh review, not executable approvals. Do not automatically restore historical snapshots into a different display configuration.

Keep the saved snapshot limited to layout/identity data. Window titles can contain private filenames; avoid persisting them in audit/checkpoint records when an app label and identity suffice. Never upload inventory or placement data for this feature. Existing local database/backup privacy limitations still apply.

## Implementation and acceptance sequence

| Slice | Deliverable | Required evidence |
| --- | --- | --- |
| Pure planning | Validated two-window layout and monitor snapshot schema | Deterministic tests for bounds, overlap, work-area insets, negative origins and invalid/unsupported input |
| Approval integration | Separate capability, immutable preview, atomic workspace reservation and typed arrange/restore actions | Expiry, removed permission, concurrent previews/approvals, cancellation, no chat dispatch and old `open_app` regressions |
| Native adapter | Inventory/capture/apply/restore restricted to the initial scope | Controlled test-window evidence for identity reuse/replacement, unsupported windows, denied access and actual geometry verification |
| Recovery | Persisted original placement, per-window outcomes and explicit restoration | Fresh-process interruption before/after each move, rollback failure, no automatic replay, backup restore invalidation and monitor-change rejection |
| Actions UI | Select, preview, approve, inspect partial result and review restoration | Keyboard/narrow-screen checks and human review before including this in a release |

Native integration must use deliberately selected test windows; do not use the user's current desktop as an unreviewed test fixture. Broadening app support, handling maximized/minimized windows, multiple monitors and automatic modes are separate follow-up scope. Refine the effort estimate after validating the adapter constraints; the existing beta estimate does not include F01 implementation.
