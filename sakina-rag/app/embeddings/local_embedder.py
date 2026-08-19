"""
Embedding provider abstraction using sentence-transformers by default.
"""
from typing import List
from abc import ABC, abstractmethod

class EmbeddingProvider(ABC):
    @abstractmethod
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        pass


class SentenceTransformersProvider(EmbeddingProvider):
    def __init__(self, model_name: str):
        from sentence_transformers import SentenceTransformer
        self.model = SentenceTransformer(model_name)

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        return self.model.encode(texts, show_progress_bar=False, convert_to_numpy=True).tolist()


def get_provider(name: str, model: str) -> EmbeddingProvider:
    if name == 'sentence_transformers' or name == 'sentence-transformers':
        return SentenceTransformersProvider(model)
    else:
        raise ValueError('Unknown embedding provider: ' + name)
