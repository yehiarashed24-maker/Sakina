import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "AQ.Ab8RN6IJu-ehdSInfdiXukBliLoIl4ewcTpC6RolvCbnch3JCw")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "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")
    CHROMA_DB_DIR: str = os.getenv("CHROMA_DB_DIR", "./chroma_db")
    LOCAL_VECTOR_STORE_DIR: str = os.getenv("LOCAL_VECTOR_STORE_DIR", "../data/vector_store")
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    KNOWLEDGE_BASE_DIR: str = "./knowledge/pdfs"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
