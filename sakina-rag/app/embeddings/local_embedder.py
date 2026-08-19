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


class GeminiEmbeddingProvider(EmbeddingProvider):
    def __init__(self, model_name: str):
        self.model_name = model_name
        from app.config import settings
        self.api_key = settings.GEMINI_API_KEY
        
    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        import requests
        url = f"https://generativelanguage.googleapis.com/v1beta/{self.model_name}:batchEmbedContents?key={self.api_key}"
        
        requests_payload = [
            {"model": self.model_name, "content": {"parts": [{"text": text}]}}
            for text in texts
        ]
        
        response = requests.post(url, json={"requests": requests_payload})
        if response.status_code != 200:
            raise Exception(f"Gemini API error: {response.text}")
            
        data = response.json()
        embeddings = [item["values"] for item in data.get("embeddings", [])]
        return embeddings


def get_provider(name: str, model: str) -> EmbeddingProvider:
    if name == 'sentence_transformers' or name == 'sentence-transformers':
        return SentenceTransformersProvider(model)
    elif name == 'gemini':
        return GeminiEmbeddingProvider(model)
    else:
        raise ValueError('Unknown embedding provider: ' + name)
