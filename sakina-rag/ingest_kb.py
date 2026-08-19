import sys
import uuid
import os

from app.config import settings
from app.embeddings.local_embedder import get_provider
from app.vectorstore.local_store import get_vectorstore
from app.ingestion.pdf_loader import load_pdf_file
from app.ingestion.chunker import chunk_documents

def run():
    print("Loading mental_health_rag_kb.pdf...")
    pdf_path = os.path.join(settings.KNOWLEDGE_BASE_DIR, "mental_health_rag_kb.pdf")
    docs = load_pdf_file(pdf_path)
    
    chunks = chunk_documents(docs)
    print(f"Split into {len(chunks)} chunks.")
    
    print("Embedding chunks...")
    embedder = get_provider('sentence_transformers', settings.EMBEDDING_MODEL_NAME)
    store = get_vectorstore()
    
    texts = [c.page_content for c in chunks]
    embs = embedder.embed_texts(texts)
    
    ids = [str(uuid.uuid4()) for _ in chunks]
    metadatas = []
    
    for c in chunks:
        meta = {
            "filename": "mental_health_rag_kb.pdf",
            "page_start": c.metadata.get("page", 1),
            "topic": "Mental Wellness"
        }
        metadatas.append(meta)
        
    store.add(ids, embs, metadatas, texts)
    print(f"Successfully added {len(chunks)} chunks from mental_health_rag_kb.pdf to {settings.LOCAL_VECTOR_STORE_DIR}")

if __name__ == '__main__':
    run()
