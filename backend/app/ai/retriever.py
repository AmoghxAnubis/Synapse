"""Use the existing ONNX/Chroma store without changing embedding identity."""
import re
import math
from pathlib import Path

from langchain_core.documents import Document

_STOP = set("what which who how when where why is are was were does do did can could would should must happen before after the a an it its this that these those to for in on of and or according under as about from many long".split())


def _terms(text):
    words = re.findall(r"[a-z]{3,}", text.lower())
    result = set()
    for word in words:
        if word in _STOP:
            continue
        if word.endswith("ies") and len(word) > 4:
            word = word[:-3] + "y"
        elif word.endswith("ing") and len(word) > 6:
            word = word[:-3]
        elif word.endswith("ed") and len(word) > 5:
            word = word[:-2]
        elif word.endswith("s") and not word.endswith("ss") and len(word) > 4:
            word = word[:-1]
        result.add(word)
    return result


def _rank(question, records):
    """Prefer discriminating query terms within already admitted candidates."""
    terms = _terms(question)
    if len(records) < 2 or not terms:
        return records
    bags = [_terms(record["text"]) for record in records]
    weights = {term: 1 + math.log((len(records) + 1) / (1 + sum(term in bag for bag in bags))) for term in terms}
    scores = [sum(weights[term] for term in terms & bag) for bag in bags]
    ordered = sorted(range(len(records)), key=lambda index: -scores[index])
    # Broad summaries and unparsed multi-part requests need their alternative
    # passages. For narrow questions, discard substantially weaker lexical
    # matches rather than filling the prompt with similar boilerplate.
    broad = re.search(r"\b(?:and|or|both|compare|summary|summari[sz]e|overview|explain|describe|list|requirements|steps|rules)\b", question, re.I)
    if not broad and max(scores) > 0:
        ordered = [index for index in ordered if scores[index] >= 0.75 * max(scores)]
    return [records[index] for index in ordered]


def _scoped_hint(memory, question, sources, max_distance):
    # Explicit selections supply context for unnamed documents, without
    # relaxing the configured cutoff or searching beyond the chosen sources.
    sources = list(dict.fromkeys(sources or []))
    if not sources or len(sources) > 3:
        return []
    candidates, seen = [], set()
    for source in sources:
        stem = Path(source.split(" (", 1)[0]).stem
        content_terms = _terms(question) - _terms(stem)
        if len(content_terms) < 2:
            continue
        for record in memory.recall(stem + "\n" + question, n_results=3,
                                    source_filters=[source], max_distance=max_distance):
            if record["id"] not in seen and len(content_terms & _terms(record["text"])) >= 2:
                candidates.append(record)
                seen.add(record["id"])
    return _rank(question, candidates)[:3]


def retrieve_documents(memory, question, source_filters, max_distance):
    # A single embedding can favor one half of a compound question. Retrieve
    # each explicit question clause at the same relevance threshold, then
    # round-robin the evidence so neither clause fills the context alone.
    parts = [part.strip() for part in re.split(
        r",?\s+and\s+(?=(?:what|which|who|how|when|where|why)\b)", question, flags=re.I
    ) if part.strip()]
    clause_tops = {}
    if len(parts) == 1 or len(parts) > 3:
        records = _rank(question, memory.recall(question, source_filters=source_filters, max_distance=max_distance))
        if not records:
            records = _scoped_hint(memory, question, source_filters, max_distance)
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
            batch = memory.recall(part, n_results=3, source_filters=scoped,
                                  max_distance=distance)
            if not batch and len(named) != 1:
                # Compound clauses sometimes miss the normal cutoff narrowly.
                # Admit at most one nearby candidate for an otherwise empty
                # clause; ordinary and single-part questions keep their cutoff.
                batch = memory.recall(part, n_results=1, source_filters=scoped,
                                      max_distance=min(0.70, max_distance + 0.05))
            if not batch and not named:
                batch = _scoped_hint(memory, part, scoped, max_distance)
            batches.append(_rank(part, batch))
        for clause_index, batch in enumerate(batches):
            if batch:
                clause_tops.setdefault(batch[0]["id"], set()).add(clause_index)
        records, seen = [], set()
        for index in range(3):
            for batch in batches:
                if index < len(batch) and batch[index]["id"] not in seen:
                    record = batch[index]
                    records.append(record)
                    seen.add(record["id"])
        if len(records) < 5 and any(not batch for batch in batches):
            for record in memory.recall(question, source_filters=source_filters, max_distance=max_distance):
                if record["id"] not in seen:
                    records.append(record)
                    seen.add(record["id"])
        records = records[:5]
    return [Document(page_content=record["text"], metadata={
                **{k: v for k, v in record.items() if k != "text"},
                "_top_clauses": sorted(clause_tops.get(record["id"], ())),
            })
            for record in records]


def citation(document):
    return {**{k: v for k, v in document.metadata.items() if not k.startswith("_")},
            "text": document.page_content}
