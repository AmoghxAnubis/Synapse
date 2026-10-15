# Model setup implementation and verification

Date: 15 October 2026. Branch: `beta/model-onboarding`, based on `c2289e5`. Candidate changes were uncommitted during verification; source hashes and normalized results are in [the evidence artifact](results/model-setup-2026-10-15.json).

## Implemented behavior

- Settings displays generation and document-model status independently. It offers an explicit setup check, retry for initial-load failure, actual model identity, and Windows installer/developer provisioning commands using the running embedding folder. A check preserves unsaved edits and does not save settings or download models.
- Ollama status distinguishes unavailable service, missing selected model, invalid inventory and installed model. It reports resolved tag/digest, disables redirects and retains proxy isolation. Installed-model status is not an answer-quality guarantee. Saved preferences are not silently replaced when their selected model is absent.
- Chroma/source administration is independent of lazy embedding initialization. Existing sources can be listed/read/deleted with missing embedding files; conversations/agents/settings remain available. Imports, retrieval and explicit readiness checks still initialize the embedding runtime. Failed initialization can be retried after setup is repaired.
- Authenticated `/health/ready` returns both model states and HTTP 503 if either is unavailable; root health and Settings do not trigger model loading. Finding a weight file is labeled unverified until initialization succeeds, including tokenizer/provider checks.
- Provisioning and runtime share `SYNAPSE_EMBEDDING_DIR`, including launch-directory-independent relative resolution. Previously explicit provisioning ignored that override and could install into a different folder.
- The hardware banner distinguishes backend availability from Ollama readiness. The tracked smoke verifier has an optional explicit `--check-setup` and requires generated citation markers on initial and follow-up answers.

## Evidence

| Check | Result |
| --- | --- |
| Before fixes | Seven initial setup regressions failed, exposing invalid model-list parsing, missing redirect/state handling and eager embedding initialization blocking source administration |
| Final backend suite | **116 passed in 23.24 seconds, no skips**, including real offline CPU ONNX and nine new setup cases |
| Setup regressions | Invalid JSON/list/null/malformed inventories; redirect rejection/resolved digest; retained source access with missing embeddings; independent model recovery; matching provisioning override; missing saved generation model preserved |
| Backend dependencies | `pip check`: no broken requirements |
| Frontend | Strict ESLint with zero warnings and production Next.js 16.4.0 build/TypeScript passed using Node 24.13.0 |
| Real production HTTP | Pairing, HttpOnly/SameSite cookie, unpaired/cross-origin rejection, request body limits, landing anchors, workspace routes and logout passed |
| Explicit setup check | Both models ready; saved model/address/network/retrieval preferences unchanged |
| Real import/answer | Synthetic import, real ONNX retrieval/Ollama answer, source restrictions, saved follow-up and unchanged reimport passed; final run required generated citation markers in both answers |
| Smoke timing | Initial answer sample 15.82 seconds; final sample 5.15 seconds. No population latency, hardware comparison or long-session claim |
| Interactive browser | **Pending.** Browser-provider inventory was empty; in-app browser creation reported unavailable. Native Chrome inventory succeeded, but capture was stopped because the current URL could not be determined reliably enough to enforce policy. No further UI input was attempted |

The isolated production launcher used `.tmp/beta-model-setup/data` and existing embedding files at `backend/.synapse/models/minilm`. It did not open or modify the production workspace's saved preferences or documents. Synthetic inference sources/conversations were removed by the verifier. No model downloads, connector calls or external writes were performed.

Installed local generation model: `llama3:latest`, digest `365c0bd3c000a25d28ddbf732fe1c6add414de7275464c4e4d1c3b5fcb5d8ad1`, through Ollama 0.40.0. Effective generation configuration remains temperature 0.1, context 8192 and prediction limit 2048. This run is workflow evidence, not a fresh representative quality holdout. Historical llama3.2 quality results are not revised by it.

## Remaining work

Finish interactive Settings checks (retry, unsaved edits, setup refresh and narrow-screen/keyboard behavior) and restored pending-action controls when browser automation or manual review is available. The existing approval restart/cancel/expiry/replay regressions passed in the backend suite; they do not establish browser interaction acceptance. Proceed with representative longer-document quality/current-path performance, then the defined F01 local technical checkpoint. GitHub live acceptance, refreshed installer/installed recovery, independent human review and clean second-machine acceptance remain open. No readiness percentage or completed-task count is raised by these partial acceptance results.
