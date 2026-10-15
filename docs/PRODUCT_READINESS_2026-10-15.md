# Synapse product readiness report

Assessment date: 15 October 2026. Source: `main` at `cc89592828f6c2bfdfd151facd6ef4cf20d60e35`, matching freshly fetched `origin/main`.

## Assessment

Synapse is a working local AI workspace with demonstrated document-to-answer flows. It is approximately **70% ready for a small Windows local beta**, but it is **not yet an accepted release candidate or a finished commercial product**. The next milestone is proving the existing product on representative documents, real connector accounts and a clean second machine, then shipping a package built from the accepted revision.

The current supported product is a single-user Windows application: import selected context, ask local questions with evidence, retain conversations, configure agents, and explicitly approve supported actions. The broader “personal AI operating system” vision still includes substantial deferred functionality.

## Branch and latest PR

- Local `main` was clean and three commits behind. It was fast-forwarded from `4f6ef83` to `cc89592`; local and remote commit IDs now match.
- [PR #35](https://github.com/AmoghxAnubis/Synapse/pull/35), **persist LangGraph local action approvals with replay protection**, merged on 15 October 2026 at 13:28 IST.
- Its two commits add durable local-app approval checkpoints/ledger, restored pending previews, cancellation/expiry/permission checks, replay protection, twelve workflow tests, and frontend expiry/copy corrections.
- The PR head's [Verify Synapse CI run](https://github.com/AmoghxAnubis/Synapse/actions/runs/38561198645) completed successfully.
- The local backend environment initially lacked the new checkpoint dependency. Installing the merged lockfile added `aiosqlite`, `langgraph-checkpoint-sqlite` and `sqlite-vec`, and updated `langgraph-checkpoint`. Fresh checks then passed. No dependency manifest, user settings or application feature code was changed during this assessment.

The durable workflow covers Calculator, Notepad and Paint. GitHub/Slack/Discord approvals retain their existing in-memory flow. An uncertain interrupted launch is not retried automatically; at-most-one launch attempt per approval is the implemented boundary. Portable restore invalidates unfinished approvals. See [durable action behavior](DURABLE_ACTIONS.md).

## How much is complete?

| Measure | Current assessment | Interpretation |
| --- | --- | --- |
| Implemented foundation checklist | 15/15 tasks closed | Authentication, storage, ingestion, conversation, connector and build repairs passed their stated checks |
| Overall baseline repair readiness | Approximately 95% | Broader acceptance remains beyond those individual implementation checks |
| Broad tracked roadmap | **20/48 closed, 41.7%** | Includes acceptance, five connectors, commercial work and deferred expansion; not a weighted product-completion score |
| Small local beta readiness | **Approximately 70%** | A useful working core, with material quality, onboarding and release acceptance gates open |
| Paid-release readiness | **Approximately 30%** | Existing engineering estimate; independent acceptance, distribution lifecycle and commercial groundwork remain |
| Cloudflare migration | 0%; deferred | Separate public-site work, outside the immediate local beta |

The 48 tracker rows currently comprise 20 DONE, 9 IN PROGRESS, 8 TODO, 2 WAITING and 9 DEFERRED. Excluding the nine deferred rows gives 20/39 closed (51.3%), but that still includes all five connector tracks and is not a better measure of beta readiness. Readiness percentages are approximate judgments, not measured accuracy or an assertion that the remaining hours equal a fixed fraction of past effort.

## What already exists and has evidence

| Product area | Implemented behavior | Evidence and remaining limit |
| --- | --- | --- |
| Document memory | PDF/TXT/Markdown/Python/DOCX imports; bounded background jobs; token-aware overlapping chunks; deduplication; source/page provenance; cancellation and source deletion | Real ONNX/Chroma ingestion and browser journeys passed; representative longer and varied files still need acceptance |
| Local answers | Ollama generation, LangChain adapter and scoped LangGraph retrieval; evidence display; source restrictions; abstention; follow-ups | Real API/browser answers and preserved evaluation artifacts exist; independent claim-support acceptance remains open |
| Conversations | Streaming, saved conversations and bounded history; cancellation avoids saving incomplete turns | Backend checks and real browser cancellation/reload passed; cancellation can wait for an active model read |
| Custom agents | Saved instructions, selected sources, integration permissions and capability configuration | Agent browser create/load/delete passed; these are configurations for bounded workflows, not general autonomous workers |
| Actions | Explicit preview/approval; fixed Windows app allowlist; GitHub issue and Slack/Discord message operations; audit history | Mocked regressions cover writes; local Calculator restart/approval/replay passed in prior live verification; current pending-preview keyboard/expiry UI acceptance remains open |
| Connected sources | Scoped GitHub, Notion, Jira, Slack and Discord readers, OS credential storage, pagination/limits, content hashes and removal reconciliation | Implemented with mocked provider coverage; **none of the five live acceptance tracks is closed** |
| Data and access | Loopback services, paired browser session, authenticated proxy, SQLite metadata, stable data path, portable backup/restore and migration tooling | Regression and prior real pairing/backup checks passed; history privacy review, process-level traffic checks and installed recovery acceptance remain |
| Dashboard and notes | Chat, Knowledge, Agents, Actions, Settings, Research and manual meeting notes/tasks | Nine routes passed desktop/mobile rendering checks; full design alignment and human first-use review remain |
| Windows distribution | Supervisor/launcher and NSIS installer prototype bundling Python, Node and standalone frontend | Older package installed, imported, answered and uninstalled with data retained on this machine; **that package predates PR #35** |

## What prevents calling it finished?

1. **Accepted answers with an accepted model (Q01-Q03).** The agreed gates are 100% source-scope compliance and citation-reference validity, at least 90% complete supported answers with supporting citations, and at least 90% correct abstentions. Small saved samples meet these gates on `llama3:latest`, but independent human review and representative longer documents remain. The 14 October run recorded `llama3.2:latest` as selected; that model previously scored 80%/85% supported completeness against 95%/90% for `llama3` in the two-order benchmark. This assessment did not query or change the saved selection. A few passing smoke questions do not establish model acceptance.

2. **Current package and clean-machine recovery (D01-D03).** Rebuild the installer from this revision and verify installation without development runtimes, model provisioning, pairing, restart, offline core use, backup/restore and uninstall with data retained on a second Windows machine. The current prototype is unsigned and refuses an existing install directory. An accepted upgrade/rollback and recovery path is still needed; production auto-update work is outside the current beta estimate.

3. **First-use and interface acceptance (L01/L04, V01-V03, A02 browser follow-up).** Complete human review, remaining dashboard alignment, keyboard/error-path checks and restored pending-action expiry controls. Earlier native UI-helper failures left that last interaction unverified. Rendering a route successfully is not feature acceptance.

4. **At least one live connector for a connector-backed beta (I01-I05).** Test scoped reads, permissions, pagination/rate limits, deduplication, removals, disconnect and approved writes on dedicated resources. Implementing five wrappers does not establish five reliable production integrations. A first beta can limit its supported provider scope; accepting all five expands the work.

5. **Release and commercial groundwork (C01-C03).** Inventory redistribution/model licensing and historical privacy exposure; define privacy, export/deletion and support expectations; inspect process-level outbound traffic; prepare a beta protocol and collect real usage/value feedback. The product does not encrypt local data at rest. Public claims and support expectations must match the accepted behavior.

6. **Development dependency finding.** Today's full npm audit reports five high-severity package entries in the ESLint dependency chain, all leading to the reported `braces` stack-exhaustion advisory. Production-only audit reports zero findings. Track compatible remediation or an explicit maintainer disposition before release; these are not five independent runtime vulnerabilities. This assessment did not apply npm's suggested major downgrade.

Answer quality and performance details are in [the model comparison](../evaluations/PERFORMANCE_BASELINE.md) and [compound citation evaluation](../evaluations/THIRD_HOLDOUT.md). The citation guard checks reference presence, not full semantic support. It buffers some compound answers: three observed first-output times were 4.4-6.4 seconds. Older fast streaming measurements do not describe that path. Frontend latency, mixed-format imports, varied long sessions and target-machine resource requirements remain to be measured.

## Remaining work and release boundary

The [canonical tracker](../PROJECT_TRACKER.md) estimates **40-85 focused engineering hours** for a local beta with one intended live connector, or **55-110 hours** for all five connector tracks. Those ranges include acceptance support, remaining interface work, quality/performance, installation/recovery and beta groundwork. They exclude waiting for a second computer, accounts, independent reviewers and beta feedback. Newly found defects or packaging choices can increase them.

At 20 focused engineering hours per week, the one-connector range is roughly 2-4.25 working weeks before external waits. This is planning arithmetic, not a scheduled release date. A complete paid launch and the broader original vision have no defensible remaining-hour estimate yet.

Recommended completion sequence:

| Order | Deliverable | Exit condition |
| --- | --- | --- |
| 1 | Freeze the first release's supported scope and model | Windows single-user workflow, intended connector and accepted model are explicit |
| 2 | Run independent first-use and representative-document acceptance | Agreed quality gates and essential UI/error/cancellation paths pass; defects recorded and resolved |
| 3 | Accept the intended live connector and current performance paths | Real scoped sync lifecycle passes; buffered-answer and target-machine behavior measured |
| 4 | Build and accept the exact release package | Second-machine installation, onboarding, restart, offline core use, recovery and retained-data uninstall pass |
| 5 | Run a small private beta and close release groundwork | Licensing/privacy/support/dependency dispositions recorded; actual usage feedback reviewed before widening release |

For the **initial beta**, “finished” should mean a new user can install the accepted package, provision an accepted model, pair, import their own supported document, receive supported cited answers, reopen history, use approved actions, recover their data, and complete the intended connector lifecycle. A paid release additionally needs a dependable maintenance/update path, commercial/support decisions and evidence from users. The 40-85-hour estimate does not certify that broader paid-release boundary.

Deferred original-vision features are window arrangement/restoration, notification control, local audio capture/transcription, interoperable MCP transport and verified GPU/NPU acceleration. Meeting notes currently accept manual input or pasted transcripts; modes save preferences. Multi-user hosting, accounts and billing are not assumed requirements. Cloudflare public-site migration remains a separate estimated 6-12 hours after local beta gates; it does not host the user's local inference.

## Verification performed for this report

| Check on 15 October | Result |
| --- | --- |
| Fresh fetch, PR merge metadata, local/remote SHA comparison | `main` = `origin/main` = `cc89592`; PR #35 confirmed merged |
| Backend locked dependency installation | Passed; merged checkpoint packages installed |
| `backend/venv/Scripts/python.exe -m pytest -c backend/pytest.ini backend/tests` | **107 passed in 13.99 seconds; no skips**, including provisioned offline embedding checks |
| Backend `pip check` | No broken requirements |
| Frontend ESLint, zero-warning limit | Passed using bundled Node 24.13.0 |
| Frontend TypeScript, no emit / no incremental writes | Passed |
| Full npm audit | Five high-severity development-chain entries; nonzero exit as expected |
| Production-only npm audit | Zero reported vulnerabilities |
| PR-head CI | Success; includes production build and locked installation jobs |

Today's assessment did not rebuild the frontend/installer, exercise the interactive browser, rerun model benchmarks, contact live connectors or create external resources. Those results above are explicitly distinguished from prior stored acceptance evidence. No commit, push, deployment or release was performed. Application changes in this session are limited to the authorized branch fast-forward and local dependency synchronization; new repository edits are reporting documents.
