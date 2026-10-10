# Independent document holdout — 10 October 2026

Q01/Q03's next gate used fixed excerpts from two public project documents that were not used in the preceding synthetic prompt repairs: `BASELINE_REVIEW.md` (7 October) and `DEVELOPER_HANDOVER.md` (10 October). The excerpt texts, eight questions, source scopes, and checks were saved before the first model run. The corpus SHA-256 is `94b1e4cc2f368ee38a014cd445452f5327972f255bb2f8938bb5820fea6f29d7`; the checks SHA-256 is `1cba782a3bd84e56f2364023f81b3d6b4f8724dd87354f2492f1775e45469098`. Numbered pages are logical Markdown excerpts, not PDF pages. These are project documents and a small convenience sample, so broader user-document acceptance is still needed.

The [first-run artifact](results/holdout-first-run.json) used the in-process API, real local ONNX embeddings and `llama3:latest`, with disposable Chroma/SQLite storage. No prompt, workflow, corpus, or check was changed after the first run. All eight cases executed and persisted. Automated checks found facts in 6/7 supported answers, expected evidence cited in 7/7, valid citation numbers and source scope in 8/8, abstention wording in 1/1, and both required sources cited in 0/1 two-document answers. These are diagnostics, not semantic accuracy measurements.

Manual claim and citation review of the first run:

| Case | Review |
| --- | --- |
| Product promise | Complete; claims supported by cited baseline excerpt 1. |
| Memory-to-answer gate | Complete; all five requested gate parts supported by cited baseline excerpt 3. |
| Scorecard | Complete; first-token and total-response latency supported by cited baseline excerpt 2. |
| Import formats | Complete; all five file types supported by cited handover excerpt 1. |
| Preview expiry | Complete; five minutes and one use supported by cited handover excerpt 2. |
| Referential preview | Correct five-minute follow-up with cited handover excerpt 2; extra parenthetical is unnecessary but not a factual error. |
| Unsupported encryption | Correctly says the source does not mention an algorithm; no algorithm invented. The response's source metadata points to handover excerpt 2. |
| Two-document question | **Incomplete.** It gives the baseline latency measurements with a valid baseline citation but omits the handover's one-answer-at-a-time limit and never cites the handover. |

The observed complete-and-supported rate is **7/8**, with **1/1** two-document case failing completeness. This is too small and too project-specific to estimate general accuracy. It does show a concrete multi-source answer failure even though the recent development regressions passed. Q01/Q03 remain in progress. Q02 is still pending.

Next: diagnose why the handover passage was omitted (retrieval candidates, prompt evidence ordering, or generation) using this preserved artifact, repair the mechanism, and run the existing development regressions. Because this holdout has now informed a diagnosis, use a *new* fixed holdout for independent acceptance. Expand it with representative PDFs, DOCX, and imported connector content, and agree numeric thresholds for claim support, completeness, citation support, abstention, scope, and follow-ups before marking Q01 complete. Then run Q02's controlled cold/warm latency, memory, ingestion, and long-session measurements on the same target machine.
