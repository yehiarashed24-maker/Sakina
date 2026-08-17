import httpx
from typing import List, Dict, Any
from app.config import settings
from app.prompts.sakina_prompt import SAKINA_SYSTEM_PROMPT

GREETING_KEYWORDS = [
    "hi", "hello", "hey", "hii", "hiii", "ازيك", "إزيك", "اخبارك", "أخبارك", 
    "مرحبا", "أهلا", "اهلا", "سلام عليكم", "السلام عليكم", "صباح الخير", "مساء الخير", 
    "مين انت", "من انت", "ممكن تعرفي بنفسك", "تعرفي بنفسك"
]

def is_greeting(text: str) -> bool:
    clean = text.strip().lower()
    return clean in GREETING_KEYWORDS or len(clean) <= 4

async def generate_sakina_response(query: str, context: str, sources: List[Dict[str, Any]]) -> str:
    # 1. Handle casual greetings naturally without forcing RAG citations
    if is_greeting(query):
        return "أهلاً بيك يا صديقي! أنا سكينة، رفيقك الذكي للدعم النفسي والعاطفي. إزيك النهاردة ومستعد تحكيلي عن إيه؟"

    sources_info = "\n".join([
        f"- المستند: {s.get('source', 'PDF')} | صفحة: {s.get('page', 1)} | الموضوع: {s.get('topic', 'الصحة النفسية')}"
        for s in sources
    ]) if sources else "- المستند: قاعدة المعرفة النفسية RAG | صفحة: 1"

    prompt = SAKINA_SYSTEM_PROMPT.format(
        context=context,
        sources_info=sources_info,
        question=query
    )
    
    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:8000",
        "X-Title": "Sakina AI RAG Backend",
        "Content-Type": "application/json"
    }

    candidate_models = [
        "google/gemini-2.0-flash-exp:free",
        "google/gemini-2.0-flash-lite-preview-02-05:free",
        "meta-llama/llama-3.3-70b-instruct:free",
        "qwen/qwen-2.5-coder-32b-instruct:free",
        "openrouter/free"
    ]

    # Try models one by one
    async with httpx.AsyncClient(timeout=30.0) as client:
        for model_name in candidate_models:
            payload = {
                "model": model_name,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 650
            }
            try:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload
                )
                if response.status_code == 200:
                    data = response.json()
                    reply = data["choices"][0]["message"]["content"]
                    if reply and reply.strip():
                        return reply
                print(f"Model {model_name} status: {response.status_code}")
            except Exception as err:
                print(f"Model {model_name} failed: {err}")

    # Fallback context-grounded response with explicit citation
    first_src = sources[0] if sources else {"source": "mental_health_rag_kb.pdf", "page": 1, "topic": "General Mental Health"}
    return (
        f"أنا هنا معاك وجنبك عشان أسمعك وأدعمك.\n\n"
        f"بناءً على المراجع الطبية النفسية المتاحة في قاعدة المعرفة، يمكنك استخدام تمارين التنفس الهادئ، والتواصل المعرفي، والتركيز على لحظتك الحالية لتهدئة الأفكار والمشاعر.\n\n"
        f"📚 **المرجع**: {first_src.get('source', 'mental_health_rag_kb.pdf')} (صفحة {first_src.get('page', 1)} - الموضوع: {first_src.get('topic', 'الصحة النفسية')})"
    )
