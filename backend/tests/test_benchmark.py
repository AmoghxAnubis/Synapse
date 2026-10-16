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
    assert result["token_events"] == 2


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


def test_corpus_imports_cannot_read_outside_the_fixture_directory(tmp_path):
    corpus_dir = tmp_path / "corpus"
    corpus_dir.mkdir()
    outside = tmp_path / "private.md"
    outside.write_text("must not be imported")
    with pytest.raises(ValueError, match="outside"):
        benchmark.import_fixtures(corpus_dir / "corpus.json", {"documents": [{"file": "../private.md"}]})
    with pytest.raises(ValueError, match="relative"):
        benchmark.import_fixtures(corpus_dir / "corpus.json", {"documents": [{"file": str(outside)}]})


def test_mixed_imports_preserve_binary_bytes_and_identify_the_input(tmp_path):
    import hashlib
    content = b"%PDF-test\x00\xff\r\n"
    (tmp_path / "fixture.pdf").write_bytes(content)
    fixture = benchmark.import_fixtures(tmp_path / "corpus.json", {"documents": [{"file": "fixture.pdf"}]})[0]
    assert fixture["content"] == content
    assert fixture["sha256"] == hashlib.sha256(content).hexdigest()


def test_sampler_includes_ollama_llama_server_children_without_double_counting(monkeypatch):
    class Process:
        def __init__(self, pid, name, rss, children=None):
            self.pid, self.info, self.rss, self.descendants = pid, {"name": name}, rss, children or []
        def memory_info(self): return SimpleNamespace(rss=self.rss)
        def children(self, recursive): return self.descendants
    runner = Process(4, "llama-server.exe", 200)
    nested = Process(5, "ollama-worker.exe", 30)
    root = Process(3, "ollama.exe", 20, [runner, nested])
    backend = Process(1, "python.exe", 100)
    unrelated = Process(9, "llama-server.exe", 900)
    monkeypatch.setattr(benchmark.psutil, "Process", lambda pid: backend)
    monkeypatch.setattr(benchmark.psutil, "process_iter", lambda *args: [root, runner, nested, unrelated])
    sampler = benchmark.MemorySampler(1)
    sampler.sample()
    assert sampler.peaks["ollama_rss_bytes"] == 250
    assert sampler.peaks["combined_rss_bytes"] == 350


def test_stalled_sampling_is_bounded_and_explicitly_incomplete(monkeypatch):
    import threading
    entered, release = threading.Event(), threading.Event()
    monkeypatch.setattr(benchmark.psutil, "Process", lambda pid: object())
    monkeypatch.setattr(benchmark.MemorySampler, "JOIN_SECONDS", 0.02)
    sampler = benchmark.MemorySampler(1)
    def blocked_sample():
        entered.set()
        release.wait(2)
    monkeypatch.setattr(sampler, "sample", blocked_sample)
    try:
        with sampler:
            assert entered.wait(1)
        assert sampler.result()["sampling_complete"] is False
        assert sampler.result()["sampling_errors"] == 1
    finally:
        release.set()
        sampler.thread.join(1)
