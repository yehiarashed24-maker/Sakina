from langchain_community.vectorstores import Chroma
from app.embeddings.embedder import get_embedding_model
from app.config import settings

def get_vectorstore():
    embeddings = get_embedding_model()
    vectorstore = Chroma(
        persist_directory=settings.CHROMA_DB_DIR,
        embedding_function=embeddings,
        collection_name="sakina_mental_wellness"
    )
    return vectorstore

def retrieve_relevant_context(query: str, k: int = 4):
    vectorstore = get_vectorstore()
    results = vectorstore.similarity_search_with_score(query, k=k)
    
    docs = []
    sources = []
    seen_sources = set()
    
    for doc, score in results:
        docs.append(doc.page_content)
        metadata = doc.metadata or {}
        source_name = metadata.get("source", "Mental Health KB")
        page_num = metadata.get("page", 1)
        topic_name = metadata.get("topic", "Mental Wellness")
        
        src_key = f"{source_name}-page{page_num}-{topic_name}"
        if src_key not in seen_sources:
            seen_sources.add(src_key)
            sources.append({
                "source": source_name,
                "page": page_num,
                "topic": topic_name
            })
            
    context_text = "\n\n---\n\n".join(docs)
    return context_text, sources
