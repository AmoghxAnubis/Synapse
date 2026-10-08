# Synapse product task tracker

Last updated: 8 October 2026.
Owner: project developer with user review for product decisions.
Current focus: local product acceptance, answer quality/performance, live connectors, and installation/recovery. Cloudflare work is deferred until the local beta gates pass, per the user on 8 October 2026.

## Product direction

Preserve the user's original landing-page design as the main public product page. The replacement page is an implementation reference, not the approved brand direction. Preserve the original hero, section structure, illustrations, animations, light/dark presentation and footer where compatible. Make limited changes to accurate feature copy, accessibility, performance and onboarding. Align the dashboard with that design.

The shared Vercel deployment was accessed successfully through its authorized share link. Server HTML confirms the headline "Your personal AI operating system", Features/Comparison/Architecture/Integrations/Stack navigation and hardware-focused messaging. Original source exists at baseline commit cc596f4. A visual comparison and exact deployed revision match are not yet verified. The share token is intentionally not copied into this repository.

Public hosting and local inference are separate concerns. Cloudflare hosting must not silently turn a local product into a hosted inference product. The existing server proxy's loopback address cannot reach a customer's computer from a cloud server.

## Progress and accounting

- Checklist: **18 of 46 tasks complete = 39%**. Visual acceptance tasks remain waiting.
- Baseline repairs: approximately **95%** complete; remaining acceptance is not a claim of unimplemented core repairs.
- Small local beta readiness: approximately **65%**.
- Paid release readiness: approximately **30%**.
- Cloudflare migration implementation: **0%**.

Checklist completion is an unweighted count across past repairs, beta work and future features. Readiness percentages are engineering assessments, not test accuracy, security guarantees, or mathematical averages of the checklist. Adding future scope can change the checklist denominator without undoing completed work.

Statuses: DONE / IN PROGRESS / TODO / WAITING / DEFERRED.
Priorities: P0 = next release gate; P1 = beta work; P2 = post-beta expansion.
A task becomes DONE only when its completion criterion is verified. Estimates are focused person-hours for one developer, including implementation and relevant checks. They exclude credential/account access, user feedback, domain propagation, recruiting testers and other external waits.

## Completed foundation - 15/15 (100% of implemented foundation tasks)

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
| B12 | DONE | Load dotenv before configuration; anchor relative data paths | Two new regression tests verify precedence and launch-directory independence |
| B13 | DONE | Retire five unsafe/overlapping prototype entry points | Five fail-closed constructor tests; history retained in Git |
| B14 | DONE | Bound frontend request reads without Content-Length | Pairing 1 KB and proxy 21 MB limits; production chunked-body rejection passed |
| B15 | DONE | Clean lockfile installation verification | Fresh Python environment: 56 tests/pip check; explicit Node 22.13.1 npm ci/lint/build/full audit |

Completion above means the implemented repair passed its stated checks. Broader product acceptance is tracked below. The backend suite contains 56 passing tests; GPU/NPU and live provider behavior are not verified.

## Phase 1 - original landing page, 8-16 hours

| ID | Priority | Status | Hours | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| L01 | P0 | WAITING | 0.5-1 | Connected browser | Deployment HTML inventory and baseline source recovered; restored from cc596f4. Exact deployed revision/pixel match remain unverified; finish visual comparison |
| L02 | P0 | DONE | 0 remaining | L01 source inventory | Original composition restored from cc596f4; replacement retained at docs/reference/implementation-landing.tsx; build and production HTML checks pass |
| L03 | P0 | DONE | 0 remaining | L02 | Targeted copy/CTA corrections, truthful branded intro, local pairing preserved, anchor and motion cleanup; unsupported hardware/privacy/action claims removed |
| L04 | P0 | WAITING | 2-4 | Connected browser/user review | Build, lint, landing HTML/anchors and production routes verified. Review http://127.0.0.1:3000 for mobile/desktop, dark/light, animation, canvas and keyboard behavior |

## Phase 2 - dashboard alignment and usability, 10-20 hours

| ID | Priority | Status | Hours | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| V01 | P1 | TODO | 3-6 | Browser access | Visually exercise pairing, imports, citations, chat cancellation, source/agent scope, settings, failures and narrow screens; record reproducible defects |
| V02 | P1 | TODO | 4-8 | L04, V01 | Align dashboard typography, colors, spacing and controls with original landing design; verify accessible keyboard interaction |
| V03 | P1 | TODO | 3-6 | V01, V02 | Fix acceptance defects and verify a first-time import-to-answer journey without developer assistance |

## Phase 3 - answer quality and performance, 12-24 hours

| ID | Priority | Status | Hours | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| Q01 | P1 | IN PROGRESS | 4-8 | Representative documents/release thresholds | Synthetic baseline: evidence 8/8, top result 8/8, scope 4/4, unrelated empty 3/3; evaluations/results/retrieval-baseline.json. Actual API baseline now reviewed: 9/9 answer facts/evidence, 7/7 abstentions, 4/4 scope and 16/16 persistence; evaluations/ANSWER_BASELINE.md. Next: harder/representative content and agreed thresholds; one short synthetic run does not complete this task |
| Q02 | P1 | TODO | 4-8 | Q01 | Benchmark cold/warm first-token and total latency, RAM, ingestion and long sessions; compare suitable models using the same corpus |
| Q03 | P1 | TODO | 4-8 | Q01, Q02 | Tune only evidence-backed retrieval/model settings; rerun quality/performance gates; record remaining limits |

The previous 50.79-second and 11.57-second responses are single samples, not a controlled benchmark or promised speed.

## Phase 4 - live connector acceptance, 15-30 hours

| ID | Priority | Status | Hours | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| I01 | P1 | TODO | 3-6 | Test GitHub repo/credentials | Verify reads, pagination, dedup, removals, permission failures, disconnect and explicitly authorized issue writes |
| I02 | P1 | TODO | 3-6 | Test Notion pages/credentials | Verify nested content, source links, permission failures, dedup/removals and disconnect |
| I03 | P1 | TODO | 3-6 | Test Jira Cloud project/credentials | Verify configured scope, content/comments, pagination, failures and disconnect |
| I04 | P1 | TODO | 3-6 | Test Slack channel/credentials | Verify history, rate limits, failures, disconnect and explicitly authorized message writes |
| I05 | P1 | TODO | 3-6 | Test Discord channel/credentials | Verify accessible history, permissions, rate limits, disconnect and explicitly authorized message writes |

Never put credentials in this tracker. Use dedicated resources; acceptance tests must not create issues/messages without explicit authorization. Large vendor-specific compatibility fixes may increase estimates.

## Phase 5 - installation and recovery, 16-32 hours

| ID | Priority | Status | Hours | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| D01 | P1 | TODO | 2-4 | Second Windows machine | Fresh lockfile installation verified here on Python 3.12 and isolated Node 22.13.1; finish cross-machine setup/model/restart/offline acceptance |
| D02 | P1 | TODO | 8-16 | D01, V03 | Choose packaging approach; prototype installer/service lifecycle, model onboarding and per-user data outside checkout |
| D03 | P1 | TODO | 5-10 | D02 | Verify installed-app restart, backup/restore, data preservation and update/rollback path; identify signing/distribution requirements |

This estimate covers a beta distribution prototype. A fully signed, production auto-update system may require additional work after the packaging choice.

## Phase 6 - commercial groundwork and beta, 6-12 hours plus external feedback

| ID | Priority | Status | Hours | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| C01 | P1 | TODO | 2-4 | Owner decisions | Inventory dependency/model licensing and historical privacy risks; record required decisions and any specialist review |
| C02 | P1 | TODO | 2-4 | C01, D02 | Define privacy, export/deletion, support and encryption expectations; verify process-level outbound traffic for the supported local workflow |
| C03 | P1 | TODO | 2-4 | V03, Q03, D03 | Prepare a small beta protocol, feedback tracker and value/pricing questions; report observed usage and willingness to pay after feedback |

Accounts, hosted multi-user isolation and billing are not assumed requirements. Decide them from the product model and beta findings.

## Deferred - Cloudflare public-site migration, 6-12 hours

| ID | Priority | Status | Hours | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| H01 | P2 | DEFERRED | 1-2 | V03, Q03, I01-I05, D03, C03 | Inventory public routes, server dependencies, domain and build; choose static Pages versus Workers using current compatibility evidence |
| H02 | P2 | DEFERRED | 3-6 | H01, L02 | Configure a reproducible Cloudflare preview; keep public marketing separate from local pairing/API routes |
| H03 | P2 | DEFERRED | 1-2 | H02, L04 | Verify assets, navigation, metadata, security headers, theme behavior, performance and rollback on preview |
| H04 | P2 | DEFERRED | 1-2 | H03 | Perform authorized domain cutover, verify production and document rollback; preserve Vercel until acceptance |

Current official references: [Cloudflare Next.js overview](https://developers.cloudflare.com/pages/framework-guides/nextjs/) and [Workers Next.js guidance](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/). Adapter/runtime compatibility must be tested against this project's version before selecting a full-stack migration. No account or DNS changes have occurred.

Resume this phase after local usability, quality/performance, intended live connectors, installation/recovery and beta feedback gates pass. Existing Vercel hosting remains in place. Advanced post-beta features do not automatically block the eventual marketing-site migration.

## Post-beta original vision - estimates pending design

| ID | Priority | Status | Estimate | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| F01 | P2 | DEFERRED | TBD after design | Beta feedback | Explicitly approved window arrangement with restoration and permission tests |
| F02 | P2 | DEFERRED | TBD after design | Beta feedback | Evaluate supported notification controls; implement truthful modes with recovery |
| F03 | P2 | DEFERRED | TBD after design | Beta feedback | Design local audio capture/transcription, consent, retention and supported hardware; evaluate quality |
| F04 | P2 | DEFERRED | TBD after design | Actual interoperability need | Implement and test a real MCP transport with scoped tools; retire remaining obsolete wrappers where justified |
| F05 | P2 | DEFERRED | TBD after design | Q02, target hardware | Benchmark supported GPU/NPU providers; add acceleration only when compatibility and results justify it |

These are deliberately outside the initial beta estimate; their designs and target-platform constraints are not sufficiently known for credible dates.

## Developer handover

| ID | Priority | Status | Hours | Depends on | Task / completion criterion |
| --- | --- | --- | --- | --- | --- |
| T01 | P0 | DONE | 0 remaining | Baseline/landing implementation | DEVELOPER_HANDOVER.md covers purpose, history, architecture, setup, data, test evidence, design decisions, limits and next steps; README links it |

## Estimated sequence

- Active order: landing/dashboard acceptance; answer quality/performance; intended live connectors; installation/recovery; beta feedback/commercial groundwork. Browser-independent quality work can proceed while visual acceptance waits.
- Cloudflare is excluded from the active estimate. Remaining non-hosting beta work is roughly **61-125 focused hours** based on the earlier phase estimates; this is provisional and should be revised after evaluation results and access to live accounts/another machine. Deferred Cloudflare work remains **6-12 hours**.
- Allow roughly **3-5 calendar weeks** with account access, review, second-machine testing and beta feedback. External delays can extend this.
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
| 2026-10-07 | Baseline follow-up and original landing restored | B12-B15, L02-L03 complete; 56 fresh-environment tests, supported Node install/build/lint/audit, production body-limit/anchor checks; L01/L04 waiting for browser acceptance |
| 2026-10-07 | Reproducible smoke and handover complete | scripts/verify_local.py --with-inference passed; final sample 17.65s; synthetic data removed; DEVELOPER_HANDOVER.md written; no hosting/DNS changes |

| 2026-10-08 | Hosting moved behind local product readiness | H01-H04 DEFERRED; no account, deployment or DNS changes; beta work takes priority |
| 2026-10-08 | Q01 started while browser acceptance waits | evaluations/corpus.json and scripts/evaluate_retrieval.py added; disposable synthetic storage; generation metrics pending |
| 2026-10-08 | Synthetic retrieval baseline verified | 8/8 evidence/top-one hits, 4/4 scope checks, 3/3 unrelated questions returned no evidence. Windows temp cleanup isolated in child process; 58 backend tests passed. Q01 remains IN PROGRESS; generation and representative acceptance pending |
| 2026-10-08 | Q01 real-answer baseline reviewed | 16 cases completed on isolated real API/Ollama; 9/9 fact/evidence checks, 7/7 abstentions after lexical scorer fix, real follow-up and scope/persistence passed. Original and rescored artifacts preserved; 61 backend tests passed. Q01 remains IN PROGRESS; Cloudflare deferred |
