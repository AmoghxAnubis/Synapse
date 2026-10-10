# External-document holdout — 10 October 2026

Q01/Q03 acceptance targets approved by the user on 10 October 2026:

- 100% source-scope compliance.
- 100% valid citation references.
- At least 90% complete supported answers with supporting citations.
- At least 90% correct abstentions.

Completeness and claim/citation support require review of the saved answers; regex diagnostics alone cannot establish either. An answer with no references can satisfy the reference-number validity check but cannot pass supported-answer acceptance. Scope must be assessed even when no citations are returned. Targets apply to a fixed run; passing a small convenience sample does not establish general accuracy or release readiness.

The new 13-case corpus and checks are frozen before the first model run. It has ten supported cases (including two follow-ups and one two-document question), and three unsupported/excluded cases. Evidence consists of authored summaries of the [Python 3.12 SQLite documentation](https://docs.python.org/3.12/library/sqlite3.html), [Ollama generate endpoint](https://docs.ollama.com/api/generate), and [FastAPI background tasks tutorial](https://fastapi.tiangolo.com/tutorial/background-tasks/), accessed on 10 October 2026. It does not contain copied user data. Each page is a logical summary section, not a PDF page. The summaries and questions were not used for the preceding product repairs.

This is an external technical-document transfer check. It is not representative PDF/DOCX parsing, live connector acceptance, adversarial certification, or independent human acceptance. Raw user documents and diverse longer documents are still needed for a broader beta corpus. Do not change these first-run inputs or tune the product before recording and reviewing the first-run result. If this set informs a repair, it becomes a development set and a fresh holdout is needed for subsequent independent acceptance.

Model assets are provisioned separately under `.tmp/q01-assets/models/minilm`; application metadata/vectors remain temporary in the evaluator. The Python 3.12 verification environment is `.tmp/langgraph-venv`. No user model preference or production database is changed. Set `SYNAPSE_EMBEDDING_DIR` to that provisioned model directory before running:

```powershell
.tmp/langgraph-venv/Scripts/python.exe scripts/evaluate_answers.py --model llama3:latest --corpus evaluations/external-holdout-corpus.json --checks evaluations/external-holdout-checks.json --output evaluations/results/external-holdout-first-run.json
```

The evaluator checks execution failures through its exit status; lexical quality failures require inspecting saved metrics and manually reviewing every claim. Corpus/check hashes and source revision are recorded in `external-holdout-manifest.json` before execution. First-run results and review will be appended below without overwriting the inputs.

## First-run result and claim review

The untouched product revision `4a199f4` ran all 13 cases with real CPU ONNX embeddings and installed `llama3:latest`. No prompt, retrieval, workflow, input or check was changed to obtain the result. The [first-run output](results/external-holdout-first-run.json) retains every generated answer, source passage, timing and diagnostic. The [assistant review](results/external-holdout-review.json) binds its judgments to the output SHA-256 and frozen input hashes. This is a coding-assistant review, not independent human acceptance.

| Approved gate | Reviewed sample | Target | Sample outcome |
| --- | ---: | ---: | --- |
| Source scope | 13/13, 100% | 100% | Met |
| Valid citation references | 13/13, 100% | 100% | Met |
| Complete supported answers with supporting citations | 9/10, 90% | At least 90% | Met |
| Correct abstentions | 3/3, 100% | At least 90% | Met |

All lexical diagnostics passed: supported facts/evidence 10/10, reference validity/scope/persistence 13/13, abstention 3/3, forbidden claims absent 6/6 and two-source citation 1/1. Strict claim review intentionally differs from that diagnostic score:

| Case | Claim and citation review |
| --- | --- |
| sqlite-timeout | Five seconds and OperationalError supported by SQLite page 1, [1]. |
| sqlite-thread | True and ProgrammingError supported by SQLite page 2, [1]. |
| sqlite-context | Both requested negations are correct and cited to page 3. Extra text says it rolls back an exception; the source describes rolling back the transaction on an exception. Conservatively excluded from strict all-claims-supported acceptance because of this imprecise wording. |
| ollama-stream | Default true and streamed partial responses supported by Ollama page 1, [1]. |
| ollama-unload | Value 0 and immediate unload supported by Ollama page 2, [1]. |
| fastapi-timing | After-response timing and additional sync/async/HTTP 202 facts all supported by FastAPI page 1, [1]. |
| fastapi-heavy | Celery and both queue examples supported by FastAPI page 2, [1]. |
| sqlite-followup | Error and wait grounded in SQLite page 1, [1]. |
| changed-source-followup | Current FastAPI evidence supports the after-response answer; excluded SQLite history is absent from its factual claims. Its final meta note is unnecessary. |
| two-documents | Both requested facts present, independently supported by SQLite [1] and Ollama [2]. |
| unsupported-price | No price fabricated; no-evidence abstention. |
| excluded-source | No SQLite timeout disclosed from unselected evidence; abstention. |
| unsupported-default | Correctly says the excerpt specifies no default, despite including example values; Ollama page 2, [1]. |

Backend verification passed **86 tests with no skips**, including real offline ONNX retrieval, in Python 3.12.13. Assets were provisioned under ignored `.tmp/q01-assets` and no user data/model preference changed. The first answer sample took 54.79 seconds; later case samples ranged from 0.13 to 1.38 seconds. The regression suite ran concurrently for part of the evaluation. These timings are not cold/warm distributions, first-token measurements, or a controlled Q02 benchmark.

All approved targets are met **for this small sample only**. Q01/Q03 remain IN PROGRESS: longer and representative PDF/DOCX/imported-workspace documents, independent human claim review, and controlled performance gates are still outstanding. The wording issue is recorded without tuning against this run. The first sandbox attempt failed before ingesting the corpus because Chroma could not create temporary storage; the approved retry is the sole model run represented by this artifact.
