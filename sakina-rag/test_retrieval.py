from app.config import settings
from app.vectorstore.local_store import retrieve_relevant_context

query = "تفاصيل عن الرهاب الاجتماعي"
context, sources = retrieve_relevant_context(query, k=4)
print("SOURCES:")
for s in sources:
    print(s)
