# Q02 local performance screen — 10 October 2026

The [repeatable script](../scripts/benchmark_local_chat.py) ingested the three public synthetic PDF/DOCX/Markdown fixtures into disposable ONNX/Chroma storage and measured in-process LangGraph retrieval plus local `llama3:latest` streaming. The [initial six-sample artifact](results/q02-screening.json) contains three single-question and three compound-question repetitions, first-token time, total time, answer text, citation metadata, and backend process working set. This is a screening baseline, not a release benchmark.

| Case | First observed total | Later median first token | Later median total |
| --- | ---: | ---: | ---: |
| Single document | 2.848 s | 2.768 s | 3.754 s |
| Compound two document | 6.631 s | 2.729 s | 4.689 s |

Three-document ingestion took 0.167 s after model initialization. Backend working set after answers was 270.9-272.2 MB. The model runs in Ollama's separate process, so these memory values omit its RAM. The first observed sample is not a verified cold start; Ollama may already have been warm. The in-process first-token clock excludes HTTP/browser transport. The sample is too small to set stable p95 or long-session targets. A [citation-prompt trial](results/q02-screening-citation-prompt.json) was faster on these samples but did not improve two-source citation reliability; the prompt was reverted, so this is not a model comparison.

Q02 remains in progress. For a fast local beta, measure a real unloaded-model start, Ollama plus backend peak RAM, ingestion of larger PDF/DOCX files, and a longer conversation on the target Windows machine. Compare a smaller installed model only if quality is at least as good. The screened compound answers exposed a Q01 blocker: two of three cited only the PDF while using a DOCX fact.
