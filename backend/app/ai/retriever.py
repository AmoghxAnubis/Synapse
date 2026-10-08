"""Use the existing ONNX/Chroma store without changing embedding identity."""
from langchain_core.documents import Document


def retrieve_documents(memory, question, source_filters, max_distance):
    return [Document(page_content=record["text"], metadata={k: v for k, v in record.items() if k != "text"})
            for record in memory.recall(question, source_filters=source_filters, max_distance=max_distance)]


def citation(document):
    return {**document.metadata, "text": document.page_content}
