from langchain_community.embeddings import HuggingFaceEmbeddings
from app.config import settings

_embedding_instance = None

def get_embedding_model():
    global _embedding_instance
    if _embedding_instance is None:
        _embedding_instance = HuggingFaceEmbeddings(
            model_name=settings.EMBEDDING_MODEL_NAME,
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
    return _embedding_instance
