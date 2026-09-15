from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""
    MONGO_URI: str = ""
    JWT_SECRET: str = ""
    GOOGLE_CLIENT_ID: str = ""
    GEMINI_MODELS: str = "gemini-3.5-flash-lite,gemini-3.5-flash"
    OPENROUTER_MODELS: str = ""
    OPENROUTER_MODEL: str = "openrouter/auto"
    CHROMA_DB_DIR: str = "./chroma_db"
    LOCAL_VECTOR_STORE_DIR: str = "../data/vector_store"
    BACKEND_URL: str = "http://localhost:8000"
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    KNOWLEDGE_BASE_DIR: str = "./knowledge/pdfs"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"

settings = Settings()
