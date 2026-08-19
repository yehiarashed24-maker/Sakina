from app.vectorstore.local_store import get_vectorstore, get_embedder

query = "انا خايف من الناس"
embedder = get_embedder()
query_emb = embedder.embed_texts([query])[0]

store = get_vectorstore()
results = store.similarity_search(query_emb, top_k=4)

print("DISTANCES for 'انا خايف من الناس':")
for d, m in zip(results['distances'], results['metadatas']):
    print(f"Dist: {d:.4f}, File: {m.get('filename')}")
