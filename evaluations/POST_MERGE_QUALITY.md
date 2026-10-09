# Post-merge answer quality check — 10 October 2026

PR #33's merged LangGraph chat path was evaluated through the actual in-process API with the provisioned ONNX model and local `llama3:latest`. The runner used disposable Chroma and SQLite storage. It did not touch user data or call connected providers. Both fixed corpora use synthetic content; the harder corpus also includes the checked-in README snapshot.

The first 16-case run passed every existing diagnostic, but manual inspection found an unsupported side fact in the missing-revenue answer: it repeated the 12500-rupee budget and launch date without citations. The new [quality checks](answer_checks_quality.json) flag known approval/reuse contradiction wording and side facts in the revenue/refund abstentions. An explicit [rescore of the original answers](results/answers-post-merge-pre-fix-rescored.json) passed only 2/3 forbidden-claim checks. The original run and old checks were preserved.

The prompt now asks for a direct, concise answer, a one-sentence abstention when the requested fact is absent, and no discussion of ignored document instructions. An intermediate harder run exposed a failure in which the answer cited the correct 37-hour pager rotation but repeated an injected false number to deny it. The final prompt removed that explanation in the focused and full runs.

Final saved runs:

| Corpus | Completed | Fact/evidence checks | Abstention checks | Forbidden-claim checks | Saved output |
| --- | ---: | ---: | ---: | ---: | --- |
| Original | 16/16 | 9/9 each | 7/7 | 3/3 | [answers-post-merge-quality.json](results/answers-post-merge-quality.json) |
| Harder | 14/14 | 11/11 each | 2/2 | 4/4 | [harder-post-merge-quality.json](results/harder-post-merge-quality.json) |

All citation-number, source-scope, and conversation-persistence diagnostics also passed in these runs. Manual inspection of the previously failing approval, revenue, refund, changed-source follow-up, and embedded-instruction answers found no repeat of those observed defects. The full backend suite passed 81 tests during this work.

These are single stochastic model runs and narrow lexical diagnostics, not a semantic accuracy rate or an accepted beta gate. Contradictions with different wording, uncited claims outside the named cases, and new prompt injection forms remain possible. Q01/Q03 remain in progress. Next, add unseen claim-support and history-grounding cases using representative approved documents, agree release thresholds, and measure real HTTP streaming and resource use under Q02.
