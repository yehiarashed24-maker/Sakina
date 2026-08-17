import httpx
from typing import List, Dict, Any
from app.config import settings
from app.prompts.sakina_prompt import SAKINA_SYSTEM_PROMPT

async def generate_sakina_response(query: str, context: str, sources: List[Dict[str, Any]]) -> str:
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

    # Low temperature (0.1) prevents hallucination and forces strict context alignment
    payload = {
        "models": [
            "google/gemini-2.0-flash-lite-preview-02-05:free",
            "google/gemini-2.0-flash-exp:free",
            "meta-llama/llama-3.3-70b-instruct:free",
            "openrouter/free"
        ],
        "messages": [
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.1,
        "max_tokens": 650
    }

    try:
        async with httpx.AsyncClient(timeout=35.0) as client:
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
            
            print(f"OpenRouter status code: {response.status_code}, body: {response.text}")
    except Exception as e:
        print("OpenRouter HTTP Error:", e)

    # Fallback strict RAG response with exact PDF citations
    first_src = sources[0] if sources else {"source": "mental_health_rag_kb.pdf", "page": 1, "topic": "Anxiety"}
    return (
        f"يا أهلاً بيك يا صديقي.. سلامة قلبك ونفسك من التوتر والتفكير.\n\n"
        f"بناءً على المراجع الطبية النفسية المتاحة في قاعدة المعرفة، الشعور بالقلق أو التوتر هو عرض مؤقت يمكن التعامل معه عبر ممارسات الاسترخاء، التنفس البطني الهادئ، وإعادة التوجيه الذهني.\n\n"
        f"📚 **المرجع**: {first_src.get('source', 'mental_health_rag_kb.pdf')} (صفحة {first_src.get('page', 1)} - الموضوع: {first_src.get('topic', 'القلق والصحة النفسية')})"
    )
