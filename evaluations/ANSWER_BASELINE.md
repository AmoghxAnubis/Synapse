# Synthetic answer baseline - 8 October 2026

Q01 now includes a run through the actual authenticated chat API with real ONNX retrieval and installed Ollama llama3:latest. Storage, agents, settings and conversations were isolated in a child process. No user vectors, secrets or live provider writes were used.

## Results

| Diagnostic | Result |
| --- | --- |
| Cases completed | 16/16 |
| Expected answer facts present | 9/9 |
| Expected source/page passage cited | 9/9 |
| Citation numbers within returned evidence | 16/16 |
| Explicit source boundaries respected | 4/4 |
| Abstention wording detected after scorer correction | 7/7 |
| Conversation turns persisted | 16/16 |

The 9 answerable cases include 6 normal questions, 2 selected-source questions and 1 actual conversational follow-up. The follow-up's first turn was generated through the API; the evaluator did not insert a pretend assistant history.

The 7 abstention cases include 3 unrelated questions, 2 questions missing facts within a relevant topic, and 2 excluded-source cases. This matters: retrieving a related passage does not prove it contains the requested revenue or refund policy.

An empty UI source selection means all sources. The empty-scope API case instead selects release.txt with an agent restricted to security.md, producing an empty intersection. The earlier primitive retrieval test for an empty filter remains valid, but is not the same UI operation.

## Review against the synthetic documents

Reviewer: coding assistant, inspecting saved answer text and evidence. This is not an independent human acceptance review.

| Cases | Review |
| --- | --- |
| budget | Correct 12500 rupees; release.txt page 1 cited |
| owner, scope-release | Correct Mira Shah; release.txt page 1 cited |
| rollback | Correct failed-request threshold above 2% for 10 minutes; page 2 cited |
| retention, scope-support | Correct 30 days; support.md page 1 cited |
| response | Correct within four business hours; support.md page 2 cited |
| approval | Correct five minutes and single use; security.md page 1 cited |
| scope-empty, scope-exclusion | Abstained without out-of-scope citations |
| unsupported-astronomy, unsupported-recipe, unsupported-ocean | No evidence; abstained |
| missing-revenue | Abstained despite retrieval of the related release budget passage |
| missing-refund | Correctly distinguished response time/contact from an undocumented refund policy |
| follow-up-owner | Real prior budget turn; correct owner and source on the follow-up |

No factual or citation errors were found in this review. These documents are short, unambiguous and synthetic. This is evidence for this run, not a general model accuracy rate or paid-release readiness claim.

## Scorer correction and audit trail

The original lexical scorer recognized only 6/7 abstentions. missing-revenue answered: "I cannot provide information that is not present in the evidence." That is correct; the scorer did not recognize "not present".

The detector now recognizes that wording. Original answers/metrics are preserved in [answers-baseline.json](results/answers-baseline.json). [answers-rescored.json](results/answers-rescored.json) records the updated metrics, original metrics, original artifact hash and scorer hash. No additional model generation was used to rescore.

Lexical checks can still approve an answer containing an abstention phrase followed by an invented claim. A regression test documents that limitation; all cases retain manual_semantic_review_required.

## Timing limits

The first answer in this run took 13.69 seconds; it was not a controlled cold-start test. Subsequent model-generating answers ranged from 1.20 to 2.45 seconds on this short corpus. No-evidence responses were much faster because the API bypassed generation.

These are in-process TestClient total-request timings. They do not measure first-token delivery, browser latency, streaming cancellation, peak Ollama memory, long-context performance or repeatability. CPU is the embedding provider; Ollama's hardware path was not measured. Q02 remains pending.

## Reproduce

From the project root, after provisioning embeddings and starting Ollama:

~~~powershell
backend/venv/Scripts/python.exe scripts/evaluate_answers.py --model llama3:latest
~~~

This invokes the local model and uses disposable storage. It checkpoints synthetic answers to the results file. A case failure is recorded and produces a nonzero exit code.

To rescore saved answers without calling Ollama:

~~~powershell
backend/venv/Scripts/python.exe scripts/evaluate_answers.py --rescore evaluations/results/answers-baseline.json
~~~

Rescoring rejects a changed corpus/checks hash and refuses to overwrite the source artifact. Automatic checks are in answer_checks.json. A model tag is recorded, but the model binary is not yet cryptographically pinned; future comparison runs should capture its digest and runtime version.

Keep private evaluation corpora and their outputs out of Git.

## Next gates

Q01 stays IN PROGRESS. Add longer multi-chunk documents, ambiguity/conflicting versions, misleading embedded instructions, more follow-up chains and representative project content. Evaluate claim/citation support and abstention again, and agree release thresholds.

Q02 must measure real HTTP streaming/first-token latency, cold/warm distributions, cancellation and resource use. Cloudflare remains deferred behind local product readiness.
