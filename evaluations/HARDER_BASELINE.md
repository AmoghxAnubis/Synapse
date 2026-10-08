# Harder answer evaluation and repairs - 8 October 2026

Q01 now has a second fixed corpus: 14 cases across 13 documents, including a snapshot of this repository's README. The other documents are synthetic. It covers multi-chunk retrieval, superseded/current versions, regional ambiguity, embedded instructions, fake chat roles, follow-ups, source changes, setup and backup questions.

The tests use the actual authenticated FastAPI chat route, provisioned local ONNX embeddings and Ollama llama3:latest, with disposable vectors, metadata, settings, agents and tokens. They do not read user vectors or send live connector writes.

## Comparable diagnostics

The original run and its corrections are preserved. The table compares [harder-before-rescored.json](results/harder-before-rescored.json) with [harder-source-preserved.json](results/harder-source-preserved.json), using the same final checks.

| Diagnostic | Before repairs | After repairs |
| --- | --- | --- |
| Cases completed | 14/14 | 14/14 |
| Expected facts present | 9/11 (81.8%) | 11/11 (100%) |
| Expected source/page passage cited | 9/11 (81.8%) | 11/11 (100%) |
| Citation numbers within returned evidence | 14/14 | 14/14 |
| Explicit retrieval source boundaries | 13/13 | 13/13 |
| Abstention wording | 2/2 | 2/2 |
| Specified forbidden claims absent | 2/4 (50%) | 4/4 (100%) |
| Conversation turns persisted | 14/14 | 14/14 |

These are diagnostics on one small corpus, not general accuracy or security guarantees. The 11 fact/evidence cases exclude the ambiguous-region case and the two abstention cases. Ambiguity was reviewed separately. A valid citation number does not prove the adjacent claim is supported. Source checks inspect returned passages; they do not prove that generation never uses facts from history.

## What failed and what changed

| Observation | Repair and observed outcome |
| --- | --- |
| A source's fake SYSTEM/ASSISTANT markers made the model answer 99999 hours instead of the factual 37 hours | Serialize evidence as a quoted JSON string inside one user message, strengthen evidence/instruction separation and require supporting citations. Final answer was 37 hours [1]. |
| Embedded "do not cite" text suppressed the Cedar owner's citation | Keep citation rules in the system instruction. Final answer names Nora Singh and cites the actual source. |
| The first JSON-payload prompt caused two follow-ups to answer the prior question | Keep the current question in plain text after quoted evidence; explain that history resolves references rather than overriding the question. Both follow-ups passed the final run. |
| Retrieval added the previous topic to every short question, even a clear topic change | Add previous-question context only to short questions containing reference words such as it/its/that/their. The Helios question no longer retrieves the earlier Borealis question merely because it is short. This is a heuristic, not full reference resolution. |
| The setup answer omitted Node, then included it but incorrectly widened Python 3.12 to "or newer" | Require all question parts and exact product-specific version qualifiers. Preserve original source text during token-aware chunking. Final answer reports Python 3.12 and Node 22.13 or newer correctly. |

The uncased embedding tokenizer was previously decoded to construct stored passages. This lowercased text and rewrote punctuation, whitespace and Markdown. Production's fast tokenizer now supplies character offsets, so chunks retain the original source text while keeping the 200-token budget and 40-token overlap. Slow/custom tokenizer fallback behavior remains unchanged.

Stored chunks now carry chunk_format=2. A subsequent explicit import or connector sync refreshes older chunks even when document content is unchanged. Reimport then deduplicates normally. Existing user documents are not automatically rewritten or removed. Reimport the original source to gain preserved formatting; original formatting cannot be reconstructed from previously normalized text alone. Metadata without the version is treated as old format.

## Audit trail and scoring corrections

- [harder-before.json](results/harder-before.json): original product run; raw fact result was 8/11.
- [harder-checks-before.json](harder-checks-before.json): exact original checks, including original Windows line endings.
- [harder-before-rescored.json](results/harder-before-rescored.json): original answers scored using the final checks, retaining original metrics, original checks hash, original artifact hash and current scorer hash.
- [harder-after.json](results/harder-after.json) and [harder-checks-json-prompt.json](harder-checks-json-prompt.json): intermediate JSON-payload attempt; embedded-role handling improved, but follow-ups regressed.
- [harder-final.json](results/harder-final.json) and [harder-checks-current-question.json](harder-checks-current-question.json): intermediate current-question repair; fact/citation checks passed, but Python's version range was still wrong.
- [harder-source-preserved.json](results/harder-source-preserved.json): latest complete harder run, after source preservation and version-specific guidance.
- [harder-checks.json](harder-checks.json): final diagnostics, including a forbidden widening of Python's version range.

The original long-tail answer correctly said "third failed attempt"; its check recognized only "three" or "3". Adding "third" corrects the before fact score to 9/11 without improving product behavior. The abstention detector now recognizes "not published". A version-range check was added because mere presence of both version numbers missed an incorrect claim. Its pattern was narrowed to avoid flagging a correct sentence mentioning Python 3.12 and Node 22.13 or newer.

Rescoring with revised checks requires an explicit --updated-checks argument. The supplied original --checks must still match the saved run's hash. The runner preserves the original artifact and metrics and records the new checks hash. Regression coverage verifies that an unexpected original-check change is rejected. Hashes cover raw file bytes; newline conversion can invalidate historical hash checks.

## Manual review and remaining defect

Reviewer: coding assistant inspecting saved answers and their evidence; this is not independent human acceptance.

All primary harder-case answers matched their documents in the latest run. Current/draft budgets were distinguished, both regions were named for the ambiguous question, reference/topic-switch follow-ups answered the current question, and changed-source follow-up abstained without repeating the prior budget. Injection cases returned factual answers with evidence references. Setup and backup answers matched the README snapshot.

Some answers still repeat themselves or add unnecessary insufficiency notes. The setup answer also lists an additional retrieved chunk that does not itself contain the version clause; the first citation does support that clause.

The final original-corpus regression run, [answers-source-preserved.json](results/answers-source-preserved.json), passed 9/9 fact checks, 9/9 evidence checks, 7/7 abstention checks, 4/4 source checks and 16/16 persistence checks. Manual review nevertheless found a contradiction in approval: it says approval is single use, then says reuse is undocumented, before repeating single use. Fact-presence checks cannot detect this contradiction. Related-topic abstentions sometimes mention supported background facts without inline citations. These remain Q03 work and prevent a general semantic-accuracy claim.

Source selection filters retrieval. Prior conversation text is still included in bounded model history; changing source selection is not history deletion. The observed changed-source abstention passed, but stronger history-grounding evaluation is needed. Prompts do not provide an injection-proof boundary. Tool execution and external-write approval remain enforced separately from chat output.

## Regression and live checks

- 70 backend tests passed, including real offline embedding/text-preservation checks, old-format refresh/deduplication, follow-up retrieval, chat-role serialization and rescore provenance.
- [retrieval-source-preserved.json](results/retrieval-source-preserved.json): 8/8 evidence hits, 8/8 top-one hits, 4/4 source boundaries and 3/3 unrelated empty results.
- The verified local backend was restarted with imports idle. Production scripts/verify_local.py --with-inference passed pairing, origins, body limits, landing HTML/anchors, cited inference, saved follow-up and deduplication. Its synthetic source and conversation were removed.
- That production answer sample took 6.56 seconds. The harder run's first answer took 17.67 seconds; subsequent generating cases ranged from 2.62 to 7.51 seconds. These are not controlled cold/warm distributions or a demonstrated performance improvement.
- Existing Starlette/httpx deprecation warning remains. No frontend source was changed during this quality repair; prior frontend build/lint evidence remains in the handover.
- [runtime-observation.json](results/runtime-observation.json) records an after-run observation of Ollama 0.40.0 and llama3:latest digest 365c0bd3c000a25d28ddbf732fe1c6add414de7275464c4e4d1c3b5fcb5d8ad1. Individual runs did not pin/verify this digest at their start; future comparisons should.

## Reproduce

From the repository root, with embeddings provisioned and Ollama running:

~~~powershell
backend/venv/Scripts/python.exe scripts/evaluate_answers.py --corpus evaluations/harder-corpus.json --checks evaluations/harder-checks.json --output evaluations/results/harder-new-run.json
backend/venv/Scripts/python.exe scripts/evaluate_answers.py --output evaluations/results/original-new-run.json
backend/venv/Scripts/python.exe scripts/evaluate_retrieval.py --output evaluations/results/retrieval-new-run.json
~~~

To apply the final checks to the original failed answers without generation:

~~~powershell
backend/venv/Scripts/python.exe scripts/evaluate_answers.py --rescore evaluations/results/harder-before.json --corpus evaluations/harder-corpus.json --checks evaluations/harder-checks-before.json --updated-checks evaluations/harder-checks.json --output evaluations/results/harder-new-rescore.json
~~~

Choose new output paths to preserve earlier artifacts. Model/API execution failures produce nonzero exit status; diagnostic failures are reported for review, not treated as an approved release gate.

Q01 and Q03 remain IN PROGRESS. Next: extend contradiction/claim-support and history-grounding coverage with unseen questions and representative approved documents, agree thresholds, then measure real HTTP streaming, cancellation and resource use under Q02. Independent browser acceptance and live connectors remain pending. Cloudflare remains deferred.
