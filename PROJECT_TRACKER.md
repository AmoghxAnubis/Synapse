# Synapse product task tracker

Last updated: 7 October 2026.
Owner: project developer with user review for product decisions.
Development is paused for planning; no landing-page restoration or hosting migration has been performed in this planning session.

## Product direction

Preserve the user's original landing-page design as the main public product page. The replacement page is an implementation reference, not the approved brand direction. Preserve the original hero, section structure, illustrations, animations, light/dark presentation and footer where compatible. Make limited changes to accurate feature copy, accessibility, performance and onboarding. Align the dashboard with that design.

The shared Vercel deployment was accessed successfully through its authorized share link. Server HTML confirms the headline "Your personal AI operating system", Features/Comparison/Architecture/Integrations/Stack navigation and hardware-focused messaging. Original source exists at baseline commit cc596f4. A visual comparison and exact deployed revision match are not yet verified. The share token is intentionally not copied into this repository.

Public hosting and local inference are separate concerns. Cloudflare hosting must not silently turn a local product into a hosted inference product. The existing server proxy's loopback address cannot reach a customer's computer from a cloud server.

## Progress and accounting

- Checklist: **11 of 41 tasks complete = 27%**. One additional task is in progress.
- Baseline repairs: approximately **85%** complete.
- Small local beta readiness: approximately **65%**.
- Paid release readiness: approximately **30%**.
- Cloudflare migration implementation: **0%**.

Checklist completion is an unweighted count across past repairs, beta work and future features. Readiness percentages are engineering assessments, not test accuracy, security guarantees, or mathematical averages of the checklist. Adding future scope can change the checklist denominator without undoing completed work.

Statuses: DONE / IN PROGRESS / TODO / WAITING / DEFERRED.
Priorities: P0 = next release gate; P1 = beta work; P2 = post-beta expansion.
A task becomes DONE only when its completion criterion is verified. Estimates are focused person-hours for one developer, including implementation and relevant checks. They exclude credential/account access, user feedback, domain propagation, recruiting testers and other external waits.

## Completed foundation ? 11/11 (100%)

| ID | Status | Repair | Evidence |
| --- | --- | --- | --- |
| B01 | DONE | Authenticated local access and protected frontend proxy | Backend auth tests and production pairing/origin/logout checks |
| B02 | DONE | Remove unrestricted shell and accidental chat actions | Fixed diagnostics, typed actions, permission/one-use approval tests |
| B03 | DONE | Restore frontend lint/type/build health | Strict lint zero warnings; production build passed |
| B04 | DONE | Dependency setup, locks and CI | Python 3.12 environment; pip check; npm audit zero vulnerabilities at verification; CI configuration added |
| B05 | DONE | Stable data paths and transactional metadata | SQLite store, concurrent ID tests, stable configuration |
| B06 | DONE | Preserve and migrate legacy state, exclude runtime files from Git | Original stores backed up; migration completed; tracking removed without deleting originals |
| B07 | DONE | Portable backup and restore | Actual restore into a new directory plus regression coverage |
| B08 | DONE | Improve ingestion, deduplication, provenance and source restrictions | Token-aware chunks, bounded parsing, real ONNX retrieval and isolated tests |
| B09 | DONE | Persisted, streamed local conversations | Real Ollama answer/follow-up, saved-turn and streaming tests |
| B10 | DONE | Implement truthful scoped connector pipeline | Credential validation/keyring, actual content readers, bounded pagination/jobs, mocked tests; live acceptance is tracked separately |
| B11 | DONE | Add readiness, explicit network consent, safe URL imports and honest feature states | Health/settings/privacy flows, unsafe-URL checks, job failure/cancel tests |

Completion above means the implemented repair passed its stated checks. Broader product acceptance is tracked below. The backend suite contains 49 passing tests; GPU/NPU and live provider behavior are not verified.

## Phase 1 ? original landing page, 8?16 hours

| ID | Priority | Status | Hours | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| L01 | P0 | IN PROGRESS | 1?2 | ? | Compare deployed page with Git: content read and baseline located; finish visual inventory and identify deployed revision or record uncertainty |
| L02 | P0 | TODO | 4?8 | L01 | Restore original landing-page composition/assets on an isolated branch; retain implementation page as a reference without duplicating runtime secrets |
| L03 | P0 | TODO | 1?2 | L02 | Correct only unsupported claims and onboarding links; label upcoming features and conditional hardware support accurately |
| L04 | P0 | TODO | 2?4 | L02, L03 | Verify mobile/desktop, light/dark, animations, accessibility basics and build; obtain user review of a concrete preview |

## Phase 2 ? Cloudflare public-site migration, 6?12 hours

| ID | Priority | Status | Hours | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| H01 | P0 | TODO | 1?2 | L01 | Inventory public routes, server dependencies, domain and build; choose static Pages versus Workers using current compatibility evidence |
| H02 | P0 | TODO | 3?6 | H01, L02 | Configure a reproducible Cloudflare preview; keep public marketing separate from local pairing/API routes |
| H03 | P0 | TODO | 1?2 | H02, L04 | Verify assets, navigation, metadata, security headers, theme behavior, performance and rollback on preview |
| H04 | P0 | TODO | 1?2 | H03 | Perform authorized domain cutover, verify production and document rollback; preserve Vercel until acceptance |

Current official references: [Cloudflare Next.js overview](https://developers.cloudflare.com/pages/framework-guides/nextjs/) and [Workers Next.js guidance](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/). Adapter/runtime compatibility must be tested against this project's version before selecting a full-stack migration. No account or DNS changes have occurred.

## Phase 3 ? dashboard alignment and usability, 10?20 hours

| ID | Priority | Status | Hours | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| V01 | P1 | TODO | 3?6 | Browser access | Visually exercise pairing, imports, citations, chat cancellation, source/agent scope, settings, failures and narrow screens; record reproducible defects |
| V02 | P1 | TODO | 4?8 | L04, V01 | Align dashboard typography, colors, spacing and controls with original landing design; verify accessible keyboard interaction |
| V03 | P1 | TODO | 3?6 | V01, V02 | Fix acceptance defects and verify a first-time import-to-answer journey without developer assistance |

## Phase 4 ? answer quality and performance, 12?24 hours

| ID | Priority | Status | Hours | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| Q01 | P1 | TODO | 4?8 | Representative documents | Version a supported/unsupported/follow-up corpus; measure retrieval hits, citation support, wrong answers and abstention; agree release thresholds |
| Q02 | P1 | TODO | 4?8 | Q01 | Benchmark cold/warm first-token and total latency, RAM, ingestion and long sessions; compare suitable models using the same corpus |
| Q03 | P1 | TODO | 4?8 | Q01, Q02 | Tune only evidence-backed retrieval/model settings; rerun quality/performance gates; record remaining limits |

The previous 50.79-second and 11.57-second responses are single samples, not a controlled benchmark or promised speed.

## Phase 5 ? live connector acceptance, 15?30 hours

| ID | Priority | Status | Hours | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| I01 | P1 | TODO | 3?6 | Test GitHub repo/credentials | Verify reads, pagination, dedup, removals, permission failures, disconnect and explicitly authorized issue writes |
| I02 | P1 | TODO | 3?6 | Test Notion pages/credentials | Verify nested content, source links, permission failures, dedup/removals and disconnect |
| I03 | P1 | TODO | 3?6 | Test Jira Cloud project/credentials | Verify configured scope, content/comments, pagination, failures and disconnect |
| I04 | P1 | TODO | 3?6 | Test Slack channel/credentials | Verify history, rate limits, failures, disconnect and explicitly authorized message writes |
| I05 | P1 | TODO | 3?6 | Test Discord channel/credentials | Verify accessible history, permissions, rate limits, disconnect and explicitly authorized message writes |

Never put credentials in this tracker. Use dedicated resources; acceptance tests must not create issues/messages without explicit authorization. Large vendor-specific compatibility fixes may increase estimates.

## Phase 6 ? installation and recovery, 16?32 hours

| ID | Priority | Status | Hours | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| D01 | P1 | TODO | 3?6 | Second Windows machine | Verify fresh checkout on supported Node/Python, model provisioning, restart, offline core use and actionable missing-model errors |
| D02 | P1 | TODO | 8?16 | D01, V03 | Choose packaging approach; prototype installer/service lifecycle, model onboarding and per-user data outside checkout |
| D03 | P1 | TODO | 5?10 | D02 | Verify installed-app restart, backup/restore, data preservation and update/rollback path; identify signing/distribution requirements |

This estimate covers a beta distribution prototype. A fully signed, production auto-update system may require additional work after the packaging choice.

## Phase 7 ? commercial groundwork and beta, 6?12 hours plus external feedback

| ID | Priority | Status | Hours | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| C01 | P1 | TODO | 2?4 | Owner decisions | Inventory dependency/model licensing and historical privacy risks; record required decisions and any specialist review |
| C02 | P1 | TODO | 2?4 | C01, D02 | Define privacy, export/deletion, support and encryption expectations; verify process-level outbound traffic for the supported local workflow |
| C03 | P1 | TODO | 2?4 | V03, Q03, D03 | Prepare a small beta protocol, feedback tracker and value/pricing questions; report observed usage and willingness to pay after feedback |

Accounts, hosted multi-user isolation and billing are not assumed requirements. Decide them from the product model and beta findings.

## Post-beta original vision ? estimates pending design

| ID | Priority | Status | Estimate | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| F01 | P2 | DEFERRED | TBD after design | Beta feedback | Explicitly approved window arrangement with restoration and permission tests |
| F02 | P2 | DEFERRED | TBD after design | Beta feedback | Evaluate supported notification controls; implement truthful modes with recovery |
| F03 | P2 | DEFERRED | TBD after design | Beta feedback | Design local audio capture/transcription, consent, retention and supported hardware; evaluate quality |
| F04 | P2 | DEFERRED | TBD after design | Actual interoperability need | Implement and test a real MCP transport with scoped tools; retire remaining obsolete wrappers where justified |
| F05 | P2 | DEFERRED | TBD after design | Q02, target hardware | Benchmark supported GPU/NPU providers; add acceleration only when compatibility and results justify it |

These are deliberately outside the initial beta estimate; their designs and target-platform constraints are not sufficiently known for credible dates.

## Estimated sequence

- Original landing page plus Cloudflare preview/cutover: **14?28 focused hours**, approximately **2?4 working days**, excluding access/review waits.
- All listed beta/commercial-groundwork phases: **73?146 focused hours**, approximately **10?19 eight-hour working days**.
- Allow roughly **3?5 calendar weeks** with account access, review, second-machine testing and beta feedback. External delays can extend this.
- Original-vision expansion and a complete paid launch are not included. Re-estimate after measured beta results.

These are planning ranges, not a promise of uninterrupted background work or a release date. Work proceeds in active sessions. Resolve uncertain items early and revise estimates when evidence changes.

## Update rules

1. Use this file as the canonical task list. Keep IMPLEMENTATION_STATUS.md as the detailed repair/evidence report.
2. At the start of an implementation session, mark active tasks IN PROGRESS and record blockers/dependencies.
3. When a task changes, update status, evidence, remaining estimate and the dated activity log before handing back.
4. Recalculate DONE/total checklist percentage from task rows. Keep readiness estimates separate and explain material changes.
5. Mark WAITING with the exact external dependency when appropriate. Never mark tested-by-mocks work as live accepted.
6. Add newly agreed work with a stable ID. Do not silently expand scope or replace the user's approved design.
7. Report completed work, next tasks, blockers and revised estimate in each development handover. Updates are session-based, not an unattended monitoring service.

## Activity log

| Date | Update | Evidence / next action |
| --- | --- | --- |
| 2026-10-07 | Foundation repairs recorded | 11 completed groups; 49 backend tests; lint/build/dependency checks; real local inference and backup restoration |
| 2026-10-07 | User selected original landing page as product design reference | Preserve original design; replacement page remains an implementation reference |
| 2026-10-07 | Shared deployment content accessible | Original headline/navigation confirmed in HTML; visual inventory and deployed revision verification remain under L01 |
| 2026-10-07 | Canonical tracker and estimates created | No development or hosting changes in this planning session; next task L01, then L02/H01 |
