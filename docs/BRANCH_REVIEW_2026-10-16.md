# GitHub branch review — 16 October 2026

Fetched/pruned `origin` and inspected all ten remote branch tips against `origin/main` (`1ac3b7e`, PR #36). GitHub reported no open PRs before this work's PR. No remote branch was deleted by this review; pruning removed only local references to branches already deleted on GitHub.

| Branch | Unique commits beyond main | Disposition |
| --- | --- | --- |
| `main` | — | Integration target |
| `MCP_testing` | 0 | Already contained in main |
| `auth-first-stage` | 0 | Already contained in main |
| `ayush_lang` | 0 | Already contained in main |
| `beta/model-onboarding` | 0 | Already merged through PR #36 |
| `beta/representative-quality` | Current continuation | Integrate through the new tested PR |
| `aditya_MCP` | `911a09d` | Historical orchestration/LLM/API/UI rewrite plus runtime vector data; current typed workflow and local model adapter supersede the inspected paths. Keep branch for reference |
| `apitest` | `b90d3d4` | Historical Jira regex/JQL and Axios upload boundary changes, plus runtime data. Current application uses a different connector/action and upload architecture. Do not reintroduce the legacy implementation |
| `pal-auth` | `ce3070f` | Historical hosted Clerk authentication and landing rewrite, plus runtime data. Outside the agreed single-user local beta and original-design requirements |
| `test_one` | `b363c48` | Historical agent/tool/UI changes, custom system-prompt support and console encoding fixes, plus runtime data. Current workflow/model interface already supports agent instructions and uses the newer embedding/runtime paths |

Reviewed ancestry, unique-commit file lists and relevant code patches. The four remaining historical tips are 170–223 main commits behind their divergence and are not a safe integration queue. No necessary current-plan dependency was identified in those inspected changes. Their unrelated code and runtime databases are not included in this PR; the branches remain available for future targeted feature review. This is not an exhaustive acceptance of every historical feature.

All work required for the current checkpoint is consolidated in the representative-quality PR, including its tests, fixtures, preserved evaluation failures, recovery evidence and bounded F01 design. See [checkpoint](../evaluations/LONG_DOCUMENT_CHECKPOINT.md). A merge consolidates development work; it does not close the documented beta acceptance gates.
