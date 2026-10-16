# Larger-document checkpoint — 16 October 2026

This is development evidence, not beta acceptance. Q01–Q03 remain open. The frozen synthetic inputs cover a 12-page PDF (4,418 words), a 5,056-word DOCX, a 7,996-word Markdown file, an older policy, and a separate fresh transfer sample. DOCX page 1 is a logical parser page, not a physical pagination claim. Manifests bind the inputs and checks; all intermediate answers remain in `results/`.

## Changes and observed quality

Retrieval now ranks admitted candidates by content terms and, only for empty retrieval with at most three explicitly selected sources, tries filename context at the unchanged distance cutoff. Compound requests retain clause balance. Old assistant citation labels are removed from generation history. Numbered-heading and compound answers are buffered, checked for valid current labels and retried once before withholding invalid output. These checks do not establish semantic claim support and do not cover every numbering style.

| Saved warm diagnostics | Original | Final reference guard |
| --- | --- | --- |
| Required facts | 9/12 | 12/12 |
| Expected supporting evidence cited | 7/12 | 12/12 |
| Valid reference numbers | 15/16 | 16/16 |
| Selected-source scope | 16/16 | 16/16 |
| Required sources in multipart answers | 2/3 | 3/3 |
| Persisted conversations | 16/16 | 16/16 |

The final 16-turn varied session also met its saved fact/evidence/reference/scope checks and persisted successfully. The cold sample cited the correct coordinator passage. Assistant review checked claims against the supplied passages, including inline mapping; it is not independent human review. Some answers include redundant policy-title references alongside supporting passages.

**The lexical abstention score overstates quality.** Although it reports 4/4, `scope-exclusion` says “The Larkspur dispatcher does not retry a failed delivery” before saying the information is unstated. This asserts an unsupported negative. Strict assistant review therefore records **3/4 correct abstentions (75%)**, below the agreed 90% gate. Do not label this run an overall quality pass.

The fresh transfer sample was frozen before its first model run and was not used to tune the product. Six of eight cases completed: four supported answers had the expected facts and supporting citations, and two unsupported questions abstained correctly. `two-source-limits` and `changed-source-reuse` returned HTTP 503. Thus completed-only 100% diagnostics do not mean an eight-case pass: supported completion was **4/6**, and overall execution **6/8**. The first-run failures are preserved. Their exact underlying exception was not captured by this evaluator. Ollama logs showed very low free host RAM during this session; this observation does not prove the cause of either error. Reliability remains open.

The existing third holdout was then run separately (the sequence had stopped after the transfer errors): all eight cases completed, with six complete supported/cited answers and two correct abstentions in assistant review. This is a regression set, not a new independent sample.

## Timing and environment

Final loopback HTTP/SSE measurements use the installed `llama3:latest` digest `365c0bd3c000a25d28ddbf732fe1c6add414de7275464c4e4d1c3b5fcb5d8ad1`, temperature 0.1, context 8192 and maximum generation 2048 tokens. Windows 11, Python 3.12.10, 16 logical CPUs and 15.7 GiB host RAM; ONNX embedding used CPU and Ollama reported an NVIDIA RTX 3050 6GB. This was the existing developer machine with other resident workloads, not a clean hardware qualification.

| Final samples | First output median / maximum | Total median / maximum |
| --- | --- | --- |
| One model-unloaded request | 26.46 / 26.46 s | 29.01 / 29.01 s |
| 16 warm cases, including abstentions | 9.92 / 42.47 s | 11.31 / 42.52 s |
| 12 supported warm cases only | 9.92 / 42.47 s | 12.66 / 42.52 s |
| 16 varied supported session turns | 14.78 / 29.71 s | 17.95 / 30.35 s |

Buffered answers arrive as one answer event, so first output can approach total time. This is a material responsiveness limit. Browser/proxy rendering is excluded. A single small run does not establish population percentiles or a release latency guarantee. Sampler instrumentation changed between intermediate runs; do not claim causal speed improvement from their timing differences. Process RSS includes Ollama descendants and may double count shared pages; it excludes GPU allocations and is not total machine memory demand. Sampling completeness/errors are stored per request.

All four actual upload parser paths passed: PDF 21.53 s, DOCX 18.99 s, older Markdown 0.63 s, records Markdown 22.27 s. The benchmark's answer corpus uses frozen parser output; uploads separately exercise real PDF/DOCX/Markdown parsing and indexing.

## Approval and recovery prerequisite

`results/action-recovery-2026-10-16.json` passed real fresh-process SQLite/LangGraph recovery, original deadline preservation, cancellation, removed permission, simulated expiry, consumed-approval replay rejection, and portable backup/restore. One launch was mocked; no application or connector was actually launched/written. Backup/restore preserved synthetic document, conversation, settings and meeting data and invalidated unfinished approvals. This is API/process coverage, not installed-package or UI acceptance.

The final backend suite passed **133 tests with no skips**, including real offline embeddings. There are no frontend or dependency changes in this work package. PR CI supplies the final integration checks.

## Reproduction and next boundary

Use the project Python environment with `SYNAPSE_EMBEDDING_DIR` pointing at provisioned MiniLM assets, `HF_HUB_OFFLINE=1`, and Ollama serving the recorded installed model. Run model workloads sequentially against disposable data:

```text
python scripts/benchmark_rag.py --models llama3:latest --corpus evaluations/long-documents-corpus.json --checks evaluations/long-documents-checks.json --output <new-output.json> --cold-repeats 1 --warm-repeats 1 --session-turns 16 --varied-session --import-corpus-files
python scripts/evaluate_answers.py --model llama3:latest --corpus evaluations/transfer-documents-corpus.json --checks evaluations/transfer-documents-checks.json --output <new-output.json>
python scripts/verify_action_recovery.py --output <new-output.json>
```

Use new output paths; preserve first runs. Product file hashes identify actual tested bytes even when commits were made during the run. The final benchmark and transfer artifacts match the current product files. The review artifact binds exact saved result hashes.

[F01 design](../docs/WINDOW_ARRANGEMENT_DESIGN.md) now defines explicitly selected test windows, immutable preview, single-use approval, stale identity/display rejection, partial-failure recovery and explicit restoration. No native window movement is enabled. The unsupported negative answer and transfer errors remain quality/reliability work; neither is waived by beginning isolated planner work. Interactive setup/action checks, live application GitHub acceptance, refreshed installed-package checks, independent review and a second Windows machine remain open. Readiness and the 20/48 completed-task count are unchanged.
