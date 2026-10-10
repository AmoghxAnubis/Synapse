"""Use the existing ONNX/Chroma store without changing embedding identity."""
import re
from pathlib import Path

from langchain_core.documents import Document


def retrieve_documents(memory, question, source_filters, max_distance):
    # A single embedding can favor one half of a compound question. Retrieve
    # each explicit question clause at the same relevance threshold, then
    # round-robin the evidence so neither clause fills the context alone.
    parts = [part.strip() for part in re.split(
        r",?\s+and\s+(?=(?:what|which|who|how|when|where|why)\b)", question, flags=re.I
    ) if part.strip()]
    if len(parts) == 1 or len(parts) > 3:
        records = memory.recall(question, source_filters=source_filters, max_distance=max_distance)
    else:
        sources = source_filters if source_filters is not None else [row["name"] for row in memory.get_sources()]
        batches = []
        for part in parts:
            normalized = re.sub(r"[^a-z0-9]+", " ", part.lower())
            named = []
            for source in sources:
                stem = Path(source.split(" (", 1)[0]).stem
                label = re.sub(r"[^a-z0-9]+", " ", stem.lower()).strip()
                if len(label.split()) >= 2 and re.search(r"\b" + re.escape(label) + r"\b", normalized):
                    named.append(source)
            # Only an explicit document name justifies a wider candidate search.
            # The answer still has to be grounded in the returned passage.
            scoped = named if len(named) == 1 else source_filters
            distance = min(0.85, max_distance + 0.2) if len(named) == 1 else max_distance
            batches.append(memory.recall(part, n_results=3, source_filters=scoped,
                                         max_distance=distance))
        records, seen = [], set()
        for index in range(3):
            for batch in batches:
                if index < len(batch) and batch[index]["id"] not in seen:
                    record = batch[index]
                    records.append(record)
                    seen.add(record["id"])
        if len(records) < 5:
            for record in memory.recall(question, source_filters=source_filters, max_distance=max_distance):
                if record["id"] not in seen:
                    records.append(record)
                    seen.add(record["id"])
        records = records[:5]
    return [Document(page_content=record["text"], metadata={k: v for k, v in record.items() if k != "text"})
            for record in records]


def citation(document):
    return {**document.metadata, "text": document.page_content}
