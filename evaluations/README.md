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
