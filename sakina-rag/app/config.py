import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "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")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "openrouter/free")
    CHROMA_DB_DIR: str = os.getenv("CHROMA_DB_DIR", "./chroma_db")
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    KNOWLEDGE_BASE_DIR: str = "./knowledge/pdfs"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
