# Additional answer-quality cases — 10 October 2026

This Q01/Q03 development corpus adds ten new synthetic cases for current versus historical policy, two-source answers, referential follow-ups, topic switches, changed source selection, unsupported attributes, regional ambiguity, and embedded role-marker instructions. It contains no private data. The cases run through the actual in-process API with provisioned ONNX embeddings, disposable Chroma/SQLite storage, and local `llama3:latest`.

The first run exposed a citation omission in a changed-source follow-up. A later run cited the selected historical policy while asserting the opposite reuse rule. Another run gave both regional retention numbers without labeling them; a further run omitted the EU rule entirely. Those were real answer defects despite earlier lexical scores. The checks now reject the wrong reuse direction, a claim that the historical rule is current, and unlabeled or incomplete region answers. A new diagnostic requires both source identities to be cited for two-source cases; it does not prove that each claim is supported by its nearby citation.

When the selected source changes, the workflow still uses the previous user question to improve retrieval, but removes the earlier conversation from the model's generation context. This prevents the old question and answer from overriding the newly selected evidence. The prompt also asks for current evidence citations and labels for each applicable group or version.

Two independent final runs passed the fixed diagnostics:

| Result | Run A | Run B |
| --- | ---: | ---: |
| Cases completed | 10/10 | 10/10 |
| Expected facts present | 8/8 | 8/8 |
| Expected evidence cited | 8/8 | 8/8 |
| Citation numbers valid | 10/10 | 10/10 |
| Source scope respected | 10/10 | 10/10 |
| Abstention language present | 2/2 | 2/2 |
| Named forbidden claims absent | 9/9 | 9/9 |
| Both requested sources cited | 2/2 | 2/2 |

Saved outputs: [Run A](results/unseen-q01-run-a.json), [Run B](results/unseen-q01-run-b.json). The established [original](results/original-q01-regression.json) and [harder](results/harder-q01-regression.json) corpus regressions also passed their fixed diagnostics. The backend suite passed 84 tests. Answers in the final runs were inspected for the known policy, scope, region, and injection failures.

These new cases are now a development set because they informed the prompt and workflow fixes. Two successful model samples do not establish a general accuracy rate. The diagnostics are mostly lexical; they cannot prove semantic support, catch every contradiction, or establish prompt-injection resistance. Q01/Q03 remain in progress pending a separate approved holdout corpus, claim-level review, and agreed release thresholds. Q02 still needs controlled streaming and resource measurements.
