import sys
import uuid

from app.config import settings
from app.embeddings.local_embedder import get_provider
from app.vectorstore.local_store import get_vectorstore

def add_adhd():
    print("Embedding ADHD text...")
    embedder = get_provider('sentence_transformers', settings.EMBEDDING_MODEL_NAME)
    store = get_vectorstore()
    
    text = "11. Attention-Deficit/Hyperactivity Disorder (ADHD) / فرط الحركة وتشتت الانتباه\nDefinition: Neurodevelopmental disorder characterized by a persistent pattern of inattention and/or hyperactivity-impulsivity that interferes with functioning or development. Keywords: ADHD, inattention, hyperactivity, impulsivity, focus, تشتت الانتباه, فرط الحركة, تركيز, نقص الانتباه."
    
    emb = embedder.embed_texts([text])[0]
    
    meta = {
        "filename": "mental_health_rag_kb.pdf",
        "page_start": 3,
        "topic": "ADHD / فرط الحركة"
    }
    
    uid = str(uuid.uuid4())
    
    store.add([uid], [emb], [meta], [text])
    print("Added ADHD to local store successfully in", settings.LOCAL_VECTOR_STORE_DIR)

if __name__ == '__main__':
    add_adhd()
