# Beta verification - 14 October 2026

Outcome: core local workflows passed the checks below, but this run does **not** approve a public beta release. The selected model, interactive browser acceptance, current installer and second-machine recovery still need attention. Source baseline: `be33329` on `ayush_lang`, with the two frontend fixes described below. No push or publishing was performed.

## Checks completed

| Area | Evidence / result |
| --- | --- |
| Backend regressions | 107 tests passed, no skips, including real offline ONNX, storage/backup/restore, authentication, provider mocks and durable approval recovery |
| Backend dependencies | uv checked 137 installed packages; dependency consistency passed |
| Frontend reproducibility | Initial installation had five direct version mismatches. `npm ci` installed the existing committed lockfile successfully. Direct installed versions now match the manifest; no dependency manifest/lock changes were needed |
| Frontend checks | Strict lint, TypeScript and production build passed after the fixes below, using Next.js 16.4.0 and React 19.2.8. Next.js reports that it ignores the unrelated parent pnpm lockfile |
| API/browser session protection | Actual loopback frontend proxy: unpaired access rejected, dashboard redirect, correct pairing, HttpOnly/SameSite cookie, cross-origin rejection, oversized/chunked body rejection and logout passed |
| Routes/landing | Landing and workspace routes returned 200 with security headers; section anchors passed. Corrected landing copy is included in the new production build |
| Document-to-answer | Real import job, local embedding/retrieval, supported budget answer/citation, saved follow-up and duplicate import passed before and after clean installation; synthetic source/conversation removed. Answer latency samples were 7.33 and 3.19 seconds, not performance distributions |
| Streaming/scope/abstention | Real SSE completed without an error event; the answer was `The Rowan beta test budget is 7600 USD. [1]`, referencing only the selected synthetic source. Two messages persisted. Asking for an unspecified launch date correctly abstained. Synthetic records removed |
| Durable local actions | A temporary test agent prepared Calculator, cancellation and permission-removal cases. Cancellation rejected approval (400), removed permission rejected approval (403), and an unsupported app was rejected (400). The actual backend/frontend processes were stopped/restarted; the pending Calculator preview retained its original expiry. Approval completed, result persisted, replay was rejected (400), and the test agent was removed |
| Windows app observation | Calculator window inventory changed from zero to one after the approval. Window screenshot/input geometry could not be verified reliably, so this is window-inventory evidence rather than full Calculator UI acceptance |
| Real expiry continuation | The earlier isolated API run preserved the original five-minute deadline across a real backend restart and rejected approval after 408.7 seconds. No app launched from that expired preview |
| Paired dashboard | User completed pairing; Windows accessibility text showed the authenticated chat dashboard, navigation, message field and local status. Interactive control testing remains incomplete because of the helper errors below |
| Credential files | The pairing-token file is ignored and not tracked. No token contents are included in the report or result artifact |

The running app used the existing `backend/.synapse` workspace and provisioned local model assets. Only uniquely named synthetic sources/conversations and a temporary test agent were created/removed; existing agents, documents and saved model/network preferences were preserved. Test approval history remains in the local audit/ledger. Tests did not contact connectors or perform external writes. This does not measure all process network traffic or prove complete offline operation.

## Defects corrected

1. Landing copy claimed automatic notification silencing/workspace rearrangement, which the product does not implement. It now describes saved mode preferences and explicitly approved supported actions, preserving the existing design.
2. The clean locked ESLint configuration exposed the Actions page calling `Date.now()` during render. An effect now updates clock state once per second. Expired restored previews disable Review; expired approval controls disable execution and display an expiry message. The approval panel shows the actual deadline instead of implying a fresh five-minute window. Strict lint and build passed after this correction; the countdown controls still need interactive browser acceptance.

The earlier successful frontend checks ran against an out-of-date installation (Next.js 16.1.6, React 19.2.3, Axios 1.13.5 and ESLint config 16.1.6). They did not establish compatibility with the committed versions. This run repaired the environment and verified the actual locked versions.

## Dependency findings

`npm audit --omit=dev` reported **zero production dependency findings**. The full audit reported **five high-severity entries** in the development ESLint chain: eslint-config-next, @next/eslint-plugin-next, fast-glob, micromatch and braces. These entries lead to one reported braces advisory, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), concerning deeply nested patterns and stack exhaustion. npm's latest braces version query returned 3.0.3, which the advisory/audit identifies as affected. No compatible patched release was established in this check. The suggested forced fix would downgrade the ESLint config to 14.2.35; it was not applied.

Keep this finding open for compatible remediation or documented maintainer disposition before release. Development tooling is distinct from the tested runtime dependency audit; neither zero runtime findings nor passing tests is a complete security assessment. [Saved verification summary](results/beta-verification-2026-10-14.json) contains normalized audit results and input hashes; raw logs remain ignored locally.

## Remaining beta gates

- Current Settings selected `llama3.2:latest`; the smoke/streaming samples passed, but this model previously failed the approved 90% supported-answer gate in both controlled runs (80%/85%). These few samples do not overturn that result. Confirm `llama3:latest` for the evaluated quality path, or independently establish acceptance for another model; this run did not change the user's selection.
- Finish interactive Actions preview restoration, keyboard controls and expiry behavior. Native UI input reported `coordinate input geometry is unavailable` and repeated `user input was detected in this window`; screenshot capture showed a foreground IDE instead of the selected Chrome/Calculator window. Recovery did not resolve these issues. Stop using these coordinates and complete a supervised/manual browser pass or repair the UI helper.
- Rebuild/reaccept the Windows installer with this commit and its locked dependencies. The recorded 12 October installer predates durable actions and today's frontend/environment fixes; its old acceptance does not validate the current release candidate.
- Complete D01 clean second-machine install, model onboarding, restart, offline and backup/restore. No second-machine evidence exists in this run.
- Complete independent human first-use/representative-document review and the remaining Q01-Q03, visual, licensing and intended live-connector acceptance gates. Mocked connector tests are not live-provider acceptance. External issue/message writes require explicit authorization.

Synapse was left running locally for the user. No installer, public deployment, cloud connection or update system was released. Checklist readiness percentages remain unchanged pending the acceptance gates.
