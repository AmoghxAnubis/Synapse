# Second answer-quality holdout — 10 October 2026

This fixed, private-data-free holdout was created after the compound-retrieval repair and before its first model run. Three small synthetic documents are stored as a two-page PDF, a DOCX with a table, and Markdown. The [builder](build_second_holdout.py) passed their actual bytes through `FileIngester.parse_bytes`; the resulting [corpus](second-holdout-corpus.json) contains the parser output used by the isolated real API/ONNX/Ollama evaluator. This tests format parsing and answers over parsed text, but the evaluator does not exercise HTTP upload, background jobs, OCR, or live connectors.

Frozen SHA-256 before first generation: corpus `420567b9123aa6972bf19b2b4ecce62dbd6d2e562e0f4c9727b8e44919299ab8`; [checks](second-holdout-checks.json) `b65837568594255b5863bf75fd36ba9b2efbae8addff8bdac54cd9340c119063`. The 11 cases cover single-source facts from both PDF pages, a DOCX paragraph and table, regional labels, an embedded instruction, two compound two-source questions (one without document names), an in-topic unknown, source-scope exclusion, and a referential follow-up. Both unsupported cases have explicit selected sources.

Proposed local beta acceptance gate, set before first run: all 11 requests execute and persist; every answer stays within selected sources and uses valid citation numbers; every material factual claim is supported by its cited passage; both unsupported cases abstain without inventing a fact; both compound answers include and cite both requested sources; at least 10 of 11 answers are complete and correct on manual review. These targets are a working release proposal, not a measured population accuracy guarantee. One or more failures keeps Q01/Q03 open. This eleven-case synthetic sample alone cannot complete representative acceptance; an approved set of real user-document shapes and sizes remains necessary.

First-run results and manual claim review will be appended without changing the frozen corpus or checks. If a failure leads to a repair, this holdout becomes development data; acceptance then needs another fresh sample.

## First run and manual review

The [first-run artifact](results/second-holdout-first-run.json) used the real in-process API, local ONNX embeddings, `llama3:latest`, and disposable Chroma/SQLite storage. All 11 requests completed and persisted. Automatic checks passed 8/9 expected facts and evidence, 11/11 citation-number validity and source scope, 2/2 abstention-language checks, 3/3 named forbidden-claim checks, and 1/2 required two-source citation checks. The corpus/checks hashes in the artifact match those frozen above.

| Case | Manual claim and citation review |
| --- | --- |
| PDF retry | Correct three-attempt limit, cited PDF page 1. |
| PDF escalation | Correct two-business-day review, cited PDF page 2. |
| PDF owner with embedded instruction | Correctly names Mara Ellis with PDF page 1; did not repeat the false name on page 2. |
| DOCX approval | Correct ten-minute, one-use rule with citation. |
| DOCX table | Correct 25 MB export maximum with citation to the parsed table. |
| Markdown regions | Correctly labels both EU 14-day and US 30-day retention with citation. |
| Named two-source question | Correct retry and approval facts, each cited to its source. |
| Unnamed two-source question | **Incorrectly incomplete.** Gives the ten-minute approval fact with citation, then says the retry limit is absent even though PDF page 1 states three times. Only the approval citation appears in the answer. |
| Unknown monthly cost | Correctly abstains without an invented cost. |
| PDF fact under DOCX-only scope | Correctly abstains and cites no excluded source. |
| Referential follow-up | Correct quarantine outcome with PDF page 1 citation. |

Manual completeness is **10/11**, but the predeclared gate requiring **both** compound answers to include and cite both facts is **1/2**, so this holdout does **not** pass Q01/Q03 acceptance. The absence statement in the failed answer is false relative to the selected documents; it is a consequential retrieval/answer error, not just a formatting defect. The [isolated retrieval diagnostic](results/second-holdout-retrieval-diagnostic.json) returned the DOCX passage at distance 0.5362 and PDF page 2 at 0.6442 for the failed full question; it did not return PDF page 1 at the 0.65 cutoff. The first-run artifact and frozen inputs remain unchanged.

Next: diagnose clause-level candidates for this unnamed compound question and improve coverage without broadly admitting unrelated passages. Re-run the existing development/abstention sets after a repair. This holdout will then be development data, so a third fresh sample is needed for independent acceptance. The PDF/DOCX fixtures are small synthetic files; larger and genuine user document shapes remain outside this evidence.
