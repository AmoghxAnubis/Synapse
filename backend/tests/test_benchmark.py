import json
from pathlib import Path
import sys
import pytest
from types import SimpleNamespace

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
import benchmark_rag as benchmark


def test_distribution_uses_nearest_rank_and_ignores_missing_first_tokens():
    assert benchmark.distribution([None]) == {"samples": 0}
    stats = benchmark.distribution([3, 1, 2, None])
    assert stats == {"samples": 3, "median": 2, "p95": 3, "min": 1, "max": 3}


@pytest.mark.parametrize("lines", [["data: {\"type\":\"token\",\"text\":\"partial\"}"],
                                  ["data: {\"type\":\"error\",\"detail\":\"model failed\"}"]])
def test_partial_or_error_stream_cannot_pass_benchmark(lines):
    with pytest.raises(RuntimeError):
        list(benchmark.decode_events(lines))


def test_events_after_completion_are_rejected():
    with pytest.raises(RuntimeError, match="after stream completion"):
        list(benchmark.decode_events(['data: {"type":"done"}', 'data: {"type":"token","text":"late"}']))


def test_source_metadata_does_not_count_as_first_token(monkeypatch):
    clock = iter([0, 1, 2, 3, 4])
    monkeypatch.setattr(benchmark.time, "perf_counter", lambda: next(clock))
    class Sampler:
        def __init__(self, pid): pass
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def result(self): return {}
    monkeypatch.setattr(benchmark, "MemorySampler", Sampler)
    class Response:
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def raise_for_status(self): pass
        def iter_lines(self, **kwargs):
            for item in [{"type": "sources", "citations": []}, {"type": "token", "text": "a"},
                         {"type": "token", "text": "b"}, {"type": "done"}]:
                yield "data: " + json.dumps(item)
    class Session:
        def post(self, *args, **kwargs): return Response()
    result = benchmark.ask(Session(), "http://127.0.0.1:1234", {}, 1234)
    assert result["sources_seconds"] == 1
    assert result["first_token_seconds"] == 2
    assert result["total_seconds"] == 4
    assert result["answer"] == "ab"


def test_sampler_includes_real_interpreter_under_windows_launcher(monkeypatch):
    class Process:
        def __init__(self, pid): self.pid = pid
        def memory_info(self): return SimpleNamespace(rss=10 if self.pid == 1 else 100)
        def children(self, recursive):
            assert recursive is True
            return [Process(2)]
    monkeypatch.setattr(benchmark.psutil, "Process", Process)
    monkeypatch.setattr(benchmark.psutil, "process_iter", lambda *args: [])
    sampler = benchmark.MemorySampler(1)
    sampler.sample()
    assert sampler.peaks["backend_rss_bytes"] == 110
    assert sampler.peaks["combined_rss_bytes"] == 110
