from app.config import settings
from app.vectorstore.local_store import retrieve_relevant_context

query = "تفاصيل طبية موسعة حول تشخيص أو علاج ADHD للكبار تحديداً (بعد سن ٢٠)"
context, sources = retrieve_relevant_context(query, k=4)
print("CONTEXT TEXT LENGTH:", len(context))
print("FIRST 500 CHARACTERS:")
print(context[:500])
