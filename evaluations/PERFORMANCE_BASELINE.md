# Local RAG performance comparison — 10 October 2026

Q02 compares installed `llama3:latest` and `llama3.2:latest` using the unchanged product and the frozen 13-case external-document corpus. `scripts/benchmark_rag.py` launches an isolated loopback FastAPI backend for each model; it never starts the production backend, changes saved user settings, syncs providers or downloads generation models. ONNX assets are the already provisioned `.tmp/q01-assets/models/minilm` snapshot.

Protocol:

- Models run sequentially. No test/evaluation suite runs concurrently.
- Three model-unloaded repeats of the same supported question per model. The harness explicitly unloads selected models through local Ollama and verifies absence from `/api/ps`. OS disk caches are not cleared, so these are not cold-machine samples.
- Two complete warm passes of the same 13 cases, preserving follow-up seeds and source changes. Every measured answer uses real loopback HTTP/SSE with one-byte line reads. First-token time begins before the request and ends on the first nonempty token event; source metadata is timed separately. Total time ends at the done event. Browser rendering and the Next.js proxy are excluded.
- A 12-turn persisted conversation with the same factual question tests the bounded-history path. This is a short sustained-session probe, not a multi-hour stability test.
- Three new 69,000-byte Markdown imports per model (66 chunks each) measure upload, parsing, ONNX embedding and Chroma persistence together. This is a repeated-text throughput fixture, not a representative mixed-format ingestion benchmark.
- Process resident memory is sampled every 100 ms during measured answer phases for the isolated backend process tree and all named Ollama processes. Ingestion memory is not sampled. Reported peaks can miss short spikes, double-count shared pages and exclude the harness, browser, drivers and OS cache. Ollama's model/VRAM allocation snapshot is separately reported and must not be added to RSS as physical RAM.
- Model digests, hardware/Python information, frozen input hashes, all answers/citations/timings, sampled memory and nearest-rank distributions are saved in `results/performance-first-run.json`. Small-sample p95 values should not be treated as population estimates.

Run in the Python 3.12 verification environment after installing the development requirements and setting `SYNAPSE_EMBEDDING_DIR` to the provisioned model path:

```powershell
.tmp/langgraph-venv/Scripts/python.exe scripts/benchmark_rag.py --models llama3:latest llama3.2:latest --output evaluations/results/performance-first-run.json
```

The script refuses to overwrite an existing output and refuses to start if an unrelated model is loaded. It temporarily unloads the two selected models; do not run it alongside another Ollama session. Model order and thermal/OS cache effects can influence comparisons. Repeat in reverse order on target machines before promising a speed advantage.

The approved quality targets remain 100% source scope/reference validity, at least 90% complete supported/cited answers and at least 90% correct abstentions. Lexical checks are diagnostics; saved model answers need separate claim review before a model recommendation. Benchmark scope does not include persistent actions or Kafka.

## Results and recommendation

Both runs completed on Windows 11 with Python 3.12.13, 20 logical CPUs and 23.7 GiB host RAM, using product revision `d7f5609`. Installed model digests and allocation details are in the artifacts. [First run](results/performance-first-run.json) ran llama3 then llama3.2. Its Windows Python launcher RSS excluded the backend child process: **discard all first-run memory measurements**. Its timing and answer records remain valid. A regression test now covers child-process inclusion. The [corrected reverse-order run](results/performance-corrected-reverse-run.json) includes the backend process tree and records the executed script hash. Neither run tuned the product or changed saved model preferences.

Corrected run, seconds; p95 uses nearest rank. Warm supported-only measurements exclude the six fast abstentions (20 supported answers per model).

| Measurement | llama3:latest | llama3.2:latest |
| --- | ---: | ---: |
| Model-unloaded first-token median / p95 (3) | 4.406 / 5.078 | 3.493 / 3.941 |
| Model-unloaded completion median / p95 (3) | 4.967 / 5.678 | 3.813 / 4.276 |
| Warm supported first-token median / p95 (20) | 0.289 / 0.415 | 0.178 / 0.218 |
| Warm supported completion median / p95 (20) | 1.006 / 1.276 | 0.449 / 0.568 |
| All warm completion median / p95 (26) | 0.960 / 1.276 | 0.421 / 0.568 |
| 12-turn completion median / p95 | 0.985 / 1.151 | 0.528 / 0.578 |
| Import median (3; 69,000 bytes each) | 1.648 | 1.270 |
| Sampled backend process-tree peak RSS (MiB) | 293.69 | 294.34 |
| Sampled Ollama peak RSS (MiB) | 517.81 | 513.38 |
| Sampled simultaneous combined peak RSS (MiB) | 804.41 | 800.60 |
| Ollama reported model VRAM allocation (MiB) | 5296.00 | 2962.37 |

Individual RSS peaks need not coincide. These are process measurements, not total machine resource requirements. Smaller reported VRAM does not imply a comparable host RSS reduction. Import ordering varied: first-run medians were 1.059 seconds for llama3 and 1.305 for llama3.2; generation-model choice is not established as the cause of import speed differences.

Assistant claim review, bound to both result hashes in [performance-review.json](results/performance-review.json), applies the same conservative all-claims-supported rule as the external holdout. It is not independent human acceptance.

| Quality gate | llama3 first / corrected | llama3.2 first / corrected |
| --- | --- | --- |
| Complete supported answers with supporting citations | 19/20 (95%) / 18/20 (90%) | 16/20 (80%) / 17/20 (85%) |
| Selected-source scope compliance | 26/26 / 26/26 | 26/26 / 26/26 |
| Citation-reference validity | 26/26 / 26/26 | 26/26 / 26/26 |
| Correct abstentions | 6/6 / 6/6 | 6/6 / 6/6 |
| Measured warm conversations persisted | 26/26 / 26/26 | 26/26 / 26/26 |

The smaller model twice claimed Ollama's streaming default was unstated even though the supplied evidence says true, omitting the required supported answer/citation. It also introduced unsupported or contradictory background-task timing in two first-run responses and one corrected-run response. The larger model's excluded responses used imprecise rollback wording (an exception rather than a transaction), despite getting the requested negative facts right. Both models preserved all 24 messages in each 12-turn probe, whose answers passed saved diagnostics; that probe repeated a single factual question.

**Retain llama3:latest as the recommended model for this evaluated quality path.** The smaller model completed supported warm answers about 2.24 times faster in the corrected run, but failed the approved 90% quality gate in both orders. The larger met the sample gates in both orders; its rollback wording still merits broader acceptance review. Existing user settings remain unchanged. Do not generalize these small technical-summary samples to user documents, machine-wide RAM needs or guaranteed latency.

Verification: **92 backend tests passed with no skips**, including real offline ONNX and six benchmark regressions; `uv pip check` passed for 134 installed packages. Development requirements/lock add psutil 7.2.2 for memory sampling. No frontend changes or browser timing checks were performed. Q02's controlled baseline is complete; Q02 remains IN PROGRESS for representative mixed-format imports, varied longer sessions and frontend/target-machine measurements. Q01/Q03 and independent human beta acceptance remain open.
