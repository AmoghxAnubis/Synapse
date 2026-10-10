"""Use the existing ONNX/Chroma store without changing embedding identity."""
import re

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
        batches = [memory.recall(part, n_results=3, source_filters=source_filters,
                                 max_distance=max_distance) for part in parts]
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
