import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    CHROMA_DB_DIR: str = os.getenv("CHROMA_DB_DIR", "./chroma_db")
    LOCAL_VECTOR_STORE_DIR: str = os.getenv("LOCAL_VECTOR_STORE_DIR", "../data/vector_store")
    BACKEND_URL: str = os.getenv("RENDER_EXTERNAL_URL", os.getenv("BACKEND_URL", "http://localhost:8000"))
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    KNOWLEDGE_BASE_DIR: str = "./knowledge/pdfs"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
