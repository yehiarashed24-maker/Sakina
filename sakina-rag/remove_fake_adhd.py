import json
from app.config import settings
from app.vectorstore.local_store import get_vectorstore

store = get_vectorstore()
to_delete = []

for i, meta in enumerate(store.metadatas):
    if meta.get("topic") == "ADHD / فرط الحركة" and meta.get("filename") == "mental_health_rag_kb.pdf":
        to_delete.append(store.ids[i])

if to_delete:
    print(f"Deleting fake ADHD chunk IDs: {to_delete}")
    store.delete(to_delete)
    print("Deleted successfully!")
else:
    print("No fake ADHD chunks found.")
