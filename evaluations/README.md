# Quality evaluation

This versioned synthetic corpus starts Q01. It is a diagnostic baseline, not representative acceptance testing or a generated-answer accuracy score.

Run from the root after provisioning the local embedding model:

~~~powershell
backend/venv/Scripts/python.exe scripts/evaluate_retrieval.py
~~~

The runner uses disposable Chroma storage and the provisioned model. It does not read or modify user vectors, call Ollama/providers, or download models. Output includes the corpus hash/version, model manifest, provider, threshold, case evidence and retrieval timings.

Metrics:
- evidence_hit: expected source/page/fact appears among returned passages.
- top_one_hit: the first passage contains that evidence.
- scope_respected: every returned passage is in the explicit selected sources; an empty selection returns none.
- retrieval_empty: unrelated questions return no evidence. This is not LLM abstention accuracy.

Unsupported questions within a relevant topic and conversational follow-ups are included but explicitly require a separate generation evaluation. Similarity alone cannot establish whether a document answers a question.

Next: add representative user-approved documents, evaluate generated claim/citation support and abstention, run follow-up chains through the actual API, and agree release thresholds. Proposed gates for discussion: at least 90% supported evidence hits, 100% source-scope compliance, and zero fabricated source references on the agreed corpus. These are proposals, not approved targets or measured product guarantees.

Keep private corpora and their outputs out of Git. This corpus and its output contain only synthetic content.

## Actual API answer evaluation

See [ANSWER_BASELINE.md](ANSWER_BASELINE.md) for the reviewed 16-case run and limitations. Use scripts/evaluate_answers.py to run real local generation against isolated metadata/vectors. answer_checks.json adds answer/citation/abstention checks and API source-policy overrides without changing the versioned retrieval corpus. Automatic diagnostics are not semantic accuracy scores.


## Harder evaluation and audited comparisons

See [HARDER_BASELINE.md](HARDER_BASELINE.md) for 14 harder cases, actual failures, repairs, final results and remaining manual-review defects. The runner accepts --corpus and --checks for alternate fixed corpora. Revised scoring of an old artifact requires --updated-checks explicitly, while --checks supplies the original file whose hash must match. Original answers are never overwritten by rescore. Always use a new --output path for comparison runs.

The final fixed checks pass on the harder corpus, but the original corpus still contains a contradictory approval/reuse answer that lexical fact checks miss. Q01/Q03 are unfinished. These corpora include only synthetic content and a public repository README snapshot; do not commit private evaluation sources or outputs. runtime-observation.json records the installed model digest after the run, not per-run cryptographic pinning.

See [POST_MERGE_QUALITY.md](POST_MERGE_QUALITY.md) for the 10 October post-merge runs, added contradiction/side-fact checks, corrected prompt, saved comparisons, and remaining limits. The older result and commentary above describe the earlier run; they are retained for provenance.
